# Setup Google Apps Script — Algonova Math

## 1. Buat Google Sheet

Buat spreadsheet baru. Tambahkan 3 tab:

### Tab: `Credentials`

| A — Username | B — Nama | C — Umur | D — Level | E — VALID | F — USED | G — Used At | H — Score | I — Character | J — Accuracy |
|---|---|---|---|---|---|---|---|---|---|
| ALGO-001 | Budi Santoso | 11 | sd-kelas-4-6 | TRUE | FALSE | | | | |
| ALGO-002 | Sari Dewi | 14 | smp | TRUE | FALSE | | | | |

- Kolom D (Level) boleh dikosongkan → website akan tentukan via diagnostic + umur
- VALID = TRUE berarti akun aktif
- USED = FALSE berarti belum pernah dipakai

### Tab: `Questions_SD46` (opsional — untuk builder)

| chapter | scene | q | A | B | C | D | answer | skill | difficulty | type | correct | wrong_a | wrong_b | wrong_c | wrong_d | clue |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Bab 1 — Insiden | Pintu terkunci | 3/8 dari 240? | 80 | 90 | 120 | 150 | B | Pecahan | Mudah | analyst | ... | ... | ... | ... | ... | ... |

---

## 2. Buka Apps Script

1. Di Google Sheet: **Ekstensi → Apps Script**
2. Hapus kode default di `Code.gs`
3. Copy-paste isi `Code.gs` dari repo
4. Buat file baru: `builder.gs` → copy-paste isi `builder.gs` dari repo

---

## 3. Deploy Web App

1. Klik **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Klik **Deploy** → copy URL yang muncul

URL bentuknya:
```
https://script.google.com/macros/s/AKfycb.../exec
```

---

## 4. Tempel URL ke `index.html`

Buka `index.html`, cari:
```js
appsScriptUrl: "https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec",
devMode: true,
```

Ganti:
```js
appsScriptUrl: "https://script.google.com/macros/s/AKfycb.../exec",
devMode: false,
```

---

## 5. Pakai Builder (opsional)

Jika ingin tambah soal dari Sheet:
1. Isi tab `Questions_SD46` sesuai format kolom
2. Di Apps Script: pilih fungsi `buildQuestionsSD46` → **Run**
3. Hasil JSON ada di tab `Output_sd-kelas-4-6`
4. Copy ke `public/questions/sd-kelas-4-6.json` di repo

---

## 6. Test

Buka `index.html` di browser (bisa langsung double-click, atau `python3 -m http.server` dari folder repo).

Login dengan username dari sheet. Jika `devMode: true`, validasi dilewati dan level ditentukan dari umur.
