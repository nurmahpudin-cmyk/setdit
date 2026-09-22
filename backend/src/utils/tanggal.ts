// Helper format tanggal Bahasa Indonesia.
// Dipakai bersama oleh modul jadwal_pimpinan dan disposisi_surat.

export const HARI_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const BULAN_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// "Senin, 8 September 2026"
export const formatTanggalLengkap = (d: Date): string => {
  return `${HARI_NAMES[d.getDay()]}, ${d.getDate()} ${BULAN_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

// "8 September 2026"
export const formatTanggal = (d: Date): string => {
  return `${d.getDate()} ${BULAN_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

// "Senin"
export const formatHari = (d: Date): string => {
  return HARI_NAMES[d.getDay()];
};
