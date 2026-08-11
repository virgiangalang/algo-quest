/**
 * i18n.js — UI bilingual ID / EN
 * Soal JSON: pakai field *_en jika ada; fallback ke ID.
 */

const AlgoI18n = (() => {
  const STR = {
    id: {
      "brand.sub": "Misteri Matematika",
      "mute.on": "Suara: Nyala",
      "mute.off": "Suara: Mati",
      "lang.id": "ID",
      "lang.en": "EN",
      "login.eyebrow": "Berkas Kasus 001 · Edisi Siswa",
      "login.title": "Kode yang Hilang",
      "login.lead": "Chip AI eksperimental milik Profesor Nova telah menghilang. Ikuti petunjuk dalam bab-bab kasus, selesaikan tantangan matematika, dan temukan karakter detektifmu di akhir investigasi.",
      "login.user": "Username Algonova",
      "login.name": "Nama Siswa",
      "login.age": "Umur (opsional)",
      "login.ageNote": "Umur membantu menyarankan level soal awal.",
      "login.cta": "Buka berkas kasus →",
      "login.loading": "Memverifikasi akses…",
      "login.langLabel": "Bahasa / Language",
      "level.eyebrow": "Berkas kasus · Pilih jalur investigasi",
      "level.title": "Pilih level soal",
      "level.lead": "Pilih tingkat yang paling pas. Kalibrasi singkat tetap dijalankan setelah ini dan boleh menyesuaikan satu tingkat naik/turun.",
      "level.suggested": "Disarankan",
      "level.hintAge": "Berdasarkan umur {age}, saran kami: {level}. Kamu tetap bebas memilih.",
      "level.hintNoAge": "Umur tidak diisi — pilih level yang paling nyaman.",
      "brief.eyebrow": "Prolog kasus",
      "brief.next": "Lanjut →",
      "brief.start": "Mulai kalibrasi →",
      "diag.eyebrow": "Fase Diagnostic · Soal {n} dari {total}",
      "diag.title": "Kalibrasi Kemampuan",
      "diag.lead": "Jawab 5 soal singkat ini untuk membantu kami menyesuaikan level kasus yang tepat untukmu.",
      "diag.next": "Lanjut →",
      "diag.good": "✓ Tepat!",
      "diag.bad": "Hampir!",
      "intro.stamp": "BERKAS DIBUKA",
      "intro.eyebrow": "Kalibrasi selesai · Kasus siap",
      "intro.loadingTitle": "Membuka berkas kasus…",
      "intro.loadingLead": "Hasil diagnostic sedang dipakai untuk menyesuaikan tingkat kesulitan investigasi.",
      "intro.lead": "Chip AI eksperimental milik Profesor Nova menghilang. Kamu akan menelusuri {chapters} bab bukti ({count} misi matematika) pada level {level}.",
      "intro.level": "Level kasus",
      "intro.diag": "Skor kalibrasi",
      "intro.count": "Jumlah misi",
      "intro.start": "Mulai investigasi →",
      "intro.loadingBtn": "Memuat berkas kasus…",
      "intro.dev": "Mode DEV FALLBACK: bank soal production belum terbaca.",
      "story.eyebrow": "Berkas baru terbuka",
      "story.continue": "Lanjutkan misi →",
      "game.analyze": "Analisis Bukti",
      "game.listen": "Dengarkan soal",
      "game.hint": "Tampilkan hint",
      "game.attempts": "Percobaan: {n}",
      "game.next": "Petunjuk berikutnya →",
      "game.rank": "Peringkat detektif",
      "game.xp": "XP",
      "game.clues": "Petunjuk",
      "game.accuracy": "Akurasi",
      "game.progress": "Progres kasus",
      "game.mission": "Misi {n} / {total}",
      "result.eyebrow": "Kasus Terpecahkan",
      "result.cert": "Lihat & Cetak Certificate",
      "result.report": "Laporan PDF ortu/guru",
      "result.skills": "Profil Matematikamu",
      "cert.print": "Cetak / Simpan PDF",
      "cert.back": "← Kembali ke Hasil",
      "cert.share": "Bagikan hasil",
      "cert.copied": "Teks hasil disalin!",
      "report.print": "Cetak / Simpan laporan PDF",
      "report.back": "← Kembali ke Hasil",
      "report.title": "Laporan Hasil Belajar",
      "report.for": "Untuk orang tua / guru",
      "report.insights": "Insight singkat",
      "report.signCeo": "CEO Algonova",
      "report.signNote": "(Tanda tangan resmi menyusul)",
      "q.numericLabel": "Jawaban angka",
      "q.numericPh": "Contoh: 90",
      "q.numericHint": "Ketik bilangan saja (boleh desimal, tanpa satuan).",
      "q.submit": "Kirim",
      "q.orderHint": "Urutkan dari atas ke bawah dengan tombol ↑ ↓.",
      "q.orderSubmit": "Kunci urutan",
      "resume.title": "Lanjutkan investigasi?",
      "resume.body": "Progress tersimpan otomatis. Lanjut dari {phase} · {detail}",
      "resume.continue": "Lanjutkan →",
      "resume.restart": "Mulai ulang",
      "autosave": "Tersimpan otomatis",
      "footer": "© Algonova by Algorithmics · Misteri Matematika · Kurikulum Merdeka",
      "err.user": "Username Algonova wajib diisi.",
      "err.name": "Nama siswa wajib diisi.",
      "err.invalid": "Username tidak ditemukan atau tidak aktif.",
      "err.net": "Gagal terhubung ke server. Cek koneksi internetmu.",
      "hint.toast": "Hint: fokus opsi {opt} — cek ulang hitunganmu.",
      "toast.retry": "Belum tepat — masih ada 1 percobaan + hint.",
      "toast.clueOk": "Petunjuk terbuka · +{xp} XP",
      "toast.clueBad": "Bukti perlu ditinjau · +35 XP",
      "feedback.ok": "Bukti terkonfirmasi · +{xp} XP",
      "feedback.bad": "Bukti perlu ditinjau · +35 XP",
      "stamp.ok": "BUKTI TERKONFIRMASI",
    },
    en: {
      "brand.sub": "Math Mystery",
      "mute.on": "Sound: On",
      "mute.off": "Sound: Off",
      "lang.id": "ID",
      "lang.en": "EN",
      "login.eyebrow": "Case File 001 · Student Edition",
      "login.title": "The Missing Code",
      "login.lead": "Professor Nova’s experimental AI chip has vanished. Follow the case chapters, solve math challenges, and discover your detective character at the end.",
      "login.user": "Algonova Username",
      "login.name": "Student Name",
      "login.age": "Age (optional)",
      "login.ageNote": "Age helps suggest a starting difficulty.",
      "login.cta": "Open case file →",
      "login.loading": "Verifying access…",
      "login.langLabel": "Bahasa / Language",
      "level.eyebrow": "Case file · Choose your track",
      "level.title": "Choose difficulty",
      "level.lead": "Pick the best fit. A short calibration still runs afterward and may adjust one level up or down.",
      "level.suggested": "Suggested",
      "level.hintAge": "Based on age {age}, we suggest: {level}. You can still choose freely.",
      "level.hintNoAge": "No age entered — pick the level that feels right.",
      "brief.eyebrow": "Case prologue",
      "brief.next": "Next →",
      "brief.start": "Start calibration →",
      "diag.eyebrow": "Diagnostic · Question {n} of {total}",
      "diag.title": "Skill Calibration",
      "diag.lead": "Answer 5 short questions so we can tune the case difficulty for you.",
      "diag.next": "Next →",
      "diag.good": "✓ Correct!",
      "diag.bad": "Close!",
      "intro.stamp": "FILE OPENED",
      "intro.eyebrow": "Calibration done · Case ready",
      "intro.loadingTitle": "Opening case file…",
      "intro.loadingLead": "Your diagnostic score is tuning the investigation difficulty.",
      "intro.lead": "Professor Nova’s experimental AI chip is missing. You’ll work through {chapters} evidence chapters ({count} math missions) at {level} level.",
      "intro.level": "Case level",
      "intro.diag": "Calibration score",
      "intro.count": "Missions",
      "intro.start": "Start investigation →",
      "intro.loadingBtn": "Loading case file…",
      "intro.dev": "DEV FALLBACK: production question bank not loaded.",
      "story.eyebrow": "New file unlocked",
      "story.continue": "Continue mission →",
      "game.analyze": "Evidence Analysis",
      "game.listen": "Listen to question",
      "game.hint": "Show hint",
      "game.attempts": "Attempts: {n}",
      "game.next": "Next clue →",
      "game.rank": "Detective rank",
      "game.xp": "XP",
      "game.clues": "Clues",
      "game.accuracy": "Accuracy",
      "game.progress": "Case progress",
      "game.mission": "Mission {n} / {total}",
      "result.eyebrow": "Case Solved",
      "result.cert": "View & Print Certificate",
      "result.report": "Parent/teacher PDF report",
      "result.skills": "Your Math Profile",
      "cert.print": "Print / Save PDF",
      "cert.back": "← Back to Results",
      "cert.share": "Share result",
      "cert.copied": "Result text copied!",
      "report.print": "Print / Save report PDF",
      "report.back": "← Back to Results",
      "report.title": "Learning Progress Report",
      "report.for": "For parents / teachers",
      "report.insights": "Quick insights",
      "report.signCeo": "CEO Algonova",
      "report.signNote": "(Official signature coming soon)",
      "q.numericLabel": "Numeric answer",
      "q.numericPh": "e.g. 90",
      "q.numericHint": "Enter a number only (decimals OK, no units).",
      "q.submit": "Submit",
      "q.orderHint": "Reorder top to bottom with ↑ ↓.",
      "q.orderSubmit": "Lock order",
      "resume.title": "Resume investigation?",
      "resume.body": "Progress was autosaved. Resume from {phase} · {detail}",
      "resume.continue": "Continue →",
      "resume.restart": "Start over",
      "autosave": "Autosaved",
      "footer": "© Algonova by Algorithmics · Math Mystery · Merdeka Curriculum",
      "err.user": "Algonova username is required.",
      "err.name": "Student name is required.",
      "err.invalid": "Username not found or inactive.",
      "err.net": "Could not reach the server. Check your connection.",
      "hint.toast": "Hint: focus option {opt} — double-check your math.",
      "toast.retry": "Not yet — 1 attempt left + hint available.",
      "toast.clueOk": "Clue unlocked · +{xp} XP",
      "toast.clueBad": "Evidence needs review · +35 XP",
      "feedback.ok": "Evidence confirmed · +{xp} XP",
      "feedback.bad": "Evidence needs review · +35 XP",
      "stamp.ok": "EVIDENCE CONFIRMED",
    },
  };

  let lang = "id";
  try {
    const saved = localStorage.getItem("algo_lang");
    if (saved === "en" || saved === "id") lang = saved;
  } catch (_) {}

  function t(key, vars) {
    const table = STR[lang] || STR.id;
    let s = table[key] || STR.id[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return s;
  }

  function setLang(next) {
    lang = next === "en" ? "en" : "id";
    try { localStorage.setItem("algo_lang", lang); } catch (_) {}
    applyDom();
    document.documentElement.lang = lang === "en" ? "en" : "id";
    return lang;
  }

  function getLang() { return lang; }

  function applyDom() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    const mute = document.getElementById("btn-mute");
    if (mute && typeof AlgoAudio !== "undefined") {
      mute.textContent = AlgoAudio.isMuted() ? t("mute.off") : t("mute.on");
    }
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
  }

  /** Localize a question object (supports *_en fields). */
  function localizeQ(q) {
    if (!q || lang !== "en") return q;
    return {
      ...q,
      scene: q.scene_en || q.scene,
      q: q.q_en || q.q,
      choices: q.choices_en || q.choices,
      items: q.items_en || q.items,
      correct: q.correct_en || q.correct,
      wrong: q.wrong_en || q.wrong,
      clue: q.clue_en || q.clue,
      skill: q.skill_en || q.skill,
      difficulty: q.difficulty_en || q.difficulty,
      chapter: q.chapter_en || q.chapter,
    };
  }

  return { t, setLang, getLang, applyDom, localizeQ, STR };
})();
