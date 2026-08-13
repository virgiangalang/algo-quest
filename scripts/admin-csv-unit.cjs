/**
 * CSV template + history dedupe tests
 * Run: node scripts/admin-csv-unit.cjs
 */
const fs = require("fs");
const path = require("path");
const AlgoQuestionCsv = require("../src/lib/question-csv");
const AlgoHistory = require("../src/lib/history");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const folderCsv = fs.readFileSync(path.join(__dirname, "../public/templates/soal-folder-template.csv"), "utf8");
const classicCsv = fs.readFileSync(path.join(__dirname, "../public/templates/soal-template.csv"), "utf8");

const folderRows = AlgoQuestionCsv.parseCsv(folderCsv);
assert(folderRows.length >= 3, "folder template should have sample rows");
const folderBank = AlgoQuestionCsv.rowsToBank("sd-kelas-4-6", folderRows, {});
assert(!AlgoQuestionCsv.validateBank(folderBank), AlgoQuestionCsv.validateBank(folderBank));
assert(folderBank.chapters.length >= 1, "folder bank chapters");
assert(folderBank._count >= 3, "folder bank count");

const classicRows = AlgoQuestionCsv.parseCsv(classicCsv);
const classicBank = AlgoQuestionCsv.rowsToBank("sd-kelas-4-6", classicRows, { folderId: "kode", folderTitle: "Kode yang Hilang" });
assert(!AlgoQuestionCsv.validateBank(classicBank), AlgoQuestionCsv.validateBank(classicBank));
const types = classicBank.chapters.flatMap((c) => c.questions.map((q) => q.type_ui));
assert(types.includes("mcq") && types.includes("numeric") && types.includes("order"), "classic template has 3 types");

try {
  AlgoQuestionCsv.parseCsv("foo,bar\n1,2");
  assert(false, "bad header should throw");
} catch (e) {
  assert(/header/i.test(e.message) || /kolom "q"/i.test(e.message), e.message);
}

try {
  const rows = AlgoQuestionCsv.parseCsv("q,bab_title,choice_a\nBerapa?,Bab 1,1");
  AlgoQuestionCsv.rowsToBank("sd-kelas-4-6", rows, {});
  assert(false, "incomplete mcq should throw");
} catch (e) {
  assert(/choice_b|pilihan/i.test(e.message), e.message);
}

const gen = `${AlgoQuestionCsv.csvHeader()}\n${AlgoQuestionCsv.exampleRows("misi-bulan", "Misi Bulan")}`;
const genBank = AlgoQuestionCsv.rowsToBank("smp", AlgoQuestionCsv.parseCsv(gen), { folderId: "misi-bulan" });
assert(!AlgoQuestionCsv.validateBank(genBank), "generated template invalid: " + AlgoQuestionCsv.validateBank(genBank));

assert(AlgoHistory.normalizeAccuracy("0.9") === 90, "0.9 → 90");
assert(AlgoHistory.normalizeAccuracy("90%") === 90, "90% → 90");
assert(AlgoHistory.normalizeAccuracy(90) === 90, "90 → 90");
assert(AlgoHistory.normalizeAccuracy("90") === 90, "str 90");

const merged = AlgoHistory.mergeLists(
  [{ folderTitle: "Misteri di Kebun Bilangan", xp: 2805, finishedAt: "2026-08-13T10:15:00.000Z", accuracy: 0.9 }],
  [{ folderTitle: "Misteri di Kebun Bilangan", xp: 2805, finishedAt: "2026-08-13T10:15:40.000Z", accuracy: 90, answers: [{ n: 1 }] }]
);
assert(merged.length === 1, "should dedupe to 1, got " + merged.length);
assert(merged[0].accuracy === 90, "prefer 90");
assert(merged[0].answers && merged[0].answers.length === 1, "keep answers");

console.log("OK admin-csv-unit");
