const {
  json,
  readBody,
  getAdminPassword,
  signToken,
} = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { ok: false, message: "POST only" });

  const password = getAdminPassword();
  if (!password) {
    return json(res, 500, {
      ok: false,
      message: "ADMIN_PASSWORD belum di-set di Vercel Environment Variables.",
    });
  }

  try {
    const body = await readBody(req);
    const input = String(body.password || "");
    if (!input || input !== password) {
      return json(res, 401, { ok: false, message: "Password salah." });
    }
    const token = signToken({ role: "admin", exp: Date.now() + 1000 * 60 * 60 * 12 });
    return json(res, 200, { ok: true, token, expiresInHours: 12 });
  } catch (e) {
    return json(res, 400, { ok: false, message: e.message });
  }
};
