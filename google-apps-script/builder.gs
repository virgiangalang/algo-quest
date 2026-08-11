/**
 * Algonova Math — Question Builder
 * File: builder.gs
 *
 * Baca tab Google Sheet "Questions_SD46" (atau tab lain per level)
 * → generate JSON soal yang bisa di-paste ke public/questions/
 *
 * Format kolom Sheet (header di baris 1):
 * chapter | scene | q | A | B | C | D | answer | skill | difficulty | type | correct | wrong_A | wrong_B | wrong_C | wrong_D | clue
 *
 * Cara pakai:
 *   1. Isi Sheet tab sesuai level (lihat format di atas)
 *   2. Buka Apps Script editor → pilih fungsi buildQuestionsSD46 → Run
 *   3. Output muncul di Logger (Ctrl+Enter atau lihat Execution Log)
 *   4. Copy-paste ke file JSON di repo
 */

// ─── BUILDER untuk masing-masing level ──────────────────────────────────────

function buildQuestionsSD13()   { buildLevel("Questions_SD13",   "sd-kelas-1-3", "SD Kelas 1–3",  "6–9 tahun",   "Misteri di Kebun Bilangan"); }
function buildQuestionsSD46()   { buildLevel("Questions_SD46",   "sd-kelas-4-6", "SD Kelas 4–6",  "10–12 tahun", "Kode yang Hilang"); }
function buildQuestionsSMP()    { buildLevel("Questions_SMP",    "smp",          "SMP",            "13–15 tahun", "Operasi Variabel Gelap"); }
function buildQuestionsSMA()    { buildLevel("Questions_SMA",    "sma",          "SMA",            "16–18 tahun", "Operasi Fungsi Rahasia"); }
function buildQuestionsDewasa() { buildLevel("Questions_Dewasa", "dewasa",       "Dewasa",         "18+ tahun",   "Operasi Numerik Elite"); }

// ─── CORE ────────────────────────────────────────────────────────────────────

function buildLevel(sheetTab, level, label, ageRange, caseTitle) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetTab);

  if (!sheet) {
    Logger.log("❌ Tab tidak ditemukan: " + sheetTab);
    return;
  }

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(h => String(h).trim().toLowerCase());

  // Map kolom
  const col = {};
  ["chapter","scene","q","a","b","c","d","answer","skill","difficulty","type","correct","wrong_a","wrong_b","wrong_c","wrong_d","clue"].forEach(h => {
    col[h] = headers.indexOf(h);
  });

  // Grouping per chapter
  const chaptersMap = {};
  const chaptersOrder = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[col.q] || String(r[col.q]).trim() === "") continue;

    const chapter = String(r[col.chapter] || "Bab 1").trim();
    if (!chaptersMap[chapter]) {
      chaptersMap[chapter] = [];
      chaptersOrder.push(chapter);
    }

    const answerIdx = ["A","B","C","D"].indexOf(String(r[col.answer] || "A").trim().toUpperCase());

    chaptersMap[chapter].push({
      id: `q${i}`,
      scene: String(r[col.scene] || "").trim(),
      q: String(r[col.q] || "").trim(),
      choices: [r[col.a], r[col.b], r[col.c], r[col.d]].map(c => String(c || "").trim()),
      answer: answerIdx >= 0 ? answerIdx : 0,
      skill: String(r[col.skill] || "Matematika").trim(),
      difficulty: String(r[col.difficulty] || "Mudah").trim(),
      type: String(r[col.type] || "analyst").trim().toLowerCase(),
      correct: String(r[col.correct] || "").trim(),
      wrong: [r[col.wrong_a], r[col.wrong_b], r[col.wrong_c], r[col.wrong_d]].map(c => String(c || "").trim()),
      clue: String(r[col.clue] || "").trim(),
    });
  }

  const result = {
    level,
    label,
    ageRange,
    curriculum: "Kurikulum Merdeka",
    caseTitle,
    chapters: chaptersOrder.map((ch, k) => ({
      id: `bab-${k+1}`,
      title: ch,
      questions: chaptersMap[ch],
    })),
  };

  const json = JSON.stringify(result, null, 2);
  Logger.log("=== OUTPUT JSON (copy ke public/questions/" + level + ".json) ===");
  Logger.log(json);

  // Tulis ke tab "Output" jika ada, supaya mudah di-copy
  let outSheet = ss.getSheetByName("Output_" + level);
  if (!outSheet) outSheet = ss.insertSheet("Output_" + level);
  outSheet.clearContents();
  outSheet.getRange(1, 1).setValue(json);

  Logger.log("✅ Done! " + (rows.length - 1) + " soal dari " + chaptersOrder.length + " bab.");
}
