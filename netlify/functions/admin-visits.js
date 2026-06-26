import { getStore } from "@netlify/blobs";

// Netlify 대시보드 → Environment variables → ADMIN_PASSWORD 설정 권장
const ADMIN_PW = process.env.ADMIN_PASSWORD || "adminpw2026!";

export default async (req, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  // Authorization: Bearer <password>
  const auth = req.headers.get("authorization") || "";
  const pw = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  if (!pw || pw !== ADMIN_PW) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers,
    });
  }

  const url = new URL(req.url);
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayKey = kstNow.toISOString().slice(0, 10);
  const dateKey = url.searchParams.get("date") || todayKey;

  try {
    const store = getStore("visit-logs");
    const raw = await store.get(dateKey);
    const data = raw ? JSON.parse(raw) : {};

    const rows = Object.entries(data)
      .map(([ip, v]) => ({ ip, count: v.count, lastSeen: v.lastSeen }))
      .sort((a, b) => b.count - a.count);

    const totalVisits = rows.reduce((sum, r) => sum + r.count, 0);

    return new Response(
      JSON.stringify({ date: dateKey, uniqueIPs: rows.length, totalVisits, rows }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
};

export const config = { path: "/api/admin-visits" };
