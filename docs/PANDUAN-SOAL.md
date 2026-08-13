# Panduan Membuat Soal Algonova Quest

Panduan ini untuk **guru / admin yang tidak harus jago coding**.  
Tujuan: buat soal → upload → siswa main kasus detektif.

Halaman admin: **`/admin.html`** (password di Vercel env `ADMIN_PASSWORD`).

---

## Ringkas 5 langkah

1. Buka `/admin` → pilih **kategori usia** → pilih **folder misi** (atau buat baru)
2. Klik **Unduh template CSV** (atau pakai [`soal-folder-template.csv`](../public/templates/soal-folder-template.csv))
3. (Opsional) **Salin prompt AI**, tempel ke ChatGPT/Gemini, paste hasil ke Excel
4. Simpan sebagai **CSV UTF-8** (bukan .xlsx)
5. Upload → **Preview & validasi** (error akan menyebut baris Excel) → **Publish**

---

## Level yang tersedia

| Kode level (pilih di admin) | Untuk siapa |
|-----------------------------|-------------|
| `sd-kelas-1-3` | SD kelas 1–3 |
| `sd-kelas-4-6` | SD kelas 4–6 |
| `smp` | SMP |
| `sma` | SMA |
| `dewasa` | Dewasa / umum |

Satu file = **satu level**.

---

## Cara A — Isi sendiri di Excel / Google Sheets

1. Buka file template CSV di Excel / Google Sheets.
2. Tiap **baris** = 1 soal.
3. Isi kolom sesuai tabel di bawah.
4. Simpan / Download as **CSV (UTF-8)**.
5. Upload di admin.

### Arti kolom

| Kolom | Wajib? | Contoh | Keterangan |
|-------|--------|--------|------------|
| `bab_id` | ya | `bab-1` | ID bab |
| `bab_title` | ya | `Bab 1 — Insiden di Lab` | Judul bab di game |
| `id` | ya | `q1-1` | ID unik soal |
| `scene` | ya | `Pintu lab terkunci…` | Cerita singkat sebelum soal |
| `q` | ya | `3/8 dari 240 = ?` | Pertanyaan |
| `type_ui` | tidak | `mcq` / `numeric` / `order` | Default `mcq` jika kosong |
| `choice_a` … `choice_d` | ya (mcq) | `80` | Empat pilihan (mcq) |
| `answer` | ya (mcq) | `B` atau `1` | Jawaban benar (huruf A–D atau angka 0–3) |
| `answer_value` | ya (numeric) | `90` | Angka benar untuk `numeric` |
| `answer_tolerance` | tidak | `0` | Toleransi absolut (numeric) |
| `items` | ya (order) | `3\|6\|12\|24` | Item urutan benar, dipisah `\|` |
| `answer_order` | tidak | `0\|1\|2\|3` | Index urutan; kosong = sudah benar |
| `skill` | ya | `Pecahan` | Topik skill bar |
| `difficulty` | ya | `Mudah` | Mudah / Sedang / Sulit |
| `type` | ya | `analyst` | `analyst`, `speedster`, `investigator`, `codebreaker`, `explorer` |
| `correct` | ya | `Benar! …` | Feedback jika benar |
| `wrong` | ya (mcq) | `salah A\|salah B\|…` | 4 feedback dipisah `\|` |
| `clue` | ya | `Jejak kaki…` | Petunjuk cerita |

### Tipe soal interaktif (`type_ui`)

| type_ui | Siswa melakukan | Field wajib |
|---------|-----------------|-------------|
| `mcq` | Pilih A–D | `choices` + `answer` |
| `numeric` | Ketik angka | `answer_value` |
| `order` | Urutkan item ↑↓ | `items` (+ opsional `answer_order`) |

Bank bawaan tiap level sudah berisi contoh **2 numeric + 1 order**.

**Tips bilingual:** tambah field `*_en` (`q_en`, `scene_en`, `choices_en`, `correct_en`, `clue_en`, `skill_en`, `difficulty_en`, `items_en`). UI tombol **EN** akan memakai field itu.

---

## Cara B — Minta AI buatkan ( Copilot / ChatGPT / Gemini )

1. Buka [`public/templates/prompt-ai.txt`](../public/templates/prompt-ai.txt)
2. Salin semua teksnya
3. Ganti `{{LEVEL}}` misalnya menjadi `smp`
4. Tempel ke AI, kirim
5. Copy hasil CSV → paste ke Google Sheets → File → Download → CSV
6. Upload di `/admin.html`

Kalau AI menambah penjelasan di luar tabel, **hapus** teks di luar header+baris data.

---

## Cara C — Edit JSON langsung

Pakai template: [`public/templates/soal-template.json`](../public/templates/soal-template.json)

- `answer` di JSON = **angka index** (0 = A, 1 = B, 2 = C, 3 = D) untuk `mcq`
- `type_ui`: `mcq` | `numeric` | `order`
- `numeric`: pakai `answer_value` (angka)
- `order`: pakai `items` + `answer_order`
- `wrong` = array 4 string (mcq)
- Upload file `.json` di admin

---

## Login admin & password

1. Di Vercel → Project **algonova-quest** → **Settings** → **Environment Variables**
2. Tambah:
   - Name: `ADMIN_PASSWORD`
   - Value: *(password yang kamu tentukan, contoh: yang sudah dikirim ke tim)*
   - Environment: Production + Preview
3. Redeploy sekali
4. Buka `https://…/admin.html` → masukkan password

Sesi login berlaku ±12 jam.

---

## Publish: apa yang terjadi?

Setelah upload & lolos validasi:

| Kalau di Vercel ada… | Hasil |
|----------------------|--------|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Soal **langsung live** (folder baru muncul di beranda siswa) |
| `BLOB_READ_WRITE_TOKEN` / GitHub token | Cadangan lama (opsional) |
| Belum ada kunci Supabase | Publish menolak otomatis — pasang env lalu Redeploy |

Kunci `service_role` **hanya** di Vercel (server). Jangan taruh di `index.html` / browser.

File statis default tetap ada di `public/questions/*.json` sebagai cadangan.

---

## Cek apakah soal sudah terpakai

1. Buka game, login siswa (devMode / kredensial VALID)
2. Selesai diagnostic 5 soal
3. Harus masuk **Case Intro**, lalu game dengan **banyak soal** (bukan cuma ~6 soal contoh)
4. Di browser DevTools → Network: cari `api/questions?level=` atau `public/questions/…` → status 200

---

## Masalah umum

| Gejala | Solusi |
|--------|--------|
| Password ditolak | Cek `ADMIN_PASSWORD` di Vercel + redeploy |
| Upload “schema invalid” | Cek `type_ui`, `answer`/`answer_value`/`items`, kolom `q` |
| Setelah diagnostic “bank soal gagal” | File JSON level itu belum ada / path salah / belum publish |
| Masih terasa “contoh HTML” | Berarti fallback lama; pastikan Part 0 + bank ≥ 20 soal ter-load |
| CSV aneh di Excel Indonesia | Simpan ulang UTF-8; jangan pakai pemisah `;` kecuali kamu ubah parser |

---

## Kontak alur kerja yang disarankan

1. Guru buat / generate CSV  
2. Guru upload di admin (atau kirim CSV ke admin teknis)  
3. Admin publish  
4. Tes 1 akun siswa sebelum dibagikan ke kelas  

Selamat menulis kasus! 🕵️ (tanpa emoji di soal siswa bila tidak perlu)
