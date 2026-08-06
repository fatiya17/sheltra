// koordinat default jakarta
export const DEFAULT_MAP_CENTER = [106.827153, -6.175392]
export const DEFAULT_MAP_ZOOM = 13.5

// pilihan mode perjalanan
export const TRAVEL_MODES = [
  { id: "walking", label: "Jalan Kaki", icon: "Footprints", speed: "15 mnt/km" },
  { id: "motorcycle", label: "Motor", icon: "Bike", speed: "3 mnt/km" },
  { id: "car", label: "Mobil / Taksi", icon: "Car", speed: "4 mnt/km" },
]

// bookmark lokasi favorit
export const SAVED_BOOKMARKS = [
  { id: "bm-1", name: "athifa", address: "Jl. Senopati No. 45, Kebayoran Baru", coordinates: [106.8105, -6.2307] },
  { id: "bm-2", name: "octa", address: "Gandaria City Mall, Jakarta Selatan", coordinates: [106.7836, -6.2446] },
  { id: "bm-3", name: "Rumah", address: "Jl. Kyai Maja No. 12, Kebayoran Baru", coordinates: [106.79, -6.244] },
  { id: "bm-4", name: "Kantor", address: "Sudirman Central Business District (SCBD)", coordinates: [106.8095, -6.224] },
]

// riwayat lokasi terakhir
export const RECENT_DESTINATIONS = [
  {
    id: "rec-1",
    name: "Stasiun Sudirman",
    detail: "Menteng, Jakarta Pusat (Hub Transit Terang)",
    category: "Stasiun MRT / KRL",
    coordinates: [106.8236, -6.2023],
    isSafeHub: true,
  },
  {
    id: "rec-2",
    name: "Jl. Senopati No. 45",
    detail: "Kebayoran Baru, Jakarta Selatan",
    category: "Pusat Keramaian",
    coordinates: [106.8105, -6.2307],
    isSafeHub: true,
  },
  {
    id: "rec-3",
    name: "Blok M Plaza",
    detail: "Jl. Bulungan No. 76, Kramat Pela",
    category: "Pusat Perbelanjaan",
    coordinates: [106.7972, -6.2442],
    isSafeHub: true,
  },
  {
    id: "rec-4",
    name: "Alfamart 24 Jam Senopati",
    detail: "Jl. Senopati No. 68, Jakarta Selatan",
    category: "Minimarket 24 Jam",
    coordinates: [106.808, -6.2325],
    isSafeHub: true,
  },
  {
    id: "rec-5",
    name: "Area Pinggiran Sukatani (Blank Spot)",
    detail: "Desa Sukatani RT 04 (Area Minim Laporan)",
    category: "Data Terbatas",
    coordinates: [106.985, -6.385],
    isSafeHub: false,
    isBlankSpot: true,
  },
]

// preset rute simulasi
export const ROUTE_PRESETS = [
  {
    id: "preset-sudirman-senopati",
    name: "Stasiun Sudirman ➔ Senopati",
    tag: "Area Protokol / Ramai",
    origin: {
      label: "Stasiun Sudirman, Menteng, Jakarta Pusat",
      coordinates: [106.8236, -6.2023],
    },
    destination: {
      label: "Jl. Senopati No. 45, Kebayoran Baru",
      coordinates: [106.8105, -6.2307],
    },
    isBlankSpot: false,
  },
  {
    id: "preset-blokm-gandaria",
    name: "Blok M Plaza ➔ Gandaria City",
    tag: "Area Komersial",
    origin: {
      label: "Blok M Plaza, Jl. Bulungan No. 76",
      coordinates: [106.7972, -6.2442],
    },
    destination: {
      label: "Gandaria City Mall, Jl. Sultan Iskandar Muda",
      coordinates: [106.7836, -6.2446],
    },
    isBlankSpot: false,
  },
  {
    id: "preset-blank-spot",
    name: "Area Pinggiran (Blank Spot - Uji Coba)",
    tag: "Data Terbatas (Edge Case)",
    origin: {
      label: "Desa Sukatani RT 04 (Area Minim Laporan)",
      coordinates: [106.985, -6.385],
    },
    destination: {
      label: "Jl. Rawa Perbatasan Blok C (Area Sepi)",
      coordinates: [107.012, -6.402],
    },
    isBlankSpot: true,
  },
]

