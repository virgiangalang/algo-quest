/**
 * Apply English *_en fields to question banks + diagnostic.
 * Run: node scripts/apply-en-banks.cjs
 */
const fs = require("fs");
const path = require("path");

const SKILL = {
  Keuangan: "Finance",
  Statistik: "Statistics",
  Logika: "Logic",
  Aritmetika: "Arithmetic",
  Rasio: "Ratio",
  Bilangan: "Numbers",
  Persentase: "Percentages",
  Waktu: "Time",
  Pola: "Patterns",
  Pembulatan: "Rounding",
  Pengukuran: "Measurement",
  Geometri: "Geometry",
  Desimal: "Decimals",
  "Urutan Operasi": "Order of Operations",
  Penjumlahan: "Addition",
  Pengurangan: "Subtraction",
  Perkalian: "Multiplication",
  Pembagian: "Division",
  "Urutan Bilangan": "Number Order",
  Pecahan: "Fractions",
  Aljabar: "Algebra",
  Laju: "Rate",
  Peluang: "Probability",
  Data: "Data",
  Fungsi: "Functions",
  Limit: "Limits",
  Kalkulus: "Calculus",
  Trigonometri: "Trigonometry",
  Matriks: "Matrices",
  Eksponen: "Exponents",
  Barisan: "Sequences",
  Logaritma: "Logarithms",
  Deret: "Series",
  "Geometri Koordinat": "Coordinate Geometry",
};

const DIFF = { Mudah: "Easy", Sedang: "Medium", Sulit: "Hard" };

const META = {
  "sd-kelas-1-3": {
    label_en: "Elementary Grades 1–3",
    ageRange_en: "Ages 6–9",
    caseTitle_en: "Mystery in the Number Garden",
    chapters: {
      "bab-1": "Chapter 1 — The Magical Garden",
      "bab-2": "Chapter 2 — Number Maze",
      "bab-3": "Chapter 3 — Hidden Treasure",
      "bab-4": "Chapter 4 — Mystery Clock",
      "bab-5": "Chapter 5 — Secret Shapes",
      "bab-6": "Chapter 6 — Final Code",
    },
  },
  "sd-kelas-4-6": {
    label_en: "Elementary Grades 4–6",
    ageRange_en: "Ages 10–12",
    caseTitle_en: "The Missing Code",
    chapters: {
      "bab-1": "Chapter 1 — Lab Incident",
      "bab-2": "Chapter 2 — Hunting Suspects",
      "bab-3": "Chapter 3 — Hidden Evidence",
      "bab-4": "Chapter 4 — Crack the Code",
      "bab-5": "Chapter 5 — The Chase",
      "bab-6": "Chapter 6 — Final Deduction",
    },
  },
  smp: {
    label_en: "Junior High",
    ageRange_en: "Ages 13–15",
    caseTitle_en: "Dark Variable Operation",
    chapters: {
      "bab-1": "Chapter 1 — Strange Signal",
      "bab-2": "Chapter 2 — Data Tracking",
      "bab-3": "Chapter 3 — Early Deduction",
      "bab-4": "Chapter 4 — Coordinate Map",
      "bab-5": "Chapter 5 — Signal Speed",
      "bab-6": "Chapter 6 — Final Variable",
    },
  },
  sma: {
    label_en: "Senior High",
    ageRange_en: "Ages 16–18",
    caseTitle_en: "Secret Function Operation",
    chapters: {
      "bab-1": "Chapter 1 — Function Analysis",
      "bab-2": "Chapter 2 — Matrix Ops",
      "bab-3": "Chapter 3 — Series & Limits",
      "bab-4": "Chapter 4 — Probability & Data",
      "bab-5": "Chapter 5 — Trig & Geometry",
      "bab-6": "Chapter 6 — Final Deduction",
    },
  },
  dewasa: {
    label_en: "Adult",
    ageRange_en: "Ages 18+",
    caseTitle_en: "Hidden Numbers Audit",
    chapters: {
      "bab-1": "Chapter 1 — Finance & Logic",
      "bab-2": "Chapter 2 — Deeper Analysis",
      "bab-3": "Chapter 3 — Office Data",
      "bab-4": "Chapter 4 — Quick Decisions",
      "bab-5": "Chapter 5 — Measures & Charts",
      "bab-6": "Chapter 6 — Closing the Case",
    },
  },
};

