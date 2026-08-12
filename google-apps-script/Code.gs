/**
 * Algonova Quest — 1 file lengkap
 * - setupCredentials() / ensureCreditColumns()
 * - validate / profile / submit (sistem KREDIT)
 * - History sheet per sesi selesai
 * - buildQuestions*() → Sheet soal → JSON
 *
 * Kolom Credentials:
 * Username | Nama | Umur | Level | VALID | USED | Used At | Score | Character | Accuracy | Credits | CreditsUsed
 *
 * Kredit: boleh main selama CreditsUsed < Credits
 * USED dicentang otomatis saat kredit habis (untuk CS).
 *
 * Deploy Web App: Execute as Me · Anyone → New version setelah ubah
 */

var SHEET_NAME = "Credentials";
var HISTORY_SHEET = "History";
var CRED_CACHE_SECONDS = 45;
var CRED_CACHE_KEY = "algo_cred_v2";

/* =========================
   SETUP
========================= */

function setupCredentials() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  var headers = [
    "Username", "Nama", "Umur", "Level", "VALID",
    "USED", "Used At", "Score", "Character", "Accuracy",
    "Credits", "CreditsUsed"
  ];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#4b2b68")
    .setFontColor("#ffffff");

  // Credits default 1 (bisa diubah CS jadi 5 untuk paket besar)
  var samples = [
    ["ALGO-001", "", "", "", true, false, "", "", "", "", 1, 0],
    ["ALGO-002", "", "", "", true, false, "", "", "", "", 5, 0],
    ["ALGO-003", "Sari Dewi", 14, "smp", true, false, "", "", "", "", 3, 0],
    ["ALGO-DEMO", "Demo User", 11, "sd-kelas-4-6", true, false, "", "", "", "", 5, 0]
  ];
  sheet.getRange(2, 1, samples.length, headers.length).setValues(samples);
  sheet.getRange(2, 5, samples.length, 1).insertCheckboxes();
  sheet.getRange(2, 6, samples.length, 1).insertCheckboxes();

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  ensureHistorySheet_();
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);
  invalidateCredCache_();

  SpreadsheetApp.getUi().alert(
    "Credentials siap (sistem kredit)!\n\n" +
    "ALGO-001 → 1 kredit\nALGO-002 → 5 kredit\nALGO-DEMO → 5 kredit\n\n" +
    "Ubah kolom Credits di Sheet untuk paket besar."
  );
}

/** Tambah kolom Credits / CreditsUsed ke sheet lama tanpa hapus data. */
function ensureCreditColumns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupCredentials();
    return;
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h || "").trim().toLowerCase(); });
  var lastCol = sheet.getLastColumn();
  if (headers.indexOf("credits") < 0) {
    sheet.getRange(1, lastCol + 1).setValue("Credits").setFontWeight("bold").setBackground("#4b2b68").setFontColor("#ffffff");
    var n = Math.max(0, sheet.getLastRow() - 1);
    if (n > 0) {
      var fills = [];
      for (var i = 0; i < n; i++) fills.push([1]);
      sheet.getRange(2, lastCol + 1, n, 1).setValues(fills);
    }
    lastCol++;
  }
  headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h || "").trim().toLowerCase(); });
  lastCol = sheet.getLastColumn();
  if (headers.indexOf("creditsused") < 0 && headers.indexOf("credits used") < 0) {
    sheet.getRange(1, lastCol + 1).setValue("CreditsUsed").setFontWeight("bold").setBackground("#4b2b68").setFontColor("#ffffff");
    var n2 = Math.max(0, sheet.getLastRow() - 1);
    if (n2 > 0) {
      var usedCol = headers.indexOf("used");
      var fills2 = [];
      for (var j = 0; j < n2; j++) {
        var used = usedCol >= 0 ? truthy_(sheet.getRange(j + 2, usedCol + 1).getValue()) : false;
        fills2.push([used ? 1 : 0]);
      }
      sheet.getRange(2, lastCol + 1, n2, 1).setValues(fills2);
    }
  }
  ensureHistorySheet_();
  invalidateCredCache_();
  SpreadsheetApp.getUi().alert("Kolom Credits / CreditsUsed & tab History siap.");
}

