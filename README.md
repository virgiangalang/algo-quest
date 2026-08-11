# Algonova Math — Misteri Matematika

Asesmen matematika berbasis cerita detektif untuk murid **Algonova**.  
Flow: Login → Diagnostic → Game → Result (skill bars) → Certificate.

Arsitektur lengkap: [MASTERPLAN.md](./MASTERPLAN.md)  
Acuan visual: [docs/reference/algonova-preview.html](./docs/reference/algonova-preview.html)

---

## Jalankan lokal

```bash
git clone https://github.com/kindoradeveloper/math-lesson.git
cd math-lesson
python3 -m http.server 8080
```

Buka [http://localhost:8080](http://localhost:8080)

`devMode: true` (default) — login dengan username + nama apa saja, tanpa Google Sheet.

---

## Deploy ke GitHub Pages

1. Pastikan semua file ada di root branch `main` (`index.html` di root, bukan di subfolder `docs/` untuk hosting).
2. Repo **Settings → Pages**
3. **Build and deployment → Source:** Deploy from a branch
4. Branch: **`main`** · Folder: **`/ (root)`**
5. Save → tunggu 1–2 menit
6. URL tipikal: `https://kindoradeveloper.github.io/math-lesson/`

### Setelah Pages live (produksi)

Di `index.html`:

```js
window.ALGONOVA_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/XXXX/exec",
  devMode: false
};
```

Commit + push lagi ke `main`. Setup Sheet: [google-apps-script/SETUP.md](./google-apps-script/SETUP.md).

### Checklist Pages

- [ ] `index.html` terbuka tanpa 404
- [ ] `public/questions/*.json` ter-load (cek Network)
- [ ] `src/lib/*.js` ter-load
- [ ] Login → Diagnostic jalan di `devMode`
- [ ] Setelah `devMode: false`, validate/submit ke Apps Script OK

> Catatan: file di `docs/reference/` hanya acuan desain untuk agent/developer, bukan entry Pages.

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
