/**
 * report.js — Parent/teacher learning report (print to PDF).
 */

const AlgoReport = (() => {
  function levelLabel(level) {
    const map = {
      "sd-kelas-1-3": "SD Kelas 1–3",
      "sd-kelas-4-6": "SD Kelas 4–6",
      smp: "SMP",
      sma: "SMA",
      dewasa: "Dewasa",
    };
    return map[level] || level || "—";
  }

  function skillRows(skillScores) {
    return Object.entries(skillScores || {})
      .map(([name, s]) => {
        const t = s.t || 0;
        const c = s.c || 0;
        const p = t ? Math.round((c / t) * 100) : 0;
        return { name, c, t, p };
      })
      .sort((a, b) => b.p - a.p || b.t - a.t);
  }

  function insights(skills, accuracy, lang) {
    const en = lang === "en";
    const lines = [];
    if (!skills.length) {
      return [en
        ? "Complete a full session to generate skill insights."
        : "Selesaikan sesi penuh untuk insight skill."];
    }
    const top = skills[0];
    const weak = [...skills].sort((a, b) => a.p - b.p || b.t - a.t)[0];
    lines.push(en
      ? `Strong in ${top.name} (${top.p}%).`
      : `Kuat di ${top.name} (${top.p}%).`);
    if (weak && weak.name !== top.name) {
      lines.push(en
        ? `Practice focus: ${weak.name} (${weak.p}%).`
        : `Perlu latihan: ${weak.name} (${weak.p}%).`);
    }
    if (accuracy >= 80) {
      lines.push(en
        ? "Overall accuracy is strong — ready for the next challenge."
        : "Akurasi keseluruhan bagus — siap tantangan berikutnya.");
    } else if (accuracy >= 60) {
      lines.push(en
        ? "Solid base; short daily drills will lift accuracy."
        : "Dasar sudah cukup; latihan singkat harian akan menaikkan akurasi.");
    } else {
      lines.push(en
        ? "Encourage guided review of missed topics this week."
        : "Dampingi review topik yang terlewat minggu ini.");
    }
    return lines.slice(0, 3);
  }

  function buildPayloadFromState(STATE, CHARACTERS) {
    const accuracy = STATE.questions && STATE.questions.length
      ? Math.round((STATE.correct / STATE.questions.length) * 100)
      : (STATE._lastAccuracy || 0);
    const best = (typeof pickCharacter === "function")
      ? pickCharacter(STATE.typeScores || {})
      : Object.entries(STATE.typeScores || { analyst: 1 }).sort((a, b) => b[1] - a[1])[0][0];
    const char = (CHARACTERS && CHARACTERS[best]) || { name: best };
    return {
      studentName: STATE.studentName || "—",
      username: STATE.username || "—",
      level: STATE.level,
      levelLabel: levelLabel(STATE.level),
      accuracy,
      xp: STATE.xp || 0,
      clues: STATE.clues || 0,
      total: (STATE.questions && STATE.questions.length) || STATE._lastTotal || 0,
      charName: char.name || best,
      skillScores: STATE.skillScores || {},
      finishedAt: new Date().toISOString(),
    };
  }

  function populate(data) {
    const lang = (typeof AlgoI18n !== "undefined") ? AlgoI18n.getLang() : "id";
    const skills = skillRows(data.skillScores);
    const tip = insights(skills, data.accuracy || 0, lang);

    document.getElementById("report-name").textContent = data.studentName || "—";
    document.getElementById("report-username").textContent = data.username || "—";
    document.getElementById("report-level").textContent = data.levelLabel || levelLabel(data.level);
    document.getElementById("report-date").textContent =
      (typeof formatDateID === "function")
        ? formatDateID(data.finishedAt)
        : new Date(data.finishedAt || Date.now()).toLocaleDateString("id-ID");
    document.getElementById("report-accuracy").textContent = (data.accuracy ?? 0) + "%";
    document.getElementById("report-xp").textContent = String(data.xp ?? 0);
    document.getElementById("report-char").textContent = data.charName || "—";
    document.getElementById("report-clues").textContent =
      `${data.clues ?? 0}/${data.total ?? 0}`;

    document.getElementById("report-skills").innerHTML = skills.length
      ? skills.map((s) => `
          <div class="report-skill">
            <div class="report-skill-head"><span>${s.name}</span><b>${s.p}%</b></div>
            <div class="report-skill-bg"><div class="report-skill-fg" style="width:${s.p}%"></div></div>
          </div>`).join("")
      : `<p class="report-muted">—</p>`;

    document.getElementById("report-insights").innerHTML =
      tip.map((line) => `<li>${line}</li>`).join("");
  }

  return { populate, buildPayloadFromState, levelLabel, insights };
})();
