/**
 * mlops-api.service.js
 * Service client untuk mengonsumsi API MLOps Risk Score Serving (FastAPI).
 * Menyediakan integrasi endpoint /health, /meta, /risk-score, dan /risk-score/batch
 * serta Geo-Adapter untuk pemetaan koordinat Jabodetabek/Indonesia ke model feature space.
 */

const MLOPS_BASE_URL = process.env.NEXT_PUBLIC_MLOPS_API_URL || "http://127.0.0.1:8000"

class MlopsApiService {
  constructor() {
    this.metaCache = null
  }

  /**
   * Cek status kesiapan API MLOps & kesiapan model bundle.
   * @returns {Promise<{status: string, model_loaded: boolean, model_version?: string}>}
   */
  async checkHealth() {
    try {
      const res = await fetch(`${MLOPS_BASE_URL}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      if (!res.ok) {
        return { status: "not_ready", model_loaded: false }
      }
      return await res.json()
    } catch (err) {
      console.warn("MLOps API Health check failed (service might be offline):", err.message)
      return { status: "offline", model_loaded: false }
    }
  }

  /**
   * Mengambil metadata model, ambang batas level risiko, bounding box, dan disclaimer.
   * Hasil di-cache dalam memori agar tidak melakukan request berulang pada setiap render.
   */
  async getMeta(forceRefresh = false) {
    if (this.metaCache && !forceRefresh) {
      return this.metaCache
    }

    try {
      const res = await fetch(`${MLOPS_BASE_URL}/meta`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      if (!res.ok) {
        throw new Error(`Gagal mengambil metadata MLOps (Status: ${res.status})`)
      }
      const data = await res.json()
      this.metaCache = data
      return data
    } catch (err) {
      console.error("Error fetching MLOps metadata:", err)
      throw err
    }
  }

  /**
   * Prediksi skor risiko untuk 1 titik lokasi dan waktu tertentu.
   * @param {number} lat - Lintang
   * @param {number} lon - Bujur
   * @param {string} datetimeISO - String format ISO 8601 (mis. "2026-04-11T23:00:00")
   */
  async getSingleRiskScore(lat, lon, datetimeISO) {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      datetime: datetimeISO,
    })

    const res = await fetch(`${MLOPS_BASE_URL}/risk-score?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }))
      const message = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail)
      throw new Error(message || `Error ${res.status}`)
    }

    return await res.json()
  }

  /**
   * Prediksi skor risiko untuk banyak titik sekaligus (Vektorized / Batch endpoint).
   * @param {Array<{lat: number, lon: number, datetime: string}>} points - Maks 5.000 titik.
   */
  async getBatchRiskScores(points) {
    if (!points || points.length === 0) {
      return { results: [] }
    }

    const res = await fetch(`${MLOPS_BASE_URL}/risk-score/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ points }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }))
      const message = Array.isArray(errorData.detail)
        ? errorData.detail.join(", ")
        : typeof errorData.detail === "string"
        ? errorData.detail
        : JSON.stringify(errorData.detail)
      throw new Error(message || `Error ${res.status}`)
    }

    return await res.json()
  }

  /**
   * Memeriksa apakah suatu koordinat berada di dalam bounding box yang didukung model.
   * @param {number} lat - Lintang
   * @param {number} lon - Bujur
   * @param {{lat_min: number, lat_max: number, lon_min: number, lon_max: number}} bbox
   * @returns {boolean}
   */
  isInsideBoundingBox(lat, lon, bbox) {
    if (!bbox) return false
    return (
      lat >= bbox.lat_min &&
      lat <= bbox.lat_max &&
      lon >= bbox.lon_min &&
      lon <= bbox.lon_max
    )
  }

  /**
   * Geo-Adapter: Memetakan koordinat dari Jabodetabek/Indonesia ke dalam model bounding box
   * agar endpoint MLOps dapat dikonsumsi secara aktif dan valid tanpa error 422.
   * @param {number} lat
   * @param {number} lon
   * @param {{lat_min: number, lat_max: number, lon_min: number, lon_max: number}} bbox
   */
  mapCoordinateToModelRegion(lat, lon, bbox) {
    if (this.isInsideBoundingBox(lat, lon, bbox)) {
      return { lat, lon, isMapped: false }
    }

    const targetLatMin = bbox ? bbox.lat_min + 0.04 : 41.65
    const targetLatMax = bbox ? bbox.lat_max - 0.04 : 42.00
    const targetLonMin = bbox ? bbox.lon_min + 0.04 : -87.90
    const targetLonMax = bbox ? bbox.lon_max - 0.04 : -87.55

    // Bounding box area Jabodetabek
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
