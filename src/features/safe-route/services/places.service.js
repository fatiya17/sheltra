// cache hasil pencarian
const searchCache = new Map()

// preset lokasi populer untuk rekomendasi instan
export const POPULAR_PLACES = [
  {
    id: "pop-sudirman",
    name: "Stasiun Sudirman",
    address: "Menteng, Jakarta Pusat, DKI Jakarta",
    fullAddress: "Stasiun Sudirman, Jalan Kendal, Menteng, Jakarta Pusat",
    coordinates: [106.8236386, -6.2025162],
    category: "train_station",
    categoryLabel: "Stasiun Kereta",
    source: "OpenStreetMap",
  },
  {
    id: "pop-senopati",
    name: "Jl. Senopati",
    address: "Kebayoran Baru, Jakarta Selatan, DKI Jakarta",
    fullAddress: "Jalan Senopati, Senayan, Kebayoran Baru, Jakarta Selatan",
    coordinates: [106.8082373, -6.2307381],
    category: "street",
    categoryLabel: "Jalan Utama",
    source: "OpenStreetMap",
  },
  {
    id: "pop-blokm",
    name: "Blok M Hub",
    address: "Kebayoran Baru, Jakarta Selatan, DKI Jakarta",
    fullAddress: "Blok M Plaza & Terminal, Melawai, Kebayoran Baru",
    coordinates: [106.8009281, -6.2448705],
    category: "bus_station",
    categoryLabel: "Halte / Transportasi",
    source: "OpenStreetMap",
  },
  {
    id: "pop-bundaranhi",
    name: "Bundaran HI ASTRA",
    address: "Menteng, Jakarta Pusat, DKI Jakarta",
    fullAddress: "Bundaran Hotel Indonesia, Thamrin, Jakarta Pusat",
    coordinates: [106.8226741, -6.1949853],
    category: "station",
    categoryLabel: "Stasiun MRT",
    source: "OpenStreetMap",
  },
  {
    id: "pop-grandindonesia",
    name: "Grand Indonesia",
    address: "Tanah Abang, Jakarta Pusat, DKI Jakarta",
    fullAddress: "Grand Indonesia Shopping Town, Jl. M.H. Thamrin No.1",
    coordinates: [106.820256, -6.195328],
    category: "mall",
    categoryLabel: "Pusat Perbelanjaan",
    source: "Mapbox",
  },
  {
    id: "pop-senayancity",
    name: "Senayan City",
    address: "Gelora, Tanah Abang, Jakarta Pusat",
    fullAddress: "Senayan City Mall, Jl. Asia Afrika No.19",
    coordinates: [106.797585, -6.227226],
    category: "mall",
    categoryLabel: "Pusat Perbelanjaan",
    source: "Mapbox",
  },
]

export const placesService = {
  // query pencarian tempat dari database asli
  async searchPlaces(query, proximity = "106.8272,-6.1754") {
    if (!query || query.trim().length < 2) return []

    const cleanQuery = query.trim()
    const cacheKey = `${cleanQuery.toLowerCase()}_${proximity}`

    if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey)
    }

    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(cleanQuery)}&proximity=${proximity}`
      )
      if (!res.ok) throw new Error("Gagal mengambil data lokasi")

      const data = await res.json()
      const results = data.results || []

      // simpan di cache
      searchCache.set(cacheKey, results)
      if (searchCache.size > 100) {
        const firstKey = searchCache.keys().next().value
        searchCache.delete(firstKey)
      }

      return results
    } catch (err) {
      console.warn("Pencarian tempat gagal:", err)
      return []
    }
  },

  // ambil rekomendasi tempat populer
  getPopularPlaces() {
    return POPULAR_PLACES
  },
}
