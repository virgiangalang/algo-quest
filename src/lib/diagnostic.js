/**
 * diagnostic.js
 * Menentukan level dari umur, menyesuaikan berdasarkan skor diagnostic,
 * dan mendefinisikan karakter detektif.
 */

/* ─── LEVEL MAP ─── */
const LEVELS = ["sd-kelas-1-3", "sd-kelas-4-6", "smp", "sma", "dewasa"];
const LEVEL_LABELS = {
  "sd-kelas-1-3": "SD Kelas 1–3",
  "sd-kelas-4-6": "SD Kelas 4–6",
  "smp":          "SMP",
  "sma":          "SMA",
  "dewasa":       "Dewasa",
};

/* ─── KARAKTER DETEKTIF ─── */
const CHARACTERS = {
  analyst: {
    name: "Sang Analis",
    emoji: "A",
    tag: "Tidak ada detail angka yang luput dari perhatianmu.",
    desc: "Kamu peka terhadap detail angka dan menyelesaikan masalah dengan teliti dan sistematis.",
  },
  speedster: {
    name: "Si Pemikir Cepat",
    emoji: "S",
    tag: "Berpikir cepat, mengambil keputusan dengan sigap.",
    desc: "Kamu bergerak cepat menghadapi tantangan dan memiliki insting matematika yang kuat.",
  },
  investigator: {
    name: "Sang Investigator",
    emoji: "I",
    tag: "Setiap petunjuk punya cerita.",
    desc: "Kekuatanmu muncul saat bukti, logika, dan penalaran teliti digabungkan.",
  },
  codebreaker: {
    name: "Sang Pemecah Kode",
    emoji: "C",
    tag: "Pola mengungkap hal yang tidak dilihat orang lain.",
    desc: "Deret, aljabar, dan aturan tersembunyi adalah keahlian alammu.",
  },
  explorer: {
    name: "Sang Penjelajah",
    emoji: "E",
    tag: "Setiap jalan dapat mengungkap petunjuk.",
    desc: "Kamu terus mencoba, beradaptasi, dan maju meskipun jalannya berubah.",
  },
};

/**
 * Tentukan level awal dari umur (Kurikulum Merdeka).
 * @param {number|null} age
 * @returns {string}
 */
function levelFromAge(age) {
  if (!age && age !== 0) return "sd-kelas-4-6";
  const n = Number(age);
  if (!n || n <= 9) return "sd-kelas-1-3";
  if (n <= 12) return "sd-kelas-4-6";
  if (n <= 15) return "smp";
  if (n <= 18) return "sma";
  return "dewasa";
}

/**
 * Sesuaikan level berdasarkan skor diagnostic.
 * @param {string} baseLevel  - Level awal dari umur
 * @param {number} score      - Jumlah benar (0–total)
 * @param {number} total      - Total soal diagnostic
 * @returns {string} level yang disesuaikan
 */
function adjustLevel(baseLevel, score, total) {
  const ratio = score / total;
  const idx = LEVELS.indexOf(baseLevel);
  if (idx < 0) return baseLevel;

  let newIdx = idx;
  if (ratio <= 0.4 && idx > 0) newIdx = idx - 1;       // turun 1 level
  else if (ratio >= 0.9 && idx < LEVELS.length - 1) newIdx = idx + 1; // naik 1 level

  return LEVELS[newIdx];
}

/**
 * Soal diagnostic — 5 soal campuran (tidak terlalu susah).
 * Tiap level punya bank soal sendiri di dalam file ini.
 */
