# Algonova Math — Masterplan

> Dokumen ini adalah source of truth untuk project. Baca sebelum coding.
> Tidak ada Supabase. Tidak ada backend server. Tidak ada analytics.

---

## 1. Gambaran Produk

**Algonova Math** adalah platform asesmen matematika berbasis cerita detektif untuk murid Algonova.
Murid mengerjakan soal sesuai levelnya → menerima **diagnostic report** → mencetak **certificate**.

Target market: murid Algonova yang sudah selesai course (prolongation / uji mandiri).

---

## 2. User Flow

```
[Google Sheet] → App Script "builder" → JSON soal per level
                                              ↓
[Murid buka website]
       ↓
[Login form]  ← username Algo + nama siswa + umur (opsional)
       ↓
[Credential dikirim ke Apps Script] → dicek USED/VALID di Sheet
       ↓  (VALID + belum USED)
[Mulai Sesi]  → Diagnostic soal 5 pertanyaan → tentukan level aktif
       ↓
[Soal utama] per level + per chapter (JSON/CSV dari repo)
       ↓
[Selesai] → Skill profil + karakter detektif → Diagnostic Report
       ↓
[Cetak / Download Certificate]   (auto muncul setelah selesai)
       ↓
[Sheet di-mark USED = TRUE] → login kedua langsung ke download certificate
```

---

## 3. Stack Teknis

| Layer | Pilihan | Alasan |
|---|---|---|
| Hosting | GitHub Pages (static) | gratis, tanpa backend |
| Data soal | JSON per level (`public/questions/`) | mudah diedit, bisa di-upload |
| Auth | Google Apps Script Web App | cek Sheet, mark USED |
| State | `localStorage` | tidak perlu DB |
| Certificate | `window.print()` + CSS @media print | tanpa library, offline-safe |
| Diagnostic | Pure JS scoring di client | cepat, tanpa API |

---

## 4. Struktur Folder

```
math-lesson/
├── index.html                  ← entry point (1 halaman, semua phase)
├── README.md
├── MASTERPLAN.md               ← dokumen ini
├── public/
│   ├── questions/
│   │   ├── sd-kelas-1-3.json   ← soal level SD 1-3
│   │   ├── sd-kelas-4-6.json   ← soal level SD 4-6
│   │   ├── smp.json            ← soal level SMP
│   │   ├── sma.json            ← soal level SMA
│   │   └── dewasa.json         ← soal level Dewasa
│   └── assets/
│       └── icons/              ← favicon, logo
├── src/
│   ├── lib/
│   │   ├── questions.js        ← fetch + parse JSON soal
│   │   ├── diagnostic.js       ← scoring logic + penentuan level + karakter
│   │   └── certificate.js      ← generate + print certificate
│   └── components/             ← (opsional) JS component kecil
└── google-apps-script/
    ├── Code.gs                 ← Web App: validasi credential + mark USED
    ├── builder.gs              ← Script untuk generate JSON soal dari Sheet
    └── SETUP.md                ← panduan deploy Apps Script
```

---

## 5. Format JSON Soal

```json
{
  "level": "sd-kelas-4-6",
  "label": "SD Kelas 4–6",
  "ageRange": "10–12 tahun",
  "curriculum": "Kurikulum Merdeka",
  "chapters": [
    {
      "id": "bab-1",
      "title": "Bab 1 — Insiden di Lab",
      "scene": "Narasi pembuka bab...",
      "questions": [
        {
          "id": "q1",
          "scene": "Konteks soal singkat.",
          "q": "Pertanyaan soal?",
          "choices": ["A", "B", "C", "D"],
          "answer": 1,
          "skill": "Pecahan",
          "difficulty": "Mudah",
          "correct": "Feedback jika benar.",
          "wrong": ["Feedback A", "Feedback B", "Feedback C", "Feedback D"],
          "clue": "Petunjuk kasus yang ditemukan.",
          "type": "analyst"
        }
      ]
    }
  ]
}
```

### Tipe detektif (untuk diagnostic character)
| Type | Karakter |
|---|---|
| `analyst` | Sang Analis |
| `speedster` | Si Pemikir Cepat |
| `investigator` | Sang Investigator |
| `codebreaker` | Sang Pemecah Kode |
| `explorer` | Sang Penjelajah |

---

## 6. Level & Kurikulum

| Level | Usia | Topik Utama (Kurikulum Merdeka) |
|---|---|---|
| SD Kelas 1–3 | 6–9 th | Bilangan 1–100, penjumlahan, pengurangan, pengenalan bentuk |
| SD Kelas 4–6 | 10–12 th | Pecahan, desimal, persentase, perimeter & luas, data sederhana |
| SMP | 13–15 th | Aljabar, geometri koordinat, statistik, peluang |
| SMA | 16–18 th | Fungsi, trigonometri dasar, limit, statistik |
| Dewasa | 18+ th | Logika, aplikasi numerik, aritmatika finansial |

---

## 7. Diagnostic System

