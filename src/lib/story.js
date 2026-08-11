/**
 * story.js — narasi kasus Algonova (briefing + antar-bab).
 * Brand Algo / dossier; bukan Kindora.
 */

const STORY_BRIEFING = [
  {
    stamp: "LAPORAN MASUK",
    title: "Laboratorium sepi",
    body: "Pagi ini chip AI eksperimental Profesor Nova menghilang dari brankas lab. Pintu terkunci dari dalam. Tidak ada pecahan kaca.",
  },
  {
    stamp: "TIM DITERJUNKAN",
    title: "Kamu dipanggil",
    body: "Biro Investigasi Algonova menugaskanmu. Setiap bukti tersembunyi di balik teka-teki matematika. Hitung dengan teliti — satu angka bisa membuka petunjuk.",
  },
  {
    stamp: "PROSEDUR",
    title: "Kalibrasi dulu",
    body: "Sebelum kasus penuh dibuka, kerjakan 5 soal singkat. Hasilnya menyesuaikan tingkat kesulitan berkas yang kamu terima.",
  },
];

const STORY_CHAPTER_INTRO = {
  default: [
    "Bab baru terbuka. Jejak di lantai masih basah — seseorang baru saja lewat.",
    "Bukti berikutnya tersegel. Pecahkan soal untuk membuka stempel berkas.",
    "Peta kasus bertambah rumit. Tetap fokus pada angka di depanmu.",
    "Kode di dinding berkedip. Ini bukan kebetulan.",
    "Waktu semakin sempit. Setiap jawaban mengunci atau membebaskan tersangka.",
    "Bab terakhir. Satukan semua petunjuk menjadi deduksi akhir.",
  ],
};

/**
 * @param {number} chapterIndex 0-based
 * @param {string} chapterTitle
 * @returns {{stamp:string,title:string,body:string}}
 */
function getChapterStory(chapterIndex, chapterTitle) {
  const lines = STORY_CHAPTER_INTRO.default;
  const body = lines[Math.min(chapterIndex, lines.length - 1)];
  return {
    stamp: `BAB ${chapterIndex + 1}`,
    title: chapterTitle || `Bab ${chapterIndex + 1}`,
    body,
  };
}

function getBriefingPanels() {
  return STORY_BRIEFING.slice();
}