/** Phrase-level Indonesian → English (order matters: longer first). */
const PHRASES = [
  ["Petunjuk baru: ", "New clue: "],
  ["Pintu kebun terkunci. Ada angka di kunci.", "The garden gate is locked. There is a number on the lock."],
  ["Ada 8 buah apel. 3 diambil.", "There are 8 apples. 3 are taken."],
  ["Bunga berjejer di kebun.", "Flowers are lined up in the garden."],
  ["Pagar kebun ada 12 papan. 4 rusak.", "The garden fence has 12 boards. 4 are broken."],
  ["Kotak berisi bola berwarna.", "A box holds colored balls."],
  ["Labirin punya 20 pintu. 7 terkunci.", "The maze has 20 doors. 7 are locked."],
  ["Pola angka di dinding labirin.", "A number pattern is on the maze wall."],
  ["Ada 15 koin emas di lantai.", "There are 15 gold coins on the floor."],
  ["Lentera ada di setiap 5 langkah.", "A lantern appears every 5 steps."],
  ["Kotak harta berisi dua bagian sama besar.", "The treasure box has two equal parts."],
  ["Peta harta punya urutan angka.", "The treasure map has a number sequence."],
  ["Ada 4 kelompok kupu-kupu, tiap kelompok 3.", "There are 4 groups of butterflies, 3 in each group."],
  ["Peti harta terbuka jika tahu jumlah semua.", "The chest opens when you know the total."],
  ["Harta dibagi rata untuk 3 orang dari 18 koin.", "Treasure is shared equally among 3 people from 18 coins."],
  ["Pintu terakhir perlu kode dua angka.", "The final door needs a two-digit code."],
  ["Kartu angka berserakan di meja detektif.", "Number cards are scattered on the detective desk."],
  ["Urutkan angka dari yang terkecil ke terbesar.", "Sort the numbers from smallest to largest."],
  ["Pintu terbuka!", "The door opens!"],
  ["apel tersisa.", "apples left."],
  ["Pesan rahasia terbuka.", "The secret message unlocks."],
  ["papan baik.", "good boards."],
  ["bola.", "balls."],
  ["pintu terbuka.", "doors are open."],
  ["Pola +2.", "Pattern +2."],
  ["koin tersisa.", "coins left."],
  ["Kamu menemukan lentera ketiga!", "You found the third lantern!"],
  ["tiap bagian.", "each part."],
  ["Pola bilangan ganjil.", "Odd-number pattern."],
  ["kupu-kupu.", "butterflies."],
  ["Peti terbuka!", "The chest opens!"],
  ["koin per orang.", "coins per person."],
  ["Urutan bilangan terkunci!", "Number order locked in!"],
  ["Kunci bernomor", "The lock number is"],
  ["Tersisa", "Left:"],
  ["Pesan ada di bunga ke-", "The message is at flower #"],
  ["papan pagar masih baik.", "fence boards are still good."],
  ["Ada", "There are"],
  ["bola di kotak.", "balls in the box."],
  ["pintu bisa dilalui.", "doors can be passed."],
  ["Angka berikutnya:", "Next number:"],
  ["koin masih tersisa.", "coins still remain."],
  ["Lentera ke-3 ada di langkah ke-", "Lantern #3 is at step"],
  ["Tiap bagian berisi", "Each part contains"],
  ["benda.", "items."],
  ["Total", "Total"],
  ["kupu-kupu di taman.", "butterflies in the garden."],
  ["Kode peti adalah", "The chest code is"],
  ["Tiap orang dapat", "Each person gets"],
  ["koin.", "coins."],
  ["Kode pintu terakhir:", "Final door code:"],
  ["Kunci brankas memakai urutan", "The vault lock uses the sequence"],
];

function trBasic(s) {
  if (s == null) return s;
  let out = String(s);
  // Apply phrase dict
  for (const [id, en] of PHRASES) {
    if (out.includes(id)) out = out.split(id).join(en);
  }
  // Common leftovers
  const tiny = [
    ["Berapa", "What is"],
    ["berapa", "what is"],
    ["dari", "of"],
    ["adalah", "is"],
    ["maka", "then"],
    ["Nilai", "Value"],
    ["nilai", "value"],
    ["tepat!", "exact!"],
    ["Tepat!", "Exact!"],
    ["Hampir.", "Almost."],
    ["Coba lagi.", "Try again."],
    ["Coba hitung lagi.", "Try calculating again."],
    ["Coba kurangi.", "Try subtracting."],
    ["Terlalu besar.", "Too big."],
    ["Terlalu kecil.", "Too small."],
    ["Benar!", "Correct!"],
    ["Betul!", "Correct!"],
    ["ya", "yes"],
    ["tidak", "no"],
    ["Ya", "Yes"],
    ["Tidak", "No"],
    ["Sama", "Equal"],
    ["Tidak tahu", "Don't know"],
    ["Mana yang lebih besar", "Which is greater"],
    ["atau", "or"],
  ];
  for (const [id, en] of tiny) {
    out = out.split(id).join(en);
  }
  return out;
}

/** Explicit high-quality EN for non-trivial prompts (level|id). */
const Q_EN = {};
const SCENE_EN = {};
const CORRECT_EN = {};
const CLUE_EN = {};
const WRONG_EN = {};
const ITEMS_EN = {};
const CHOICES_EN = {};

function put(level, id, fields) {
  const k = `${level}|${id}`;
  if (fields.q) Q_EN[k] = fields.q;
  if (fields.scene) SCENE_EN[k] = fields.scene;
  if (fields.correct) CORRECT_EN[k] = fields.correct;
  if (fields.clue) CLUE_EN[k] = fields.clue;
  if (fields.wrong) WRONG_EN[k] = fields.wrong;
  if (fields.items) ITEMS_EN[k] = fields.items;
  if (fields.choices) CHOICES_EN[k] = fields.choices;
}