### Fase 1 — Soal Penempatan (5 soal)
- Diambil dari bank soal campuran semua level
- Berdasarkan umur → suggest level awal
- Skor 0–2 benar → turun 1 level; 3–4 benar → tetap; 5 benar → naik 1 level

### Fase 2 — Skill Profil (dari soal utama)
- Setiap soal punya `skill` (misal: Pecahan, Aljabar, Geometri)
- Dihitung `{correct}/{total}` per skill
- Ditampilkan di hasil sebagai bar chart

### Fase 3 — Karakter Detektif
- Berdasarkan `type` soal yang paling banyak dijawab benar
- 5 karakter (analyst, speedster, investigator, codebreaker, explorer)

---

## 8. Google Sheet — Struktur Kolom

Sheet utama: **`Credentials`**

| Kolom | Isi |
|---|---|
| `A` — Username | `ALGO-001` dst (ID Algonova) |
| `B` — Nama Siswa | Nama lengkap |
| `C` — Umur | Angka (opsional) |
| `D` — Level | `sd-kelas-4-6` dst (opsional, override diagnostic) |
| `E` — VALID | `TRUE` / `FALSE` |
| `F` — USED | `TRUE` / `FALSE` |
| `G` — Used At | Timestamp (diisi otomatis Apps Script) |
| `H` — Score | Skor akhir (diisi otomatis) |
| `I` — Character | Karakter detektif (diisi otomatis) |
| `J` — Accuracy | Persentase akurasi (diisi otomatis) |

---

## 9. Apps Script Endpoints

### `Code.gs` — Web App (deploy as: anyone, no auth)

**POST `/validate`**
```json
Request:  { "username": "ALGO-001", "name": "Budi", "age": 11 }
Response: {
  "valid": true,
  "used": false,
  "studentName": "Budi Santoso",
  "level": "sd-kelas-4-6",
  "age": 11,
  "message": "OK"
}
```

**POST `/submit`** (dipanggil saat murid selesai)
```json
Request:  { "username": "ALGO-001", "score": 2750, "character": "analyst", "accuracy": 85, "skills": {...} }
Response: { "success": true }
```

### `builder.gs` — Script (run manual di Sheet)
- Baca tab `Questions_SD46` → generate `sd-kelas-4-6.json`
- Format kolom Sheet: `chapter | scene | q | A | B | C | D | answer | skill | difficulty | correct | wrong_A | wrong_B | wrong_C | wrong_D | clue | type`

---

## 10. Certificate

- Full-page HTML + CSS `@media print`
- Isi: nama siswa, tanggal, level, karakter detektif, akurasi, tanda tangan digital (text-based)
- Muncul otomatis setelah game selesai
- Tombol **Cetak / Simpan PDF** (`window.print()`)
- Jika sudah USED → halaman login redirect langsung ke certificate dengan data dari localStorage

---

## 11. Credential Check Flow (Detail)

```
Murid isi form login (username, nama, umur)
  ↓
fetch POST ke Apps Script Web App URL
  ↓
Apps Script:
  1. Cari baris username di Sheet "Credentials"
  2. Jika tidak ada → { valid: false, message: "Username tidak ditemukan" }
  3. Jika VALID=FALSE → { valid: false, message: "Akun tidak aktif" }
  4. Jika USED=TRUE → { valid: true, used: true } → website load certificate dari localStorage
  5. Jika VALID=TRUE + USED=FALSE → { valid: true, used: false } → mulai sesi

Saat submit hasil:
  Apps Script update baris: USED=TRUE, Used At=timestamp, Score, Character, Accuracy
```

---

## 12. Desain Visual

- Warna utama: **Ungu Algo** (`#4b2b68` / `#68418a`)
- Background: kertas linen krem (`#ebe6de`, `#dcd5cb`)
- Card/panel: putih dengan border tipis
- Font: Inter (body) + Georgia (heading/serif aksen)
- Sidebar gelap: `#23202a`
- Aesthetic: **detektif / misteri matematika** — dossier, stempel CONFIDENTIAL, case file
- Referensi visual: `docs/reference/algonova-preview.html`

---

## 13. Definition of Done

- [x] Login form → validasi Apps Script → OK / error jelas
- [x] Diagnostic 5 soal → level ditentukan → soal utama di-load dari JSON
- [x] Selesai soal → skill bar + karakter → certificate muncul
- [x] Certificate bisa dicetak / save PDF
- [x] Login kedua (USED) → langsung ke certificate download
- [x] Apps Script: validate + submit + builder semua jalan
- [x] JSON soal: semua level ≥ 30 soal / 6 bab (termasuk SD 4–6)
- [x] README deploy instructions lengkap
- [x] Hosting di GitHub Pages bisa akses tanpa error (static root)

---

## 14. Yang TIDAK ada di v1 (sengaja)

- Tidak ada halaman analytics / dashboard
- Tidak ada Supabase / database backend
- Tidak ada akun admin di website
- Tidak ada leaderboard publik
- Tidak ada sistem retake (USED = selamanya, kecuali di-reset manual di Sheet)
