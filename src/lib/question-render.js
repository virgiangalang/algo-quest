/**
 * question-render.js — render & grade interactive question types.
 * type_ui: mcq | numeric | order (default mcq)
 */

const QuestionRender = (() => {
  function typeOf(q) {
    return (q && q.type_ui) || "mcq";
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function render(box, q, onSubmitReady) {
    const t = typeOf(q);
    box.innerHTML = "";
    box.className = "choices";
    if (t === "numeric") return renderNumeric(box, q, onSubmitReady);
    if (t === "order") return renderOrder(box, q, onSubmitReady);
    return renderMcq(box, q, onSubmitReady);
  }

  function renderMcq(box, q, onSubmitReady) {
    box.className = "choices";
    q.choices.forEach((c, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.innerHTML = `<span class="choice-key">${"ABCD"[idx]}</span>${c}`;
      btn.onclick = () => onSubmitReady({ kind: "mcq", index: idx, btn });
      box.appendChild(btn);
    });
  }

  function t(key, fallback) {
    if (typeof AlgoI18n !== "undefined") return AlgoI18n.t(key) || fallback;
    return fallback;
  }

  function renderNumeric(box, q, onSubmitReady) {
    box.className = "choices interactive-block";
    const wrap = document.createElement("div");
    wrap.className = "numeric-wrap";
    wrap.innerHTML = `
      <label class="numeric-label">${t("q.numericLabel", "Jawaban angka")}</label>
      <div class="numeric-row">
        <input type="text" inputmode="decimal" class="numeric-input" id="numeric-answer" placeholder="${t("q.numericPh", "Contoh: 90")}" autocomplete="off">
        <button type="button" class="btn-primary" id="numeric-submit">${t("q.submit", "Kirim")}</button>
      </div>
      <div class="numeric-hint">${t("q.numericHint", "Ketik bilangan saja (boleh desimal, tanpa satuan).")}</div>
    `;
    box.appendChild(wrap);
    const input = wrap.querySelector("#numeric-answer");
    const submit = wrap.querySelector("#numeric-submit");
    const go = () => {
      if (typeof STATE !== "undefined" && STATE.answered) return;
      onSubmitReady({ kind: "numeric", value: input.value, input, submit });
    };
    submit.onclick = go;
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    setTimeout(() => input.focus(), 50);
  }

  function renderOrder(box, q, onSubmitReady) {
    box.className = "choices interactive-block";
    const items = (q.items || q.choices || []).map((label, i) => ({ id: i, label: String(label) }));
    const shuffled = shuffle(items);
    if (typeof STATE === "undefined") window.STATE = window.STATE || {};
    STATE._orderCurrent = shuffled.map((x) => x.id);

    const wrap = document.createElement("div");
    wrap.className = "order-wrap";
    wrap.innerHTML = `<div class="order-hint">${t("q.orderHint", "Urutkan dari atas ke bawah dengan tombol ↑ ↓.")}</div><div class="order-list" id="order-list"></div>
      <button type="button" class="btn-primary" id="order-submit" style="margin-top:12px">${t("q.orderSubmit", "Kunci urutan")}</button>`;
    box.appendChild(wrap);
    const list = wrap.querySelector("#order-list");

    function paint() {
      list.innerHTML = "";
      STATE._orderCurrent.forEach((id, pos) => {
        const item = items.find((x) => x.id === id);
        const row = document.createElement("div");
        row.className = "order-item";
        row.innerHTML = `
          <span class="order-pos">${pos + 1}</span>
          <span class="order-label">${item.label}</span>
          <span class="order-actions">
            <button type="button" data-act="up" data-pos="${pos}" aria-label="Naik">↑</button>
            <button type="button" data-act="down" data-pos="${pos}" aria-label="Turun">↓</button>
          </span>`;
        list.appendChild(row);
      });
      list.querySelectorAll("button").forEach((b) => {
        b.onclick = () => {
          if (STATE.answered) return;
          const pos = Number(b.getAttribute("data-pos"));
          const act = b.getAttribute("data-act");
          const arr = STATE._orderCurrent.slice();
          if (act === "up" && pos > 0) [arr[pos - 1], arr[pos]] = [arr[pos], arr[pos - 1]];
          if (act === "down" && pos < arr.length - 1) [arr[pos + 1], arr[pos]] = [arr[pos], arr[pos + 1]];
          STATE._orderCurrent = arr;
          paint();
        };
      });
    }
    paint();
    wrap.querySelector("#order-submit").onclick = () => {
      if (STATE.answered) return;
      onSubmitReady({ kind: "order", order: STATE._orderCurrent.slice() });
    };
  }

  function grade(q, payload) {
    const t = typeOf(q);
    if (t === "numeric") {
      const expected = Number(q.answer_value != null ? q.answer_value : q.answer);
      const tol = Number(q.answer_tolerance || 0);
      let raw = String(payload.value || "").trim().replace(/\s/g, "");
      // ID: 120.000 → 120000 ; EN/decimal: keep last comma/dot as decimal
      if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
        raw = raw.replace(/\./g, "").replace(",", ".");
      } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
        raw = raw.replace(/,/g, "");
      } else {
        raw = raw.replace(",", ".");
      }
      const got = Number(raw);
      const ok = !Number.isNaN(got) && Math.abs(got - expected) <= tol;
      return { ok, detail: { expected, got } };
    }
    if (t === "order") {
      const correct = q.answer_order || q.items?.map((_, i) => i) || q.choices?.map((_, i) => i) || [];
      const got = payload.order || [];
      const ok = correct.length === got.length && correct.every((v, i) => v === got[i]);
      return { ok, detail: { expected: correct, got } };
    }
    // mcq
    const ok = payload.index === q.answer;
    return { ok, detail: { index: payload.index } };
  }

  return { typeOf, render, grade };
})();