function addCredential() {
  var ui = SpreadsheetApp.getUi();
  var user = ui.prompt("Username baru", "Contoh: ALGO-010", ui.ButtonSet.OK_CANCEL);
  if (user.getSelectedButton() !== ui.Button.OK) return;
  var username = String(user.getResponseText() || "").trim().toUpperCase();
  if (!username) { ui.alert("Username kosong."); return; }

  var credPrompt = ui.prompt("Jumlah kredit", "Default 1. Paket besar contoh: 5", ui.ButtonSet.OK_CANCEL);
  var credits = 1;
  if (credPrompt.getSelectedButton() === ui.Button.OK) {
    var n = Number(credPrompt.getResponseText());
    if (n > 0) credits = Math.floor(n);
  }

  ensureCreditColumns();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var map = headerMap_(sheet);
  var last = sheet.getLastRow() + 1;
  sheet.getRange(last, 1).setValue(username);
  if (map.valid) sheet.getRange(last, map.valid).setValue(true).insertCheckboxes();
  if (map.used) sheet.getRange(last, map.used).setValue(false).insertCheckboxes();
  if (map.credits) sheet.getRange(last, map.credits).setValue(credits);
  if (map.creditsUsed) sheet.getRange(last, map.creditsUsed).setValue(0);
  invalidateCredCache_();
  ui.alert("Ditambah: " + username + " · Credits=" + credits);
}

function resetCredentialUsed() {
  var ui = SpreadsheetApp.getUi();
  var user = ui.prompt("Reset kredit dipakai", "Username:", ui.ButtonSet.OK_CANCEL);
  if (user.getSelectedButton() !== ui.Button.OK) return;
  var username = String(user.getResponseText() || "").trim().toUpperCase();

  ensureCreditColumns();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var map = headerMap_(sheet);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;
    var row = i + 1;
    if (map.used) sheet.getRange(row, map.used).setValue(false);
    if (map.usedAt) sheet.getRange(row, map.usedAt).clearContent();
    if (map.creditsUsed) sheet.getRange(row, map.creditsUsed).setValue(0);
    invalidateCredCache_();
    ui.alert("Reset kredit dipakai OK: " + username);
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
    if (!action || action === "ping" || action === "warm") {
      return respond_({ ok: true, message: "Algonova Quest API aktif.", t: Date.now() });
    }
    if (action === "validate") {
      return respond_(validateStudent_({ username: p.username, name: p.name || p.nama, age: p.age || p.umur }));
    }
    if (action === "profile") {
      return respond_(updateProfile_({ username: p.username, name: p.name || p.nama, age: p.age || p.umur }));
    }
    if (action === "history") {
      return respond_(getHistory_({ username: p.username }));
    }
    if (action === "submit") {
      return respond_(submitResult_({
        username: p.username, name: p.name || p.nama, age: p.age || p.umur,
        level: p.level, score: p.score, accuracy: p.accuracy, character: p.character,
        folder: p.folder, folderTitle: p.folderTitle
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
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    if (e && e.parameter) {
      Object.keys(e.parameter).forEach(function (k) {
        if (body[k] === undefined) body[k] = e.parameter[k];
      });
    }
    var action = String(body.action || "").toLowerCase();
    if (action === "validate") return respond_(validateStudent_(body));
    if (action === "submit") return respond_(submitResult_(body));
    if (action === "profile") return respond_(updateProfile_(body));
    if (action === "history") return respond_(getHistory_(body));
    if (action === "ping" || action === "warm") {
      return respond_({ ok: true, message: "Algonova Quest API aktif.", t: Date.now() });
    }
    return respond_({ success: false, message: "Action tidak dikenal." });
  } catch (err) {
    return respond_({ success: false, message: "Error: " + err.message });
  }
}

function respond_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function truthy_(v) {
  if (v === true || v === 1) return true;
  return ["TRUE", "YES", "1", "YA"].indexOf(String(v == null ? "" : v).trim().toUpperCase()) >= 0;
}

function headerMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var map = {};
  headers.forEach(function (h, i) {
    var key = String(h || "").trim().toLowerCase().replace(/\s+/g, "");
    if (key === "username") map.username = i + 1;
    if (key === "nama" || key === "name") map.nama = i + 1;
    if (key === "umur" || key === "age") map.umur = i + 1;
    if (key === "level") map.level = i + 1;
    if (key === "valid") map.valid = i + 1;
    if (key === "used") map.used = i + 1;
    if (key === "usedat") map.usedAt = i + 1;
    if (key === "score") map.score = i + 1;
    if (key === "character") map.character = i + 1;
    if (key === "accuracy") map.accuracy = i + 1;
    if (key === "credits" || key === "credit" || key === "kredit") map.credits = i + 1;
    if (key === "creditsused" || key === "creditused" || key === "kreditdipakai") map.creditsUsed = i + 1;
  });
  return map;
}

function creditStatsFromRow_(row, map) {
  // row is 0-indexed array from getValues
  var legacyUsed = map.used ? truthy_(row[map.used - 1]) : false;
  var credits = map.credits ? Number(row[map.credits - 1]) : NaN;
  var creditsUsed = map.creditsUsed ? Number(row[map.creditsUsed - 1]) : NaN;
  if (!isFinite(credits) || credits < 0) credits = 1;
  if (!isFinite(creditsUsed) || creditsUsed < 0) creditsUsed = legacyUsed ? Math.max(1, credits) : 0;
  var creditsLeft = Math.max(0, credits - creditsUsed);
  return { credits: credits, creditsUsed: creditsUsed, creditsLeft: creditsLeft, exhausted: creditsLeft <= 0 };
}

function getCredData_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(CRED_CACHE_KEY);
  if (hit) {
    try { return JSON.parse(hit); } catch (e) {}
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  try { cache.put(CRED_CACHE_KEY, JSON.stringify(data), CRED_CACHE_SECONDS); } catch (e) {}
  return data;
}

function invalidateCredCache_() {
  try { CacheService.getScriptCache().remove(CRED_CACHE_KEY); } catch (e) {}
}

function ensureHistorySheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HISTORY_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(HISTORY_SHEET);
    var headers = [
      "Username", "Nama", "Finished At", "Level", "Folder", "Folder Title",
      "Score", "Accuracy", "Character", "Cert Id"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#4b2b68").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function validateStudent_(body) {
  var username = String((body && body.username) || "").trim().toUpperCase();
  if (!username) return { valid: false, message: "Username wajib diisi." };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { valid: false, message: "Tab Credentials tidak ditemukan. Jalankan setupCredentials()." };
  var map = headerMap_(sheet);
  var data = getCredData_() || sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[0]).trim().toUpperCase() !== username) continue;
    if (!truthy_(row[(map.valid || 5) - 1])) {
      return { valid: false, message: "Akun tidak aktif. Hubungi Algonova." };
    }
    var stats = creditStatsFromRow_(row, map);
    return {
      valid: true,
      used: stats.exhausted,
      canPlay: stats.creditsLeft > 0,
      credits: stats.credits,
      creditsUsed: stats.creditsUsed,
      creditsLeft: stats.creditsLeft,
      studentName: String(row[(map.nama || 2) - 1] || "").trim() || (body && (body.name || body.nama)) || "",
      age: Number(row[(map.umur || 3) - 1]) || (body && (body.age || body.umur)) || null,
      level: String(row[(map.level || 4) - 1] || "").trim() || null,
      score: map.score ? row[map.score - 1] || 0 : 0,
      character: map.character ? String(row[map.character - 1] || "").trim() : "",
      accuracy: map.accuracy ? row[map.accuracy - 1] || 0 : 0,
      usedAt: map.usedAt && row[map.usedAt - 1] ? String(row[map.usedAt - 1]) : "",
      message: stats.exhausted
        ? "Kredit habis. Kamu masih bisa unduh riwayat/sertifikat."
        : "OK"
    };
  }
  return { valid: false, message: "Username tidak ditemukan." };
}

