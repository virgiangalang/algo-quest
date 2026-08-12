/**
 * Auth proxy — validate CEPAT via Google Sheet CSV (~0.3–1s).
 * Submit tetap lewat Apps Script (tulis USED/Score).
 *
 * Kenapa bukan Apps Script untuk login?
 * Web App Google sering cold-start 10–30+ dtk / hang → UI stuck.
 * Export CSV Sheet jauh lebih stabil (seperti auth cepat di project Kindora).
 */
const { json, readBody } = require("./_lib");

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzjXGev3pevaaCWk_Ob16isnpM2M_-uQHKlC-f8VE8gdS_WvJ0-bUWzwRxy1wbn43AZDQ/exec";

const DEFAULT_SHEET_ID = "1cnE2jMYSwEhIM1xCNq9ZRIhM_fFqLJwvCW8YSHsbmdU";
const DEFAULT_SHEET_GID = "658906218";

/** In-memory cache per warm serverless instance */
let credCache = { at: 0, rows: null };

function env(name, fallback) {
  const v = process.env[name];
  return v != null && String(v).trim() ? String(v).trim() : fallback;
}

function sheetCsvUrl() {
  const id = env("GOOGLE_SHEET_ID", DEFAULT_SHEET_ID);
  const gid = env("GOOGLE_SHEET_GID", DEFAULT_SHEET_GID);
  // published/export CSV — tidak butuh Apps Script
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function truthy(v) {
  if (v === true || v === 1) return true;
  return ["TRUE", "YES", "1", "YA", "CHECKED"].includes(
    String(v == null ? "" : v).trim().toUpperCase()
  );
}

/** Minimal CSV parser (handles quotes) */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const s = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

async function fetchCredRows(force) {
  const ttlMs = Number(env("CRED_CACHE_MS", "20000")) || 20000;
  if (!force && credCache.rows && Date.now() - credCache.at < ttlMs) {
    return credCache.rows;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const resp = await fetch(sheetCsvUrl(), {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "Cache-Control": "no-cache" },
    });
    if (!resp.ok) {
      throw new Error(`Gagal baca Google Sheet (HTTP ${resp.status}). Pastikan Sheet bisa diakses (Anyone with link: Viewer).`);
    }
    const text = await resp.text();
    if (/<!DOCTYPE html>|Sign in/i.test(text.slice(0, 200))) {
      throw new Error("Sheet terkunci. Share → Anyone with the link → Viewer.");
    }
    const rows = parseCsv(text);
    credCache = { at: Date.now(), rows };
    return rows;
  } finally {
    clearTimeout(timer);
  }
}

function validateFromRows(rows, body) {
  const username = String((body && body.username) || "").trim().toUpperCase();
  if (!username) return { valid: false, message: "Username wajib diisi." };
  if (!rows || rows.length < 2) {
    return { valid: false, message: "Data Credentials kosong." };
  }

  // Header row → index (tolerant)
  const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
  const idx = {
    username: header.findIndex((h) => h === "username"),
    nama: header.findIndex((h) => h === "nama" || h === "name"),
    umur: header.findIndex((h) => h === "umur" || h === "age"),
    level: header.findIndex((h) => h === "level"),
    valid: header.findIndex((h) => h === "valid"),
    used: header.findIndex((h) => h === "used"),
    usedAt: header.findIndex((h) => h === "used at" || h === "used_at" || h === "usedat"),
    score: header.findIndex((h) => h === "score"),
    character: header.findIndex((h) => h === "character"),
    accuracy: header.findIndex((h) => h === "accuracy"),
  };
  if (idx.username < 0) idx.username = 0;
  if (idx.valid < 0) idx.valid = 4;
  if (idx.used < 0) idx.used = 5;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const u = String(row[idx.username] || "").trim().toUpperCase();
    if (u !== username) continue;

    const valid = truthy(row[idx.valid]);
    const used = truthy(row[idx.used]);
    if (!valid) return { valid: false, message: "Akun tidak aktif. Hubungi Algonova." };

    const nama = idx.nama >= 0 ? String(row[idx.nama] || "").trim() : "";
    const level = idx.level >= 0 ? String(row[idx.level] || "").trim() : "";
    const ageRaw = idx.umur >= 0 ? row[idx.umur] : "";
    return {
      valid: true,
      used,
      studentName: nama || (body && (body.name || body.nama)) || "",
      age: Number(ageRaw) || (body && (body.age || body.umur)) || null,
      level: level || null,
      score: idx.score >= 0 ? row[idx.score] || 0 : 0,
      character: idx.character >= 0 ? String(row[idx.character] || "").trim() : "",
      accuracy: idx.accuracy >= 0 ? row[idx.accuracy] || 0 : 0,
      usedAt: idx.usedAt >= 0 && row[idx.usedAt] ? String(row[idx.usedAt]) : "",
      message: used ? "Akun sudah digunakan." : "OK",
      source: "sheet-csv",
    };
  }
  return { valid: false, message: "Username tidak ditemukan." };
}

