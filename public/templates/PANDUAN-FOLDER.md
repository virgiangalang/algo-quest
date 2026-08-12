# Template soal per Folder / Sub-kategori

Algonova memakai struktur:

```
Kategori usia (SD 1–3 / SD 4–6 / SMP / SMA / Dewasa)
  └── Folder / cerita / misi   ← yang dipilih siswa setelah kategori
        └── Bab → soal
```

## Cara menambah folder baru (simpel)

1. Buat file JSON soal, contoh: `public/questions/sd-kelas-4-6/nama-folder-baru.json`  
   (boleh salin struktur dari `missing-moonstone.json`)
2. Daftarkan di `public/questions/catalog.json` di dalam `folders` kategori yang sesuai:

```json
{
  "id": "nama-folder-baru",
  "title": "Judul yang tampil ke siswa",
  "blurb": "Deskripsi singkat",
  "file": "sd-kelas-4-6/nama-folder-baru.json",
  "badge": "BARU",
  "questionsHint": "20 soal"
}
```

3. Deploy / push → siswa langsung melihat folder baru setelah pilih kategori.

## Template CSV

Pakai [`soal-folder-template.csv`](./soal-folder-template.csv) — kolom penting:

| Kolom | Arti |
|-------|------|
| `folder_id` | ID folder (huruf kecil, tanpa spasi) |
| `folder_title` | Judul folder |
| `bab_id` / `bab_title` | Bab dalam cerita |
| kolom soal biasa | sama seperti template lama (`type_ui`, `q`, `choice_*`, `answer`, …) |

Template klasik tanpa folder tetap ada: [`soal-template.csv`](./soal-template.csv).

## Pilot usia 8–9 (SD 4–6)

Folder dari workbook *Algonova Math Adventure Pilot 60 Soal*:

- `missing-moonstone` — The Missing Moonstone (20)
- `robot-city` — Robot City (20)
- `lost-temple` — The Lost Kingdom (20)
- plus `kode-yang-hilang` (paket klasik)

## Diagnostic

5 soal awal **disembunyikan** (`enableDiagnostic: false` di `index.html`). Kode tetap ada jika nanti diaktifkan lagi.