// ——— SD 1-3 explicit (covers unique + repeated stems) ———
[
  ["q1-1", "2 + 3 = ?", "The garden gate is locked. There is a number on the lock.", "2 + 3 = 5. The door opens!", "The lock number is 5."],
  ["q1-2", "8 – 3 = ?", "There are 8 apples. 3 are taken.", "8 – 3 = 5 apples left.", "5 apples remain."],
  ["q1-3", "5 + 5 = ?", "Flowers are lined up in the garden.", "5 + 5 = 10! The secret message unlocks.", "The message is at flower #10."],
  ["q1-4", "12 – 4 = ?", "The garden fence has 12 boards. 4 are broken.", "12 – 4 = 8 good boards.", "8 fence boards are still good."],
  ["q1-5", "3 + 4 + 2 = ?", "A box holds colored balls.", "3 + 4 + 2 = 9 balls.", "There are 9 balls in the box."],
  ["q2-1", "20 – 7 = ?", "The maze has 20 doors. 7 are locked.", "20 – 7 = 13 open doors.", "13 doors can be passed."],
  ["q2-2", "2, 4, 6, 8, __?", "A number pattern is on the maze wall.", "8 + 2 = 10! Pattern +2.", "Next number: 10."],
  ["q2-3", "15 – 6 = ?", "There are 15 gold coins on the floor.", "15 – 6 = 9 coins left.", "9 coins still remain."],
  ["q2-4", "5 × 3 = ?", "A lantern appears every 5 steps.", "5 × 3 = 15. You found the third lantern!", "Lantern #3 is at step 15."],
  ["q2-5", "10 ÷ 2 = ?", "The treasure box has two equal parts.", "10 ÷ 2 = 5 in each part.", "Each part contains 5 items."],
  ["q3-1", "1, 3, 5, 7, __?", "The treasure map has a number sequence.", "7 + 2 = 9! Odd-number pattern.", "Next number: 9."],
  ["q3-2", "4 × 3 = ?", "There are 4 groups of butterflies, 3 in each group.", "4 × 3 = 12 butterflies.", "12 butterflies total in the garden."],
  ["q3-3", "7 + 8 = ?", "The chest opens when you know the total.", "7 + 8 = 15. The chest opens!", "The chest code is 15."],
  ["q3-4", "18 ÷ 3 = ?", "Treasure is shared equally among 3 people from 18 coins.", "18 ÷ 3 = 6 coins each.", "Each person gets 6 coins."],
  ["q3-5", "What is 20 – 13?", "The final door needs a two-digit code.", "20 – 13 = 7! The door opens!", "Final door code: 7."],
  ["q4-1", "Sort the numbers from smallest to largest.", "Number cards are scattered on the detective desk.", "3 → 7 → 12 → 20. Number order locked in!", "The vault lock uses the sequence 3-7-12-20."],
].forEach(([id, q, scene, correct, clue]) => put("sd-kelas-1-3", id, { q, scene, correct, clue }));

// Reuse SD1-3 stems for later chapters that are repeats
for (const id of ["q4-2","q5-2","q6-2"]) put("sd-kelas-1-3", id, { q: "8 – 3 = ?", scene: "New clue: There are 8 apples. 3 are taken.", correct: "8 – 3 = 5 apples left.", clue: "5 apples remain." });
for (const id of ["q4-3","q5-3","q6-3"]) put("sd-kelas-1-3", id, { q: "5 + 5 = ?", scene: "New clue: Flowers are lined up in the garden.", correct: "5 + 5 = 10! The secret message unlocks.", clue: "The message is at flower #10." });
for (const id of ["q4-4","q5-4","q6-4"]) put("sd-kelas-1-3", id, { q: "12 – 4 = ?", scene: "New clue: The garden fence has 12 boards. 4 are broken.", correct: "12 – 4 = 8 good boards.", clue: "8 fence boards are still good." });
for (const id of ["q4-5","q5-5","q6-5"]) put("sd-kelas-1-3", id, { q: "3 + 4 + 2 = ?", scene: "New clue: A box holds colored balls.", correct: "3 + 4 + 2 = 9 balls.", clue: "There are 9 balls in the box." });
for (const id of ["q5-1","q6-1"]) put("sd-kelas-1-3", id, { q: "2 + 3 = ?", scene: "New clue: The garden gate is locked. There is a number on the lock.", correct: "2 + 3 = 5. The door opens!", clue: "The lock number is 5." });

