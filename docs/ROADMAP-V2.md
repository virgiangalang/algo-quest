# Algonova Quest — ROADMAP V2

> **Status:** Part 0 **DONE** (flow + case-intro + admin upload). Part 1–6 menunggu.  
> Brand tetap **Algonova** (ungu dossier/misteri).  
> Yang diadopsi dari Kindora Trial = **fitur & pola UX**, bukan warna/brand Kindora.  
> Dokumen ini = source of truth. Eksekusi **per part**.

**Repo kerja saat ini:** `kindoradeveloper/math-lesson` (branch `cursor/algonova-math-polish-1a7d`).  
**Live product:** `virgiangalang/algo-quest` → https://algonova-quest.vercel.app/ (push agent terbatas — sync manual / grant access).

---

## 0. Masalah yang sudah teridentifikasi

| # | Gejala | Root cause / hipotesis (dari audit kode) |
|---|--------|------------------------------------------|
| A | UI masih “HTML polos / mirip preview statis” | App sengaja di-skin ke `docs/reference/algonova-preview.html`. Belum ada motion system, scene transitions, SFX, story panels — jadi terasa sama dengan contoh HTML. |
| B | Setelah **5 soal** (diagnostic) “balik ke HTML contoh” | `finishDiagnostic()` → `loadQuestions(level)`. Jika fetch JSON gagal (path/`Output Directory`/CORS relatif), jatuh ke `FALLBACK_QUESTIONS` di `src/lib/questions.js` — isi hampir sama dengan soal di preview HTML (~6 soal Bab 1). User merasa “kembali ke contoh HTML”, bukan kasus penuh 6 bab × 30 soal. Juga: **tidak ada case-intro**; loncat langsung game tanpa cerita. |
| C | Certificate kurang | Layout cetak tipis; sedikit data; tanpa karakter/cerita visual kuat. |
| D | Tidak bisa pilih level | Level hanya dari umur + `adjustLevel()` otomatis. |
| E | Storytelling animation belum ada | Tidak ada cutscene/panel cerita antar bab; phase hanya `login → diagnostic → game → result → certificate`. |
| F | Soal belum “bunyi” | Tidak ada SFX benar/salah, TTS, audio clue. |
| G | Fitur Kindora belum diadopsi | Confetti, rewards/stiker, audio_mode, attempt/hint, story panels, block completion — belum ada di kode. |

**Catatan auth:** `devMode: false` + Apps Script sudah live. Jangan diubah di V2 kecuali bug CORS POST.

### Bug B — detail teknis (Part 0)

```
startDiagnostic()  →  5 soal
finishDiagnostic()
  → adjustLevel(...)
  → await loadQuestions(STATE.level)   // path: public/questions/<level>.json
  → jika gagal: FALLBACK_QUESTIONS     // ← konten mirip preview HTML
  → setupChapters + showPhase("game")
```

Checklist investigasi production:

1. Buka DevTools Network di https://algonova-quest.vercel.app/ setelah diagnostic — apakah `public/questions/*.json` = 200?
2. Jika Output Directory Vercel = `.` dan file ada di `public/questions/`, path relatif dari root harus OK; jika Output = `public`, path `public/questions/...` **404** → fallback.
3. Setelah fix path: pastikan `STATE.questions.length` ≈ 30, bukan 6.

---

## 1. Prinsip produk V2

1. **Algo first** — ungu `#4b2b68`, dossier, detektif, bukan cosmic Kindora.
2. **Flow penuh cerita** — setiap phase punya intro/outro animasi singkat.
3. **Suara mendukung fokus** — SFX ringan + opsi TTS; bisa di-mute.
4. **Level explicit** — murid/guru boleh pilih level; diagnostic menyesuaikan suggestion.
5. **Satu page tetap** — `index.html` + modul JS (boleh pecah file, tanpa React wajib di V2).
6. **Soal tetap JSON lokal** — tanpa Supabase.
7. **Preview HTML = referensi visual saja** — bukan runtime / bukan bank soal production.

---

## 2. Flow target (baru)

```
LOGIN (Sheet VALID/USED)
  ├─ USED=true → CERTIFICATE (enhanced)
  └─ VALID
        → LEVEL SELECT (manual + saran dari umur)
        → BRIEFING (story cutscene kasus, 2–3 panel)
        → DIAGNOSTIC (5 soal) + SFX
        → CASE INTRO (hasil kalibrasi + karakter preview)
        → GAME (6 bab × cerita + soal + SFX + rewards)
              ├─ tiap bab: story panel → soal → bab clear animation
              └─ selesai kasus
        → RESULT (skill bars + karakter + confetti Algo)
        → CERTIFICATE (print/PDF premium)
        → submit USED=true
```