// data titik aman di peta
export const MOCK_SAFE_POINTS = [
  {
    id: "sp-1",
    name: "Pos Polisi Bundaran HI",
    type: "police",
    categoryLabel: "Pos Polisi 24 Jam",
    coordinates: [106.8229, -6.195],
    address: "Bundaran HI, Jl. M.H. Thamrin",
    features: ["Petugas Siaga 24 Jam", "Penerangan Sangat Terang", "CCTV Aktif"],
    is24Hours: true,
  },
  {
    id: "sp-2",
    name: "Pos Polisi Dukuh Atas",
    type: "police",
    categoryLabel: "Pos Polisi 24 Jam",
    coordinates: [106.8217, -6.2008],
    address: "Kawasan Transit Dukuh Atas",
    features: ["Personel Patroli", "Area Terang", "Panic Button Ready"],
    is24Hours: true,
  },
  {
    id: "sp-3",
    name: "Indomaret Point 24 Jam Sudirman",
    type: "convenience_store",
    categoryLabel: "Minimarket 24 Jam",
    coordinates: [106.8205, -6.211],
    address: "Jl. Jend. Sudirman Kav. 28",
    features: ["Buka 24 Jam", "Area Ramai & Terang", "CCTV Depan Toko"],
    is24Hours: true,
  },
  {
    id: "sp-4",
    name: "Stasiun MRT Bendungan Hilir",
    type: "transit_station",
    categoryLabel: "Stasiun MRT / Hub Transportasi",
    coordinates: [106.8188, -6.2163],
    address: "Jl. Jend. Sudirman No. 44",
    features: ["Petugas Keamanan Stasiun", "Penerangan Optimal", "Ramai Pejalan Kaki"],
    is24Hours: false,
  },
  {
    id: "sp-5",
    name: "Pos Satpam SCBD Gate 3",
    type: "security_post",
    categoryLabel: "Pos Keamanan Komersial",
    coordinates: [106.8095, -6.224],
    address: "Kawasan Niaga Terpadu Sudirman",
    features: ["Penjagaan 24 Jam", "Lampu Penerangan Terang", "Jalur Evakuasi"],
    is24Hours: true,
  },
  {
    id: "sp-6",
    name: "Posko Sahabat Perempuan Senopati",
    type: "safe_haven",
    categoryLabel: "Posko Siaga Perempuan",
    coordinates: [106.812, -6.228],
    address: "Jl. Senopati No. 22, Kebayoran Baru",
    features: ["Pendampingan Cepat", "Tempat Aman Singgah", "Hotline Terhubung"],
    is24Hours: true,
  },
  {
    id: "sp-7",
    name: "Alfamart 24 Jam Senopati",
    type: "convenience_store",
    categoryLabel: "Minimarket 24 Jam",
    coordinates: [106.808, -6.2325],
    address: "Jl. Senopati No. 68",
    features: ["Buka 24 Jam", "Parkir Terang", "Staf Siaga"],
    is24Hours: true,
  },
  {
    id: "sp-8",
    name: "Pos Polisi Blok M",
    type: "police",
    categoryLabel: "Pos Polisi 24 Jam",
    coordinates: [106.798, -6.2435],
    address: "Pintu Keluar Terminal Blok M",
    features: ["Polisi Siaga 24 Jam", "Penerangan Baik"],
    is24Hours: true,
  },
  {
    id: "sp-9",
    name: "Lawson 24 Jam Kyai Maja",
    type: "convenience_store",
    categoryLabel: "Minimarket 24 Jam",
    coordinates: [106.79, -6.244],
    address: "Jl. Kyai Maja No. 12",
    features: ["Buka 24 Jam", "Penerangan Jalan Baik", "Ramai Pengunjung"],
    is24Hours: true,
  },
]