// ——— SD 4-6 ———
const sd46 = [
  ["q1-1", "A box holds 240 microchips. 3/8 of them are blue. How many blue chips?", "The lab door is locked tight. A keypad lights up beside it.", "ACCESS GRANTED. 3/8 × 240 = 90. You handled the fraction perfectly!", "Muddy footprints were found near Prof. Nova's desk."],
  ["q1-2", "The clock stopped at 14:35. Officers checked 47 minutes earlier. What time was that?", "A digital clock froze exactly when the chip vanished.", "14:35 − 47 = 13:48. Exact!", "The room was secure at 13:48."],
  ["q1-3", "Which value is the largest?", "Four batteries with number labels sit on the table.", "3.9 is the largest.", "The strongest battery was labeled 3.9."],
  ["q1-4", "Complete the pattern: 18, 24, 30, 36, __", "UV light reveals a code pattern on the floor.", "The pattern adds 6 each time → 42.", "Floor code: 42."],
  ["q1-5", "A number rounded to the nearest hundred becomes 4,700. Which could it be?", "The guest ID number is partly damaged.", "4,649–4,749 round to 4,700; 4,749 works.", "Guest ID likely ends near 4,749."],
  ["q2-1", "0.75 hours = how many minutes?", "Mira claims she was in the library for 0.75 hours.", "0.75 × 60 = 45 minutes. Mira's alibi checks out.", "Mira's library time matches the CCTV."],
  ["q2-2", "A drink costs Rp12,000 and a sandwich Rp19,250. Total?", "Rafi bought food at the cafe. Part of the receipt is burned.", "12,000 + 19,250 = Rp31,250.", "Receipt total: Rp31,250."],
  ["q2-3", "How many pages did Luna copy?", "Luna claims she copied 2/5 of a 150-page report.", "2/5 × 150 = 60 pages.", "60 pages were copied."],
  ["q2-4", "At the same speed, how many km in 10 minutes?", "Theo bikes 12 km in 40 minutes.", "12 km / 40 min = 0.3 km/min → 3 km in 10 min.", "Theo covers 3 km in 10 minutes."],
  ["q2-5", "25% of 80 cameras are offline. How many are off?", "A suspect makes a statement about security cameras.", "25% of 80 = 20 cameras off.", "20 cameras were inactive."],
  ["q3-1", "A storage room is 8 m × 5 m. What is its perimeter?", "A research-complex map is found under the carpet.", "2 × (8 + 5) = 26 m. A loose wall panel is found!", "A hidden panel is at the 26 m corner."],
  ["q3-2", "The room is 8 m × 5 m. What is its area?", "A room floor plan is found behind a panel.", "8 × 5 = 40 m².", "Floor area: 40 m²."],
  ["q3-3", "1.5 liters = how many milliliters?", "A sealed measuring tube holds a hidden code.", "1.5 L = 1,500 mL.", "Tube code: 1500."],
  ["q3-4", "A 2.75 kg package = how many grams?", "The vault asks for the package weight.", "2.75 kg = 2,750 g.", "Package weight: 2750 g."],
  ["q3-5", "A laser forms a right angle. How many degrees?", "A laser grid guards the room door.", "A right angle is 90°.", "Laser lock angle: 90°."],
  ["q4-1", "Order the ×2 pattern from start to finish.", "A train ticket holds a shuffled encrypted sequence.", "3 → 6 → 12 → 24 → 48. Platform confirmed!", "The suspect used Platform 48."],
  ["q4-2", "x + 17 = 45. What is x?", "A station locker asks for the value of x.", "x = 45 − 17 = 28.", "Locker code uses 28."],
  ["q4-3", "6 × n = 54. What is n?", "A phone shows a multiplication password.", "n = 54 ÷ 6 = 9.", "Password factor: 9."],
  ["q4-4", "Which is a prime number?", "Secret message: 'Only those who know primes can see the truth.'", "29 is prime.", "Prime key: 29."],
  ["q4-5", "Machine: multiply by 3, then add 2. Input = 7. Output?", "The final password uses a simple function machine.", "3 × 7 + 2 = 23.", "Machine output: 23."],
  ["q5-1", "How many minutes remain?", "The suspect entered the station at 18:12. Meeting at 18:20.", "18:20 − 18:12 = 8 minutes.", "8 minutes left."],
  ["q5-2", "Stair A has 36 steps. Stair B has 25% fewer. How many steps on B?", "Two stairs lead to the platform.", "25% of 36 = 9; 36 − 9 = 27 steps.", "Stair B has 27 steps."],
  ["q5-3", "What is the average speed?", "Schedule board: the train travels 180 km in 3 hours.", "180 ÷ 3 = 60 km/h.", "Average speed: 60 km/h."],
  ["q5-4", "Probability of randomly drawing a blue card?", "The suspect drops a bag of access cards: 5 red, 3 blue, 2 green.", "3 blue out of 10 → 3/10.", "Blue-card chance: 3/10."],
  ["q5-5", "Route A: 450 m. Route B: 0.6 km. Route C: 520 m. Which is shortest?", "A corridor splits into three mapped routes.", "0.6 km = 600 m, so A (450 m) is shortest.", "Shortest path: Route A."],
  ["q6-1", "Is 4/6 smaller than 2/3?", "The suspect claims 4/6 < 2/3. Verify.", "4/6 = 2/3, so it is NOT smaller. Answer: No.", "The claim was false."],
  ["q6-2", "How long is the footprint in the photo?", "Garden footprint is 24 cm long. Photo scale 1:3.", "24 ÷ 3 = 8 cm in the photo.", "Photo footprint: 8 cm."],
  ["q6-3", "What was the original ticket price?", "Train ticket: price after 10% discount = Rp18,000.", "18,000 is 90% → original = 20,000.", "Original price: Rp20,000."],
  ["q6-4", "What is the average?", "Chip access log recorded: 6, 8, 7, 9, 10.", "(6+8+7+9+10)/5 = 8.", "Average access value: 8."],
  ["q6-5", "Gate code = 5² + 3 × 4. What is the result?", "The culprit tries to escape through a coded gate.", "25 + 12 = 37 (order of operations).", "Gate code: 37."],
];
sd46.forEach(([id, q, scene, correct, clue]) => put("sd-kelas-4-6", id, { q, scene, correct, clue }));
put("sd-kelas-4-6", "q5-5", { choices: ["Route A", "Route B", "Route C", "All equal"] });
put("sd-kelas-4-6", "q6-1", { choices: ["Yes", "No"] });

