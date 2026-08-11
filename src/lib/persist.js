/**
 * persist.js — autosave / resume session (survive reload).
 */

const AlgoPersist = (() => {
  const KEY = "algo_session_v1";

  function canSave(state) {
    if (!state || !state.username) return false;
    if (!state.phase || state.phase === "login") return false;
    return true;
  }

  function save(state, extra = {}) {
    if (!canSave(state)) return false;
    try {
      const payload = {
        v: 1,
        savedAt: Date.now(),
        lang: (typeof AlgoI18n !== "undefined" && AlgoI18n.getLang()) || "id",
        phase: state.phase,
        username: state.username,
        studentName: state.studentName,
        age: state.age,
        level: state.level,
        suggestedLevel: state.suggestedLevel,
        levelChosen: state.levelChosen,
        qIndex: state.qIndex,
        correct: state.correct,
        xp: state.xp,
        clues: state.clues,
        typeScores: state.typeScores,
        skillScores: state.skillScores,
        diagIndex: state.diagIndex,
        diagCorrect: state.diagCorrect,
        diagQuestions: state.diagQuestions,
        questions: state.questions,
        caseData: state.caseData,
        questionSource: state.questionSource,
        usedFallback: state.usedFallback,
        seenChapters: state.seenChapters || {},
        briefIndex: state.briefIndex || 0,
        ...extra,
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
      flashAutosave();
      return true;
    } catch (e) {
      console.warn("[algo] persist save failed", e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !data.username) return null;
      // expire after 7 days
      if (data.savedAt && Date.now() - data.savedAt > 7 * 24 * 3600 * 1000) {
        clear();
        return null;
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  function flashAutosave() {
    const el = document.getElementById("autosave-pill");
    if (!el) return;
    el.classList.add("show");
    clearTimeout(flashAutosave._t);
    flashAutosave._t = setTimeout(() => el.classList.remove("show"), 1600);
  }

  function phaseLabel(phase, lang) {
    const map = {
      id: {
        "level-select": "pilih level",
        briefing: "prolog",
        diagnostic: "kalibrasi",
        "case-intro": "intro kasus",
        game: "investigasi",
        result: "hasil",
        certificate: "sertifikat",
      },
      en: {
        "level-select": "level select",
        briefing: "prologue",
        diagnostic: "calibration",
        "case-intro": "case intro",
        game: "investigation",
        result: "results",
        certificate: "certificate",
      },
    };
    return (map[lang] || map.id)[phase] || phase;
  }

  return { save, load, clear, canSave, phaseLabel, KEY };
})();
