# Algonova Quest — ROADMAP V3 (Plan Only)

> **Status:** PLAN ONLY — jangan eksekusi fitur besar sebelum part disetujui.  
> Live: https://algonova-quest.vercel.app/ · Repo: `virgiangalang/algo-quest`  
> Mirror kerja agent: `kindoradeveloper/math-lesson` (sync manual ke algo-quest).  
> Brand: **Algonova** (bukan Kindora look). Adopsi = pola UX Kindora (tipe soal, story, reward).

---

## 1. Dampak terbesar (prioritas jualan)

Urutan dampak untuk closing sekolah / ortu / demo:

| Rank | Fitur | Kenapa dampak besar | Effort |
|------|--------|---------------------|--------|
| **1** | **Storytelling visual + scene images** | Langsung terasa “game”, bukan form HTML; demo 10 detik sudah beda | Sedang |
| **2** | **Tipe soal interaktif (bukan hanya MCQ)** | Diferensiasi vs kompetitor & Kindora-parity; guru bilang “ada isinya” | Besar |
| **3** | **Laporan PDF ke ortu/guru** | Closing B2B/B2C: bukti belajar yang bisa dikirim | Sedang |
| 4 | Logo Algonova resmi di semua surface | Brand trust | Kecil |
| 5 | i18n ID/EN (sudah ada UI) + bank soal EN | Pasar internasional / sekolah bilingual | Sedang |
| 6 | Domain custom (bukan hanya vercel.app) | Terasa produk, bukan prototype | Kecil (ops + DNS) |
| 7 | PWA / install HP | Retention | Sedang |
| 8 | Leaderboard kelas | Engagement kelas | Sedang–besar |

**Rekomendasi eksekusi V3:**  
`Logo` → `Story visual` → `Tipe soal baru (bertahap)` → `Laporan PDF` → Notion docs → domain.

Laporan PDF **ikut** di V3 (kamu setuju). Tanda tangan CEO **nyusul** (placeholder dulu).

---

## 2. Link / URL — perlu beda-beda?

**Tidak wajib** pecah banyak domain untuk tiap fitur.

| URL | Fungsi |
|-----|--------|
| `https://algonova-quest.vercel.app/` | App siswa (satu SPA) |
| `…/admin.html` | Dashboard upload soal (password) |
| `…/?dev=1` | Tes lokal tanpa Sheet |
| `…/?lang=en` (opsional nanti) | Deep-link bahasa |

**Yang disarankan (bukan wajib sekarang):**
1. **Custom domain** mis. `quest.algonova.id` → pointing ke project Vercel yang sama (tetap 1 app).
2. Path tetap: `/` siswa, `/admin.html` admin — **satu deploy**.
3. Jangan buat subdomain terpisah per level/bahasa kecuali ada alasan analytics/SEO kuat.

**Kesimpulan:** 1 link produk sudah cukup. Bedakan lewat **path + role**, bukan banyak site.

---

## 3. Status sekarang (audit cepat)

### Sudah ada
- [x] Flow: Login → Level → Briefing → Diagnostic 5 → Case intro → Game ~30 → Result → Certificate  
- [x] Autosave + resume reload  
- [x] UI bilingual ID/EN (soal JSON masih ID; support `*_en`)  
- [x] SFX / TTS / mute / hint / confetti  
- [x] **Admin dashboard** `/admin.html` + login `ADMIN_PASSWORD`  
- [x] **Template:** `public/templates/soal-template.csv|json` + `prompt-ai.txt`  
- [x] **Panduan:** `docs/PANDUAN-SOAL.md`  
- [x] Logo file live: `https://algonova-quest.vercel.app/logoalgo.png` (**200**) — belum dipasang di UI brand mark  
- [ ] Notion dokumentasi produk (belum)

### Belum / lemah
- [ ] Storytelling masih teks + stempel; **belum ada gambar scene**  
- [ ] Soal hampir semua **pilihan ganda**  
- [ ] Laporan PDF ortu/guru (baru certificate print)  
- [ ] TTD CEO resmi  
- [ ] Brand mark masih huruf “A”, belum `logoalgo.png`

---

## 4. Part eksekusi V3 (step-by-step)

### Part A — Brand: pasang `logoalgo.png` (P0 kecil)
**Tujuan:** logo resmi di topbar, login, certificate, admin.

Checklist:
- [x] Pastikan `logoalgo.png` ada di root atau `public/` repo `algo-quest` (sudah di main)
- [x] Ganti `.brandMark` / cert logo / admin mark → `<img src="/logoalgo.png" alt="Algonova">`
- [x] Ukuran responsif: topbar ~32–36px, login ~56–72px, certificate ~64px
- [x] Favicon opsional dari logo
- [x] Cek tidak pecah di mobile
- [ ] E2E: logo `img` visible di login + certificate

**Done when:** huruf “A” kotak ungu diganti logo di surface utama.

---

### Part B — Storytelling visual (P0 dampak demo)
**Tujuan:** tiap bab / briefing punya gambar scene yang relevan (lab, jejak, stasiun, brankas, dll).