// ——— SMP ———
const smp = [
  ["q1-1", "Solve: 3x + 5 = 20", "An encrypted signal arrives at the data center.", "3x = 15 → x = 5.", "Signal key uses x = 5."],
  ["q1-2", "Point (2, 3) reflected across the x-axis becomes?", "Signal location coordinates are computed.", "(2, 3) → (2, −3).", "Mirror point: (2, −3)."],
  ["q1-3", "What is the mode of the data?", "Signal frequency data: 4, 7, 4, 9, 4, 6.", "4 appears most often → mode 4.", "Mode frequency: 4."],
  ["q1-4", "Distance traveled by the signal?", "Signal duration: 2.5 hours. Speed 120 km/h.", "2.5 × 120 = 300 km.", "Signal path: 300 km."],
  ["q1-5", "Probability the signal is NOT blocked?", "Chance of being blocked: 3 of 12 possibilities.", "Not blocked = 9/12 = 3/4.", "Clear-signal chance: 3/4."],
  ["q2-1", "What is the average temperature?", "Lab temperature data: 18, 22, 20, 25, 15.", "(18+22+20+25+15)/5 = 20.", "Average temp: 20."],
  ["q2-2", "Next number?", "Data pattern: 1, 4, 9, 16, __?", "Perfect squares → next is 25.", "Next square: 25."],
  ["q2-3", "2x – 3 = 11. What is x?", "An equation is etched on the vault wall.", "2x = 14 → x = 7.", "Vault variable: 7."],
  ["q2-4", "Length of the hypotenuse?", "Right triangle sides: 3 cm and 4 cm.", "3-4-5 triangle → 5 cm.", "Hypotenuse: 5 cm."],
  ["q2-5", "Price after discount?", "30% off a Rp200,000 price.", "70% of 200,000 = Rp140,000.", "Discounted price: Rp140,000."],
  ["q3-1", "What is the value of y?", "Linear graph: y = 2x + 1. If x = 4.", "y = 8 + 1 = 9.", "Graph point y = 9."],
  ["q3-2", "Probability of drawing a blue ball?", "A bag holds 5 red, 3 blue, 2 yellow balls.", "3 blue of 10 → 3/10.", "Blue-ball chance: 3/10."],
  ["q3-3", "What is x?", "Rectangle: length (2x+3) cm, width 4 cm, perimeter 30 cm.", "2((2x+3)+4)=30 → x = 4.", "Length parameter x = 4."],
  ["q3-4", "What is the volume?", "Cube with side 6 cm.", "6³ = 216 cm³.", "Cube volume: 216 cm³."],
  ["q3-5", "Pattern: next number?", "Latest data: 12, 15, 18, 21, __?", "Add 3 each time → 24.", "Next value: 24."],
  ["q4-1", "Order the fractions from smallest to largest.", "Lab notes hold fractions that must be ordered before unlocking.", "1/4 < 1/3 < 1/2 < 3/4. Vault opens!", "Fraction code matches the camera log."],
  ["q4-2", "Distance from (0,0) to (6,8)?", "Compute the distance.", "√(36+64) = 10.", "Distance: 10."],
  ["q4-3", "x/4 = 3. Value of x?", "Wall equation.", "x = 12.", "Wall code: 12."],
  ["q4-4", "Median of 3,5,7,9,11?", "Median data set.", "Middle value is 7.", "Median: 7."],
  ["q4-5", "25% of 200?", "Energy percentage.", "0.25 × 200 = 50.", "Energy share: 50."],
  ["q5-1", "150 km in 2.5 hours. Average speed?", "Signal train.", "150 ÷ 2.5 = 60.", "Speed: 60."],
  ["q5-2", "Ratio 2:5 of 35 — first part?", "Ratio split.", "2/7 × 35 = 10.", "First share: 10."],
  ["q5-3", "−3 + 8 = ?", "Number offset.", "−3 + 8 = 5.", "Offset: 5."],
  ["q5-4", "Area of a square with side 9 cm?", "Square panel.", "9² = 81.", "Panel area: 81."],
  ["q5-5", "Probability of an even number?", "Security die.", "3/6 = 1/2.", "Even chance: 1/2."],
  ["q6-1", "5(x − 2) = 20. Value of x?", "Gate equation.", "x − 2 = 4 → x = 6.", "Gate value: 6."],
  ["q6-2", "GCD of 12 and 18?", "GCD code.", "GCD = 6.", "GCD key: 6."],
  ["q6-3", "LCM of 4 and 6?", "LCM lock.", "LCM = 12.", "LCM key: 12."],
  ["q6-4", "Measure of a right angle?", "Laser mirror.", "90°.", "Mirror angle: 90°."],
  ["q6-5", "Average of 6, 8, 10, 12?", "Final average.", "36 ÷ 4 = 9.", "Final mean: 9."],
];
smp.forEach(([id, q, scene, correct, clue]) => put("smp", id, { q, scene, correct, clue }));

