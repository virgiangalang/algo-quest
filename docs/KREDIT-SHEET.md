# Sistem Kredit Algonova Quest

CS mengatur berapa kali username boleh main lewat Google Sheet.

## Kolom baru di tab `Credentials`

| Kolom | Arti | Contoh |
|-------|------|--------|
| **Credits** | Total kuota main | `1` (sekali) atau `5` (paket besar) |
| **CreditsUsed** | Sudah dipakai berapa kali | `0` awal |
| **USED** | Otomatis dicentang saat kredit habis | untuk pantauan CS |

Sisa = `Credits - CreditsUsed`. Kalau sisa 0, siswa **tidak bisa mulai misi baru**, tapi tetap bisa login → **Beranda akun** → unduh sertifikat riwayat.

## Setup cepat (Sheet yang sudah ada)

1. Buka Apps Script → jalankan fungsi **`ensureCreditColumns`** (sekali)  
   → menambah kolom Credits / CreditsUsed + tab **History** tanpa hapus data.
2. Deploy ulang Web App (**New version**).
3. Isi angka Credits per baris (mis. paket besar = 5).

## Alur siswa

1. Login (username + umur) → isi nama  
2. **Beranda akun**: lihat kredit + riwayat  
3. Mulai misi (jika kredit tersisa) → selesai → kredit -1  
4. Tombol **Kembali ke beranda** → hub akun (bukan login lagi)  
5. **Buka sertifikat / PDF** dari riwayat kapan saja  

## Tab History

Setiap selesai misi, Apps Script menambah baris di tab `History` (Username, Nama, waktu, level/folder, skor, akurasi, karakter, Cert Id) — berguna jika siswa lupa unduh.
