/**
 * Algonova Quest — 1 file lengkap
 * - setupCredentials()  → buat tab Credentials + contoh data
 * - validate / submit   → Web App auth (dengan cache biar login lebih cepat)
 * - buildQuestions*()   → Sheet soal → JSON
 *
 * Deploy Web App: Execute as Me · Anyone
 * Setelah ubah: Deploy → Manage deployments → Edit → New version
 */

var SHEET_NAME = "Credentials";
/** Cache daftar kredensial (detik). Login berulang jauh lebih cepat. */
var CRED_CACHE_SECONDS = 45;
var CRED_CACHE_KEY = "algo_cred_v1";

/* =========================
   SETUP CREDENTIALS
   Jalankan sekali dari editor: setupCredentials
========================= */

function setupCredentials() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  var headers = [
    "Username", "Nama", "Umur", "Level", "VALID",
    "USED", "Used At", "Score", "Character", "Accuracy"
  ];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#4b2b68")
    .setFontColor("#ffffff");

  var samples = [
    ["ALGO-001", "", "", "", true, false, "", "", "", ""],
    ["ALGO-002", "", "", "", true, false, "", "", "", ""],
    ["ALGO-003", "Sari Dewi", 14, "smp", true, false, "", "", "", ""],
    ["ALGO-DEMO", "Demo User", 11, "sd-kelas-4-6", true, false, "", "", "", ""]
  ];
  sheet.getRange(2, 1, samples.length, headers.length).setValues(samples);
  sheet.getRange(2, 5, samples.length, 1).insertCheckboxes();
  sheet.getRange(2, 6, samples.length, 1).insertCheckboxes();

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);
  invalidateCredCache_();

  Logger.log("Credentials siap. Username uji: ALGO-001, ALGO-002, ALGO-003, ALGO-DEMO");
  SpreadsheetApp.getUi().alert(
    "Credentials siap!\n\nUsername uji:\nALGO-001\nALGO-002\nALGO-003\nALGO-DEMO\n\nVALID dicentang, USED kosong."
  );
}

function addCredential() {
  var ui = SpreadsheetApp.getUi();
  var user = ui.prompt("Username baru", "Contoh: ALGO-010", ui.ButtonSet.OK_CANCEL);
  if (user.getSelectedButton() !== ui.Button.OK) return;
  var username = String(user.getResponseText() || "").trim().toUpperCase();
  if (!username) {
    ui.alert("Username kosong.");
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupCredentials();
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  }

  var last = sheet.getLastRow() + 1;
  sheet.getRange(last, 1, 1, 10).setValues([[
    username, "", "", "", true, false, "", "", "", ""
  ]]);
  sheet.getRange(last, 5).insertCheckboxes();
  sheet.getRange(last, 6).insertCheckboxes();
  invalidateCredCache_();
  ui.alert("Ditambah: " + username + " (VALID=true, USED=false)");
}

function resetCredentialUsed() {
  var ui = SpreadsheetApp.getUi();
  var user = ui.prompt("Reset USED", "Username yang di-reset:", ui.ButtonSet.OK_CANCEL);
  if (user.getSelectedButton() !== ui.Button.OK) return;
  var username = String(user.getResponseText() || "").trim().toUpperCase();

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;
    var row = i + 1;
    sheet.getRange(row, 6).setValue(false);
    sheet.getRange(row, 7, 1, 4).clearContent();
    invalidateCredCache_();
    ui.alert("Reset OK: " + username);
    return;
  }
  ui.alert("Username tidak ditemukan.");
}