Sumber gambar (aman legal):
1. **Utama:** aset sendiri / desainer Algonova  
2. **Alternatif cepat (lisensi jelas):**
   - [Unsplash](https://unsplash.com) / [Pexels](https://www.pexels.com) — unduh + simpan ke `public/story/` (jangan hotlink abadi)
   - Atau generate konsisten (satu style “dossier noir + ungu Algo”) lalu commit ke repo
3. **Jangan** scrap sembarangan dari Google Images (risiko hak cipta)

Checklist:
- [ ] Folder `public/story/{bab-1..bab-6}.jpg` (+ `brief-1..3`)
- [ ] `story.js` / JSON chapter: field `image` / `imageAlt`
- [ ] Briefing panels: full-bleed / edge-to-edge image + teks overlay dossier (ikuti rule brand: hero kuat, tanpa badge mengambang berlebih)
- [ ] Chapter overlay: gambar + stempel + narasi
- [ ] Case-intro: satu key art kasus
- [ ] Lazy-load + ukuran kompres (<200KB/gambar ideal)
- [ ] Fallback gradient jika image gagal
- [ ] Copy narasi diperpanjang (2–3 kalimat beat cerita, bukan 1 baris)

**Done when:** demo tanpa baca soal sudah terasa “masuk kasus detektif”.

---

### Part C — Tipe soal interaktif (P0 produk, bertahap)
**Status:** DONE (mcq + numeric + order MVP)

Checklist C0/C1:
- [x] Update template CSV/JSON + `prompt-ai.txt` + `PANDUAN-SOAL.md`
- [x] Admin upload validasi `type_ui` (numeric/order)
- [x] Renderer `src/lib/question-render.js`
- [x] Backward compatible: tanpa `type_ui` → `mcq`
- [x] 2 numeric + 1 order per level bank
- [x] Feedback + SFX + attempts tetap jalan

### Part D — Laporan PDF ortu/guru
**Status:** DONE (placeholder TTD CEO)

Checklist:
- [x] Tombol laporan di result
- [x] Phase `#phase-report` + print CSS A4 (`body.print-report`)
- [x] ID/EN string laporan
- [x] Share + print
- [x] Data dari `localStorage` result
- [x] Placeholder TTD CEO

---

### Part E — Polish brand & TTD (nyusul)
- [ ] Slot tanda tangan: CEO Algonova + Program Director (gambar signature nanti)  
- [ ] Copy legal kecil di footer laporan  
- [ ] Warna/spacing selaras logo  

---

### Part F — Notion (dokumentasi, setelah kode stabil)
Halaman Notion yang berguna:
1. **Product one-pager** — apa itu Algonova Quest, link live, flow  
2. **Guru: cara buat soal** — mirror `PANDUAN-SOAL.md` + template links  
3. **Admin ops** — password env, upload CSV, VALID/USED Sheet  
4. **Roadmap V3** — checklist part A–E  
5. **Brand kit** — logo, warna `#4b2b68`, do/don’t  

Checklist:
- [ ] Buat parent page “Algonova Quest”  
- [ ] Subpage di atas  
- [ ] Link ke live + GitHub + templates  
- [ ] Update saat Part A–D selesai  

*(Eksekusi Notion setelah kamu OK — butuh konfirmasi lokasi teamspace.)*

---

## 5. Error / risiko yang dicek tiap part

| Risiko | Mitigasi |
|--------|----------|
| Hotlink gambar mati / ilegal | Commit ke `public/story/`, lisensi dicatat di README |
| Drag-and-drop jelek di HP | Utamakan tap-to-order dulu sebelum drag bebas |
| JSON lama rusak | Default `type_ui=mcq`; migrasi bertahap |
| Print PDF beda browser | Tes Chrome + Safari; ukuran A4 tetap |
| Logo pecah / terlalu besar | CSS max-height + object-fit |
| Sync `math-lesson` ≠ `algo-quest` | Setelah tiap part: merge ke `algo-quest` main + cek URL live |
| Admin 308/redirect | Pakai clean URL `/admin` atau `/admin.html` konsisten |
| Autosave membengkak | Jangan simpan base64 image di localStorage |

**Checklist verifikasi live tiap rilis:**
```text
[ ] / → 200, logo terlihat
[ ] /admin.html → login OK (ADMIN_PASSWORD)
[ ] templates CSV 200
[ ] ?dev=1 full flow tanpa hilang saat reload
[ ] 1 soal numeric / order jalan
[ ] Print certificate + laporan PDF layout OK
```

---

## 6. Urutan kerja yang disarankan

1. **Part A** Logo  
2. **Part B** Story images + narasi  
3. **Part C0–C1** Skema + numeric + order/match  
4. **Part D** Laporan PDF (+ placeholder TTD)  
5. **Part E** TTD CEO aset nyata  
6. **Part F** Notion  

Setiap part: implementasi → E2E/smoke → commit → **sync `algo-quest` main** → cek Vercel.

---

## 7. Keputusan yang perlu konfirmasi

1. **Gambar story:** Unsplash/Pexels (cepat) atau tunggu aset desain Algonova?  
   → Usulan: **Pexels/Unsplash dulu**, style-grade dengan overlay dossier ungu.  
2. **Tipe interaktif pertama:** `numeric` + `order`, atau `numeric` + `match`?  
   → Usulan: **numeric + order**.  
3. **Laporan PDF:** hanya print browser, atau generate file server-side?  
   → Usulan V3: **print CSS** (sama seperti certificate).  
4. **Notion:** buat sekarang (kosong + link plan) atau setelah Part A–D?  
   → Usulan: **skeleton Notion sekarang**, isi penuh setelah D.  
5. **Custom domain** sekarang atau nanti?  
   → Usulan: **nanti**, setelah visual story + PDF.

---

## 8. Cara minta eksekusi

Balas misalnya:
- `OK V3 A` — logo saja  
- `OK V3 A–B` — logo + story images  
- `OK V3 A–D` — sampai laporan PDF  
- + jawaban §7 jika beda dari usulan  

---

*Dokumen ini belum mengubah runtime. Admin + template sudah ada di repo/live; Notion belum.*
