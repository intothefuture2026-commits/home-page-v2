import { getStore } from '@netlify/blobs';
import { SolapiMessageService } from 'solapi';

// 문의 유형별 문자 표기 라벨. 여기에 없는 formType은 전부 거부됩니다.
const FORM_TYPE_LABELS = {
  'interest-register': '관심고객 등록',
  'interest-register-hero': '관심고객 등록',
  'visit-reservation': '방문예약',
};

// 방문예약 폼의 select 옵션과 반드시 일치해야 하는 허용 목록
const VISIT_TIME_LABELS = {
  '09-10': '09:00~10:00',
  '10-11': '10:00~11:00',
  '11-12': '11:00~12:00',
  '13-14': '13:00~14:00',
  '14-15': '14:00~15:00',
  '15-16': '15:00~16:00',
  '16-17': '16:00~17:00',
};

const MAX_BODY_BYTES = 5_000;
const NAME_MAX_LEN = 20;
const RATE_LIMIT_WINDOW_MS = 20_000;

const NAME_RE = /^[가-힣a-zA-Z0-9.\-\s]{1,20}$/;
const PHONE_RE = /^01[016789]\d{7,8}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 문의 폼을 서비스하는 도메인(Cafe24)과 이 함수가 배포된 도메인(Netlify)이
// 서로 다르므로, 알려진 두 프론트엔드 origin만 명시적으로 허용합니다.
const ALLOWED_ORIGINS = new Set([
  'https://www.bunyanghouse.com',
  'https://parkfore.bunyanghouse.com',
]);
const LOCALHOST_ORIGIN_RE = /^http:\/\/localhost:\d+$/;

function isDevContext() {
  return process.env.NETLIFY_DEV === 'true' || process.env.CONTEXT === 'dev';
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return isDevContext() && LOCALHOST_ORIGIN_RE.test(origin);
}

function corsHeaders(allowedOrigin) {
  if (!allowedOrigin) return {};
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    Vary: 'Origin',
  };
}

function jsonResponse(status, body, allowedOrigin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(allowedOrigin),
    },
  });
}

function cleanText(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatPhoneDisplay(digits) {
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

function buildMessage({ formTypeLabel, name, phoneDisplay, visitDate, visitTimeLabel }) {
  const lines = [
    '[홈페이지 신규 문의]',
    `문의유형: ${formTypeLabel}`,
    `이름: ${name}`,
    `연락처: ${phoneDisplay}`,
  ];
  if (visitDate) lines.push(`방문희망일: ${visitDate}`);
  if (visitTimeLabel) lines.push(`방문희망시간: ${visitTimeLabel}`);
  return lines.join('\n');
}

// Blobs 조회가 실패해도(로컬 개발 등) 실제 문의가 막히지 않도록 fail-open 처리합니다.
async function checkRateLimit(ip) {
  try {
    const store = getStore('contact-rate-limit');
    const key = ip || 'unknown';
    const last = await store.get(key);
    const now = Date.now();
    if (last && now - Number(last) < RATE_LIMIT_WINDOW_MS) {
      return false;
    }
    await store.set(key, String(now));
    return true;
  } catch (err) {
    console.error('contact rate-limit check failed:', err.message);
    return true;
  }
}

export default async (req, context) => {
  const now = new Date().toISOString();
  const originHeader = req.headers.get('origin');
  const originIsAllowed = isAllowedOrigin(originHeader);
  const allowedOrigin = originIsAllowed ? originHeader : null;

  // 브라우저의 CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    if (!originIsAllowed) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin',
      },
    });
  }

  // Origin 헤더가 있는데 허용 목록에 없으면 즉시 차단 (알 수 없는 외부 도메인)
  if (originHeader && !originIsAllowed) {
    return jsonResponse(403, { ok: false }, null);
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false }, allowedOrigin);
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return jsonResponse(415, { ok: false }, allowedOrigin);
  }

  const contentLength = Number(req.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { ok: false }, allowedOrigin);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { ok: false }, allowedOrigin);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse(400, { ok: false }, allowedOrigin);
  }

  // 허니팟: 채워져 있으면 봇으로 간주하고 조용히 성공 응답만 돌려줍니다.
  if (typeof body._gotcha === 'string' && body._gotcha.trim() !== '') {
    console.log(`[${now}] contact: honeypot triggered, skipped`);
    return jsonResponse(200, { ok: true }, allowedOrigin);
  }

  const formType = typeof body.formType === 'string' ? body.formType : '';
  const formTypeLabel = FORM_TYPE_LABELS[formType];
  if (!formTypeLabel) {
    return jsonResponse(400, { ok: false }, allowedOrigin);
  }

  const name = cleanText(body.name, NAME_MAX_LEN);
  if (!NAME_RE.test(name)) {
    return jsonResponse(400, { ok: false }, allowedOrigin);
  }

  const phoneDigits = normalizePhone(body.phone);
  if (!PHONE_RE.test(phoneDigits)) {
    return jsonResponse(400, { ok: false }, allowedOrigin);
  }

  if (body.agreeAll !== true) {
    return jsonResponse(400, { ok: false }, allowedOrigin);
  }

  let visitDate = '';
  let visitTimeLabel = '';
  if (formType === 'visit-reservation') {
    if (typeof body.visitDate === 'string' && DATE_RE.test(body.visitDate)) {
      visitDate = body.visitDate;
    }
    if (typeof body.visitTime === 'string' && VISIT_TIME_LABELS[body.visitTime]) {
      visitTimeLabel = VISIT_TIME_LABELS[body.visitTime];
    }
  }

  const ip =
    context.ip ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown';
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    console.log(`[${now}] contact: rate limited`);
    return jsonResponse(429, { ok: false }, allowedOrigin);
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const fromNumber = normalizePhone(process.env.SOLAPI_FROM_NUMBER);
  const adminNumber = normalizePhone(process.env.SOLAPI_ADMIN_NUMBER);

  if (!apiKey || !apiSecret || !fromNumber || !adminNumber) {
    const missing = [
      !apiKey && 'SOLAPI_API_KEY',
      !apiSecret && 'SOLAPI_API_SECRET',
      !fromNumber && 'SOLAPI_FROM_NUMBER',
      !adminNumber && 'SOLAPI_ADMIN_NUMBER',
    ].filter(Boolean).join(', ');
    console.error(`[${now}] contact: missing env vars (${missing})`);
    return jsonResponse(500, { ok: false }, allowedOrigin);
  }

  const text = buildMessage({
    formTypeLabel,
    name,
    phoneDisplay: formatPhoneDisplay(phoneDigits),
    visitDate,
    visitTimeLabel,
  });

  try {
    const messageService = new SolapiMessageService(apiKey, apiSecret);
    const result = await messageService.send({ to: adminNumber, from: fromNumber, text });
    const groupId = result?.groupInfo?.groupId || '';
    console.log(`[${now}] contact: sms sent ok groupId=${groupId}`);
    return jsonResponse(200, { ok: true }, allowedOrigin);
  } catch (err) {
    const errorCode = err?.errorCode || err?._tag || err?.name || 'UNKNOWN';
    console.error(`[${now}] contact: sms send failed code=${errorCode}`);
    return jsonResponse(502, { ok: false }, allowedOrigin);
  }
};

export const config = { path: '/api/contact' };
