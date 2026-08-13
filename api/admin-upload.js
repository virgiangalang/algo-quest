const {
  json,
  readBody,
  verifyToken,
  getBearer,
  validateBank,
  blobPut,
  githubPutFile,
  LEVELS,
  readStaticCatalog,
  questionRelPath,
  upsertCatalogFolder,
  supabaseConfig,
  supabaseLoadMergedCatalog,
  supabasePublishBank,
} = require("./_lib");
const AlgoQuestionCsv = require("../src/lib/question-csv");

/**
 * Convert flat CSV rows → bank soal Algonova.
 */
function rowsToBank(level, rows, meta = {}) {
  return AlgoQuestionCsv.rowsToBank(level, rows, meta);
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
      return json(res, 400, { ok: false, message: `Kategori usia harus salah satu: ${LEVELS.join(", ")}` });
    }

    const folderId = AlgoQuestionCsv.slugFolderId(body.folderId || body.folder_id || "");
    const folderTitle = String(body.folderTitle || body.caseTitle || "").trim();
    const folderBlurb = String(body.folderBlurb || "").trim();
    const existingFile = body.file || "";

    let data = body.data;
    if (!data && Array.isArray(body.rows)) {
      data = rowsToBank(level, body.rows, {
        folderId,
        folderTitle,
        caseTitle: folderTitle,
      });
    }
    if (!data) {
      return json(res, 400, {
        ok: false,
        message: "Tidak ada data soal. Preview CSV/JSON dulu, atau kirim data/rows.",
      });
    }

    data.level = level;
    if (folderTitle) data.caseTitle = folderTitle;
    if (folderId) data.folder = folderId;

    const err = validateBank(data);
    if (err) return json(res, 400, { ok: false, message: err });

    const count = (data.chapters || []).reduce((n, ch) => n + ((ch.questions || []).length), 0);
    const relFile = questionRelPath(level, folderId, existingFile);
    const result = { ok: true, level, folderId: folderId || null, file: relFile, count, published: [], download: data };
    const folderMeta = {
      id: folderId,
      title: folderTitle || data.caseTitle || folderId,
      blurb: folderBlurb,
      file: relFile,
      questionsHint: `${count} soal`,
    };

    let catalog = await supabaseLoadMergedCatalog();
    if (!catalog || !Array.isArray(catalog.levels)) catalog = readStaticCatalog();
    if (folderId) catalog = upsertCatalogFolder(catalog, level, folderMeta);

    try {
      if (supabaseConfig().canWrite) {
        await supabasePublishBank({
          file: relFile,
          level,
          folderId: folderId || null,
          folderTitle: folderMeta.title,
          blurb: folderBlurb,
          count,
          payload: data,
          catalog,
        });
        result.published.push({ via: "supabase", file: relFile });
      } else if (supabaseConfig().canRead) {
        result.supabaseError = "SUPABASE_SERVICE_ROLE_KEY belum dipasang di Vercel (hanya kunci baca).";
      } else {
        result.supabaseError = "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY belum dipasang di Vercel.";
      }
    } catch (e) {
      result.supabaseError = e.message;
    }

    try {
      const blob = await blobPut(`questions/${relFile}`, data);
      if (blob) result.published.push({ via: "blob", url: blob.url || null, file: relFile });
    } catch (e) {
      result.blobError = e.message;
    }

    try {
      const gh = await githubPutFile(relFile, data, `chore(admin): soal ${level}/${folderId || "default"}`);
      if (gh) result.published.push({ via: "github", commit: gh.commit?.sha || true, file: relFile });
    } catch (e) {
      result.githubError = e.message;
    }

    if (folderId) {
      try {
        const blobCat = await blobPut("questions/catalog.json", catalog);
        if (blobCat) result.published.push({ via: "blob-catalog" });
        try {
          const ghCat = await githubPutFile("catalog.json", catalog, `chore(admin): catalog folder ${folderId}`);
          if (ghCat) result.published.push({ via: "github-catalog" });
        } catch (e) {
          result.catalogGithubError = e.message;
        }
      } catch (e) {
        result.catalogError = e.message;
      }
    }

    const alreadyInCatalog = !!(catalog.levels || [])
      .find((l) => l.id === level)
      ?.folders?.some((f) => f.id === folderId);

    if (!result.published.length) {
      result.needsManualDownload = true;
      result.catalogNeeded = !!(folderId && !alreadyInCatalog);
      result.repoPath = `public/questions/${relFile}`;
      const title = folderTitle || folderId || level;
      result.message = [
        `✅ ${count} soal “${title}” sudah dicek dan valid.`,
        "",
        "Publish otomatis ke Supabase belum aktif.",
        "Di Vercel → Settings → Environment Variables, pasang:",
        "  SUPABASE_URL",
        "  SUPABASE_SERVICE_ROLE_KEY  (Project Settings → API → service_role, jangan share ke siswa)",
        "Lalu Redeploy. Setelah itu tombol Publish langsung live — tanpa unduh JSON / git push.",
        result.supabaseError ? `\nDetail: ${result.supabaseError}` : "",
      ].filter(Boolean).join("\n");
      if (result.catalogNeeded) result.catalog = catalog;
    } else {
      const via = result.published.map((p) => p.via).join(", ");
      result.message = `Soal folder "${folderTitle || folderId || level}" sudah live (${count} soal) via ${via}. Siswa bisa langsung pilih folder ini di beranda.`;
    }

    return json(res, 200, result);
  } catch (e) {
    return json(res, 400, { ok: false, message: e.message || "Upload gagal. Cek CSV mengikuti template." });
  }
};
