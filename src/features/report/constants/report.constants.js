// opsi kategori insiden
export const REPORT_CATEGORIES = [
  "Catcalling / Pelecehan Verbal",
  "Dikuntit / Suspicious Following",
  "Pelecehan Fisik / Physical Harassment",
  "Begal / Kriminalitas Jalanan",
  "Penerangan Minim / Area Gelap",
  "Tempat Sepi / Rawan Insiden",
  "Lainnya",
]

// config upload bukti
export const EVIDENCE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/quicktime"],
}

// default koordinat peta jakarta
export const DEFAULT_MAP_CENTER = [106.827153, -6.175110]
export const DEFAULT_MAP_ZOOM = 14

// data awal feed laporan
export const INITIAL_REPORTS = [
  {
    id: "rep-1",
    refCode: "ANON-P3K9R1",
    category: "Catcalling / Pelecehan Verbal",
    location: "Jembatan Penyeberangan Stasiun Pondok Cina",
    time: "2026-07-26T21:30",
    description: "Ada sekelompok orang nongkrong bersiul dan memanggil-manggil dengan kata-kata tidak sopan saat lewat jam 9 malam.",
    status: "Telah Terverifikasi Komunitas",
    createdAt: "30 menit yang lalu",
    evidence: null,
  },
  {
    id: "rep-2",
    refCode: "ANON-W2J5D8",
    category: "Penerangan Minim / Area Gelap",
    location: "Jl. Akses UI Dekat Gang Melati",
    time: "2026-07-26T20:15",
    description: "Lampu jalan mati total sekitar 200 meter, sangat gelap dan minim kendaraan lewat.",
    status: "Laporan Baru",
    createdAt: "2 jam yang lalu",
    evidence: null,
  },
  {
    id: "rep-3",
    refCode: "ANON-T7M3Y4",
    category: "Dikuntit / Suspicious Following",
    location: "Trotoar Margonda Raya KM 4",
    time: "2026-07-25T22:00",
    description: "Merasa diikuti motor tanpa plat nomor dari depan halte sampai ke gang masuk perumahan.",
    status: "Telah Terverifikasi Komunitas",
    createdAt: "Kemarin",
    evidence: null,
  },
]
