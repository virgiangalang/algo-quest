const {
  json,
  blobGetJson,
  readStaticQuestion,
  LEVELS,
  supabaseGetBank,
} = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET") return json(res, 405, { ok: false, message: "GET only" });

  const url = new URL(req.url, "http://localhost");
  const file = url.searchParams.get("file");
  const level = url.searchParams.get("level") || "sd-kelas-4-6";
  const key = file || level;

  if (!file && !LEVELS.includes(level)) {
    return json(res, 400, { ok: false, message: "level/file tidak dikenal" });
  }

  try {
    const rel = file
      ? String(file).replace(/^\/+/, "")
      : `${level}.json`;

    const fromSb = await supabaseGetBank(rel);
    if (fromSb && fromSb.chapters) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Algo-Source", "supabase");
      return json(res, 200, fromSb);
    }

    const blobKey = `questions/${rel}`;
    const fromBlob = await blobGetJson(blobKey);
    if (fromBlob && fromBlob.chapters) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Algo-Source", "blob");
      return json(res, 200, fromBlob);
    }

    const fromDisk = readStaticQuestion(key);
    if (fromDisk) {
      res.setHeader("Cache-Control", "public, max-age=60");
      res.setHeader("X-Algo-Source", "static");
      return json(res, 200, fromDisk);
    }

    return json(res, 404, { ok: false, message: `Soal ${key} tidak ditemukan` });
  } catch (e) {
    return json(res, 500, { ok: false, message: e.message });
  }
};
