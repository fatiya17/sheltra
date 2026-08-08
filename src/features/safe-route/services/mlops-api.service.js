import axios from "axios"

// base url api mlops
const MLOPS_BASE_URL = process.env.NEXT_PUBLIC_MLOPS_API_URL || "http://127.0.0.1:8000"

// instance axios khusus mlops
export const mlopsClient = axios.create({
  baseURL: MLOPS_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

class MlopsApiService {
  constructor() {
    // cache metadata di memori
    this.metaCache = null
  }

  // helper format error axios
  _formatError(err) {
    if (err.response?.data) {
      const detail = err.response.data.detail
      if (typeof detail === "string") return detail
      if (Array.isArray(detail)) {
        return detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
      }
      if (detail) return JSON.stringify(detail)
    }
    return err.message || "Terjadi kesalahan pada layanan MLOps"
  }

  // cek health service mlops
  async checkHealth() {
    try {
      const res = await mlopsClient.get("/health", { timeout: 3000 })
      return res.data
    } catch (err) {
      console.warn("mlops health check gagal:", err.message)
      return { status: "offline", model_loaded: false }
    }
  }

  // ambil metadata model mlops
  async getMeta(forceRefresh = false) {
    if (this.metaCache && !forceRefresh) {
      return this.metaCache
    }

    try {
      const res = await mlopsClient.get("/meta")
      this.metaCache = res.data
      return res.data
    } catch (err) {
      console.error("gagal fetch metadata mlops:", this._formatError(err))
      throw new Error(this._formatError(err))
    }
  }

  // prediksi skor satu titik
  async getSingleRiskScore(lat, lon, datetimeISO, config = {}) {
    try {
      const res = await mlopsClient.get("/risk-score", {
        params: {
          lat: Number(lat),
          lon: Number(lon),
          datetime: datetimeISO,
        },
        ...config,
      })
      return res.data
    } catch (err) {
      throw new Error(this._formatError(err))
    }
  }

  // prediksi batch multi titik
  async getBatchRiskScores(points, config = {}) {
    if (!points || points.length === 0) {
      return { results: [] }
    }

    try {
      const res = await mlopsClient.post(
        "/risk-score/batch",
        { points },
        config
      )
      return res.data
    } catch (err) {
      throw new Error(this._formatError(err))
    }
  }

  // validasi bounding box model
  isInsideBoundingBox(lat, lon, bbox) {
    if (!bbox) return false
    return (
      lat >= bbox.lat_min &&
      lat <= bbox.lat_max &&
      lon >= bbox.lon_min &&
      lon <= bbox.lon_max
    )
  }

  // adapter mapping koordinat region
  mapCoordinateToModelRegion(lat, lon, bbox) {
    if (this.isInsideBoundingBox(lat, lon, bbox)) {
      return { lat, lon, isMapped: false }
    }

    const targetLatMin = bbox ? bbox.lat_min + 0.04 : 41.65
    const targetLatMax = bbox ? bbox.lat_max - 0.04 : 42.00
    const targetLonMin = bbox ? bbox.lon_min + 0.04 : -87.90
    const targetLonMax = bbox ? bbox.lon_max - 0.04 : -87.55

    // bounding box area jabodetabek
    const jktLatMin = -6.45
    const jktLatMax = -6.08
    const jktLonMin = 106.65
    const jktLonMax = 107.05

    const normLat = Math.max(0, Math.min(1, (lat - jktLatMin) / (jktLatMax - jktLatMin)))
    const normLon = Math.max(0, Math.min(1, (lon - jktLonMin) / (jktLonMax - jktLonMin)))

    const mappedLat = targetLatMin + normLat * (targetLatMax - targetLatMin)
    const mappedLon = targetLonMin + normLon * (targetLonMax - targetLonMin)

    return {
      lat: Math.round(mappedLat * 10000) / 10000,
      lon: Math.round(mappedLon * 10000) / 10000,
      isMapped: true,
    }
  }
}

export const mlopsApiService = new MlopsApiService()
export { MlopsApiService }

