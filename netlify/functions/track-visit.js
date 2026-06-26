const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const ip =
    event.headers["x-nf-client-connection-ip"] ||
    (event.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    "unknown";

  const now = new Date();
  // KST = UTC+9
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateKey = kstNow.toISOString().slice(0, 10); // YYYY-MM-DD

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

  return { statusCode: 204, body: "" };
};
