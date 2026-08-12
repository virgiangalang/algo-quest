/**
 * Proxy ke Google Apps Script (validate / submit).
 *
 * Browser tidak bisa andalkan POST langsung ke script.google.com:
 * Google mengarahkan (302) ke script.googleusercontent.com, lalu POST
 * di URL itu gagal (405) / respons HTML → "Gagal terhubung ke server".
 *
 * Di server kita: POST dengan redirect:manual, lalu GET Location (hasil JSON).
 */
const { json, readBody } = require("./_lib");

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzjXGev3pevaaCWk_Ob16isnpM2M_-uQHKlC-f8VE8gdS_WvJ0-bUWzwRxy1wbn43AZDQ/exec";

function getAppsScriptUrl() {
  return String(process.env.APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL).trim();
}

async function callAppsScript(payload) {
  const appsUrl = getAppsScriptUrl();
  if (!appsUrl) {
    throw new Error("APPS_SCRIPT_URL belum di-set.");
  }

  // 1) POST → ambil Location redirect (teknik yang andal)
  const postResp = await fetch(appsUrl, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const loc = postResp.headers.get("location");
  if (loc) {
    const echoResp = await fetch(loc, { redirect: "follow" });
    const text = await echoResp.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error("Respons Apps Script tidak valid (HTML/bukan JSON).");
    }
  }

  if (postResp.ok) {
    const text = await postResp.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error("Respons Apps Script tidak valid.");
    }
  }

  // 2) Fallback GET (deploy live sudah mendukung action=validate via query)
  if (payload && payload.action === "validate") {
    const u = new URL(appsUrl);
    for (const [k, v] of Object.entries(payload)) {
      if (v == null || typeof v === "object") continue;
      u.searchParams.set(k, String(v));
    }
    const getResp = await fetch(u.toString(), { redirect: "follow" });
    const text = await getResp.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error("Respons Apps Script tidak valid (GET fallback).");
    }
  }

  throw new Error(
    `Apps Script gagal (HTTP ${postResp.status}). Coba deploy ulang Web App.`
  );
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, message: "POST only" });
  }

  try {
    const body = await readBody(req);
    if (!body || !body.action) {
      return json(res, 400, { ok: false, message: "action wajib diisi." });
    }
    const result = await callAppsScript(body);
    return json(res, 200, result);
  } catch (e) {
    return json(res, 502, {
      ok: false,
      valid: false,
      message: e.message || "Gagal menghubungi Google Sheet.",
    });
  }
};
