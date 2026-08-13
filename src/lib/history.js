/**
 * Riwayat misi: normalisasi akurasi + dedupe (Sheet 0.9 vs lokal 90).
 */
(function (root) {
  function normalizeAccuracy(raw) {
    if (raw == null || raw === "") return 0;
    const s = String(raw).trim().replace(/%/g, "").replace(",", ".");
    let n = Number(s);
    if (!Number.isFinite(n)) return 0;
    if (n > 0 && n <= 1) n *= 100;
    n = Math.round(n);
    if (n < 0) n = 0;
    if (n > 100) n = 100;
    return n;
  }

  function bucketKey(h) {
    const t = Date.parse(h && h.finishedAt ? h.finishedAt : "");
    const minute = Number.isFinite(t) ? Math.floor(t / 60000) : 0;
    const xp = Number(h && (h.xp != null ? h.xp : h.score)) || 0;
    const title = String((h && (h.folderTitle || h.folderId || h.level)) || "")
      .toLowerCase()
      .trim();
    return `${title}|${xp}|${minute}`;
  }

  function richness(h) {
    let s = 0;
    if (h && Array.isArray(h.answers) && h.answers.length) s += 100;
    if (h && h.folderTitle) s += 10;
    if (h && h.certId) s += 5;
    if (h && normalizeAccuracy(h.accuracy) >= 1) s += 2;
    return s;
  }

  function mergeEntry(a, b) {
    const left = a || {};
    const right = b || {};
    const preferRight = richness(right) >= richness(left);
    const base = preferRight ? { ...left, ...right } : { ...right, ...left };
    base.accuracy = normalizeAccuracy(base.accuracy);
    if ((!base.answers || !base.answers.length) && left.answers && left.answers.length) {
      base.answers = left.answers;
    }
    if ((!base.answers || !base.answers.length) && right.answers && right.answers.length) {
      base.answers = right.answers;
    }
    if (!base.folderTitle) base.folderTitle = left.folderTitle || right.folderTitle || "";
    return base;
  }

  function mergeLists(...lists) {
    const map = new Map();
    lists.flat().forEach((h) => {
      if (!h) return;
      const entry = { ...h, accuracy: normalizeAccuracy(h.accuracy) };
      const k = bucketKey(entry);
      map.set(k, map.has(k) ? mergeEntry(map.get(k), entry) : entry);
    });
    return Array.from(map.values()).sort((a, b) =>
      String(b.finishedAt || "").localeCompare(String(a.finishedAt || ""))
    );
  }

  const AlgoHistory = { normalizeAccuracy, bucketKey, mergeLists, mergeEntry, richness };

  if (typeof module !== "undefined" && module.exports) module.exports = AlgoHistory;
  root.AlgoHistory = AlgoHistory;
})(typeof globalThis !== "undefined" ? globalThis : this);