// zona risiko rawan insiden
export const MOCK_RISK_ZONES = [
  {
    id: "rz-1",
    name: "Area Gang Gelap Setiabudi",
    coordinates: [106.827, -6.208],
    radiusMeters: 220,
    riskLevel: "Tinggi",
    incidentCount: 4,
    reason: "Minim lampu penerangan jalan & sepi pejalan kaki setelah pukul 20:00",
  },
  {
    id: "rz-2",
    name: "Jalur Sepi Karet Belakang",
    coordinates: [106.815, -6.218],
    radiusMeters: 180,
    riskLevel: "Sedang",
    incidentCount: 2,
    reason: "Riwayat laporan catcalling dan jalanan sempit minim pengawasan CCTV",
  },
  {
    id: "rz-3",
    name: "Gang Tikus Senopati Dalam",
    coordinates: [106.816, -6.229],
    radiusMeters: 160,
    riskLevel: "Sedang",
    incidentCount: 2,
    reason: "Pohon rimbun menghalangi penerangan & jarang dilalui patroli",
  },
  {
    id: "rz-4",
    name: "Area Belakang Gandaria",
    coordinates: [106.791, -6.248],
    radiusMeters: 200,
    riskLevel: "Tinggi",
    incidentCount: 3,
    reason: "Jalanan sepi saat larut malam tanpa pos keamanan terdekat",
  },
]

// data mock rute alternatif
export const MOCK_ROUTES = {
  "preset-sudirman-senopati": [
    {
      id: "route-sudirman-safe",
      title: "Rute Teraman (Rekomendasi Utama)",
      tag: "Paling Direkomendasikan",
      isSafest: true,
      isBlankSpot: false,
      safetyScore: 94,
      riskLevel: "Rendah",
      duration: "18 mnt",
      distance: "4.1 km",
      lightingScore: 95,
      crowdDensityScore: 90,
      safePointsCount: 5,
      passedSafePointIds: ["sp-1", "sp-2", "sp-3", "sp-4", "sp-5", "sp-6"],
      incidentReportsCount: 0,
      highlights: [
        "Melewati 5 Safe Points (Pos Polisi & Minimarket 24 Jam)",
        "Penerangan jalan 95% sangat terang di jalan protokol",
        "Kepadatan pejalan kaki ramai & banyak CCTV aktif",
        "Menghindari 2 zona rawan insiden di gang samping",
      ],
      color: "#F02E65", // warna primary
      // rute jalan protokol sudirman & scbd
      coordinates: [
        [106.8236, -6.2023],
        [106.8228, -6.205],
        [106.8215, -6.2095],
        [106.8202, -6.2135],
        [106.8188, -6.2163],
        [106.8155, -6.2215],
        [106.8125, -6.2255],
        [106.8115, -6.228],
        [106.8105, -6.2307],
      ],
    },
    {
      id: "route-sudirman-fast",
      title: "Rute Tercepat (Jalur Alternatif)",
      tag: "Jalur Lebih Cepat",
      isSafest: false,
      isBlankSpot: false,
      safetyScore: 66,
      riskLevel: "Sedang",
      duration: "13 mnt",
      distance: "3.4 km",
      lightingScore: 58,
      crowdDensityScore: 45,
      safePointsCount: 1,
      passedSafePointIds: ["sp-2"],
      incidentReportsCount: 2,
      highlights: [
        "Lebih cepat 5 menit melewati gang pemukiman",
        "Melewati 1 zona rawan (Jalur Sepi Karet Belakang)",
        "Penerangan 58% (ada ruas minim lampu setelah 21:00)",
        "Hanya melewati 1 Safe Point",
      ],
      color: "#f59e0b", // amber oranye
      // rute potong gang karet belakang
      coordinates: [
        [106.8236, -6.2023],
        [106.8217, -6.2055],
        [106.8185, -6.2105],
        [106.815, -6.218],
        [106.8135, -6.224],
        [106.8105, -6.2307],
      ],
    },
  ],
  "preset-blokm-gandaria": [
    {
      id: "route-blokm-safe",
      title: "Rute Utama Terang (Rekomendasi)",
      tag: "Paling Direkomendasikan",
      isSafest: true,
      isBlankSpot: false,
      safetyScore: 91,
      riskLevel: "Rendah",
      duration: "11 mnt",
      distance: "2.3 km",
      lightingScore: 90,
      crowdDensityScore: 85,
      safePointsCount: 3,
      passedSafePointIds: ["sp-8", "sp-9"],
      incidentReportsCount: 0,
      highlights: [
        "Melewati jalan raya Kyai Maja & Gandaria Raya",
        "Penerangan optimal sepanjang trotoar",
        "Melewati 3 titik aman minimarket & pos polisi",
      ],
      color: "#F02E65",
      coordinates: [
        [106.7972, -6.2442],
        [106.7945, -6.2441],
        [106.79, -6.244],
        [106.7865, -6.2443],
        [106.7836, -6.2446],
      ],
    },
    {
      id: "route-blokm-shortcut",
      title: "Rute Gang Perumahan",
      tag: "Jalur Alternatif",
      isSafest: false,
      isBlankSpot: false,
      safetyScore: 61,
      riskLevel: "Sedang",
      duration: "8 mnt",
      distance: "1.8 km",
      lightingScore: 50,
      crowdDensityScore: 40,
      safePointsCount: 0,
      passedSafePointIds: [],
      incidentReportsCount: 1,
      highlights: [
        "Memotong gang sempit pemukiman warga",
        "Minim penerangan & portal sering ditutup larut malam",
        "Tidak ada titik aman 24 jam",
      ],
      color: "#f59e0b",
      coordinates: [
        [106.7972, -6.2442],
        [106.795, -6.2465],
        [106.791, -6.248],
        [106.787, -6.246],
        [106.7836, -6.2446],
      ],
    },
  ],
  "preset-blank-spot": [
    {
      id: "route-blank-spot-default",
      title: "Rute Jaringan Jalan Umum",
      tag: "Data Keamanan Terbatas",
      isSafest: false,
      isBlankSpot: true,
      safetyScore: null,
      riskLevel: "Data Terbatas",
      duration: "24 mnt",
      distance: "6.8 km",
      lightingScore: null,
      crowdDensityScore: null,
      safePointsCount: 0,
      passedSafePointIds: [],
      incidentReportsCount: 0,
      disclaimer:
        "Data keamanan & riwayat insiden belum memadai di area ini. Rute ditampilkan berdasarkan jaringan jalan umum standar.",
      highlights: [
        "Rute berbasis peta navigasi jalan umum standar",
        "Data risiko & riwayat insiden belum tersedia di area ini",
        "Disarankan memilih jalan utama yang memiliki penerangan",
      ],
      color: "#94a3b8", // slate abu-abu
      coordinates: [
        [106.985, -6.385],
        [106.992, -6.39],
        [107.001, -6.395],
        [107.012, -6.402],
      ],
    },
  ],
}