async function callAppsScriptPostEcho(payload) {
  const appsUrl = env("APPS_SCRIPT_URL", DEFAULT_APPS_SCRIPT_URL);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const postResp = await fetch(appsUrl, {
      method: "POST",
      redirect: "manual",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const loc = postResp.headers.get("location");
    if (loc) {
      const echoCtrl = new AbortController();
      const echoTimer = setTimeout(() => echoCtrl.abort(), 10000);
      try {
        const echoResp = await fetch(loc, { redirect: "follow", signal: echoCtrl.signal });
        return JSON.parse(await echoResp.text());
      } finally {
        clearTimeout(echoTimer);
      }
    }
    if (postResp.ok) return JSON.parse(await postResp.text());
    throw new Error(`Apps Script HTTP ${postResp.status}`);
  } finally {
    clearTimeout(timer);
  }
}

async function callAppsScriptGet(payload) {
  const appsUrl = env("APPS_SCRIPT_URL", DEFAULT_APPS_SCRIPT_URL);
  const u = new URL(appsUrl);
  for (const [k, v] of Object.entries(payload || {})) {
    if (v == null || typeof v === "object") continue;
    u.searchParams.set(k, String(v));
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const resp = await fetch(u.toString(), { redirect: "follow", signal: ctrl.signal });
    return JSON.parse(await resp.text());
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, message: "POST only" });
  }

  try {
    const body = await readBody(req);
    const action = String((body && body.action) || "").toLowerCase();
    if (!action) return json(res, 400, { ok: false, message: "action wajib diisi." });

    if (action === "ping" || action === "warm") {
      // Prefetch CSV ke cache — bangunkan jalur cepat, bukan Apps Script
      try {
        await fetchCredRows(false);
      } catch (_) { /* ignore */ }
      return json(res, 200, { ok: true, message: "sheet-csv ready", t: Date.now() });
    }

    if (action === "validate") {
      const rows = await fetchCredRows(false);
      return json(res, 200, validateFromRows(rows, body));
    }

    if (action === "profile") {
      // Simpan nama/umur tanpa menandai USED
      try {
        const result = await callAppsScriptPostEcho({
          action: "profile",
          username: body.username,
          name: body.name || body.nama,
          nama: body.name || body.nama,
          age: body.age || body.umur,
          umur: body.age || body.umur,
        });
        credCache = { at: 0, rows: null };
        return json(res, 200, result);
      } catch (e1) {
        try {
          const viaGet = await callAppsScriptGet({
            action: "profile",
            username: body.username,
            name: body.name || body.nama,
            age: body.age || body.umur,
          });
          credCache = { at: 0, rows: null };
          return json(res, 200, viaGet);
        } catch (e2) {
          // Non-blocking: client tetap lanjut meski Sheet lambat
          return json(res, 200, {
            ok: true,
            deferred: true,
            message: "Nama disimpan lokal; Sheet menyusul saat submit.",
          });
        }
      }
    }

    if (action === "submit") {
      // Invalidate cache supaya login berikutnya lihat USED terbaru
      credCache = { at: 0, rows: null };
      try {
        const result = await callAppsScriptPostEcho(body);
        return json(res, 200, result);
      } catch (e1) {
        try {
          const viaGet = await callAppsScriptGet(body);
          return json(res, 200, viaGet);
        } catch (e2) {
          return json(res, 502, {
            ok: false,
            success: false,
            message: e1.message || "Gagal menyimpan hasil ke Sheet.",
          });
        }
      }
    }

    return json(res, 400, { ok: false, message: "Action tidak dikenal." });
  } catch (e) {
    const aborted = e && (e.name === "AbortError" || /aborted/i.test(e.message || ""));
    return json(res, 502, {
      ok: false,
      valid: false,
      message: aborted
        ? "Server Sheet timeout. Coba lagi beberapa detik."
        : e.message || "Gagal menghubungi Google Sheet.",
    });
  }
};
