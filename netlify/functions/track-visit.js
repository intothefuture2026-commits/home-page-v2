import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const ip =
    context.ip ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown";

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateKey = kstNow.toISOString().slice(0, 10); // YYYY-MM-DD (KST)

  try {
    const store = getStore("visit-logs");
    const raw = await store.get(dateKey);
    const data = raw ? JSON.parse(raw) : {};

    if (!data[ip]) data[ip] = { count: 0, lastSeen: "" };
    data[ip].count += 1;
    data[ip].lastSeen = now.toISOString();

    await store.set(dateKey, JSON.stringify(data));
  } catch (err) {
    console.error("track-visit error:", err.message);
  }

  return new Response(null, { status: 204 });
};

export const config = { path: "/api/track-visit" };
