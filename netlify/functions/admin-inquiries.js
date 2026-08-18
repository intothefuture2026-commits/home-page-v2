import { getStore } from '@netlify/blobs';

// Netlify 대시보드 → Environment variables → ADMIN_PASSWORD 설정 권장 (admin-visits.js와 동일 계정 재사용)
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'adminpw2026!';

const MAX_LIST_KEYS = 1000; // 목록 조회 1회당 스캔 상한
const MAX_ROWS = 500; // 응답에 포함할 최대 건수

const CSV_HEADERS = [
  '접수시각(KST)',
  '문의유형',
  '이름',
  '연락처',
  '방문희망일',
  '방문희망시간',
  '접수 Origin',
  'SMS발송상태',
];

const FORM_TYPE_LABELS = {
  'interest-register': '관심고객 등록',
  'interest-register-hero': '관심고객 등록',
  'visit-reservation': '방문예약',
};

function formatKST(isoStr) {
  try {
    return new Date(isoStr).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch {
    return isoStr || '';
  }
}

function kstDateKey(ms) {
  const kst = new Date(ms + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// Excel/Sheets 수식 injection 방지 + 콤마/따옴표/개행 이스케이프
function csvCell(value) {
  const str = String(value ?? '');
  const guarded = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

function toCsv(rows) {
  const lines = [CSV_HEADERS.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([
      formatKST(r.receivedAt),
      FORM_TYPE_LABELS[r.formType] || r.formType,
      r.name,
      r.phone,
      r.visitDate,
      r.visitTime,
      r.origin,
      r.smsStatus,
    ].map(csvCell).join(','));
  }
  return lines.join('\r\n');
}

export default async (req, context) => {
  const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  const auth = req.headers.get('authorization') || '';
  const pw = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!pw || pw !== ADMIN_PW) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  const url = new URL(req.url);
  const dateFilter = url.searchParams.get('date') || '';
  const format = url.searchParams.get('format') || 'json';

  try {
    const store = getStore('inquiries');
    const { blobs } = await store.list();

    // 키가 13자리 0-패딩 epoch ms로 시작하므로 문자열 내림차순 정렬 = 최신순 정렬
    const sortedKeys = blobs
      .map((b) => b.key)
      .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
      .slice(0, MAX_LIST_KEYS);

    const records = await Promise.all(
      sortedKeys.map((key) => store.get(key, { type: 'json' }).catch(() => null))
    );

    let rows = records.filter(Boolean);
    if (dateFilter) {
      rows = rows.filter((r) => kstDateKey(r.receivedAtMs) === dateFilter);
    }
    rows = rows.slice(0, MAX_ROWS);

    if (format === 'csv') {
      const csv = toCsv(rows);
      const safeDatePart = /^\d{4}-\d{2}-\d{2}$/.test(dateFilter) ? dateFilter : 'all';
      const filename = `inquiries-${safeDatePart}.csv`;
      return new Response('﻿' + csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return new Response(JSON.stringify({ count: rows.length, rows }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error('admin-inquiries error:', err.message);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: jsonHeaders });
  }
};

export const config = { path: '/api/admin-inquiries' };
