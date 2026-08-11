const {
  json,
  readBody,
  verifyToken,
  getBearer,
  validateBank,
  blobPut,
  githubPutQuestion,
  LEVELS,
} = require("./_lib");

/**
 * Convert flat CSV rows → bank soal Algonova.
 * Expected columns documented in docs/PANDUAN-SOAL.md
 */
function rowsToBank(level, rows, meta = {}) {
  const byChapter = new Map();
  rows.forEach((row, i) => {
    const bab = String(row.bab_title || row.chapter || row.bab || `Bab 1`).trim();
    const babId = String(row.bab_id || row.chapter_id || `bab-${bab}`).trim();
    if (!byChapter.has(bab)) {
      byChapter.set(bab, { id: babId, title: bab, questions: [] });
    }
    const choices = [
      row.choice_a ?? row.a,
      row.choice_b ?? row.b,
      row.choice_c ?? row.c,
      row.choice_d ?? row.d,
    ].map((x) => String(x ?? "").trim()).filter((x, idx, arr) => {
      // keep empties only if earlier choices exist? require 4 for consistency
      return true;
    });
    const filled = choices.filter((c) => c !== "");
    if (filled.length < 2) {
      throw new Error(`Baris ${i + 2}: minimal 2 pilihan (choice_a/b/...)`);
    }
    let answer = row.answer;
    if (typeof answer === "string" && /^[A-Da-d]$/.test(answer.trim())) {
      answer = answer.trim().toUpperCase().charCodeAt(0) - 65;
    } else {
      answer = Number(answer);
    }
    if (Number.isNaN(answer) || answer < 0 || answer >= filled.length) {
      throw new Error(`Baris ${i + 2}: answer harus 0-3 atau A-D`);
    }
    const wrongRaw = row.wrong || "";
    let wrong;
    if (Array.isArray(row.wrong)) wrong = row.wrong;
    else if (typeof wrongRaw === "string" && wrongRaw.includes("|")) {
      wrong = wrongRaw.split("|").map((s) => s.trim());
    } else {
      wrong = filled.map((_, idx) =>
        idx === answer ? "" : String(row[`wrong_${String.fromCharCode(97 + idx)}`] || "Coba hitung kembali.")
      );
    }
    while (wrong.length < filled.length) wrong.push("Coba hitung kembali.");

    byChapter.get(bab).questions.push({
      id: String(row.id || `q-${i + 1}`),
      scene: String(row.scene || "Petunjuk baru ditemukan di lokasi kasus."),
      q: String(row.q || row.question || "").trim(),
      choices: filled.length === 4 ? choices.map((c) => c || "—") : filled,
      answer,
      skill: String(row.skill || "Matematika"),
      difficulty: String(row.difficulty || row.tingkat || "Sedang"),
      type: String(row.type || "analyst"),
      correct: String(row.correct || row.feedback_benar || "Benar! Bukti terkonfirmasi."),
      wrong,
      clue: String(row.clue || row.petunjuk || "Petunjuk tercatat di berkas."),
    });
  });

  return {
    level,
    label: meta.label || level,
    ageRange: meta.ageRange || "",
    curriculum: meta.curriculum || "Kurikulum Merdeka",
    caseTitle: meta.caseTitle || "Kode yang Hilang",
    chapters: [...byChapter.values()],
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { ok: false, message: "POST only" });

  const token = getBearer(req);
  const session = verifyToken(token);
  if (!session) return json(res, 401, { ok: false, message: "Sesi admin tidak valid. Login ulang." });

  try {
    const body = await readBody(req);
    const level = body.level;
    if (!LEVELS.includes(level)) {
      return json(res, 400, { ok: false, message: `level harus salah satu: ${LEVELS.join(", ")}` });
    }

    let data = body.data;
    if (!data && Array.isArray(body.rows)) {
      data = rowsToBank(level, body.rows, body.meta || {});
    }
    if (!data) return json(res, 400, { ok: false, message: "Kirim data (JSON bank) atau rows (CSV parsed)." });

    // Pastikan level di data sinkron
    data.level = level;

    const err = validateBank(data);
    if (err) return json(res, 400, { ok: false, message: err });

    const result = { ok: true, level, published: [], download: data };

    // 1) Blob (instant live override)
    try {
      const blob = await blobPut(`questions/${level}.json`, data);
      if (blob) result.published.push({ via: "blob", url: blob.url || null });
    } catch (e) {
      result.blobError = e.message;
    }

    // 2) GitHub commit (redeploy)
    try {
      const gh = await githubPutQuestion(level, data);
      if (gh) result.published.push({ via: "github", commit: gh.commit?.sha || true });
    } catch (e) {
      result.githubError = e.message;
    }

    if (!result.published.length) {
      result.ok = true;
      result.message =
        "Soal tervalidasi. Belum ada BLOB_READ_WRITE_TOKEN / GITHUB_TOKEN — unduh JSON dan taruh di public/questions/ lalu deploy.";
      result.needsManualDownload = true;
    } else {
      result.message = "Soal berhasil dipublish.";
    }

    return json(res, 200, result);
  } catch (e) {
    return json(res, 400, { ok: false, message: e.message });
  }
};