---

## 3. Fitur Kindora → padanan Algo

| Kindora Trial | Padanan Algonova Quest | Part |
|---------------|------------------------|------|
| Track select (star/moon/…) | **Level select** (SD1–3 … Dewasa) | 1 |
| Story panels per block | **Story panels per bab** (dossier pages) | 2 |
| `audio_mode` / TTS / `audio_url` | **SFX + TTS prompt** (Web Speech API; MP3 opsional) | 3 |
| Confetti on correct | **Confetti/stamp “BUKTI TERKONFIRMASI”** | 4 |
| Block rewards / stickers | **Badge bab** (Petunjuk terkumpul / stempel bab) | 4 |
| Attempts + hint | **2–3 percobaan + hint** pada soal sulit | 4 |
| Loading “adventure…” | **Loading case file** animasi | 2 |
| Done screen + certificate feel | **Result cinematic + certificate redesign** | 5 |
| Phase gate → play → done | **Phase state machine** eksplisit di `STATE.phase` | 0–2 |

**Tidak diadopsi:** brand Kindora, warna cosmic ungu-pink, PPT embed, speaking/mic capture (kecuali diminta belakangan).

---

## 4. Part eksekusi (urut wajib)

### Part 0 — Stabilisasi flow (P0, bug)
**Tujuan:** setelah 5 soal diagnostic, masuk kasus penuh — tidak “balik ke contoh HTML”.

Checklist:
- [x] Audit path JSON di production Vercel (`public/questions/` vs Output Directory)
- [x] Buat `questionPathCandidates()` + `/api/questions` path-safe
- [x] Error UI jelas di case-intro jika JSON gagal (bukan silent fallback ke preview-like bank)
- [x] FALLBACK hanya localhost + banner DEV FALLBACK
- [x] Phase list eksplisit; login tidak dipakai sebagai error sink
- [x] Phase `case-intro` antara diagnostic → game
- [x] `validateQuestionBank` min 20 soal sebelum enable Mulai
- [x] Log `console.info('[algo]', …)`
- [x] **Bonus:** Admin `/admin.html` + upload CSV/JSON + panduan `docs/PANDUAN-SOAL.md`

**Done when:** login → diagnostic 5 → case intro → game soal 1 bab 1 dari JSON penuh (~30 soal), tanpa konten mirip preview.

---

### Part 1 — Level Select
**Tujuan:** user memilih level sebelum bermain.

Checklist:
- [x] Phase baru `level-select` setelah login (jika belum USED)
- [x] Kartu level: SD 1–3, SD 4–6, SMP, SMA, Dewasa (copy Algo)
- [x] Badge “Disarankan” dari umur
- [x] Diagnostic memakai level terpilih (bukan hanya umur)
- [x] `adjustLevel` tetap boleh naik/turun 1 tingkat setelah diagnostic
- [x] Sheet kolom `Level` diisi saat submit (sudah di `appsScriptPost` submit)

**Done when:** bisa pilih SMP meski umur 11; diagnostic & bank soal mengikuti.

---

### Part 2 — Storytelling & motion system
**Tujuan:** dari awal sampai akhir terasa kasus detektif, bukan form HTML.

Checklist:
- [x] Design tokens motion: fade/slide/stamp (CSS), min 3 animasi inti
- [x] `BRIEFING` cutscene (3 panel) sebelum diagnostic
- [x] Antar bab: story panel (title + narasi + stempel)
- [x] Modul `src/lib/story.js` — copy per level (boleh shared skeleton dulu)
- [x] Transisi phase dengan `phase-enter` + sound optional
- [x] Sidebar progress bab lebih “case file” (stempel done)
- [x] Hierarchy tipografi + atmosphere (grain/ink) — beda dari preview statis

**Done when:** tidak ada loncatan kasar phase; tiap bab punya pembuka cerita.

---

### Part 3 — Audio / “soal bunyi”
**Tujuan:** feedback suara seperti trial class (versi Algo).

Checklist:
- [ ] Modul `src/lib/audio.js` (mute toggle, volume, unlock on first tap)
- [ ] SFX: correct, wrong, click, bab-clear, level-up, certificate
- [ ] Generate SFX via Web Audio API (tanpa aset besar) **atau** file pendek di `public/sfx/`
- [ ] TTS opsional: bacakan `q.scene` / `q.q` (tombol 🔊), `speechSynthesis`
- [ ] Field JSON opsional nanti: `audio_url`, `tts: true` (kompatibel mundur)
- [ ] Toggle mute di topbar (persist `localStorage`)

**Done when:** jawab benar/salah terdengar; mute bekerja; tidak memblokir UX tanpa gesture user.

---