const DIAG_BANK = {
  "sd-kelas-1-3": [
    {
      "q": "1 + 1 = ?",
      "choices": [
        "1",
        "2",
        "3",
        "4"
      ],
      "answer": 1,
      "correct": "Betul! 1 + 1 = 2.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "1 + 1 = ?",
      "choices_en": [
        "1",
        "2",
        "3",
        "4"
      ],
      "correct_en": "Correct! 1 + 1 = 2."
    },
    {
      "q": "5 – 3 = ?",
      "choices": [
        "1",
        "2",
        "3",
        "4"
      ],
      "answer": 1,
      "correct": "Betul! 5 – 3 = 2.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "5 – 3 = ?",
      "choices_en": [
        "1",
        "2",
        "3",
        "4"
      ],
      "correct_en": "Correct! 5 – 3 = 2."
    },
    {
      "q": "Mana yang lebih besar: 7 atau 4?",
      "choices": [
        "4",
        "7",
        "Sama",
        "Tidak tahu"
      ],
      "answer": 1,
      "correct": "7 lebih besar dari 4.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "Which is greater: 7 or 4?",
      "choices_en": [
        "4",
        "7",
        "Equal",
        "Don't know"
      ],
      "correct_en": "7 is greater than 4."
    },
    {
      "q": "2 × 3 = ?",
      "choices": [
        "5",
        "6",
        "7",
        "8"
      ],
      "answer": 1,
      "correct": "2 × 3 = 6.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "2 × 3 = ?",
      "choices_en": [
        "5",
        "6",
        "7",
        "8"
      ],
      "correct_en": "2 × 3 = 6."
    },
    {
      "q": "10 – 4 = ?",
      "choices": [
        "4",
        "5",
        "6",
        "7"
      ],
      "answer": 2,
      "correct": "10 – 4 = 6.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "10 – 4 = ?",
      "choices_en": [
        "4",
        "5",
        "6",
        "7"
      ],
      "correct_en": "10 – 4 = 6."
    }
  ],
  "sd-kelas-4-6": [
    {
      "q": "3/4 dari 40 adalah …",
      "choices": [
        "15",
        "20",
        "30",
        "35"
      ],
      "answer": 2,
      "correct": "3/4 × 40 = 30.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "3/4 of 40 is…",
      "choices_en": [
        "15",
        "20",
        "30",
        "35"
      ],
      "correct_en": "3/4 × 40 = 30."
    },
    {
      "q": "0,5 × 20 = ?",
      "choices": [
        "5",
        "10",
        "15",
        "20"
      ],
      "answer": 1,
      "correct": "0,5 × 20 = 10.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "0.5 × 20 = ?",
      "choices_en": [
        "5",
        "10",
        "15",
        "20"
      ],
      "correct_en": "0.5 × 20 = 10."
    },
    {
      "q": "25% dari 80 = ?",
      "choices": [
        "15",
        "20",
        "25",
        "30"
      ],
      "answer": 1,
      "correct": "25% = 1/4, jadi 80 ÷ 4 = 20.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "25% of 80 = ?",
      "choices_en": [
        "15",
        "20",
        "25",
        "30"
      ],
      "correct_en": "25% = 1/4, so 80 ÷ 4 = 20."
    },
    {
      "q": "Keliling persegi sisi 6 cm = ?",
      "choices": [
        "12 cm",
        "18 cm",
        "24 cm",
        "36 cm"
      ],
      "answer": 2,
      "correct": "Keliling = 4 × 6 = 24 cm.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "Perimeter of a square with side 6 cm = ?",
      "choices_en": [
        "12 cm",
        "18 cm",
        "24 cm",
        "36 cm"
      ],
      "correct_en": "Perimeter = 4 × 6 = 24 cm."
    },
    {
      "q": "Pola: 5, 10, 15, 20, _?",
      "choices": [
        "22",
        "24",
        "25",
        "30"
      ],
      "answer": 2,
      "correct": "Polanya +5, jadi 25.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "Pattern: 5, 10, 15, 20, _?",
      "choices_en": [
        "22",
        "24",
        "25",
        "30"
      ],
      "correct_en": "The pattern is +5, so 25."
    }
  ],
  "smp": [
    {
      "q": "x + 5 = 12, maka x = ?",
      "choices": [
        "5",
        "6",
        "7",
        "8"
      ],
      "answer": 2,
      "correct": "x = 12 – 5 = 7.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "x + 5 = 12, so x = ?",
      "choices_en": [
        "5",
        "6",
        "7",
        "8"
      ],
      "correct_en": "x = 12 – 5 = 7."
    },
    {
      "q": "2x = 18, maka x = ?",
      "choices": [
        "6",
        "7",
        "8",
        "9"
      ],
      "answer": 3,
      "correct": "x = 18 ÷ 2 = 9.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "2x = 18, so x = ?",
      "choices_en": [
        "6",
        "7",
        "8",
        "9"
      ],
      "correct_en": "x = 18 ÷ 2 = 9."
    },
    {
      "q": "Peluang muncul angka genap pada dadu 1–6?",
      "choices": [
        "1/6",
        "1/3",
        "1/2",
        "2/3"
      ],
      "answer": 2,
      "correct": "Ada 3 angka genap (2,4,6) dari 6, jadi 3/6 = 1/2.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "Probability of an even number on a die 1–6?",
      "choices_en": [
        "1/6",
        "1/3",
        "1/2",
        "2/3"
      ],
      "correct_en": "3 even numbers (2.4,6) out of 6 → 1/2."
    },
    {
      "q": "Luas lingkaran dengan jari-jari 7 cm (π ≈ 22/7)?",
      "choices": [
        "44 cm²",
        "154 cm²",
        "176 cm²",
        "308 cm²"
      ],
      "answer": 1,
      "correct": "π × 7² = 22/7 × 49 = 154 cm².",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "Area of a circle with radius 7 cm (π ≈ 22/7)?",
      "choices_en": [
        "44 cm²",
        "154 cm²",
        "176 cm²",
        "308 cm²"
      ],
      "correct_en": "π × 7² = 22/7 × 49 = 154 cm²."
    },
    {
      "q": "Rata-rata dari 4, 6, 8, 10 = ?",
      "choices": [
        "6",
        "7",
        "8",
        "9"
      ],
      "answer": 1,
      "correct": "(4+6+8+10) ÷ 4 = 28 ÷ 4 = 7.",
      "wrong": [
        "",
        "",
        "",
        ""
      ],
      "q_en": "Average of 4, 6, 8, 10 = ?",
      "choices_en": [
        "6",
        "7",
        "8",
        "9"
      ],
      "correct_en": "(4+6+8+10) ÷ 4 = 7."
    }
  ],
  "sma": [
    {
      "q": "Turunan f(x) = 3x² adalah …",
      "q_en": "Derivative of f(x) = 3x² is…",
      "choices": [
        "3x",
        "6x",
        "x²",
        "6x²"
      ],
      "choices_en": [
        "3x",
        "6x",
        "x²",
        "6x²"
      ],
      "answer": 1,
      "correct": "f'(x) = 2 × 3x = 6x.",
      "correct_en": "f'(x) = 6x.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "sin 30° = ?",
      "q_en": "sin 30° = ?",
      "choices": [
        "√2/2",
        "√3/2",
        "1/2",
        "1"
      ],
      "choices_en": [
        "√2/2",
        "√3/2",
        "1/2",
        "1"
      ],
      "answer": 2,
      "correct": "sin 30° = 1/2.",
      "correct_en": "sin 30° = 1/2.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "log₂ 8 = ?",
      "q_en": "log₂ 8 = ?",
      "choices": [
        "2",
        "3",
        "4",
        "8"
      ],
      "choices_en": [
        "2",
        "3",
        "4",
        "8"
      ],
      "answer": 1,
      "correct": "2³ = 8, jadi log₂ 8 = 3.",
      "correct_en": "2³ = 8, so log₂ 8 = 3.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "Akar dari x² – 5x + 6 = 0?",
      "q_en": "Roots of x² – 5x + 6 = 0?",
      "choices": [
        "1 dan 6",
        "2 dan 3",
        "–2 dan –3",
        "–1 dan 6"
      ],
      "choices_en": [
        "1 and 6",
        "2 and 3",
        "–2 and –3",
        "–1 and 6"
      ],
      "answer": 1,
      "correct": "(x–2)(x–3) = 0, jadi x = 2 dan x = 3.",
      "correct_en": "(x–2)(x–3)=0, so x=2 and x=3.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "∑ dari k=1 s/d 4 adalah: 1+2+3+4 = ?",
      "q_en": "Sum from k=1 to 4: 1+2+3+4 = ?",
      "choices": [
        "8",
        "9",
        "10",
        "12"
      ],
      "choices_en": [
        "8",
        "9",
        "10",
        "12"
      ],
      "answer": 2,
      "correct": "1+2+3+4 = 10.",
      "correct_en": "1+2+3+4 = 10.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    }
  ],
  "dewasa": [
    {
      "q": "Jika diskon 20% dari harga Rp 150.000, harga akhirnya?",
      "q_en": "If 20% off Rp150.000, final price?",
      "choices": [
        "Rp 100.000",
        "Rp 120.000",
        "Rp 130.000",
        "Rp 135.000"
      ],
      "choices_en": [
        "Rp100,000",
        "Rp120,000",
        "Rp130,000",
        "Rp135,000"
      ],
      "answer": 1,
      "correct": "150.000 × 0,8 = 120.000.",
      "correct_en": "150.000 × 0.8 = 120.000.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "Bunga sederhana 5% per tahun pada Rp 2.000.000 selama 3 tahun?",
      "q_en": "Simple interest 5%/year on Rp2.000.000 for 3 years?",
      "choices": [
        "Rp 200.000",
        "Rp 250.000",
        "Rp 300.000",
        "Rp 350.000"
      ],
      "choices_en": [
        "Rp200,000",
        "Rp250,000",
        "Rp300,000",
        "Rp350,000"
      ],
      "answer": 2,
      "correct": "2.000.000 × 5% × 3 = 300.000.",
      "correct_en": "2.000.000 × 5% × 3 = 300.000.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "Rata-rata 10, 20, 30, 40, 50 = ?",
      "q_en": "Average of 10, 20, 30, 40, 50 = ?",
      "choices": [
        "25",
        "30",
        "35",
        "40"
      ],
      "choices_en": [
        "25",
        "30",
        "35",
        "40"
      ],
      "answer": 1,
      "correct": "150 ÷ 5 = 30.",
      "correct_en": "150 ÷ 5 = 30.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "KPK dari 4 dan 6 adalah?",
      "q_en": "LCM of 4 and 6?",
      "choices": [
        "8",
        "10",
        "12",
        "24"
      ],
      "choices_en": [
        "8",
        "10",
        "12",
        "24"
      ],
      "answer": 2,
      "correct": "KPK(4,6) = 12.",
      "correct_en": "LCM(4.6) = 12.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    },
    {
      "q": "3² + 4² = ?",
      "q_en": "3² + 4² = ?",
      "choices": [
        "14",
        "25",
        "30",
        "49"
      ],
      "choices_en": [
        "14",
        "25",
        "30",
        "49"
      ],
      "answer": 1,
      "correct": "9 + 16 = 25.",
      "correct_en": "9 + 16 = 25.",
      "wrong": [
        "",
        "",
        "",
        ""
      ]
    }
  ]
};

/**
 * Ambil 5 soal diagnostic untuk level tertentu.
 * @param {string} level
 * @returns {Array}
 */
function getDiagnosticQuestions(level) {
  const bank = DIAG_BANK[level] || DIAG_BANK["sd-kelas-4-6"];
  // Shuffle dan ambil 5
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

/**
 * Pilih karakter detektif dari skor tipe soal.
 * @param {Object} typeScores
 * @returns {string} key karakter
 */
function pickCharacter(typeScores) {
  const entries = Object.entries(typeScores || {});
  if (!entries.length) return "analyst";
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0] in CHARACTERS ? entries[0][0] : "analyst";
}
