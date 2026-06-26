const { getStore } = require("@netlify/blobs");

// Set ADMIN_PASSWORD in Netlify dashboard → Site configuration → Environment variables
const ADMIN_PW = process.env.ADMIN_PASSWORD || "adminpw2026!";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  // Expect Authorization: Bearer <password>
  const auth = (event.headers.authorization || "").trim();
  const pw = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  if (!pw || pw !== ADMIN_PW) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayKey = kstNow.toISOString().slice(0, 10);
  const dateKey = (event.queryStringParameters || {}).date || todayKey;

  try {
    const store = getStore("visit-logs");
    const raw = await store.get(dateKey);
    const data = raw ? JSON.parse(raw) : {};

    const rows = Object.entries(data)
      .map(([ip, v]) => ({ ip, count: v.count, lastSeen: v.lastSeen }))
      .sort((a, b) => b.count - a.count);

    const totalVisits = rows.reduce((sum, r) => sum + r.count, 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ date: dateKey, uniqueIPs: rows.length, totalVisits, rows }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
