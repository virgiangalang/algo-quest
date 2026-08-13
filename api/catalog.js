const {
  json,
  blobGetJson,
  readStaticCatalog,
  supabaseLoadMergedCatalog,
  supabaseConfig,
  mergeCatalogLayers,
} = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET") return json(res, 405, { ok: false, message: "GET only" });

  try {
    if (supabaseConfig().canRead) {
      const merged = await supabaseLoadMergedCatalog();
      if (merged && Array.isArray(merged.levels)) {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Algo-Source", "supabase");
        return json(res, 200, merged);
      }
    }

    const fromBlob = await blobGetJson("questions/catalog.json");
    if (fromBlob && Array.isArray(fromBlob.levels)) {
      const merged = mergeCatalogLayers(readStaticCatalog(), fromBlob, []);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Algo-Source", "blob");
      return json(res, 200, merged);
    }

    const fromDisk = readStaticCatalog();
    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("X-Algo-Source", "static");
    return json(res, 200, fromDisk);
  } catch (e) {
    return json(res, 500, { ok: false, message: e.message });
  }
};
