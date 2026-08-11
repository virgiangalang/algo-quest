/**
 * questions.js
 * Load soal per level — API override dulu, lalu file statis (path-safe).
 * Tidak silent-fallback ke bank "contoh HTML" di production.
 */

const QUESTION_LEVELS = [
  "sd-kelas-1-3",
  "sd-kelas-4-6",
  "smp",
  "sma",
  "dewasa",
];

const MIN_QUESTIONS_FOR_CASE = 20;

function isLocalHost() {
  try {
    const h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  } catch (_) {
    return false;
  }
}

/**
 * Kandidat path relatif yang tahan Output Directory Vercel = `.` atau `public`.
 */
function questionPathCandidates(level) {
  const file = `${level}.json`;
  let prefix = "/";
  try {
    if (typeof document !== "undefined" && document.baseURI && typeof URL !== "undefined") {
      const p = new URL(".", document.baseURI).pathname;
      prefix = p.endsWith("/") ? p : `${p}/`;
    }
  } catch (_) {
    prefix = "/";
  }
  return [
    `${prefix}api/questions?level=${encodeURIComponent(level)}`,
    `${prefix}public/questions/${file}`,
    `${prefix}questions/${file}`,
    `/api/questions?level=${encodeURIComponent(level)}`,
    `/public/questions/${file}`,
    `/questions/${file}`,
    `public/questions/${file}`,
    `questions/${file}`,
  ];
}

/**
 * @param {string} level
 * @returns {Promise<{data: Object, source: string, usedFallback: boolean}>}
 */
async function loadQuestions(level) {
  const lvl = QUESTION_LEVELS.includes(level) ? level : "sd-kelas-4-6";
  const paths = questionPathCandidates(lvl);
  const errors = [];

  console.info("[algo] loadQuestions start", { level: lvl, paths: paths.slice(0, 4) });

  for (const path of paths) {
    try {
      const resp = await fetch(path, { cache: "no-store" });
      if (!resp.ok) {
        errors.push(`${path} → ${resp.status}`);
        continue;
      }
      const ct = (resp.headers.get("content-type") || "").toLowerCase();
      // Hindari parse HTML (kadang 200 + index.html)
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
    "Bank soal tidak bisa dimuat. Cek file public/questions/ atau upload di /admin.html"
  );
  err.details = errors;
  throw err;
}

/**
 * Ratakan semua soal dari semua chapter menjadi array linear.
 * @param {Object} data
 * @returns {Array}
 */
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

/**
 * Validasi bank soal sebelum masuk game.
 * @param {Object} data
 * @returns {{ok:boolean, count:number, message:string}}
 */
function validateQuestionBank(data) {
  const flat = flattenQuestions(data);
  const count = flat.length;
  if (count < MIN_QUESTIONS_FOR_CASE) {
    return {
      ok: false,
      count,
      message: `Bank soal terlalu sedikit (${count}). Minimal ${MIN_QUESTIONS_FOR_CASE} soal untuk kasus penuh. Bukan bank contoh HTML.`,
    };
  }
  return { ok: true, count, message: "OK" };
}

/**
 * Fallback DEV ONLY — sengaja kecil agar jelas ini bukan kasus production.
 */
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
          scene: "Mode pengembangan. File JSON production tidak terbaca.",
          q: "1 + 1 = ?",
          choices: ["1", "2", "3", "4"],
          answer: 1,
          skill: "Dasar",
          difficulty: "Mudah",
          type: "analyst",
          correct: "DEV OK",
          wrong: ["", "", "", ""],
          clue: "Perbaiki path public/questions/*.json",
        },
      ],
    },
  ],
};
