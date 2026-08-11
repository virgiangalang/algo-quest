# Algonova Math — Misteri Matematika

> Platform asesmen matematika berbasis cerita detektif untuk murid Algonova.  
> Murid mengerjakan soal → menerima **diagnostic report** → mencetak **certificate resmi**.

---

## Demo cepat (tanpa server)

```bash
# Clone
git clone https://github.com/kindoradeveloper/math-lesson.git
cd math-lesson

# Jalankan server lokal
python3 -m http.server 8080
# buka http://localhost:8080
```

`devMode: true` sudah aktif — login dengan nama dan username apapun, tanpa perlu Google Sheet.

---

## Struktur

```
math-lesson/
├── index.html                   ← Semua fase ada di sini (login, diagnostic, game, result, certificate)
├── src/lib/
│   ├── questions.js             ← Fetch + parse JSON soal
│   ├── diagnostic.js            ← Scoring + penentuan level + karakter detektif
│   └── certificate.js          ← Helper certificate
├── public/questions/
│   ├── sd-kelas-1-3.json       ← Soal SD 1–3 (15 soal, 3 bab)
│   ├── sd-kelas-4-6.json       ← Soal SD 4–6 (30 soal, 6 bab) ← lengkap
│   ├── smp.json                ← Soal SMP (15 soal, 3 bab)
│   ├── sma.json                ← Soal SMA (10 soal, 2 bab)
│   └── dewasa.json             ← Soal Dewasa (10 soal, 2 bab)
├── google-apps-script/
│   ├── Code.gs                 ← Web App: validate + submit
│   ├── builder.gs              ← Generate JSON dari Google Sheet
│   └── SETUP.md                ← Panduan deploy Apps Script
└── MASTERPLAN.md               ← Arsitektur lengkap
```

---

## Level & Kurikulum

| Level | Usia | Topik |
|---|---|---|
| SD Kelas 1–3 | 6–9 th | Operasi dasar, pola bilangan, geometri awal |
| SD Kelas 4–6 | 10–12 th | Pecahan, desimal, persentase, perimeter & luas |
| SMP | 13–15 th | Aljabar, statistik, peluang, geometri koordinat |
| SMA | 16–18 th | Fungsi, kalkulus dasar, trigonometri, matriks |
| Dewasa | 18+ th | Keuangan, logika, statistik aplikatif |

---

## User Flow

```
Login (username Algonova)
  → Diagnostic 5 soal → Level ditentukan
  → Soal utama per bab (JSON lokal)
  → Hasil + Skill profil + Karakter detektif
  → Certificate (cetak / PDF)
```

Login kedua (username USED) → langsung ke certificate download.

---

## Google Sheet + Apps Script

Lihat **[google-apps-script/SETUP.md](google-apps-script/SETUP.md)** untuk:
- Format tab `Credentials` (VALID/USED)
- Deploy Web App
- Pakai builder untuk generate JSON soal dari Sheet

---

## Deploy ke GitHub Pages

1. Push ke GitHub
2. Settings → Pages → Source: **main / root**
3. Akses di: `https://kindoradeveloper.github.io/math-lesson/`

---

## Tambah Soal

**Cara 1 — Edit JSON langsung:**
Edit file di `public/questions/[level].json`. Format soal ada di `MASTERPLAN.md §5`.

**Cara 2 — Dari Google Sheet:**
Isi tab `Questions_SD46` → jalankan `buildQuestionsSD46()` di Apps Script → copy JSON ke repo.

---

## Karakter Detektif

| Karakter | Emoji | Muncul jika |
|---|---|---|
| Sang Analis | A | Banyak benar soal tipe `analyst` |
| Si Pemikir Cepat | S | Banyak benar tipe `speedster` |
| Sang Investigator | I | Banyak benar tipe `investigator` |
| Sang Pemecah Kode | C | Banyak benar tipe `codebreaker` |
| Sang Penjelajah | E | Banyak mencoba (tipe `explorer`) |

---

## Teknologi

- **Static HTML** — tidak butuh server, tidak butuh database
- **Google Apps Script** — validasi username & simpan hasil ke Sheet
- **localStorage** — state sesi & data certificate
- **window.print()** — cetak certificate (CSS `@media print`)
- **JSON** — soal per level, mudah diedit & di-upload

---

*Algonova by Algorithmics · Kurikulum Merdeka*