function submitResult_(body) {
  var username = String((body && body.username) || "").trim().toUpperCase();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, message: "Tab Credentials tidak ditemukan." };

  invalidateCredCache_();
  ensureCreditColumnsQuiet_();
  var map = headerMap_(sheet);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;
    var row = i + 1;
    if (!truthy_(data[i][(map.valid || 5) - 1])) {
      return { success: false, message: "Akun tidak VALID." };
    }
    var stats = creditStatsFromRow_(data[i], map);
    if (stats.creditsLeft <= 0) {
      return { success: false, noCredits: true, message: "Kredit habis.", credits: stats.credits, creditsUsed: stats.creditsUsed, creditsLeft: 0 };
    }

    var usedAt = new Date().toISOString();
    var newUsed = stats.creditsUsed + 1;
    var name = body.name || body.nama || data[i][(map.nama || 2) - 1] || "";
    if (map.nama) sheet.getRange(row, map.nama).setValue(name);
    if ((body.age != null || body.umur != null) && map.umur) {
      sheet.getRange(row, map.umur).setValue(body.age != null ? body.age : body.umur);
    }
    if (body.level && map.level) sheet.getRange(row, map.level).setValue(body.level);
    if (map.usedAt) sheet.getRange(row, map.usedAt).setValue(usedAt);
    if (map.score) sheet.getRange(row, map.score).setValue(body.score || 0);
    if (map.character) sheet.getRange(row, map.character).setValue(body.character || "");
    if (map.accuracy) sheet.getRange(row, map.accuracy).setValue((body.accuracy || 0) + "%");
    if (map.creditsUsed) sheet.getRange(row, map.creditsUsed).setValue(newUsed);
    if (map.used) sheet.getRange(row, map.used).setValue(newUsed >= stats.credits);

    var certId = String(username + "-" + Date.now()).slice(0, 24);
    appendHistory_({
      username: username,
      name: name,
      finishedAt: usedAt,
      level: body.level || "",
      folder: body.folder || "",
      folderTitle: body.folderTitle || "",
      score: body.score || 0,
      accuracy: body.accuracy || 0,
      character: body.character || "",
      certId: certId
    });

    invalidateCredCache_();
    return {
      success: true,
      ok: true,
      usedAt: usedAt,
      certId: certId,
      credits: stats.credits,
      creditsUsed: newUsed,
      creditsLeft: Math.max(0, stats.credits - newUsed)
    };
  }
  return { success: false, message: "Username tidak ditemukan untuk submit." };
}