/* =========================
   WEB APP
========================= */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || "").toLowerCase();

    // Warmup / health — tanpa baca Sheet (cepat bangunkan container)
    if (!action || action === "ping" || action === "warm") {
      return respond_({ ok: true, message: "Algonova Quest API aktif.", t: Date.now() });
    }

    if (action === "validate") {
      return respond_(validateStudent_({
        username: p.username,
        name: p.name || p.nama,
        age: p.age || p.umur
      }));
    }

    if (action === "submit") {
      return respond_(submitResult_({
        username: p.username,
        name: p.name || p.nama,
        age: p.age || p.umur,
        level: p.level,
        score: p.score,
        accuracy: p.accuracy,
        character: p.character
      }));
    }

    return respond_({ ok: true, message: "Algonova Quest API aktif." });
  } catch (err) {
    return respond_({ ok: false, valid: false, message: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    if (e && e.parameter) {
      Object.keys(e.parameter).forEach(function (k) {
        if (body[k] === undefined) body[k] = e.parameter[k];
      });
    }
    var action = String(body.action || "").toLowerCase();
    if (action === "validate") return respond_(validateStudent_(body));
    if (action === "submit") return respond_(submitResult_(body));
    if (action === "ping" || action === "warm") {
      return respond_({ ok: true, message: "Algonova Quest API aktif.", t: Date.now() });
    }
    return respond_({ success: false, message: "Action tidak dikenal." });
  } catch (err) {
    return respond_({ success: false, message: "Error: " + err.message });
  }
}

function respond_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function truthy_(v) {
  if (v === true || v === 1) return true;
  return ["TRUE", "YES", "1", "YA"].indexOf(String(v == null ? "" : v).trim().toUpperCase()) >= 0;
}

/** Baca Credentials — pakai cache agar validate tidak selalu hit Spreadsheet. */
function getCredData_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(CRED_CACHE_KEY);
  if (hit) {
    try { return JSON.parse(hit); } catch (e) { /* fall through */ }
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();

  try {
    // CacheService max ~100KB / entry — cukup untuk ratusan username
    cache.put(CRED_CACHE_KEY, JSON.stringify(data), CRED_CACHE_SECONDS);
  } catch (e) {
    // Abaikan jika terlalu besar
  }
  return data;
}

function invalidateCredCache_() {
  try { CacheService.getScriptCache().remove(CRED_CACHE_KEY); } catch (e) { /* ignore */ }
}

function validateStudent_(body) {
  var username = String((body && body.username) || "").trim().toUpperCase();
  if (!username) return { valid: false, message: "Username wajib diisi." };

  var data = getCredData_();
  if (!data) {
    return { valid: false, message: "Tab Credentials tidak ditemukan. Jalankan setupCredentials()." };
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[0]).trim().toUpperCase() !== username) continue;

    var valid = truthy_(row[4]);
    var used = truthy_(row[5]);
    if (!valid) return { valid: false, message: "Akun tidak aktif. Hubungi Algonova." };

    return {
      valid: true,
      used: used,
      studentName: String(row[1] || "").trim() || (body && (body.name || body.nama)) || "",
      age: Number(row[2]) || (body && (body.age || body.umur)) || null,
      level: String(row[3] || "").trim() || null,
      score: row[7] || 0,
      character: String(row[8] || "").trim(),
      accuracy: row[9] || 0,
      usedAt: row[6] ? String(row[6]) : "",
      message: used ? "Akun sudah digunakan." : "OK"
    };
  }
  return { valid: false, message: "Username tidak ditemukan." };
}

function submitResult_(body) {
  var username = String((body && body.username) || "").trim().toUpperCase();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, message: "Tab Credentials tidak ditemukan." };

  // Submit harus data segar (bukan cache) supaya USED akurat
  invalidateCredCache_();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;

    var row = i + 1;
    if (!truthy_(data[i][4])) return { success: false, message: "Akun tidak VALID." };
    if (truthy_(data[i][5])) return { success: false, alreadyUsed: true, message: "Akun sudah USED." };

    var usedAt = new Date().toISOString();
    sheet.getRange(row, 2).setValue(body.name || body.nama || data[i][1] || "");
    if (body.age != null || body.umur != null) {
      sheet.getRange(row, 3).setValue(body.age != null ? body.age : body.umur);
    }
    if (body.level) sheet.getRange(row, 4).setValue(body.level);
    sheet.getRange(row, 6).setValue(true);
    sheet.getRange(row, 7).setValue(usedAt);
    sheet.getRange(row, 8).setValue(body.score || 0);
    sheet.getRange(row, 9).setValue(body.character || "");
    sheet.getRange(row, 10).setValue((body.accuracy || 0) + "%");

    invalidateCredCache_();
    return { success: true, ok: true, usedAt: usedAt };
  }
  return { success: false, message: "Username tidak ditemukan untuk submit." };
}

