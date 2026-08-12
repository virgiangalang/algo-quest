# Setup Google Apps Script — Algonova Math

Panduan menghubungkan website ke Google Sheet (VALID / USED).

---

## Ringkasan alur kredensial

```
VALID=TRUE, USED=FALSE  →  boleh login, kerjakan asesmen penuh
VALID=TRUE, USED=TRUE   →  login kedua: langsung ke certificate
VALID=FALSE             →  ditolak
Username tidak ada      →  ditolak
```

Setelah murid selesai, Apps Script mengisi:

- `USED` = `TRUE`
- `Used At` = timestamp ISO
- `Score`, `Character`, `Accuracy` (+ Nama / Umur / Level bila dikirim)

**Tidak ada retake otomatis.** Untuk uji ulang, reset manual `USED` → `FALSE` dan kosongkan kolom hasil.

---

## 1. Buat Google Sheet

Buat spreadsheet baru. Tambahkan tab:

### Tab: `Credentials` (wajib)

Baris 1 harus tepat seperti ini:

| Username | Nama | Umur | Level | VALID | USED | Used At | Score | Character | Accuracy |
|----------|------|------|-------|-------|------|---------|-------|-----------|----------|

Contoh baris uji:

| Username | Nama | Umur | Level | VALID | USED | Used At | Score | Character | Accuracy |
|----------|------|------|-------|-------|------|---------|-------|-----------|----------|
| ALGO-001 | | | | TRUE | FALSE | | | | |
| ALGO-002 | Sari Dewi | 14 | smp | TRUE | FALSE | | | | |
| ALGO-003 | | | | FALSE | FALSE | | | | |

Catatan:

| Kolom | Aturan |
|-------|--------|
| **VALID** | Isi `TRUE` / `FALSE` (teks). Hanya `TRUE` yang boleh masuk. |
| **USED** | Mulai `FALSE`. Menjadi `TRUE` setelah submit hasil. |
| **Nama / Umur** | Boleh kosong di Sheet — diisi dari form login saat submit. |
| **Level** | Opsional. Jika diisi (`sd-kelas-1-3`, `sd-kelas-4-6`, `smp`, `sma`, `dewasa`) dipakai sebagai level awal; jika kosong, website pakai umur + diagnostic. |

### Tab: `Questions_SD46` (opsional — untuk builder)

Lihat header di komentar `builder.gs`.

---

## 2. Pasang skrip

1. Di Sheet: **Extensions → Apps Script**
2. Hapus kode default → tempel isi [`Code.gs`](./Code.gs)
3. File baru → tempel [`builder.gs`](./builder.gs) (opsional)
4. Pastikan `SHEET_NAME = "Credentials"` sesuai nama tab
5. Save

---

## 3. Deploy Web App

1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy → izinkan permission Google
6. Salin **Web app URL** (`https://script.google.com/macros/s/.../exec`)

Setiap ubah `Code.gs`, buat **New deployment** (atau Manage → New version) supaya URL/produk terbaru dipakai.

> **Catatan teknis:** Browser sering gagal `POST` langsung ke `script.google.com` (redirect 302 → 405).
> Website memanggil proxy **`/api/sheet`** di Vercel, yang meneruskan request ke Apps Script dengan aman.
> Pastikan project Vercel sudah berisi file `api/sheet.js` (sudah ada di repo).

---

## 4. Hubungkan ke `index.html`

```js
window.ALGONOVA_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/XXXX/exec",
  devMode: false
};
```

| Mode | Perilaku |
|------|----------|
| `devMode: true` | Skip Sheet; username bebas; submit tidak menulis |
| `devMode: false` | Wajib URL valid; enforce VALID/USED |

---

## 5. Uji VALID / USED

### A. Akun baru (VALID + belum USED)

1. Baris: `ALGO-001 | … | VALID=TRUE | USED=FALSE`
2. Buka site → login `ALGO-001` + nama
3. Harus masuk Diagnostic → Game → Result → Certificate
4. Cek Sheet: `USED=TRUE`, `Used At` terisi, skor/karakter/akurasi terisi

### B. Login kedua (USED)

1. Login lagi dengan `ALGO-001`
2. Harus **langsung ke Certificate** (data dari Sheet / localStorage)
3. Tidak boleh mengerjakan soal lagi

### C. Akun nonaktif

1. Set `VALID=FALSE`
2. Login harus ditolak dengan pesan jelas

### D. Reset uji

Set `USED=FALSE`, kosongkan `Used At`, `Score`, `Character`, `Accuracy`.

---

## 6. Builder soal (opsional)

1. Isi tab `Questions_SD46`
2. Jalankan `buildQuestionsSD46` di editor Apps Script
3. Copy JSON ke `public/questions/sd-kelas-4-6.json`

---

## Troubleshooting

| Gejala | Perbaikan |
|--------|-----------|
| `Username tidak ditemukan` | Typo / spasi; cocokkan huruf besar-kecil (script menormalisasi ke UPPER) |
| `Akun tidak aktif` | `VALID` harus teks `TRUE` |
| Login kedua tetap ke diagnostic | Pastikan submit sukses menulis `USED=TRUE`; cek deployment terbaru |
| Fetch gagal / CORS | Access **Anyone**; redeploy; coba dari HTTPS (GitHub Pages) |
| `devMode` lokal OK, Pages gagal | Set `devMode: false` + URL Web App di commit yang di-deploy Pages |

---

## Lokal tanpa Sheet

```bash
python3 -m http.server 8080
```

Biarkan `devMode: true` — cocok untuk polish UI & soal.