// data profil risiko per jam
export const HOURLY_RISK_FACTORS = [
  { hour: "06:00", label: "Pagi (06:00)", baseRisk: 10, note: "Pencahayaan alami & aktivitas warga mulai ramai" },
  { hour: "09:00", label: "Pagi (09:00)", baseRisk: 8, note: "Jam sibuk kerja, area sangat ramai & terpantau" },
  { hour: "12:00", label: "Siang (12:00)", baseRisk: 12, note: "Pencahayaan maksimal, jalanan ramai lancar" },
  { hour: "15:00", label: "Sore (15:00)", baseRisk: 15, note: "Aktivitas pulang sekolah/kerja mulai meningkat" },
  { hour: "18:00", label: "Petang (18:00)", baseRisk: 25, note: "Matahari terbenam, lampu jalan mulai menyala" },
  { hour: "20:00", label: "Malam (20:00)", baseRisk: 38, note: "Pertokoan mulai tutup, jalanan mulai lengang" },
  { hour: "22:00", label: "Larut Malam (22:00)", baseRisk: 58, note: "Pencahayaan berkurang, pengawasan minim" },
  { hour: "00:00", label: "Tengah Malam (00:00)", baseRisk: 74, note: "Area sepi, risiko catcalling & begal meningkat" },
  { hour: "02:00", label: "Dini Hari (02:00)", baseRisk: 82, note: "Sangat sepi & rawan tindak kriminalitas" },
]
