/**
 * Parse & validasi CSV soal Algonova (browser + Node).
 */
(function (root) {
  const LEVELS = ["sd-kelas-1-3", "sd-kelas-4-6", "smp", "sma", "dewasa"];

  const REQUIRED_HEADERS = ["q", "bab_title"];
  const HEADER = [
    "folder_id", "folder_title", "bab_id", "bab_title", "id", "type_ui", "scene", "q",
    "choice_a", "choice_b", "choice_c", "choice_d", "answer", "answer_value",
    "answer_tolerance", "items", "answer_order", "skill", "difficulty", "type",
    "correct", "wrong", "clue",
  ];

  function slugFolderId(raw) {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  function detectDelimiter(text) {
    const first = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).find((l) => l.trim()) || "";
    const commas = (first.match(/,/g) || []).length;
    const semis = (first.match(/;/g) || []).length;
    return semis > commas ? ";" : ",";
  }

  function parseCsv(text) {
    const src = String(text || "").replace(/^\uFEFF/, "");
    if (!src.trim()) throw new Error("File CSV kosong. Unduh template resmi, isi di Excel, lalu simpan sebagai CSV UTF-8.");
    const delim = detectDelimiter(src);
    const rows = [];
    let i = 0, field = "", row = [], inQ = false;
    const pushField = () => { row.push(field); field = ""; };
    const pushRow = () => {
      if (row.length === 1 && row[0] === "") { row = []; return; }
      rows.push(row); row = [];
    };
    while (i < src.length) {
      const c = src[i];
      if (inQ) {
        if (c === '"') {
          if (src[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += c;
      } else if (c === '"') inQ = true;
      else if (c === delim) pushField();
      else if (c === "\n") { pushField(); pushRow(); }
      else if (c === "\r") { /* skip */ }
      else field += c;
      i++;
    }
    pushField();
    pushRow();
    if (!rows.length) throw new Error("CSV tidak terbaca. Pastikan file .csv (bukan .xlsx).");
    const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
    if (!headers.includes("q") && !headers.includes("question")) {
      throw new Error(
        `Header CSV tidak dikenali (kolom "q" tidak ada). Unduh template dari halaman admin. Header sekarang: ${headers.slice(0, 8).join(", ") || "(kosong)"}`
      );
    }
    return rows.slice(1).filter((r) => r.some((x) => String(x).trim() !== "")).map((r, idx) => {
      const obj = { _row: idx + 2 };
      headers.forEach((h, hi) => { obj[h] = r[hi] != null ? String(r[hi]).trim() : ""; });
      return obj;
    });
  }

  function rowLabel(row) {
    return `Baris Excel ${row._row || "?"}${row.id ? ` (${row.id})` : ""}`;
  }

  function rowsToBank(level, rows, meta = {}) {
    if (!LEVELS.includes(level)) {
      throw new Error(`Kategori usia tidak valid. Pilih salah satu: ${LEVELS.join(", ")}`);
    }
    if (!rows || !rows.length) {
      throw new Error("Tidak ada baris soal. Isi minimal 1 soal di bawah header.");
    }
    const byChapter = new Map();
    let folderId = slugFolderId(meta.folderId || "");
    let folderTitle = meta.folderTitle || "";

    rows.forEach((row) => {
      if (!folderId) folderId = slugFolderId(row.folder_id);
      if (!folderTitle) folderTitle = row.folder_title || "";
      const bab = String(row.bab_title || row.chapter || "").trim() || "Bab 1";
      const babId = String(row.bab_id || row.chapter_id || `bab-${byChapter.size + 1}`).trim();
      if (!byChapter.has(bab)) byChapter.set(bab, { id: babId, title: bab, questions: [] });
      const qText = String(row.q || row.question || "").trim();
      if (!qText) throw new Error(`${rowLabel(row)}: kolom q (pertanyaan) kosong.`);

      const typeUi = String(row.type_ui || "mcq").trim().toLowerCase() || "mcq";
      const base = {
        id: row.id || `q-${row._row || byChapter.get(bab).questions.length + 1}`,
        type_ui: typeUi,
        scene: row.scene || "Petunjuk baru muncul di lokasi kasus.",
        q: qText,
        skill: row.skill || "Matematika",
        difficulty: row.difficulty || "Sedang",
        type: row.type || "analyst",
        correct: row.correct || row.feedback_benar || "Benar! Bukti terkonfirmasi.",
        clue: row.clue || row.petunjuk || "",
      };

      if (typeUi === "numeric") {
        const raw = String(row.answer_value ?? row.answer ?? "").trim().replace(",", ".");
        const answerValue = Number(raw);
        if (!raw || Number.isNaN(answerValue)) {
          throw new Error(`${rowLabel(row)}: soal numeric wajib isi answer_value (angka, contoh 26).`);
        }
        base.answer_value = answerValue;
        if (String(row.answer_tolerance || "").trim() !== "") {
          base.answer_tolerance = Number(String(row.answer_tolerance).replace(",", "."));
        }
        byChapter.get(bab).questions.push(base);
        return;
      }

      if (typeUi === "order") {
        const items = String(row.items || "")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        if (items.length < 2) {
          throw new Error(`${rowLabel(row)}: soal order wajib kolom items dipisah tanda | (contoh 3|6|12|24).`);
        }
        let answerOrder;
        if (row.answer_order && String(row.answer_order).trim() !== "") {
          answerOrder = String(row.answer_order).split("|").map((s) => Number(s.trim()));
        } else {
          answerOrder = items.map((_, i) => i);
        }
        if (answerOrder.some((n) => Number.isNaN(n) || n < 0 || n >= items.length)) {
          throw new Error(`${rowLabel(row)}: answer_order tidak valid. Pakai index 0|1|2|… sesuai items.`);
        }
        base.items = items;
        base.answer_order = answerOrder;
        base.choices = items;
        base.answer = 0;
        byChapter.get(bab).questions.push(base);
        return;
      }

      if (typeUi !== "mcq") {
        throw new Error(`${rowLabel(row)}: type_ui harus mcq, numeric, atau order (sekarang: "${typeUi}").`);
      }

      const choices = [row.choice_a, row.choice_b, row.choice_c, row.choice_d]
        .map((x) => String(x ?? "").trim())
        .filter((x) => x !== "");
      if (choices.length < 2) {
        throw new Error(`${rowLabel(row)}: pilihan ganda butuh minimal choice_a dan choice_b.`);
      }
      let answer = row.answer;
      if (typeof answer === "string" && /^[A-Da-d]$/.test(answer.trim())) {
        answer = answer.trim().toUpperCase().charCodeAt(0) - 65;
      } else {
        answer = Number(answer);
      }
      if (Number.isNaN(answer) || answer < 0 || answer >= choices.length) {
        throw new Error(`${rowLabel(row)}: kolom answer harus A–D atau 0–3 (sesuai pilihan yang terisi).`);
      }
      let wrong;
      if (row.wrong && String(row.wrong).includes("|")) {
        wrong = String(row.wrong).split("|").map((s) => s.trim());
      } else {
        wrong = choices.map((_, j) => (j === answer ? "Benar!" : "Coba hitung kembali."));
      }
      while (wrong.length < choices.length) wrong.push("Coba hitung kembali.");
      base.choices = choices;
      base.answer = answer;
      base.wrong = wrong;
      byChapter.get(bab).questions.push(base);
    });

    const chapters = [...byChapter.values()];
    const count = chapters.reduce((n, ch) => n + ch.questions.length, 0);
    return {
      level,
      label: meta.label || level,
      folder: folderId || meta.folderId || "",
      caseTitle: folderTitle || meta.caseTitle || meta.folderTitle || "Kode yang Hilang",
      curriculum: "Kurikulum Merdeka",
      chapters,
      _count: count,
    };
  }

  function validateBank(data) {
    if (!data || typeof data !== "object") return "File JSON tidak valid (bukan object).";
    if (!data.level || !LEVELS.includes(data.level)) {
      return `Kolom level wajib salah satu: ${LEVELS.join(", ")}`;
    }
    if (!Array.isArray(data.chapters) || !data.chapters.length) {
      return "Tidak ada bab. Setiap soal butuh bab_title.";
    }
    let total = 0;
    for (const ch of data.chapters) {
      if (!ch.title) return "Setiap bab wajib punya judul (bab_title).";
      if (!Array.isArray(ch.questions) || !ch.questions.length) {
        return `Bab "${ch.title}" belum punya soal.`;
      }
      for (const q of ch.questions) {
        total++;
        const typeUi = (q.type_ui || "mcq").toLowerCase();
        if (!q.q) return `Ada soal tanpa pertanyaan di bab "${ch.title}".`;
        if (typeUi === "numeric") {
          const v = q.answer_value != null ? Number(q.answer_value) : Number(q.answer);
          if (Number.isNaN(v)) return `Soal numeric "${q.q}" wajib answer_value angka.`;
          continue;
        }
        if (typeUi === "order") {
          if (!Array.isArray(q.items) || q.items.length < 2) {
            return `Soal urutan "${q.q}" wajib items (minimal 2).`;
          }
          continue;
        }
        if (!Array.isArray(q.choices) || q.choices.length < 2) {
          return `Soal "${q.q}" harus punya minimal 2 pilihan (choice_a / choice_b).`;
        }
        if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.choices.length) {
          return `Soal "${q.q}": answer harus A–D atau index 0…${q.choices.length - 1}.`;
        }
      }
    }
    if (total < 1) return "Minimal 1 soal.";
    return null;
  }

  function csvHeader() {
    return HEADER.join(",");
  }

  function csvEscape(v) {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function exampleRows(folderId, folderTitle) {
    const fid = slugFolderId(folderId) || "folder-baru";
    const ft = folderTitle || "Misi Baru";
    const rows = [
      [fid, ft, "bab-1", "Bab 1 — TKP", "q1", "mcq", "Alarm berbunyi.", "2 + 3 = ?", "4", "5", "6", "7", "B", "", "", "", "", "Hitung", "Mudah", "analyst", "2+3=5.", "Coba lagi.|Benar.|Coba lagi.|Coba lagi.", ""],
      [fid, ft, "bab-1", "Bab 1 — TKP", "q2", "numeric", "Keypad menyala.", "Keliling persegi 4 m?", "", "", "", "", "", "16", "0", "", "", "Geometri", "Mudah", "explorer", "4×4=16.", "", ""],
    ];
    return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  }

  function bankToCsv(bank) {
    const fid = slugFolderId(bank && bank.folder);
    const ft = (bank && bank.caseTitle) || "";
    const lines = [HEADER.join(",")];
    for (const ch of (bank && bank.chapters) || []) {
      for (const q of ch.questions || []) {
        const typeUi = String(q.type_ui || "mcq").toLowerCase();
        const choices = Array.isArray(q.choices) ? q.choices : [];
        const answerLetter =
          typeUi === "mcq" && typeof q.answer === "number" && q.answer >= 0
            ? String.fromCharCode(65 + q.answer)
            : "";
        const row = [
          fid,
          ft,
          ch.id || "",
          ch.title || "",
          q.id || "",
          typeUi,
          q.scene || "",
          q.q || "",
          choices[0] || "",
          choices[1] || "",
          choices[2] || "",
          choices[3] || "",
          answerLetter,
          typeUi === "numeric" ? (q.answer_value != null ? q.answer_value : "") : "",
          q.answer_tolerance != null && q.answer_tolerance !== "" ? q.answer_tolerance : "",
          Array.isArray(q.items) ? q.items.join("|") : "",
          Array.isArray(q.answer_order) ? q.answer_order.join("|") : "",
          q.skill || "",
          q.difficulty || "",
          q.type || "",
          q.correct || "",
          Array.isArray(q.wrong) ? q.wrong.join("|") : "",
          q.clue || "",
        ];
        lines.push(row.map(csvEscape).join(","));
      }
    }
    return lines.join("\n");
  }

  const AlgoQuestionCsv = {
    LEVELS,
    HEADER,
    slugFolderId,
    parseCsv,
    rowsToBank,
    validateBank,
    csvHeader,
    exampleRows,
    bankToCsv,
    detectDelimiter,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = AlgoQuestionCsv;
  root.AlgoQuestionCsv = AlgoQuestionCsv;
})(typeof globalThis !== "undefined" ? globalThis : this);
