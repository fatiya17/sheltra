// konstanta default kontak tepercaya
export const DEFAULT_TRUSTED_CONTACTS = [
  {
    id: "tc-1",
    name: "Alzea",
    relation: "Ibu / Keluarga",
    phone: "+6281234567890",
    avatarBg: "bg-sky-100 text-sky-700 border-sky-300",
    badgeColor: "bg-emerald-500",
    avatarInitial: "AZ",
    avatarImage: "https://api.dicebear.com/7.x/lorelei/svg?seed=Alzea&backgroundColor=ffe4e6",
    isPrimary: true,
  },
  {
    id: "tc-2",
    name: "Yafie",
    relation: "Partner / Pasangan",
    phone: "+6281398765432",
    avatarBg: "bg-emerald-100 text-emerald-700 border-emerald-300",
    badgeColor: "bg-emerald-500",
    avatarInitial: "YF",
    avatarImage: "https://api.dicebear.com/7.x/lorelei/svg?seed=Yafie&backgroundColor=e0f2fe",
    isPrimary: false,
  },
  {
    id: "tc-3",
    name: "Sally",
    relation: "Sahabat",
    phone: "+6281122334455",
    avatarBg: "bg-pink-100 text-pink-700 border-pink-300",
    badgeColor: "bg-emerald-500",
    avatarInitial: "SL",
    avatarImage: "https://api.dicebear.com/7.x/lorelei/svg?seed=Sally&backgroundColor=ffd5dc",
    isPrimary: false,
  },
]

// pilihan avatar pastel
export const AVATAR_PRESETS = [
  { bg: "bg-sky-100 text-sky-700 border-sky-300", label: "Sky" },
  { bg: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "Mint" },
  { bg: "bg-pink-100 text-pink-700 border-pink-300", label: "Rose" },
  { bg: "bg-amber-100 text-amber-700 border-amber-300", label: "Amber" },
  { bg: "bg-purple-100 text-purple-700 border-purple-300", label: "Lavender" },
]

// hotline darurat nasional
export const EMERGENCY_HOTLINES = [
  {
    id: "hl-police",
    name: "Polisi",
    number: "110",
    label: "Layanan Keamanan Polisi",
    icon: "ShieldAlert",
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    id: "hl-ambulance",
    name: "Ambulans (SPGDT)",
    number: "119",
    label: "Gawat Darurat Medis",
    icon: "Ambulance",
    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    btnColor: "bg-rose-600 hover:bg-rose-700 text-white",
  },
  {
    id: "hl-sapa",
    name: "SAPA 129",
    number: "129",
    label: "KemenPPPA (Sahabat Perempuan & Anak)",
    icon: "HeartHandshake",
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    btnColor: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  {
    id: "hl-emergency",
    name: "Panggilan Darurat",
    number: "112",
    label: "Layanan Bebas Pulsa Pemda",
    icon: "PhoneCall",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
  },
]

// daftar mock safe points terdekat radius 500m
export const MOCK_NEARBY_SAFE_POINTS = [
  {
    id: "sp-1",
    name: "Pos Polisi Subsektor Senopati",
    category: "police_post",
    categoryLabel: "Pos Polisi",
    distanceMeters: 140,
    walkingTimeMinutes: 2,
    address: "Jl. Senopati No. 18, Kebayoran Baru",
    is24Hours: true,
    features: ["Polisi Siaga 24 Jam", "Penerangan Terang", "CCTV Aktif"],
    coordinates: [106.8115, -6.2312],
    phone: "021-7201234",
  },
  {
    id: "sp-2",
    name: "Alfamart 24 Jam Senopati",
    category: "convenience_store",
    categoryLabel: "Minimarket 24 Jam",
    distanceMeters: 230,
    walkingTimeMinutes: 3,
    address: "Jl. Senopati No. 68, Jakarta Selatan",
    is24Hours: true,
    features: ["Staf Siaga", "Area Ramai", "Parkir Terang"],
    coordinates: [106.808, -6.2325],
    phone: "021-7205678",
  },
  {
    id: "sp-3",
    name: "Pos Satpam Terpadu SCBD Gate 3",
    category: "security_post",
    categoryLabel: "Pos Keamanan Swasta",
    distanceMeters: 380,
    walkingTimeMinutes: 5,
    address: "Kawasan Niaga Terpadu Sudirman Lot 8",
    is24Hours: true,
    features: ["Petugas Satpam 24 Jam", "P3K Siaga", "Radio HT"],
    coordinates: [106.8095, -6.226],
    phone: "021-5152000",
  },
  {
    id: "sp-4",
    name: "Klinik Pratama Medika 24 Jam",
    category: "clinic",
    categoryLabel: "Fasilitas Medis / Klinik",
    distanceMeters: 480,
    walkingTimeMinutes: 6,
    address: "Jl. Suryo No. 24, Senopati",
    is24Hours: true,
    features: ["Tenaga Medis", "Ambulans Standby", "Ruang Tunggu Aman"],
    coordinates: [106.817, -6.2335],
    phone: "021-7278901",
  },
]

// durasi hold tombol sos (milidetik)
export const SOS_HOLD_DURATION_MS = 2000

// key penyimpanan localstorage
export const SOS_STORAGE_KEYS = {
  CONTACTS: "sistech_sos_trusted_contacts",
  HISTORY: "sistech_sos_history",
  OFFLINE_QUEUE: "sistech_sos_offline_queue",
}
