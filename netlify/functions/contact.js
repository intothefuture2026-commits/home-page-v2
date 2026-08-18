import { randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { SolapiMessageService } from 'solapi';

// 문의 유형별 문자 표기 라벨. 여기에 없는 formType은 전부 거부됩니다.
const FORM_TYPE_LABELS = {
  'interest-register': '관심고객 등록',
  'interest-register-hero': '관심고객 등록',
  'visit-reservation': '방문예약',
};

// SMS 본문에는 짧은 라벨만 사용합니다 (예: "[문의]관심등록/이름/연락처").
const FORM_TYPE_SHORT_LABELS = {
  'interest-register': '관심등록',
  'interest-register-hero': '관심등록',
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
const SMS_MAX_BYTES = 90;
const INQUIRY_RETENTION_DAYS = 90;
const INQUIRY_CLEANUP_MAX_DELETE = 50;

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

// 국내 SMS 90바이트 규격: 비-ASCII(한글 등)는 2바이트, ASCII는 1바이트로 계산합니다.
// (실제 UTF-8 바이트 수와는 다릅니다 — 한글 45자 = 90바이트 규칙 기준)
function smsByteLength(str) {
  let bytes = 0;
  for (const ch of str) {
    bytes += ch.codePointAt(0) > 127 ? 2 : 1;
  }
  return bytes;
}

// 문자 단위(서로게이트 페어 포함)로 안전하게 잘라 지정한 바이트 수를 넘지 않도록 합니다.
function truncateToSmsBytes(str, maxBytes) {
  let result = '';
  let bytes = 0;
  for (const ch of str) {
    const chBytes = ch.codePointAt(0) > 127 ? 2 : 1;
    if (bytes + chBytes > maxBytes) break;
    result += ch;
    bytes += chBytes;
  }
  return result;
}

function buildShortMessage({ formTypeShortLabel, name, phoneDigits }) {
  const prefix = '[문의]';
  const fixedBytes = smsByteLength(prefix) + smsByteLength(formTypeShortLabel) + 2 /* 슬래시 2개 */ + smsByteLength(phoneDigits);
  const nameBudget = Math.max(0, SMS_MAX_BYTES - fixedBytes);
  const safeName = truncateToSmsBytes(name, nameBudget);

  let text = `${prefix}${formTypeShortLabel}/${safeName}/${phoneDigits}`;

  // 최후의 안전장치: 어떤 이유로든 90바이트를 넘으면 문자열 전체를 잘라냅니다.
  if (smsByteLength(text) > SMS_MAX_BYTES) {
    text = truncateToSmsBytes(text, SMS_MAX_BYTES);
  }
  return text;
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

// 접수된 문의 전체 데이터를 SMS 발송 이전에 먼저 저장합니다.
// 키를 13자리 0-패딩 epoch ms로 시작하게 만들어 문자열 정렬 = 시간 정렬이 되도록 합니다.
async function saveInquiry(store, record) {
  const key = `${String(record.receivedAtMs).padStart(13, '0')}_${record.id}`;
  await store.setJSON(key, record);
  return key;
}

async function updateInquiryStatus(store, key, record) {
  try {
    await store.setJSON(key, record);
  } catch (err) {
    console.error('contact: inquiry status update failed:', err.message);
  }
}

// 90일이 지난 문의를 새 접수 처리 중에 best-effort로 정리합니다.
// 목록 조회 1회(최대 1페이지) + 삭제 최대 N건으로 매 요청의 비용을 제한합니다.
async function cleanupOldInquiries(store) {
  try {
    const cutoffMs = Date.now() - INQUIRY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const { blobs } = await store.list();
    let deleted = 0;
    for (const blob of blobs) {
      if (deleted >= INQUIRY_CLEANUP_MAX_DELETE) break;
      const tsPart = blob.key.split('_')[0];
      const ts = Number(tsPart);
      if (Number.isFinite(ts) && ts < cutoffMs) {
        await store.delete(blob.key);
        deleted++;
      }
    }
  } catch (err) {
    console.error('contact: inquiry cleanup failed:', err.message);
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

  // ── 1. 문의 전체 데이터를 SOLAPI 호출보다 먼저 저장 ──
  const receivedAtMs = Date.now();
  const inquiryId = randomUUID();
  const pageOrigin = cleanText(originHeader || req.headers.get('referer') || 'unknown', 200);

  const inquiryRecord = {
    id: inquiryId,
    receivedAt: new Date(receivedAtMs).toISOString(),
    receivedAtMs,
    formType,
    name,
    phone: phoneDigits,
    visitDate: formType === 'visit-reservation' ? visitDate : '',
    visitTime: formType === 'visit-reservation' ? visitTimeLabel : '',
    origin: pageOrigin,
    smsStatus: 'pending',
    smsGroupId: '',
  };

  let inquiryStore;
  let inquiryKey;
  try {
    inquiryStore = getStore('inquiries');
    inquiryKey = await saveInquiry(inquiryStore, inquiryRecord);
    // 저장 성공 후에만, 그리고 매 요청마다 과부하 없이 best-effort로 오래된 데이터 정리
    // (서버리스 함수는 응답 후 곧바로 종료될 수 있어 반드시 await로 완료를 기다립니다)
    await cleanupOldInquiries(inquiryStore);
  } catch (err) {
    console.error(`[${now}] contact: inquiry save failed:`, err.message);
    return jsonResponse(500, { ok: false }, allowedOrigin);
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
    await updateInquiryStatus(inquiryStore, inquiryKey, { ...inquiryRecord, smsStatus: 'failed' });
    return jsonResponse(500, { ok: false }, allowedOrigin);
  }

  const text = buildShortMessage({
    formTypeShortLabel: FORM_TYPE_SHORT_LABELS[formType],
    name,
    phoneDigits,
  });

  try {
    const messageService = new SolapiMessageService(apiKey, apiSecret);
    const result = await messageService.send({ to: adminNumber, from: fromNumber, text, type: 'SMS' });
    const groupId = result?.groupInfo?.groupId || '';
    console.log(`[${now}] contact: sms sent ok groupId=${groupId} bytes=${smsByteLength(text)}`);
    await updateInquiryStatus(inquiryStore, inquiryKey, { ...inquiryRecord, smsStatus: 'sent', smsGroupId: groupId });
    return jsonResponse(200, { ok: true }, allowedOrigin);
  } catch (err) {
    const errorCode = err?.errorCode || err?._tag || err?.name || 'UNKNOWN';
    console.error(`[${now}] contact: sms send failed code=${errorCode}`);
    await updateInquiryStatus(inquiryStore, inquiryKey, { ...inquiryRecord, smsStatus: 'failed' });
    return jsonResponse(502, { ok: false }, allowedOrigin);
  }
};

export const config = { path: '/api/contact' };

// 순수 함수만 별도로 export — 유닛 테스트 전용, Netlify Functions 런타임은 default/config만 사용합니다.
export { smsByteLength, truncateToSmsBytes, buildShortMessage, FORM_TYPE_SHORT_LABELS };
