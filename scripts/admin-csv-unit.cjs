/**
 * CSV template + history dedupe tests
 * Run: node scripts/admin-csv-unit.cjs
 */
const fs = require("fs");
const path = require("path");
const AlgoQuestionCsv = require("../src/lib/question-csv");
const AlgoHistory = require("../src/lib/history");
const { upsertCatalogFolder, mergeCatalogLayers, mergeCatalogWithBanks, hideFolderInCatalog } = require("../api/_lib");

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

const baseCat = {
  version: 1,
  levels: [{ id: "sd-kelas-4-6", title: "SD 4–6", folders: [{ id: "kode", title: "Kode", file: "sd-kelas-4-6.json" }] }],
};
const remoteCat = {
  version: 1,
  levels: [{ id: "sd-kelas-4-6", title: "SD 4–6", folders: [{ id: "toko", title: "Toko", file: "sd-kelas-4-6/toko.json" }] }],
};
const layered = mergeCatalogLayers(baseCat, remoteCat, [
  { file: "sd-kelas-4-6/misteri-toko-mainan-ajaib.json", level: "sd-kelas-4-6", folder_id: "misteri-toko-mainan-ajaib", folder_title: "Misteri Toko Mainan Ajaib", question_count: 30 },
]);
const ids = layered.levels.find((l) => l.id === "sd-kelas-4-6").folders.map((f) => f.id);
assert(ids.includes("kode") && ids.includes("toko") && ids.includes("misteri-toko-mainan-ajaib"), "catalog merge keeps static + supabase folders");

const withBank = mergeCatalogWithBanks({ version: 1, levels: [] }, [
  { file: "smp/x.json", level: "smp", folder_id: "x", folder_title: "X", question_count: 20 },
]);
assert(withBank.levels.find((l) => l.id === "smp").folders[0].title === "X", "upsert new level from bank");
assert(upsertCatalogFolder(baseCat, "sd-kelas-4-6", { id: "kode", title: "Kode Baru", file: "sd-kelas-4-6.json" }).levels[0].folders[0].title === "Kode Baru", "folder title update");

const hiddenCat = hideFolderInCatalog(layered, { file: "sd-kelas-4-6/toko.json", folderId: "toko", level: "sd-kelas-4-6" });
const hiddenIds = hiddenCat.levels.find((l) => l.id === "sd-kelas-4-6").folders.map((f) => f.id);
assert(!hiddenIds.includes("toko"), "hidden folder removed from catalog");
assert(hiddenCat.hiddenFiles.includes("sd-kelas-4-6/toko.json"), "hiddenFiles recorded");
const rematerialized = mergeCatalogLayers(baseCat, hiddenCat, []);
assert(!rematerialized.levels.find((l) => l.id === "sd-kelas-4-6").folders.some((f) => f.id === "toko"), "static merge does not resurrect hidden folder");

const csvRound = AlgoQuestionCsv.bankToCsv(folderBank);
assert(csvRound.split("\n").length >= 4, "bankToCsv has header + rows");
const reparsed = AlgoQuestionCsv.rowsToBank("sd-kelas-4-6", AlgoQuestionCsv.parseCsv(csvRound), {});
assert(!AlgoQuestionCsv.validateBank(reparsed), "csv roundtrip validates");

console.log("OK admin-csv-unit");
