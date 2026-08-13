/**
 * questions.js
 * Load soal per level (+ folder/story). Catalog: public/questions/catalog.json
 */

const QUESTION_LEVELS = [
  "sd-kelas-1-3",
  "sd-kelas-4-6",
  "smp",
  "sma",
  "dewasa",
];

const MIN_QUESTIONS_FOR_CASE = 15;

let _catalogCache = null;

function isLocalHost() {
  try {
    const h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  } catch (_) {
    return false;
  }
}

function pathPrefix() {
  let prefix = "/";
  try {
    if (typeof document !== "undefined" && document.baseURI && typeof URL !== "undefined") {
      const p = new URL(".", document.baseURI).pathname;
      prefix = p.endsWith("/") ? p : `${p}/`;
    }
  } catch (_) {
    prefix = "/";
  }
  return prefix;
}

function catalogPathCandidates() {
  const prefix = pathPrefix();
  return [
    `${prefix}api/catalog`,
    `/api/catalog`,
    `${prefix}public/questions/catalog.json`,
    `${prefix}questions/catalog.json`,
    `/public/questions/catalog.json`,
    `/questions/catalog.json`,
  ];
}

/**
 * @returns {Promise<Object>}
 */
async function loadCatalog() {
  if (_catalogCache) return _catalogCache;
  const errors = [];
  for (const path of catalogPathCandidates()) {
    try {
      const resp = await fetch(path, { cache: "no-store" });
      if (!resp.ok) {
        errors.push(`${path} → ${resp.status}`);
        continue;
      }
      const data = await resp.json();
      if (!data || !Array.isArray(data.levels)) {
        errors.push(`${path} → schema invalid`);
        continue;
      }
      _catalogCache = data;
      return data;
    } catch (e) {
      errors.push(`${path} → ${e.message}`);
    }
  }
  console.warn("[algo] catalog load failed", errors);
  // Minimal fallback mirroring classic levels
  _catalogCache = {
    version: 0,
    levels: QUESTION_LEVELS.map((id) => ({
      id,
      title: id,
      folders: [{ id: "default", title: id, file: `${id}.json` }],
    })),
  };
  return _catalogCache;
}

function foldersForLevel(catalog, levelId) {
  const lvl = (catalog.levels || []).find((l) => l.id === levelId);
  return (lvl && lvl.folders) || [];
}

function questionFileCandidates(file) {
  const clean = String(file || "").replace(/^\/+/, "");
  const prefix = pathPrefix();
  const levelOnly = clean.replace(/\.json$/i, "");
  return [
    `${prefix}api/questions?file=${encodeURIComponent(clean)}`,
    `${prefix}api/questions?level=${encodeURIComponent(levelOnly)}`,
    `${prefix}public/questions/${clean}`,
    `${prefix}questions/${clean}`,
    `/api/questions?file=${encodeURIComponent(clean)}`,
    `/public/questions/${clean}`,
    `/questions/${clean}`,
  ];
}

/**
 * @param {string} level
 * @param {string} [file] relative path under public/questions/
 * @returns {Promise<{data: Object, source: string, usedFallback: boolean}>}
 */
async function loadQuestions(level, file) {
  const lvl = QUESTION_LEVELS.includes(level) ? level : "sd-kelas-4-6";
  const targetFile = file || `${lvl}.json`;
  const paths = questionFileCandidates(targetFile);
  const errors = [];

  console.info("[algo] loadQuestions start", { level: lvl, file: targetFile });

  for (const path of paths) {
    try {
      const resp = await fetch(path, { cache: "no-store" });
      if (!resp.ok) {
        errors.push(`${path} → ${resp.status}`);
        continue;
      }
      const ct = (resp.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("text/html")) {
        errors.push(`${path} → HTML bukan JSON`);
        continue;
      }
      const data = await resp.json();
      if (!data || !Array.isArray(data.chapters)) {
        errors.push(`${path} → schema invalid`);
        continue;
      }
      const flat = flattenQuestions(data);
      console.info("[algo] loadQuestions ok", {
        level: lvl,
        path,
        chapters: data.chapters.length,
        questions: flat.length,
      });
      return { data, source: path, usedFallback: false };
    } catch (e) {
      errors.push(`${path} → ${e.message}`);
    }
  }

  console.warn("[algo] loadQuestions failed all paths", errors);

  if (isLocalHost()) {
    console.warn("[algo] DEV FALLBACK aktif (localhost saja)");
    return { data: FALLBACK_QUESTIONS, source: "FALLBACK_DEV", usedFallback: true };
  }

  const err = new Error(
    "Bank soal tidak bisa dimuat. Cek public/questions/ atau upload di /admin.html"
  );
  err.details = errors;
  throw err;
}

function flattenQuestions(data) {
  if (!data || !data.chapters) return [];
  return data.chapters.flatMap((ch) =>
    (ch.questions || []).map((q) => ({
      ...q,
      chapter: ch.title,
      chapter_en: ch.title_en || q.chapter_en || ch.title,
    }))
  );
}

function validateQuestionBank(data) {
  const flat = flattenQuestions(data);
  const count = flat.length;
  if (count < MIN_QUESTIONS_FOR_CASE) {
    return {
      ok: false,
      count,
      message: `Bank soal terlalu sedikit (${count}). Minimal ${MIN_QUESTIONS_FOR_CASE} soal.`,
    };
  }
  return { ok: true, count, message: "OK" };
}

const FALLBACK_QUESTIONS = {
  level: "sd-kelas-4-6",
  label: "SD Kelas 4–6 (DEV FALLBACK)",
  caseTitle: "Kode yang Hilang [DEV]",
  chapters: [
    {
      id: "bab-1",
      title: "Bab 1 — Insiden di Lab (DEV)",
      questions: [
        {
          id: "dev-1",
          scene: "Mode pengembangan.",
          q: "1 + 1 = ?",
          choices: ["1", "2", "3", "4"],
          answer: 1,
          skill: "Dasar",
          difficulty: "Mudah",
          type: "analyst",
          correct: "DEV OK",
          wrong: ["", "", "", ""],
          clue: "Perbaiki path public/questions",
        },
      ],
    },
  ],
};
