/**
 * review.js — berkas soal + kunci + pembahasan (cetak PDF di klien).
 * Tidak memanggil API: aman untuk ~200 sesi bersamaan (beban di browser, bukan server).
 */

const AlgoReview = (() => {
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function lang() {
    return (typeof AlgoI18n !== "undefined" && AlgoI18n.getLang() === "en") ? "en" : "id";
  }

  function typeOf(q) {
    return (q && q.type_ui) || "mcq";
  }

  /** Teks hint yang sama persis dengan toast di dalam game. */
  function hintText(q) {
    const en = lang() === "en";
    const t = typeOf(q);
    if (t === "mcq" && typeof q.answer === "number") {
      const opt = "ABCD"[q.answer] || "?";
      if (typeof AlgoI18n !== "undefined") return AlgoI18n.t("hint.toast", { opt });
      return en
        ? `Hint: focus option ${opt} — double-check your math.`
        : `Hint: fokus opsi ${opt} — cek ulang hitunganmu.`;
    }
    if (t === "numeric") {
      return en
        ? "Hint: enter the number only, then check the steps."
        : "Hint: ketik angkanya saja, lalu cek ulang langkah hitungannya.";
    }
    return en
      ? "Hint: check the order from top to bottom."
      : "Hint: cek urutan dari atas ke bawah.";
  }

  function choiceLabel(choices, index) {
    if (index == null || index < 0) return "—";
    const letter = "ABCD"[index] || String(index + 1);
    const text = (choices || [])[index];
    return text == null ? letter : `${letter}. ${text}`;
  }

  function orderLabels(q, ids) {
    const items = q.items || q.choices || [];
    return (ids || []).map((id) => String(items[id] != null ? items[id] : id)).join(" → ");
  }

  function formatCorrect(q) {
    const t = typeOf(q);
    if (t === "numeric") {
      const expected = q.answer_value != null ? q.answer_value : q.answer;
      return String(expected);
    }
    if (t === "order") {
      const ids = q.answer_order || (q.items || q.choices || []).map((_, i) => i);
      return orderLabels(q, ids);
    }
    return choiceLabel(q.choices, q.answer);
  }

  function formatStudent(q, payload, result) {
    if (!payload) return "—";
    if (payload.kind === "numeric") {
      const raw = String(payload.value || "").trim();
      return raw || "—";
    }
    if (payload.kind === "order") {
      return orderLabels(q, payload.order || []);
    }
    if (payload.kind === "mcq" || payload.index != null) {
      return choiceLabel(q.choices, payload.index);
    }
    if (result && result.detail && result.detail.got != null) {
      return String(result.detail.got);
    }
    return "—";
  }

  /**
   * Snapshot ringkas 1 soal untuk PDF + localStorage (tanpa bank soal utuh).
   */
  function buildEntry(q, payload, result, extra) {
    const lq = (typeof AlgoI18n !== "undefined") ? AlgoI18n.localizeQ(q) : q;
    const ok = !!(result && result.ok);
    const idx = payload && (payload.index != null ? payload.index : payload.kind === "mcq" ? payload.index : null);
    const wrongNote = (!ok && lq.wrong && idx != null) ? (lq.wrong[idx] || "") : "";
    return {
      n: extra.n,
      id: q.id || `q${extra.n}`,
      chapter: lq.chapter || "",
      scene: lq.scene || "",
      q: lq.q || "",
      skill: lq.skill || "",
      difficulty: lq.difficulty || "",
      typeUi: typeOf(q),
      choices: Array.isArray(lq.choices) ? lq.choices.slice() : [],
      studentLabel: formatStudent(lq, payload, result),
      correctLabel: formatCorrect(lq),
      ok,
      hintUsed: !!extra.hintUsed,
      hintText: hintText(q),
      pembahasan: String(lq.correct || "").trim(),
      clue: String(lq.clue || "").trim(),
      wrongNote: String(wrongNote || "").trim(),
    };
  }

  function upsertLog(log, entry) {
    const list = Array.isArray(log) ? log.slice() : [];
    const i = list.findIndex((x) => x && x.n === entry.n);
    if (i >= 0) list[i] = entry;
    else list.push(entry);
    list.sort((a, b) => (a.n || 0) - (b.n || 0));
    return list;
  }

  function levelLabel(level) {
    if (typeof AlgoI18n !== "undefined" && AlgoI18n.levelLabel) return AlgoI18n.levelLabel(level);
    if (typeof AlgoReport !== "undefined") return AlgoReport.levelLabel(level);
    return level || "—";
  }

  function loadSavedAnswers(username) {
    if (!username) return [];
    try {
      const saved = JSON.parse(localStorage.getItem(`algo_result_${username}`) || "null");
      if (saved && Array.isArray(saved.answers) && saved.answers.length) return saved.answers;
    } catch (_) {}
    return [];
  }

  function resolveAnswers(state) {
    if (state && Array.isArray(state.answerLog) && state.answerLog.length) return state.answerLog;
    return loadSavedAnswers(state && state.username);
  }

  function populate(data) {
    const en = lang() === "en";
    const answers = data.answers || [];
    const wrongN = answers.filter((a) => !a.ok).length;
    const total = answers.length || data.total || 0;
    const acc = total ? Math.round(((data.correctCount != null ? data.correctCount : answers.filter((a) => a.ok).length) / total) * 100) : (data.accuracy || 0);

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set("review-name", data.studentName || "—");
    set("review-username", data.username || "—");
    set("review-level", data.folderTitle || data.levelLabel || levelLabel(data.level));
    set("review-date",
      (typeof formatDateID === "function")
        ? formatDateID(data.finishedAt)
        : new Date(data.finishedAt || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    );
    set("review-accuracy", `${acc}%`);
    set("review-total", String(total));
    set("review-wrong", String(wrongN));
    set("review-stamp", data.folderTitle || "CASE FILE");

    const list = document.getElementById("review-list");
    if (!list) return;

    if (!answers.length) {
      list.innerHTML = `<p class="review-empty">${esc(en
        ? "Question review is only available after you finish a mission on this device."
        : "Berkas soal hanya tersedia setelah misi diselesaikan di perangkat ini.")}</p>`;
      return;
    }

    list.innerHTML = answers.map((a) => {
      const status = a.ok
        ? `<span class="review-badge ok">${esc(en ? "Correct" : "Benar")}</span>`
        : `<span class="review-badge bad">${esc(en ? "Needs review" : "Perlu ditinjau")}</span>`;
      const choices = (a.choices || []).map((c, i) => {
        const letter = "ABCD"[i] || String(i + 1);
        const isKey = a.correctLabel && a.correctLabel.startsWith(`${letter}.`);
        return `<li class="${isKey ? "key" : ""}"><span>${letter}</span>${esc(c)}</li>`;
      }).join("");
      const choiceBlock = choices
        ? `<ol class="review-choices">${choices}</ol>`
        : "";
      const discuss = (!a.ok || a.pembahasan)
        ? `<div class="review-discuss ${a.ok ? "ok" : "bad"}">
            <div class="review-discuss-kicker">${esc(a.ok
              ? (en ? "Solution" : "Pembahasan")
              : (en ? "Discussion (missed)" : "Pembahasan (jawaban belum tepat)"))}</div>
            <p>${esc(a.pembahasan || (en ? "Compare your steps with the key." : "Bandingkan langkahmu dengan kunci."))}</p>
            ${a.wrongNote ? `<p class="review-note">${esc(a.wrongNote)}</p>` : ""}
          </div>`
        : "";
      const hintBlock = a.hintUsed
        ? `<div class="review-hint"><b>${esc(en ? "Hint used" : "Hint dipakai")}:</b> ${esc(a.hintText || "")}</div>`
        : "";
      const clueBlock = a.clue
        ? `<div class="review-clue"><b>${esc(en ? "Case clue" : "Petunjuk kasus")}:</b> ${esc(a.clue)}</div>`
        : "";

      return `<article class="review-card ${a.ok ? "is-ok" : "is-bad"}">
        <header class="review-card-head">
          <div>
            <div class="review-kicker">${esc(a.chapter || "")}</div>
            <h3>Misi ${String(a.n).padStart(2, "0")} ${status}</h3>
          </div>
          <div class="review-pills">
            ${a.skill ? `<span class="pill">${esc(a.skill)}</span>` : ""}
            ${a.difficulty ? `<span class="pill">${esc(a.difficulty)}</span>` : ""}
          </div>
        </header>
        ${a.scene ? `<p class="review-scene">${esc(a.scene)}</p>` : ""}
        <p class="review-q">${esc(a.q)}</p>
        ${choiceBlock}
        <dl class="review-keys">
          <div><dt>${esc(en ? "Your answer" : "Jawabanmu")}</dt><dd class="${a.ok ? "ok" : "bad"}">${esc(a.studentLabel)}</dd></div>
          <div><dt>${esc(en ? "Answer key" : "Kunci jawaban")}</dt><dd class="ok">${esc(a.correctLabel)}</dd></div>
        </dl>
        ${hintBlock}
        ${clueBlock}
        ${!a.ok ? discuss : (a.pembahasan ? discuss : "")}
      </article>`;
    }).join("");
  }

  function buildPayloadFromState(state) {
    const answers = resolveAnswers(state);
    const saved = (() => {
      try {
        return JSON.parse(localStorage.getItem(`algo_result_${state.username}`) || "null") || {};
      } catch (_) { return {}; }
    })();
    const total = answers.length || saved.total || (Array.isArray(state.questions) ? state.questions.length : 0);
    const correctCount = answers.length ? answers.filter((a) => a.ok).length : Math.round(((saved.accuracy || 0) / 100) * (saved.total || 0));
    return {
      studentName: state.studentName || saved.studentName || "—",
      username: state.username || saved.username || "—",
      level: state.level || saved.level,
      levelLabel: levelLabel(state.level || saved.level),
      folderTitle: state.folderTitle || saved.folderTitle || (state.caseData && state.caseData.caseTitle) || "",
      accuracy: saved.accuracy != null ? saved.accuracy : (total ? Math.round((correctCount / total) * 100) : 0),
      correctCount,
      total,
      answers,
      finishedAt: saved.finishedAt || new Date().toISOString(),
    };
  }

  return {
    esc,
    hintText,
    formatCorrect,
    formatStudent,
    buildEntry,
    upsertLog,
    populate,
    resolveAnswers,
    buildPayloadFromState,
  };
})();
