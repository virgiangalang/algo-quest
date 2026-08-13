/**
 * Shared helpers for admin API (no npm deps).
 * Password: process.env.ADMIN_PASSWORD
 */

const crypto = require("crypto");

const LEVELS = ["sd-kelas-1-3", "sd-kelas-4-6", "smp", "sma", "dewasa"];

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("Body JSON tidak valid"));
      }
    });
    req.on("error", reject);
  });
}

function getAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || "").trim();
}

function signToken(payload) {
  const secret = getAdminPassword();
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const secret = getAdminPassword();
  if (!secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return "";
}

const AlgoQuestionCsv = require("../src/lib/question-csv");

function validateBank(data) {
  return AlgoQuestionCsv.validateBank(data);
}

function questionRelPath(level, folderId, existingFile) {
  if (existingFile && String(existingFile).endsWith(".json") && !String(existingFile).includes("..")) {
    return String(existingFile).replace(/^\/+/, "");
  }
  const slug = AlgoQuestionCsv.slugFolderId(folderId);
  if (slug) return `${level}/${slug}.json`;
  return `${level}.json`;
}

function upsertCatalogFolder(catalog, level, folder) {
  const data = catalog && typeof catalog === "object" ? catalog : { version: 1, levels: [] };
  if (!Array.isArray(data.levels)) data.levels = [];
  let lvl = data.levels.find((l) => l.id === level);
  if (!lvl) {
    lvl = { id: level, title: level, folders: [] };
    data.levels.push(lvl);
  }
  if (!Array.isArray(lvl.folders)) lvl.folders = [];
  const id = AlgoQuestionCsv.slugFolderId(folder.id);
  const next = {
    id,
    title: folder.title || id,
    blurb: folder.blurb || "",
    file: folder.file || `${level}/${id}.json`,
    questionsHint: folder.questionsHint || "",
  };
  const idx = lvl.folders.findIndex((f) => f.id === id);
  if (idx >= 0) lvl.folders[idx] = { ...lvl.folders[idx], ...next };
  else lvl.folders.push(next);
  data.updatedAt = new Date().toISOString();
  return data;
}

function readStaticCatalog() {
  const fs = require("fs");
  const path = require("path");
  const p = path.join(process.cwd(), "public", "questions", "catalog.json");
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_) {}
  return { version: 1, levels: LEVELS.map((id) => ({ id, title: id, folders: [] })) };
}

async function blobPut(pathname, content) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const url = `https://blob.vercel-storage.com/${pathname}`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-version": "7",
      "Content-Type": "application/json",
      "x-vercel-blob-access": "public",
    },
    body: typeof content === "string" ? content : JSON.stringify(content),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Blob put gagal: ${resp.status} ${t}`);
  }
  const saved = await resp.json();

  // Update manifest so GET bisa resolve URL publik
  try {
    const manifestPath = "questions/manifest.json";
    let manifest = {};
    const existing = await blobGetJson(manifestPath, { skipManifest: true });
    if (existing && typeof existing === "object") manifest = existing;
    manifest[pathname] = saved.url;
    manifest.updatedAt = new Date().toISOString();
    await fetch(`https://blob.vercel-storage.com/${manifestPath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-version": "7",
        "Content-Type": "application/json",
        "x-vercel-blob-access": "public",
      },
      body: JSON.stringify(manifest),
    });
  } catch (_) {
    /* manifest best-effort */
  }

  return saved;
}

async function blobGetJson(pathname, opts = {}) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  // 1) Via manifest (cepat)
  if (!opts.skipManifest) {
    try {
      const listUrl = `https://blob.vercel-storage.com?prefix=${encodeURIComponent("questions/manifest.json")}&limit=5`;
      const listResp = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}`, "x-api-version": "7" },
      });
      if (listResp.ok) {
        const listed = await listResp.json();
        const blobs = listed.blobs || [];
        const man = blobs.find((b) => b.pathname === "questions/manifest.json");
        if (man && man.url) {
          const manResp = await fetch(man.url, { cache: "no-store" });
          if (manResp.ok) {
            const manifest = await manResp.json();
            if (manifest[pathname]) {
              const fileResp = await fetch(manifest[pathname], { cache: "no-store" });
              if (fileResp.ok) return fileResp.json();
            }
          }
        }
      }
    } catch (_) {}
  }

  // 2) List by exact pathname prefix
  const listUrl = `https://blob.vercel-storage.com?prefix=${encodeURIComponent(pathname)}&limit=10`;
  const listResp = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-version": "7",
    },
  });
  if (!listResp.ok) return null;
  const listed = await listResp.json();
  const blobs = listed.blobs || [];
  const hit = blobs.find(
    (b) => b.pathname === pathname || (b.url && String(b.pathname || "").endsWith(pathname))
  );
  if (!hit || !hit.url) return null;
  const fileResp = await fetch(hit.url, { cache: "no-store" });
  if (!fileResp.ok) return null;
  return fileResp.json();
}

async function githubPutFile(relPath, data, message) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. virgiangalang/algo-quest
  if (!token || !repo) return null;

  const clean = String(relPath || "").replace(/^\/+/, "");
  if (!clean || clean.includes("..")) throw new Error("Path file tidak valid");
  const path = clean.startsWith("public/") ? clean : `public/questions/${clean}`;
  const content = Buffer.from(
    typeof data === "string" ? data : JSON.stringify(data, null, 2),
    "utf8"
  ).toString("base64");
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;

  let sha;
  const getResp = await fetch(api, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "algonova-admin",
    },
  });
  if (getResp.ok) {
    const cur = await getResp.json();
    sha = cur.sha;
  }

  const putResp = await fetch(api, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "algonova-admin",
    },
    body: JSON.stringify({
      message: message || `chore(admin): update ${path}`,
      content,
      sha,
      branch: process.env.GITHUB_BRANCH || "main",
    }),
  });
  if (!putResp.ok) {
    const t = await putResp.text();
    throw new Error(`GitHub commit gagal: ${putResp.status} ${t}`);
  }
  return putResp.json();
}

function readStaticQuestion(levelOrFile) {
  const fs = require("fs");
  const path = require("path");
  const raw = String(levelOrFile || "").replace(/^\/+/, "");
  const asFile = raw.endsWith(".json") ? raw : `${raw}.json`;
  // Prevent path traversal
  if (asFile.includes("..")) return null;
  const candidates = [
    path.join(process.cwd(), "public", "questions", asFile),
    path.join(process.cwd(), "questions", asFile),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf8"));
      }
    } catch (_) {}
  }
  return null;
}

function githubPutQuestion(level, data) {
  return githubPutFile(`${level}.json`, data, `chore(admin): update soal ${level}`);
}

module.exports = {
  LEVELS,
  json,
  readBody,
  getAdminPassword,
  signToken,
  verifyToken,
  getBearer,
  validateBank,
  blobPut,
  blobGetJson,
  githubPutQuestion,
  githubPutFile,
  readStaticQuestion,
  readStaticCatalog,
  questionRelPath,
  upsertCatalogFolder,
};