function ensureCreditColumnsQuiet_() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h || "").trim().toLowerCase().replace(/\s+/g, ""); });
    var lastCol = sheet.getLastColumn();
    if (headers.indexOf("credits") < 0) {
      sheet.getRange(1, lastCol + 1).setValue("Credits");
      lastCol++;
    }
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h || "").trim().toLowerCase().replace(/\s+/g, ""); });
    lastCol = sheet.getLastColumn();
    if (headers.indexOf("creditsused") < 0) {
      sheet.getRange(1, lastCol + 1).setValue("CreditsUsed");
    }
  } catch (e) {}
}

function appendHistory_(item) {
  var sheet = ensureHistorySheet_();
  sheet.appendRow([
    item.username, item.name, item.finishedAt, item.level, item.folder, item.folderTitle,
    item.score, (item.accuracy || 0) + "%", item.character, item.certId
  ]);
}

function getHistory_(body) {
  var username = String((body && body.username) || "").trim().toUpperCase();
  if (!username) return { ok: false, history: [], message: "Username wajib." };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HISTORY_SHEET);
  if (!sheet) return { ok: true, history: [] };
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;
    out.push({
      username: data[i][0],
      studentName: data[i][1],
      finishedAt: String(data[i][2] || ""),
      level: data[i][3],
      folder: data[i][4],
      folderTitle: data[i][5],
      xp: data[i][6],
      accuracy: data[i][7],
      character: data[i][8],
      certId: data[i][9]
    });
  }
  return { ok: true, history: out.reverse() };
}

function updateProfile_(body) {
  var username = String((body && body.username) || "").trim().toUpperCase();
  if (!username) return { success: false, message: "Username wajib diisi." };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, message: "Tab Credentials tidak ditemukan." };
  var map = headerMap_(sheet);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() !== username) continue;
    var row = i + 1;
    if (!truthy_(data[i][(map.valid || 5) - 1])) return { success: false, message: "Akun tidak VALID." };
    var name = body.name || body.nama;
    if (name && map.nama) sheet.getRange(row, map.nama).setValue(String(name).trim());
    if ((body.age != null || body.umur != null) && map.umur) {
      sheet.getRange(row, map.umur).setValue(body.age != null ? body.age : body.umur);
    }
    invalidateCredCache_();
    return { success: true, ok: true, message: "Profil diperbarui." };
  }
  return { success: false, message: "Username tidak ditemukan." };
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
  if (!sheet) { Logger.log("Tab tidak ditemukan: " + sheetTab); return; }

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
    if (!chaptersMap[chapter]) { chaptersMap[chapter] = []; chaptersOrder.push(chapter); }
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
    level: level, label: label, ageRange: ageRange, curriculum: "Kurikulum Merdeka", caseTitle: caseTitle,
    chapters: chaptersOrder.map(function (ch, k) {
      return { id: "bab-" + (k + 1), title: ch, questions: chaptersMap[ch] };
    })
  };
  var outName = "Output_" + level;
  var outSheet = ss.getSheetByName(outName) || ss.insertSheet(outName);
  outSheet.clearContents();
  outSheet.getRange(1, 1).setValue(JSON.stringify(result, null, 2));
  Logger.log("Done: " + outName);
}

function testValidate() {
  Logger.log(validateStudent_({ username: "ALGO-001" }));
}
