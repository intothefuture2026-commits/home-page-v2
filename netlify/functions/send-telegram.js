// 환경변수로 설정하세요: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID || '';

function buildText(data) {
  // 데이터에 따라 메시지 내용 구성 (HTML escape minimal)
  const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines = [];
  lines.push(`<b>웹문의 접수</b>`);
  if (data.formType) lines.push(`유형: ${esc(data.formType)}`);
  if (data._subject) lines.push(`제목: ${esc(data._subject)}`);
  if (data.name) lines.push(`이름: ${esc(data.name)}`);
  if (data.phone) lines.push(`연락처: ${esc(data.phone)}`);
  if (data.visitDate) lines.push(`방문일: ${esc(data.visitDate)}`);
  if (data.visitTime) lines.push(`방문시간: ${esc(data.visitTime)}`);
  if (data.message) lines.push(`메시지: ${esc(data.message)}`);
  lines.push(`경로: ${esc((data.referrer || '').slice(0,200))}`);
  return lines.join('\n');
}

export default async (req, context) => {
  const headers = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ error: 'Server not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.' }), { status: 500, headers });
  }

  let body = {};
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  // Add referrer / origin info
  body.referrer = req.headers.get('referer') || req.headers.get('origin') || '';

  const text = buildText(body);

  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });

    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      return new Response(JSON.stringify({ error: 'Telegram API error', detail: data }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true, result: data.result }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/send-telegram' };
