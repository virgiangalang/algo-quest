/**
 * questions.js
 * Mengambil dan memproses soal dari JSON per level.
 * Tidak butuh server — cukup fetch() dari file statis.
 */

const QUESTION_FILES = {
  "sd-kelas-1-3": "public/questions/sd-kelas-1-3.json",
  "sd-kelas-4-6": "public/questions/sd-kelas-4-6.json",
  "smp":          "public/questions/smp.json",
  "sma":          "public/questions/sma.json",
  "dewasa":       "public/questions/dewasa.json",
};

/**
 * Muat soal untuk level tertentu.
 * @param {string} level
 * @returns {Promise<Object>} data soal
 */
async function loadQuestions(level) {
  const path = QUESTION_FILES[level] || QUESTION_FILES["sd-kelas-4-6"];
  try {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error("File tidak ditemukan");
    return await resp.json();
  } catch (e) {
    console.warn("Gagal load soal, pakai fallback:", e.message);
    return FALLBACK_QUESTIONS;
  }
}

/**
 * Ratakan semua soal dari semua chapter menjadi array linear.
 * Tiap soal mendapat field `chapter` dari parent chapter.
 * @param {Object} data
 * @returns {Array}
 */
function flattenQuestions(data) {
  if (!data || !data.chapters) return [];
  return data.chapters.flatMap(ch =>
    (ch.questions || []).map(q => ({ ...q, chapter: ch.title }))
  );
}

/**
 * Fallback: soal minimal jika JSON belum tersedia (dev mode).
 * Berisi 6 soal SD kelas 4-6.
 */
const FALLBACK_QUESTIONS = {
  level: "sd-kelas-4-6",
  label: "SD Kelas 4–6 (Fallback)",
  caseTitle: "Kode yang Hilang",
  chapters: [
    {
      id: "bab-1",
      title: "Bab 1 — Insiden di Lab",
      questions: [
        {
          id:"q1", scene:"Pintu lab terkunci. Keypad menyala.",
          q:"3/8 dari 240 chip berwarna biru. Berapa jumlahnya?",
          choices:["80","90","120","150"], answer:1,
          skill:"Pecahan", difficulty:"Mudah", type:"analyst",
          correct:"AKSES DIBERIKAN. 3/8 × 240 = 90.",
          wrong:["Bagi dengan 3, bukan hitung 3/8.","Hampir! Cek pecahannya.","Itu setengah dari 240.","Terlalu besar."],
          clue:"Jejak kaki berlumpur dari taman.",
        },
        {
          id:"q2", scene:"Jam digital berhenti saat chip hilang.",
          q:"Jam berhenti pukul 14.35. Petugas memeriksa 47 menit sebelumnya. Pukul berapa?",
          choices:["13:38","13:48","14:02","14:12"], answer:1,
          skill:"Waktu", difficulty:"Mudah", type:"investigator",
          correct:"Benar! 14.35 – 47 menit = 13.48.",
          wrong:["Kurangi 47 dari 14.35.","Menitnya keliru.","Hanya 33 menit.","Hanya 23 menit."],
          clue:"Ruangan aman pada 13.48.",
        },
        {
          id:"q3", scene:"Empat baterai dengan angka berbeda.",
          q:"Mana yang paling besar: 3.09 / 3.9 / 3.19 / 3.099?",
          choices:["3.09","3.9","3.19","3.099"], answer:1,
          skill:"Desimal", difficulty:"Mudah", type:"analyst",
          correct:"3,9 paling besar. Bandingkan persepuluhan dulu.",
          wrong:["Bandingkan persepuluhan dulu.","3,9 = 3,90 — benar!","3,19 < 3,90.","3,099 < 3,9."],
          clue:"Sidik jari muncul di meja.",
        },
        {
          id:"q4", scene:"Pola kode di bawah lampu UV.",
          q:"Lanjutkan pola: 18, 24, 30, 36, __",
          choices:["40","41","42","44"], answer:2,
          skill:"Pola", difficulty:"Mudah", type:"codebreaker",
          correct:"36 + 6 = 42. Laci tersembunyi terbuka!",
          wrong:["Kenaikannya selalu sama.","Setiap angka +6.","42 — tepat!","Bukan +8."],
          clue:"Kartu pengunjung sobek di dalam laci.",
        },
        {
          id:"q5", scene:"Mira mengaku di perpustakaan 0,75 jam.",
          q:"0,75 jam = berapa menit?",
          choices:["35","40","45","75"], answer:2,
          skill:"Desimal", difficulty:"Mudah", type:"investigator",
          correct:"0,75 × 60 = 45 menit.",
          wrong:["Kalikan jam × 60.","0,75 × 60 = 45.","Tepat: 45 menit.","75 adalah angka desimalnya."],
          clue:"Waktu Mira di perpustakaan terbukti benar.",
        },
        {
          id:"q6", scene:"Soal terakhir bab 1.",
          q:"25% dari 80 kamera tidak aktif. Berapa kamera yang mati?",
          choices:["15","20","25","30"], answer:1,
          skill:"Persentase", difficulty:"Mudah", type:"analyst",
          correct:"25% = 1/4. 80 ÷ 4 = 20 kamera.",
          wrong:["25% = seperempat.","80 ÷ 4 = 20.","25 adalah persentasenya.","30 = 37,5% dari 80."],
          clue:"20 kamera mati saat kejadian.",
        },
      ]
    }
  ]
};