// ——— SMA ———
const sma = [
  ["q1-1", "f(x) = 2x² – 3x + 1. What is f(2)?", "A hidden function sits on the server.", "f(2) = 8 − 6 + 1 = 3.", "Function return: 3."],
  ["q1-2", "lim (x→2) of (x²–4)/(x–2) = ?", "A function limit on data speed.", "Factor → lim (x+2) = 4.", "Limit value: 4."],
  ["q1-3", "f(x) = 3x² + 2x. Derivative?", "Derivative to find maximum speed.", "f'(x) = 6x + 2.", "Derivative: 6x + 2."],
  ["q1-4", "sin 30° + cos 60° = ?", "Antenna elevation angle.", "1/2 + 1/2 = 1.", "Angle sum: 1."],
  ["q1-5", "From 100 trials, P(success) = 0.7. Expected successes?", "Encryption success probability.", "0.7 × 100 = 70.", "Expected successes: 70."],
  ["q2-1", "Determinant of [[2,1],[3,4]] = ?", "Access-code matrix.", "2·4 − 1·3 = 5.", "Det = 5."],
  ["q2-2", "2ˣ = 32. What is x?", "An exponential equation in the system.", "2⁵ = 32 → x = 5.", "Exponent x = 5."],
  ["q2-3", "10th term of 3, 7, 11, 15, ... ?", "Arithmetic sequence in encryption data.", "a_n = 3 + (n−1)·4 → a_10 = 39.", "10th term: 39."],
  ["q2-4", "∫₀² 2x dx = ?", "Area under the curve.", "[x²] from 0 to 2 = 4.", "Integral value: 4."],
  ["q2-5", "log₃ 81 = ?", "Final question before the case breaks open.", "3⁴ = 81 → 4.", "Log value: 4."],
  ["q3-1", "1+2+3+4 = ?", "Quick series.", "Sum = 10.", "Series sum: 10."],
  ["q3-2", "2, 4, 8, 16, __", "Doubling pattern.", "Next = 32.", "Next term: 32."],
  ["q3-3", "lim x→2 (x+3) = ?", "Simple limit.", "2 + 3 = 5.", "Limit: 5."],
  ["q3-4", "a=3, b=2. 3rd term?", "Arithmetic sequence.", "3 + 2·2 = 7.", "3rd term: 7."],
  ["q3-5", "Average of 10, 20, 30?", "Mean.", "60/3 = 20.", "Mean: 20."],
  ["q4-1", "Order the steps to solve 2x + 6 = 18 from start to finish.", "The equation-solving steps must be rearranged.", "Ordered algebra steps — access granted.", "x = 6 opens the second panel."],
  ["q4-2", "Variance of data 2,2,2?", "Variance check.", "All equal → variance 0.", "Variance: 0."],
  ["q4-3", "C(5,1) = ?", "Combination.", "C(5,1) = 5.", "Combinations: 5."],
  ["q4-4", "Mode of 1,2,2,3,4?", "Mode check.", "Mode is 2.", "Mode: 2."],
  ["q4-5", "P(A)=0.3 then P(A′)?", "Complement.", "1 − 0.3 = 0.7.", "Complement: 0.7."],
  ["q5-1", "cos 60° = ?", "Trigonometry.", "cos 60° = 1/2.", "cos = 1/2."],
  ["q5-2", "tan 45° = ?", "Trigonometry.", "tan 45° = 1.", "tan = 1."],
  ["q5-3", "Circumference r=7 (π=22/7)?", "Circle.", "2πr = 44.", "Circumference: 44."],
  ["q5-4", "Area with base 6 height 4?", "Triangle.", "(6×4)/2 = 12.", "Triangle area: 12."],
  ["q5-5", "Legs 5 and 12, hypotenuse?", "Pythagoras.", "√(25+144)=13.", "Hypotenuse: 13."],
  ["q6-1", "If f′=6x, f could be?", "Antiderivative.", "∫6x dx = 3x² + C.", "Antiderivative: 3x² + C."],
  ["q6-2", "2³ × 2² = ?", "Exponents.", "2⁵ = 32 form → 2⁵.", "Product: 2⁵."],
  ["q6-3", "Slope 2 through (0,1). Equation for y?", "Line.", "y = 2x + 1.", "Line: y = 2x + 1."],
  ["q6-4", "Inverse of f(x)=x+4?", "Inverse.", "f⁻¹(x) = x − 4.", "Inverse: x − 4."],
  ["q6-5", "|−7| = ?", "Absolute value.", "|−7| = 7.", "Absolute value: 7."],
];
sma.forEach(([id, q, scene, correct, clue]) => put("sma", id, { q, scene, correct, clue }));
put("sma", "q4-1", { items: ["2x + 6 = 18", "2x = 12", "x = 6", "Check: 2(6)+6=18"] });

