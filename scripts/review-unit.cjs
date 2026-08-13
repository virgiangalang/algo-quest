/**
 * Unit checks for AlgoReview (no browser).
 * Run: node scripts/review-unit.cjs
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "../src/lib/review.js"), "utf8");
const context = {
  AlgoI18n: {
    getLang: () => "id",
    t: (k, v) => `Hint: fokus opsi ${v.opt} — cek ulang hitunganmu.`,
    localizeQ: (q) => q,
    levelLabel: (l) => l,
  },
};
vm.createContext(context);
vm.runInContext(src.replace("const AlgoReview", "var AlgoReview"), context);
const AlgoReview = context.AlgoReview;
if (!AlgoReview) {
  console.error("AlgoReview not exported");
  process.exit(1);
}

const q = {
  id: "q1",
  q: "1 + 1 = ?",
  choices: ["1", "2", "3", "4"],
  answer: 1,
  skill: "Dasar",
  difficulty: "Mudah",
  type: "analyst",
  correct: "1 + 1 = 2",
  wrong: ["Belum tepat", "Benar!", "Belum tepat", "Belum tepat"],
  clue: "",
  type_ui: "mcq",
  chapter: "Bab 1",
};

const hint = AlgoReview.hintText(q);
if (!/fokus opsi B/.test(hint)) {
  console.error("hint mismatch", hint);
  process.exit(1);
}

const key = AlgoReview.formatCorrect(q);
if (key !== "B. 2") {
  console.error("key mismatch", key);
  process.exit(1);
}

const student = AlgoReview.formatStudent(q, { kind: "mcq", index: 0 });
if (student !== "A. 1") {
  console.error("student mismatch", student);
  process.exit(1);
}

const entry = AlgoReview.buildEntry(q, { kind: "mcq", index: 0 }, { ok: false }, { n: 1, hintUsed: true });
if (entry.ok || entry.pembahasan !== "1 + 1 = 2" || !entry.hintUsed) {
  console.error("entry mismatch", entry);
  process.exit(1);
}

const log = AlgoReview.upsertLog([], entry);
const log2 = AlgoReview.upsertLog(log, { ...entry, studentLabel: "C. 3" });
if (log2.length !== 1 || log2[0].studentLabel !== "C. 3") {
  console.error("upsert mismatch", log2);
  process.exit(1);
}

if (AlgoReview.esc("<b>") !== "&lt;b&gt;") {
  console.error("esc mismatch");
  process.exit(1);
}

console.log("OK review-unit");
