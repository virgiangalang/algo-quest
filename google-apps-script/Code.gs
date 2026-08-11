/**
 * Algonova Math — Apps Script Web App
 * File: Code.gs
 *
 * Deploy sebagai Web App:
 *   - Execute as: Me
 *   - Who has access: Anyone
 *
 * Endpoint: POST dengan JSON body { action, ... }
 */

const SHEET_NAME = "Credentials";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === "validate") return respond(validateStudent(body));
    if (action === "submit")   return respond(submitResult(body));

    return respond({ success: false, message: "Action tidak dikenal." });
  } catch (err) {
    return respond({ success: false, message: "Error: " + err.message });
  }
}

// ─── CORS untuk preflight ───
function doGet(e) {
  return respond({ ok: true, message: "Algonova Math API aktif." });
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── VALIDATE ───────────────────────────────────────────────────────────────
/**
 * Cek apakah username valid & belum dipakai.
 * body: { username, name, age }
 */
function validateStudent(body) {
  const username = String(body.username || "").trim().toUpperCase();
  if (!username) return { valid: false, message: "Username wajib diisi." };

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();

  // Header di baris 1: Username|Nama|Umur|Level|VALID|USED|Used At|Score|Character|Accuracy
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).trim().toUpperCase() !== username) continue;

    const valid = String(row[4]).toUpperCase() === "TRUE";
    const used  = String(row[5]).toUpperCase() === "TRUE";

    if (!valid) return { valid: false, message: "Akun tidak aktif. Hubungi Algonova." };

    // Ambil level dari sheet (bisa dikosongkan → diagnostic tentukan sendiri)
    const levelFromSheet = String(row[3] || "").trim() || null;

    return {
      valid: true,
      used: used,
      studentName: String(row[1]).trim() || body.name,
      age: Number(row[2]) || body.age || null,
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
 * body: { username, score, accuracy, character, skills }
 */
function submitResult(body) {
  const username = String(body.username || "").trim().toUpperCase();

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;

    const row = i + 1; // 1-indexed untuk sheet
    sheet.getRange(row, 2).setValue(body.name || body.nama || data[i][1]); // Nama
    if (body.age != null || body.umur != null) {
      sheet.getRange(row, 3).setValue(body.age != null ? body.age : body.umur);
    }
    if (body.level) sheet.getRange(row, 4).setValue(body.level);
    sheet.getRange(row, 6).setValue(true);                             // USED = TRUE
    sheet.getRange(row, 7).setValue(new Date().toISOString());          // Used At
    sheet.getRange(row, 8).setValue(body.score || 0);                   // Score
    sheet.getRange(row, 9).setValue(body.character || "");              // Character
    sheet.getRange(row, 10).setValue((body.accuracy || 0) + "%");       // Accuracy

    return { success: true, ok: true, usedAt: sheet.getRange(row, 7).getValue() };
  }

  return { success: false, message: "Username tidak ditemukan untuk submit." };
}
