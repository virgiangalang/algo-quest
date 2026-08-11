# Algonova Math — Misteri Matematika

Asesmen matematika berbasis cerita detektif untuk murid **Algonova**.  
Flow: Login → Diagnostic → **Case Intro** → Game → Result → Certificate.

Arsitektur: [MASTERPLAN.md](./MASTERPLAN.md) · Roadmap V2: [docs/ROADMAP-V2.md](./docs/ROADMAP-V2.md)  
Panduan buat soal (non-teknis): [docs/PANDUAN-SOAL.md](./docs/PANDUAN-SOAL.md)  
Admin upload soal: [`/admin.html`](./admin.html)

---

## Jalankan lokal

```bash
git clone https://github.com/kindoradeveloper/math-lesson.git
cd math-lesson
python3 -m http.server 8080
```

Buka [http://localhost:8080](http://localhost:8080)

Untuk **admin API** (login/upload), pakai `vercel dev` (butuh Vercel CLI + env `ADMIN_PASSWORD`).

---

## Admin soal (CSV / JSON)

1. Set di Vercel → Environment Variables: `ADMIN_PASSWORD` = password admin
2. (Opsional) `BLOB_READ_WRITE_TOKEN` agar publish langsung live
3. (Opsional) `GITHUB_TOKEN` + `GITHUB_REPO` agar commit otomatis ke `public/questions/`
4. Buka `/admin.html` → login → upload template CSV/JSON
5. Template: `public/templates/` · Panduan: `docs/PANDUAN-SOAL.md`

Lihat juga [`.env.example`](./.env.example).

---

## Deploy ke GitHub Pages / Vercel

### Vercel (disarankan)

- Framework: **Other**
- Output Directory: **`.`** (bukan `public`)
- Root Directory: kosong
- Env: `ADMIN_PASSWORD` (wajib untuk admin)

### GitHub Pages

1. Pastikan `index.html` di root branch `main`
2. Repo **Settings → Pages** → Deploy from branch → `main` / `(root)`
3. Catatan: API `/api/*` **tidak** jalan di Pages — admin publish butuh Vercel

### Setelah live (produksi auth siswa)

Di `index.html`:

```js
window.ALGONOVA_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/XXXX/exec",
  devMode: false
};
```

Setup Sheet: [google-apps-script/SETUP.md](./google-apps-script/SETUP.md).

### Checklist

- [ ] `index.html` terbuka tanpa 404
- [ ] Setelah diagnostic → **case intro** (bukan balik ke login / contoh HTML)
- [ ] `public/questions/*.json` atau `/api/questions?level=` = 200, jumlah misi ~30
- [ ] `/admin.html` login dengan `ADMIN_PASSWORD`
- [ ] Login siswa → Diagnostic jalan

> File di `docs/reference/` hanya acuan desain, bukan entry hosting.

---

## User flow

```
Login (Username Algo + Nama + Umur opsional)
  ├─ USED=true  → Certificate (langsung)
  └─ VALID + belum USED
        → Diagnostic (5 soal)
        → Game cerita detektif (JSON lokal)
        → Result + skill bars + karakter
        → Certificate (print / PDF)
        → Sheet di-mark USED=true
```

---

## Struktur

```
index.html
MASTERPLAN.md
README.md
src/lib/questions.js
src/lib/diagnostic.js
src/lib/certificate.js
public/questions/          ← 5 level, masing-masing 30 soal / 6 bab
google-apps-script/        ← Code.gs + builder.gs + SETUP.md
docs/reference/            ← preview UI Algo (acuan desain)
```

---

## Level & soal

| Level | File | Soal |
|-------|------|------|
| SD 1–3 | `public/questions/sd-kelas-1-3.json` | 30 / 6 bab |
| SD 4–6 | `public/questions/sd-kelas-4-6.json` | 30 / 6 bab |
| SMP | `public/questions/smp.json` | 30 / 6 bab |
| SMA | `public/questions/sma.json` | 30 / 6 bab |
| Dewasa | `public/questions/dewasa.json` | 30 / 6 bab |

Soal sengaja tidak terlalu susah (fokus prolongation).

---

## Google Sheet (VALID / USED)

Kolom: `Username | Nama | Umur | Level | VALID | USED | Used At | Score | Character | Accuracy`

- **VALID=TRUE** → boleh login  
- **USED=FALSE** → kerjakan asesmen  
- **USED=TRUE** → login berikutnya langsung certificate  

Detail: [google-apps-script/SETUP.md](./google-apps-script/SETUP.md)

---

## Karakter detektif

| Karakter | Muncul jika banyak benar tipe |
|----------|-------------------------------|
| Sang Analis | `analyst` |
| Si Pemikir Cepat | `speedster` |
| Sang Investigator | `investigator` |
| Sang Pemecah Kode | `codebreaker` |
| Sang Penjelajah | `explorer` |

---

## Teknologi

- Static HTML/CSS/JS — tanpa Supabase, tanpa analytics/dashboard
- Auth: Google Apps Script Web App + Sheet
- Soal: JSON lokal
- Certificate: `window.print()` + CSS `@media print`

---

*Algonova · Kurikulum Merdeka · Misteri Matematika*