// ——— Dewasa ———
const dewasa = [
  ["q1-1", "20% discount on Rp150,000. Final price? (numbers only, e.g. 120000)", "A shopping receipt is found in the case file.", "150,000 × 0.8 = 120,000.", "Final price Rp120,000."],
  ["q1-2", "Simple interest 5%/year on Rp2,000,000 for 3 years?", "A savings account is open.", "2,000,000 × 5% × 3 = 300,000.", "Interest: Rp300,000."],
  ["q1-3", "Average of 10, 20, 30, 40, 50?", "Monthly report.", "150 ÷ 5 = 30.", "Average: 30."],
  ["q1-4", "LCM of 4 and 6?", "Meeting schedules clash.", "LCM = 12.", "LCM: 12."],
  ["q1-5", "3² + 4² = ?", "Quick check on the whiteboard.", "9 + 16 = 25.", "Result: 25."],
  ["q2-1", "10% tax on Rp500,000? (numbers only, e.g. 50000)", "A tax slip is on the desk.", "10% × 500,000 = 50,000.", "Tax: Rp50,000."],
  ["q2-2", "Ratio 3:5 of total 40 — how much is the 3 part?", "Project budget split.", "3/8 × 40 = 15.", "Share of 3: 15."],
  ["q2-3", "All A are B. x is A. Therefore?", "Logic note in the dossier.", "x must be B.", "Conclusion: x is B."],
  ["q2-4", "25% margin on capital Rp800,000. How much profit?", "Shop margin.", "0.25 × 800,000 = 200,000.", "Profit: Rp200,000."],
  ["q2-5", "GCD of 15 and 25?", "Factor code on the vault.", "GCD = 5.", "GCD: 5."],
  ["q3-1", "Median of 4, 8, 10, 12, 20?", "Employee spreadsheet.", "Median is 10.", "Median: 10."],
  ["q3-2", "45 out of 90 equals what percent?", "Progress report.", "45/90 = 50%.", "Progress: 50%."],
  ["q3-3", "From 09:20 to 10:05, how many minutes?", "Attendance log.", "45 minutes.", "Duration: 45 minutes."],
  ["q3-4", "3/4 already spent. How much remains?", "Department budget Rp12,000,000.", "1/4 of 12,000,000 = 3,000,000.", "Remaining: Rp3,000,000."],
  ["q3-5", "100, 90, 80, 70, __?", "Ticket number pattern.", "Subtract 10 → 60.", "Next ticket: 60."],
  ["q4-1", "Order the values from smallest to largest.", "A shuffled budget report must be ordered before the presentation.", "12% < 0.25 < 1/3 < 40%. Summary ready to send.", "Validation order matches the CEO attachment."],
  ["q4-2", "3 workers finish in 12 days. 6 workers (same rate) need?", "Workforce estimate.", "Twice the workers → half the time = 6 days.", "Need: 6 days."],
  ["q4-3", "2% inflation on Rp1,000,000?", "Inflation note.", "0.02 × 1,000,000 = 20,000.", "Inflation amount: Rp20,000."],
  ["q4-4", "If rain then wet. Not wet. Therefore?", "Deduction in the interrogation room.", "Must be not raining (modus tollens).", "Conclusion: not raining."],
  ["q4-5", "2,450 rounded to the nearest hundred?", "A file number needs rounding.", "2,450 → 2,500.", "Rounded ID: 2,500."],
  ["q5-1", "1.5 hours = how many minutes?", "Meeting duration.", "1.5 × 60 = 90.", "90 minutes."],
  ["q5-2", "2.75 kg = how many grams?", "Package goods.", "2.75 × 1000 = 2,750.", "2,750 grams."],
  ["q5-3", "What is the perimeter?", "Archive room plan 8 m × 5 m.", "2×(8+5)=26 m.", "Perimeter: 26 m."],
  ["q5-4", "Area of room 8 m × 5 m?", "Same floor area.", "40 m².", "Area: 40 m²."],
  ["q5-5", "0.75 as a fraction?", "Proportion chart.", "0.75 = 3/4.", "Fraction: 3/4."],
  ["q6-1", "Profit Rp50 on capital Rp200. ROI percent?", "Project ROI.", "50/200 = 25%.", "ROI: 25%."],
  ["q6-2", "4 × Rp250,000 = ?", "Installment total.", "1,000,000.", "Total: Rp1,000,000."],
  ["q6-3", "Which is a prime number?", "Number filter on the terminal.", "29 is prime.", "Prime: 29."],
  ["q6-4", "Value of 5² + 3 × 4?", "Final gate code.", "25 + 12 = 37.", "Gate code: 37."],
  ["q6-5", "Average of 6, 8, 7, 9, 10?", "Final audit summary.", "40/5 = 8.", "Final average: 8."],
];
dewasa.forEach(([id, q, scene, correct, clue]) => put("dewasa", id, { q, scene, correct, clue }));
put("dewasa", "q2-3", { choices: ["x must be B", "x is not B", "unknown", "x = A only"] });
put("dewasa", "q4-4", { choices: ["Must be raining", "Must not be raining", "Unknown", "Must be wet"] });
put("dewasa", "q3-3", { choices: ["35 minutes", "40 minutes", "45 minutes", "50 minutes"] });

function localizeWrong(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((w) => trBasic(w));
}

function enrichQuestion(level, q) {
  const k = `${level}|${q.id}`;
  const out = { ...q };
  out.scene_en = SCENE_EN[k] || trBasic(q.scene);
  out.q_en = Q_EN[k] || trBasic(q.q);
  out.correct_en = CORRECT_EN[k] || trBasic(q.correct);
  out.clue_en = CLUE_EN[k] || trBasic(q.clue);
  out.skill_en = SKILL[q.skill] || q.skill;
  out.difficulty_en = DIFF[q.difficulty] || q.difficulty;
  if (Array.isArray(q.choices)) out.choices_en = CHOICES_EN[k] || q.choices.map((c) => trBasic(c));
  if (Array.isArray(q.items)) out.items_en = ITEMS_EN[k] || q.items.map((c) => trBasic(c));
  if (Array.isArray(q.wrong)) out.wrong_en = WRONG_EN[k] || localizeWrong(q.wrong);
  return out;
}

function enrichBank(file) {
  const p = path.join("public/questions", file);
  const bank = JSON.parse(fs.readFileSync(p, "utf8"));
  const level = bank.level;
  const meta = META[level] || {};
  bank.label_en = meta.label_en || bank.label;
  bank.caseTitle_en = meta.caseTitle_en || bank.caseTitle;
  if (bank.ageRange) bank.ageRange_en = meta.ageRange_en || bank.ageRange;
  bank.curriculum_en = "Merdeka Curriculum";
  bank.chapters = bank.chapters.map((ch) => ({
    ...ch,
    title_en: (meta.chapters && meta.chapters[ch.id]) || trBasic(ch.title).replace(/^Bab /i, "Chapter "),
    questions: (ch.questions || []).map((q) => enrichQuestion(level, q)),
  }));
  fs.writeFileSync(p, JSON.stringify(bank, null, 2) + "\n");
  const n = bank.chapters.reduce((a, c) => a + c.questions.length, 0);
  const en = bank.chapters.reduce((a, c) => a + c.questions.filter((q) => q.q_en).length, 0);
  console.log(file, en + "/" + n);
}

for (const f of ["sd-kelas-1-3.json", "sd-kelas-4-6.json", "smp.json", "sma.json", "dewasa.json"]) {
  enrichBank(f);
}

