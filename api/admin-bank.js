const {
  json,
  readBody,
  verifyToken,
  getBearer,
  supabaseConfig,
  supabaseLoadMergedCatalog,
  supabaseDeleteBank,
  supabaseSaveCatalog,
  hideFolderInCatalog,
  questionRelPath,
} = require("./_lib");
const AlgoQuestionCsv = require("../src/lib/question-csv");

function listFolders(catalog) {
  const out = [];
  for (const lvl of (catalog && catalog.levels) || []) {
    for (const f of lvl.folders || []) {
      out.push({
        level: lvl.id,
        levelTitle: lvl.title || lvl.id,
        id: f.id,
        title: f.title || f.id,
        blurb: f.blurb || "",
        file: f.file || "",
        questionsHint: f.questionsHint || "",
      });
    }
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});

  const token = getBearer(req);
  const session = verifyToken(token);
  if (!session) return json(res, 401, { ok: false, message: "Sesi admin tidak valid. Login ulang." });

  try {
    if (req.method === "GET") {
      const catalog = await supabaseLoadMergedCatalog();
      return json(res, 200, { ok: true, folders: listFolders(catalog), catalog });
    }

    if (req.method !== "DELETE") {
      return json(res, 405, { ok: false, message: "GET atau DELETE saja" });
    }

    if (!supabaseConfig().canWrite) {
      return json(res, 400, {
        ok: false,
        message: "Hapus butuh SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di Vercel.",
      });
    }

    const body = await readBody(req);
    const url = new URL(req.url, "http://localhost");
    const folderId = AlgoQuestionCsv.slugFolderId(body.folderId || url.searchParams.get("folderId") || "");
    const level = String(body.level || url.searchParams.get("level") || "").trim();
    const file = String(body.file || url.searchParams.get("file") || "").replace(/^\/+/, "");
    const rel = file || questionRelPath(level, folderId, "");
    if (!rel || rel.includes("..")) {
      return json(res, 400, { ok: false, message: "Folder/file tidak valid." });
    }

    let catalog = await supabaseLoadMergedCatalog();
    catalog = hideFolderInCatalog(catalog, { file: rel, folderId, level });
    try {
      await supabaseDeleteBank(rel);
    } catch (e) {
      /* bank may only exist as static file */
      if (!/0 rows|204|not found|PGRST116/i.test(String(e.message))) {
        /* still hide even if delete of missing row is ok */
      }
    }
    await supabaseSaveCatalog(catalog);

    return json(res, 200, {
      ok: true,
      file: rel,
      folderId: folderId || null,
      message: `Folder dihapus dari daftar siswa. File cadangan di repo (jika ada) tidak ikut terhapus.`,
    });
  } catch (e) {
    return json(res, 400, { ok: false, message: e.message || "Gagal menghapus folder." });
  }
};
