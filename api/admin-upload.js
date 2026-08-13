const {
  json,
  readBody,
  verifyToken,
  getBearer,
  validateBank,
  blobPut,
  blobGetJson,
  githubPutFile,
  LEVELS,
  readStaticCatalog,
  questionRelPath,
  upsertCatalogFolder,
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
        let catalog = await blobGetJson("questions/catalog.json");
        if (!catalog || !Array.isArray(catalog.levels)) catalog = readStaticCatalog();
        catalog = upsertCatalogFolder(catalog, level, {
          id: folderId,
          title: folderTitle || data.caseTitle || folderId,
          blurb: folderBlurb,
          file: relFile,
          questionsHint: `${count} soal`,
        });
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

    const catalogNow = readStaticCatalog();
    const alreadyInCatalog = !!(catalogNow.levels || [])
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
        "Upload otomatis ke website belum aktif (koneksi Blob/GitHub belum dipasang).",
        `File JSON sudah disiapkan. Letakkan di: public/questions/${relFile}`,
        alreadyInCatalog
          ? "Folder ini sudah ada di katalog — tidak perlu daftar ulang."
          : "Folder baru: daftar juga di public/questions/catalog.json (file catalog ikut diunduh).",
        "Setelah itu deploy / push agar siswa melihat soal baru.",
      ].join("\n");
      if (result.catalogNeeded) {
        result.catalog = upsertCatalogFolder(catalogNow, level, {
          id: folderId,
          title: folderTitle || data.caseTitle || folderId,
          blurb: folderBlurb,
          file: relFile,
          questionsHint: `${count} soal`,
        });
      }
    } else {
      result.message = `Soal folder "${folderTitle || folderId || level}" berhasil dipublish (${count} soal).`;
    }

    return json(res, 200, result);
  } catch (e) {
    return json(res, 400, { ok: false, message: e.message || "Upload gagal. Cek CSV mengikuti template." });
  }
};