// Diagnostic EN
const diagPath = "src/lib/diagnostic.js";
let diag = fs.readFileSync(diagPath, "utf8");
const DIAG_EN = {
  "sd-kelas-1-3": [
    { q_en: "1 + 1 = ?", choices_en: ["1","2","3","4"], correct_en: "Correct! 1 + 1 = 2." },
    { q_en: "5 – 3 = ?", choices_en: ["1","2","3","4"], correct_en: "Correct! 5 – 3 = 2." },
    { q_en: "Which is greater: 7 or 4?", choices_en: ["4","7","Equal","Don't know"], correct_en: "7 is greater than 4." },
    { q_en: "2 × 3 = ?", choices_en: ["5","6","7","8"], correct_en: "2 × 3 = 6." },
    { q_en: "10 – 4 = ?", choices_en: ["4","5","6","7"], correct_en: "10 – 4 = 6." },
  ],
  "sd-kelas-4-6": [
    { q_en: "3/4 of 40 is…", choices_en: ["15","20","30","35"], correct_en: "3/4 × 40 = 30." },
    { q_en: "0.5 × 20 = ?", choices_en: ["5","10","15","20"], correct_en: "0.5 × 20 = 10." },
    { q_en: "25% of 80 = ?", choices_en: ["15","20","25","30"], correct_en: "25% = 1/4, so 80 ÷ 4 = 20." },
    { q_en: "Perimeter of a square with side 6 cm = ?", choices_en: ["12 cm","18 cm","24 cm","36 cm"], correct_en: "Perimeter = 4 × 6 = 24 cm." },
    { q_en: "Pattern: 5, 10, 15, 20, _?", choices_en: ["22","24","25","30"], correct_en: "The pattern is +5, so 25." },
  ],
  smp: [
    { q_en: "x + 5 = 12, so x = ?", choices_en: ["5","6","7","8"], correct_en: "x = 12 – 5 = 7." },
    { q_en: "2x = 18, so x = ?", choices_en: ["6","7","8","9"], correct_en: "x = 18 ÷ 2 = 9." },
    { q_en: "Probability of an even number on a die 1–6?", choices_en: ["1/6","1/3","1/2","2/3"], correct_en: "3 even numbers (2,4,6) out of 6 → 1/2." },
    { q_en: "Area of a circle with radius 7 cm (π ≈ 22/7)?", choices_en: ["44 cm²","154 cm²","176 cm²","308 cm²"], correct_en: "π × 7² = 22/7 × 49 = 154 cm²." },
    { q_en: "Average of 4, 6, 8, 10 = ?", choices_en: ["6","7","8","9"], correct_en: "(4+6+8+10) ÷ 4 = 7." },
  ],
  sma: [
    { q_en: "Derivative of f(x) = 3x² is…", choices_en: ["3x","6x","x²","6x²"], correct_en: "f'(x) = 6x." },
    { q_en: "sin 30° = ?", choices_en: ["√2/2","√3/2","1/2","1"], correct_en: "sin 30° = 1/2." },
    { q_en: "log₂ 8 = ?", choices_en: ["2","3","4","8"], correct_en: "2³ = 8, so log₂ 8 = 3." },
    { q_en: "Roots of x² – 5x + 6 = 0?", choices_en: ["1 and 6","2 and 3","–2 and –3","–1 and 6"], correct_en: "(x–2)(x–3)=0, so x=2 and x=3." },
    { q_en: "Sum from k=1 to 4: 1+2+3+4 = ?", choices_en: ["8","9","10","12"], correct_en: "1+2+3+4 = 10." },
  ],
  dewasa: [
    { q_en: "If 20% off Rp150,000, final price?", choices_en: ["Rp100,000","Rp120,000","Rp130,000","Rp135,000"], correct_en: "150,000 × 0.8 = 120,000." },
    { q_en: "Simple interest 5%/year on Rp2,000,000 for 3 years?", choices_en: ["Rp200,000","Rp250,000","Rp300,000","Rp350,000"], correct_en: "2,000,000 × 5% × 3 = 300,000." },
    { q_en: "Average of 10, 20, 30, 40, 50 = ?", choices_en: ["25","30","35","40"], correct_en: "150 ÷ 5 = 30." },
    { q_en: "LCM of 4 and 6?", choices_en: ["8","10","12","24"], correct_en: "LCM(4,6) = 12." },
    { q_en: "3² + 4² = ?", choices_en: ["14","25","30","49"], correct_en: "9 + 16 = 25." },
  ],
};

// Patch DIAG_BANK by rebuilding from parsed structure is hard with regex.
// Instead append EN fields into each object literal carefully via eval-safe transform:
const vm = require("vm");
// Extract DIAG_BANK object with Function
const m = diag.match(/const DIAG_BANK = (\{[\s\S]*?\n\});/);
if (!m) throw new Error("DIAG_BANK not found");
const bankObj = vm.runInNewContext("(" + m[1] + ")");
for (const [level, list] of Object.entries(DIAG_EN)) {
  bankObj[level] = bankObj[level].map((q, i) => ({ ...q, ...list[i] }));
}
const newBank = "const DIAG_BANK = " + JSON.stringify(bankObj, null, 2).replace(/"([^"]+)":/g, "$1:") + ";";
// JSON.stringify quotes keys - keep as JS with quoted keys is fine
const newBank2 = "const DIAG_BANK = " + JSON.stringify(bankObj, null, 2) + ";";
diag = diag.replace(m[0], newBank2);
fs.writeFileSync(diagPath, diag);
console.log("diagnostic EN patched");
