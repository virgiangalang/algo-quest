/**
 * certificate.js
 * Helper untuk populate dan cetak certificate.
 * Semua rendering sudah di index.html; file ini hanya utility tambahan.
 */

/**
 * Generate ID unik untuk certificate.
 * Format: ALGO-{tahun}-{username}-{6 char random}
 */
function generateCertId(username) {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ALGO-${year}-${(username || "XXXXX").toUpperCase()}-${rand}`;
}

/**
 * Format tanggal Indonesia.
 */
function formatDateID(isoString) {
  const d = new Date(isoString || Date.now());
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Cetak halaman certificate via browser print dialog.
 * CSS @media print di index.html menyembunyikan semua elemen selain certificate.
 */
function printCertificate() {
  window.print();
}
