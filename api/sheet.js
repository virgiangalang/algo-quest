/**
 * Proxy ke Google Apps Script (validate / submit).
 *
 * Browser POST ke script.google.com sering gagal (302 → 405).
 * Validate lebih cepat lewat GET; submit tetap POST+echo dari server.
 */
const { json, readBody } = require("./_lib");

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzjXGev3pevaaCWk_Ob16isnpM2M_-uQHKlC-f8VE8gdS_WvJ0-bUWzwRxy1wbn43AZDQ/exec";

function getAppsScriptUrl() {
  return String(process.env.APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL).trim();
}

function buildGetUrl(appsUrl, payload) {
  const u = new URL(appsUrl);
  for (const [k, v] of Object.entries(payload || {})) {
    if (v == null || typeof v === "object") continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function parseJsonText(text, label) {
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error(`Respons Apps Script tidak valid (${label}).`);
  }
}

async function callAppsScriptGet(appsUrl, payload) {
  const getResp = await fetch(buildGetUrl(appsUrl, payload), { redirect: "follow" });
  return parseJsonText(await getResp.text(), "GET");
}

async function callAppsScriptPostEcho(appsUrl, payload) {
  const postResp = await fetch(appsUrl, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const loc = postResp.headers.get("location");
  if (loc) {
    const echoResp = await fetch(loc, { redirect: "follow" });
    return parseJsonText(await echoResp.text(), "POST echo");
  }

  if (postResp.ok) {
    return parseJsonText(await postResp.text(), "POST");
  }

  throw new Error(`Apps Script gagal (HTTP ${postResp.status}).`);
}

async function callAppsScript(payload) {
  const appsUrl = getAppsScriptUrl();
  if (!appsUrl) throw new Error("APPS_SCRIPT_URL belum di-set.");

  const action = String((payload && payload.action) || "").toLowerCase();

  // Validate / warm: 1 request GET (lebih cepat dari POST+echo)
  if (action === "validate" || action === "ping" || action === "warm" || !action) {
    try {
      return await callAppsScriptGet(appsUrl, payload.action ? payload : { action: "warm" });
    } catch (e) {
      // Cadangan POST+echo
      return callAppsScriptPostEcho(appsUrl, payload);
    }
  }

  // Submit: coba GET dulu (setelah Code.gs baru), lalu POST+echo
  try {
    const viaGet = await callAppsScriptGet(appsUrl, payload);
    // Deploy lama mengabaikan action=submit dan balas {ok:true,message:"…aktif"} 
    const looksLikeHealthOnly =
      viaGet &&
      viaGet.ok === true &&
      !viaGet.usedAt &&
      viaGet.success == null &&
      /aktif/i.test(String(viaGet.message || ""));
    if (looksLikeHealthOnly) {
      return callAppsScriptPostEcho(appsUrl, payload);
    }
    return viaGet;
  } catch (_) {
    return callAppsScriptPostEcho(appsUrl, payload);
  }
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