### Part 4 — Game UX ala trial (rewards, hint, confetti)
**Tujuan:** engagement setara Kindora trial, skin Algo.

Checklist:
- [ ] Confetti/stamp pada jawaban benar
- [ ] Percobaan terbatas + tombol hint setelah N salah
- [ ] Reward stempel per bab selesai
- [ ] Toast “Petunjuk terkunci / terbuka”
- [ ] XP/akurasi animasi naik
- [ ] Modul `src/lib/ui.js` (confetti, toast, stamp)

**Done when:** menyelesaikan 1 bab terasa “menang” secara visual+audio.

---

### Part 5 — Certificate & Result premium
**Tujuan:** certificate layak dikirim ke ortu/guru.

Checklist:
- [ ] Result: cinematic reveal karakter + skill bars + ringkasan bab
- [ ] Certificate: border dossier, ID kode, level, akurasi, karakter, tanggal, tanda tangan Algo
- [ ] Print CSS A4 yang rapi
- [ ] Tombol share/download (print PDF cukup di V2)
- [ ] USED login → certificate yang sama (bukan kosong)

**Done when:** print preview terlihat “ijazah kasus”, bukan kartu tipis.

---

### Part 6 — Polish UI global + konten
**Tujuan:** beda jauh dari HTML starter/preview.

Checklist:
- [ ] Font pairing final (display + body distinctive; bukan Inter default saja)
- [ ] Background atmosphere konsisten semua phase
- [ ] Mobile pass (sidebar collapse)
- [ ] Copywriting narasi per level (bukan 1 kasus generic saja)
- [ ] Review soal JSON + path load production
- [ ] Hapus kesan “ini cuma contoh HTML”

**Done when:** brand test lolos — tanpa nav pun terasa Algonova Quest.

---

## 5. Arsitektur teknis V2 (usulan)

```
index.html                 ← shell phases + CSS tokens
src/lib/
  questions.js             ← load JSON (path-safe untuk Vercel)
  diagnostic.js            ← levelFromAge, adjust, characters
  certificate.js           ← render print data
  audio.js                 ← NEW SFX/TTS/mute
  story.js                 ← NEW panels & cutscenes per level
  ui.js                    ← NEW transitions, confetti, toast
public/
  questions/*.json
  sfx/                     ← optional short sounds
docs/
  ROADMAP-V2.md            ← dokumen ini
  reference/algonova-preview.html  ← REFERENSI SAJA, bukan runtime
```

State machine eksplisit:

```js
STATE.phase =
  'login' | 'level-select' | 'briefing' | 'diagnostic' |
  'case-intro' | 'game' | 'result' | 'certificate'
```

---

## 6. Urutan kerja

1. **Part 0** (bug flow / JSON path) — blocking  
2. **Part 1** (level select)  
3. **Part 2** (story/motion)  
4. **Part 3** (audio)  
5. **Part 4** (rewards/hint/confetti)  
6. **Part 5** (certificate)  
7. **Part 6** (UI polish global)

Setiap part: commit → push → (deploy Vercel / sync ke algo-quest) → verifikasi URL → part berikutnya.

---

## 7. Definition of Done V2

- [ ] Pilih level → briefing animasi → diagnostic → case intro → game ~30 soal cerita
- [ ] Tidak pernah “balik ke HTML contoh” setelah diagnostic (JSON penuh, bukan FALLBACK diam-diam)
- [ ] SFX + mute; opsional TTS
- [ ] Story panel tiap bab + reward stempel
- [ ] Certificate print bagus
- [ ] Auth Sheet tetap (VALID/USED)
- [ ] Brand Algo utuh (bukan Kindora look)

---

## 8. Keputusan sebelum Part 0

| # | Pertanyaan | Usulan default (jika tidak dijawab) |
|---|------------|-------------------------------------|
| 1 | Level select **wajib** untuk semua, atau hanya jika umur kosong? | **Wajib**, dengan badge “Disarankan” dari umur |
| 2 | Audio: Web Audio beep dulu atau file MP3? | **Web Audio + TTS**, MP3 belakangan |
| 3 | Stack: tetap vanilla JS atau React/Vite? | **Vanilla V2**; React = V3 jika perlu |
| 4 | Repo push utama? | Kerjakan di `math-lesson` dulu; sync ke `algo-quest` / grant write access |

---

## 9. Cara minta eksekusi

Balas dengan salah satu:

- `OK Part 0` — mulai bugfix flow/JSON saja  
- `OK Part 0–1` — flow + level select  
- `OK V2 full` — kerjakan berurutan Part 0→6 dengan default §8  
- Atau jawab §8 lalu tentukan part mana dulu

---

*Dokumen ini belum mengubah runtime app. Eksekusi menunggu konfirmasi.*