/* =========================
   BUILDER SOAL (opsional)
========================= */

function buildQuestionsSD13() {
  buildLevel_("Questions_SD13", "sd-kelas-1-3", "SD Kelas 1–3", "6–9 tahun", "Harta di Kebun Angka");
}
function buildQuestionsSD46() {
  buildLevel_("Questions_SD46", "sd-kelas-4-6", "SD Kelas 4–6", "10–12 tahun", "Kode yang Hilang");
}
function buildQuestionsSMP() {
  buildLevel_("Questions_SMP", "smp", "SMP", "13–15 tahun", "Operasi Variabel Gelap");
}
function buildQuestionsSMA() {
  buildLevel_("Questions_SMA", "sma", "SMA", "16–18 tahun", "Operasi Fungsi Rahasia");
}
function buildQuestionsDewasa() {
  buildLevel_("Questions_Dewasa", "dewasa", "Dewasa", "18+ tahun", "Audit Angka Tersembunyi");
}

function buildLevel_(sheetTab, level, label, ageRange, caseTitle) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetTab);
  if (!sheet) {
    Logger.log("Tab tidak ditemukan: " + sheetTab);
    return;
  }

  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = {};
  ["chapter","scene","q","a","b","c","d","answer","skill","difficulty","type","correct","wrong_a","wrong_b","wrong_c","wrong_d","clue"]
    .forEach(function (h) { col[h] = headers.indexOf(h); });

  var chaptersMap = {};
  var chaptersOrder = [];

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (col.q < 0 || !r[col.q] || String(r[col.q]).trim() === "") continue;

    var chapter = String(r[col.chapter] || "Bab 1").trim();
    if (!chaptersMap[chapter]) {
      chaptersMap[chapter] = [];
      chaptersOrder.push(chapter);
    }

    var answerIdx = ["A","B","C","D"].indexOf(String(r[col.answer] || "A").trim().toUpperCase());
    chaptersMap[chapter].push({
      id: "q" + i,
      scene: String(r[col.scene] || "").trim(),
      q: String(r[col.q] || "").trim(),
      choices: [r[col.a], r[col.b], r[col.c], r[col.d]].map(function (c) { return String(c || "").trim(); }),
      answer: answerIdx >= 0 ? answerIdx : 0,
      skill: String(r[col.skill] || "Matematika").trim(),
      difficulty: String(r[col.difficulty] || "Mudah").trim(),
      type: String(r[col.type] || "analyst").trim().toLowerCase(),
      correct: String(r[col.correct] || "").trim(),
      wrong: [r[col.wrong_a], r[col.wrong_b], r[col.wrong_c], r[col.wrong_d]].map(function (c) { return String(c || "").trim(); }),
      clue: String(r[col.clue] || "").trim()
    });
  }

  var result = {
    level: level,
    label: label,
    ageRange: ageRange,
    curriculum: "Kurikulum Merdeka",
    caseTitle: caseTitle,
    chapters: chaptersOrder.map(function (ch, k) {
      return { id: "bab-" + (k + 1), title: ch, questions: chaptersMap[ch] };
    })
  };

  var json = JSON.stringify(result, null, 2);
  var outName = "Output_" + level;
  var outSheet = ss.getSheetByName(outName) || ss.insertSheet(outName);
  outSheet.clearContents();
  outSheet.getRange(1, 1).setValue(json);
  Logger.log("Done: " + outName);
}

function testValidate() {
  Logger.log(validateStudent_({ username: "ALGO-001" }));
}
