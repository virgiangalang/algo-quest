/**
 * Algonova Quest — Apps Script Web App
 * File: Code.gs
 *
 * Deploy sebagai Web App:
 *   - Execute as: Me
 *   - Who has access: Anyone
 *
 * Endpoint:
 *   POST JSON body { action, ... }
 *   GET  ?action=validate|submit&...  (disarankan untuk browser / fallback)
 */

const SHEET_NAME = "Credentials";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return respond(routeAction(body));
  } catch (err) {
    return respond({ success: false, valid: false, message: "Error: " + err.message });
  }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (!p.action) {
      return respond({ ok: true, message: "Algonova Quest API aktif." });
    }
    // Query string → object biasa (skills boleh JSON string)
    const body = Object.assign({}, p);
    if (body.age != null && body.age !== "") body.age = Number(body.age);
    if (body.umur != null && body.umur !== "") body.umur = Number(body.umur);
    if (body.score != null && body.score !== "") body.score = Number(body.score);
    if (body.accuracy != null && body.accuracy !== "") body.accuracy = Number(String(body.accuracy).replace("%", ""));
    if (typeof body.skills === "string" && body.skills) {
      try { body.skills = JSON.parse(body.skills); } catch (_) {}
    }
    return respond(routeAction(body));
  } catch (err) {
    return respond({ success: false, valid: false, message: "Error: " + err.message });
  }
}

function routeAction(body) {
  const action = body.action;
  if (action === "validate") return validateStudent(body);
  if (action === "submit") return submitResult(body);
  return { success: false, message: "Action tidak dikenal." };
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Checkbox / TRUE / true / 1 → boolean */
function asBool(v) {
  if (v === true || v === false) return v;
  const s = String(v == null ? "" : v).trim().toUpperCase();
  return s === "TRUE" || s === "YES" || s === "1" || s === "YA";
}

// ─── VALIDATE ───────────────────────────────────────────────────────────────
/**
 * Cek apakah username valid & belum dipakai.
 * body: { username, name, age }
 */
function validateStudent(body) {
  const username = String(body.username || "").trim().toUpperCase();
  if (!username) return { valid: false, message: "Username wajib diisi." };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return { valid: false, message: "Tab '" + SHEET_NAME + "' tidak ditemukan di Sheet." };
  }
  const data = sheet.getDataRange().getValues();

  // Header: Username|Nama|Umur|Level|VALID|USED|Used At|Score|Character|Accuracy
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).trim().toUpperCase() !== username) continue;

    const valid = asBool(row[4]);
    const used = asBool(row[5]);

    if (!valid) return { valid: false, message: "Akun tidak aktif. Hubungi Algonova." };

    const levelFromSheet = String(row[3] || "").trim() || null;

    return {
      valid: true,
      used: used,
      studentName: String(row[1]).trim() || body.name || body.nama || "",
      age: Number(row[2]) || body.age || body.umur || null,
      level: levelFromSheet,
      score: row[7] || 0,
      character: String(row[8] || "").trim(),
      accuracy: row[9] || 0,
      usedAt: row[6] ? String(row[6]) : "",
      message: used ? "Akun sudah digunakan." : "OK",
    };
  }

  return { valid: false, message: "Username tidak ditemukan." };
}

// ─── SUBMIT ─────────────────────────────────────────────────────────────────
/**
 * Simpan hasil dan tandai USED = TRUE.
 * body: { username, score, accuracy, character, skills, name, age, level }
 */
function submitResult(body) {
  const username = String(body.username || "").trim().toUpperCase();
  if (!username) return { success: false, message: "Username wajib diisi." };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return { success: false, message: "Tab '" + SHEET_NAME + "' tidak ditemukan di Sheet." };
  }
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;

    const row = i + 1; // 1-indexed
    sheet.getRange(row, 2).setValue(body.name || body.nama || data[i][1]);
    if (body.age != null || body.umur != null) {
      sheet.getRange(row, 3).setValue(body.age != null ? body.age : body.umur);
    }
    if (body.level) sheet.getRange(row, 4).setValue(body.level);
    sheet.getRange(row, 6).setValue(true); // USED
    sheet.getRange(row, 7).setValue(new Date().toISOString());
    sheet.getRange(row, 8).setValue(body.score || 0);
    sheet.getRange(row, 9).setValue(body.character || "");
    sheet.getRange(row, 10).setValue((body.accuracy || 0) + "%");

    return { success: true, ok: true, usedAt: sheet.getRange(row, 7).getValue() };
  }

  return { success: false, message: "Username tidak ditemukan untuk submit." };
}
