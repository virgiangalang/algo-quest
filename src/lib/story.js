/**
 * story.js — narasi kasus Algonova (briefing + antar-bab) + path gambar.
 */

const STORY_BRIEFING = [
  {
    stamp: "LAPORAN MASUK",
    title: "Laboratorium sepi",
    body: "Pagi ini chip AI eksperimental Profesor Nova menghilang dari brankas lab. Pintu terkunci dari dalam. Tidak ada pecahan kaca. Hanya bau ozon samar dan keypad yang masih hangat.",
    image: "public/story/brief-1.jpg",
  },
  {
    stamp: "TIM DITERJUNKAN",
    title: "Kamu dipanggil",
    body: "Biro Investigasi Algonova menugaskanmu. Setiap bukti tersembunyi di balik teka-teki matematika. Hitung dengan teliti — satu angka bisa membuka petunjuk, atau mengunci tersangka yang salah.",
    image: "public/story/brief-2.jpg",
  },
  {
    stamp: "PROSEDUR",
    title: "Kalibrasi dulu",
    body: "Sebelum kasus penuh dibuka, kerjakan 5 soal singkat. Hasilnya menyesuaikan tingkat kesulitan berkas yang kamu terima. Setelah itu, enam bab bukti menunggu.",
    image: "public/story/brief-3.jpg",
  },
];

const STORY_CHAPTER_INTRO = {
  default: [
    {
      body: "Bab baru terbuka. Jejak di lantai masih basah — seseorang baru saja lewat. Keypad lab berkedip meminta kode yang hanya muncul jika kamu menghitung dengan benar.",
      image: "public/story/bab-1.jpg",
    },
    {
      body: "Empat tersangka menunggu. Alibi mereka penuh angka: waktu, jarak, pecahan. Satukan bukti sebelum salah satu dari mereka menghilang lagi.",
      image: "public/story/bab-2.jpg",
    },
    {
      body: "Di balik panel dinding ada ruang tersembunyi. Laser, denah, dan tabung ukur menjaga rahasia. Ukur dengan tepat atau alarm akan menyala.",
      image: "public/story/bab-3.jpg",
    },
    {
      body: "Kode terenkripsi muncul di loker dan ponsel. Pola, aljabar, dan bilangan prima menjadi satu-satunya kunci menuju peron pelarian.",
      image: "public/story/bab-4.jpg",
    },
    {
      body: "Pengejaran dimulai di stasiun. Menit, kecepatan, dan peluang menentukan apakah kamu mencegat ransel merah itu — atau kehilangannya selamanya.",
      image: "public/story/bab-5.jpg",
    },
    {
      body: "Bab terakhir. Satukan semua petunjuk menjadi deduksi akhir. Satu kesalahan hitung bisa membebaskan pelaku yang salah.",
      image: "public/story/bab-6.jpg",
    },
  ],
};

const CASE_KEY_ART = "public/story/case-key.jpg";

/**
 * @param {number} chapterIndex 0-based
 * @param {string} chapterTitle
 * @returns {{stamp:string,title:string,body:string,image:string}}
 */
function getChapterStory(chapterIndex, chapterTitle) {
  const entries = STORY_CHAPTER_INTRO.default;
  const entry = entries[Math.min(chapterIndex, entries.length - 1)];
  const body = typeof entry === "string" ? entry : entry.body;
  const image = typeof entry === "string" ? `public/story/bab-${chapterIndex + 1}.jpg` : entry.image;
  return {
    stamp: `BAB ${chapterIndex + 1}`,
    title: chapterTitle || `Bab ${chapterIndex + 1}`,
    body,
    image,
  };
}

function getBriefingPanels() {
  return STORY_BRIEFING.slice();
}
