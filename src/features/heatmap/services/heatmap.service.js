import { MOCK_HEATMAP_INCIDENTS, TIME_RANGE_OPTIONS, RISK_LEVELS } from "../constants/heatmap.constants"

// nilai default turunan berdasarkan tingkat risiko
const RISK_SCORE_BY_LEVEL = {
  high: 85,
  medium: 62,
  low: 38,
  safe: 12,
  blue_point: 45,
  purple_point: 50,
}

const REPORT_COUNT_BY_LEVEL = {
  high: 12,
  medium: 7,
  low: 3,
  safe: 0,
  blue_point: 2,
  purple_point: 4,
}

const pad2 = (n) => String(n).padStart(2, "0")

// turunkan rentang jam rawan dari waktu kejadian
function derivePeakHours(timeOfDay, riskLevel) {
  if (riskLevel === "safe") return "24 Jam"
  const match = /(\d{1,2}):\d{2}/.exec(timeOfDay || "")
  if (!match) return "19.00 - 03.00 WIB"
  const h = parseInt(match[1], 10)
  const start = (h - 2 + 24) % 24
  const end = (h + 3) % 24
  return `${pad2(start)}.00 - ${pad2(end)}.00 WIB`
}

// jarak haversine (km) antara dua [lon, lat]
function haversine(a, b) {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// perkaya data insiden dengan field yang dibutuhkan popup detail
export function enrichHeatmapIncident(item, allIncidents = []) {
  if (!item) return item
  const level = item.riskLevel?.toLowerCase()
  const riskScore = item.riskScore ?? RISK_SCORE_BY_LEVEL[level] ?? 50
  const incidentCount = item.incidentCount ?? REPORT_COUNT_BY_LEVEL[level] ?? 1
  const peakHours = item.peakHours ?? derivePeakHours(item.timeOfDay, level)

  let nearestSafePoint = item.nearestSafePoint
  if (!nearestSafePoint && Array.isArray(item.coordinates)) {
    const safe = allIncidents.filter((i) => i.riskLevel === "safe" && i.id !== item.id)
    if (safe.length) {
      let best = null
      let bestDist = Infinity
      for (const s of safe) {
        if (!Array.isArray(s.coordinates)) continue
        const d = haversine(item.coordinates, s.coordinates)
        if (d < bestDist) {
          bestDist = d
          best = s
        }
      }
      if (best) nearestSafePoint = `${best.title} · ${best.location}`
    }
  }
  if (!nearestSafePoint) nearestSafePoint = "Pos Polisi Terdekat"

  return { ...item, riskScore, incidentCount, peakHours, nearestSafePoint }
}

// service pengolahan data heatmap
class HeatmapService {
  constructor() {
    this.incidents = [...MOCK_HEATMAP_INCIDENTS]
  }

  // filter data berdasarkan rentang waktu
  filterByTimeRange(timeRangeId, incidentList = this.incidents) {
    const selectedOption = TIME_RANGE_OPTIONS.find((opt) => opt.id === timeRangeId) || TIME_RANGE_OPTIONS[0]
    if (selectedOption.id === "all") return incidentList

    const now = Date.now()
    const thresholdMs = selectedOption.days * 24 * 60 * 60 * 1000

    return incidentList.filter((item) => {
      const itemTime = new Date(item.reportedAt).getTime()
      return now - itemTime <= thresholdMs
    })
  }

  // filter data berdasarkan kata kunci
  filterByQuery(query, incidentList) {
    if (!query || !query.trim()) return incidentList
    const q = query.toLowerCase().trim()
    return incidentList.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.areaName?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    )
  }

  // konversi data ke format geojson mapbox
  toGeoJSON(incidentList) {
    return {
      type: "FeatureCollection",
      features: incidentList.map((item) => {
        const riskMeta = RISK_LEVELS[item.riskLevel.toUpperCase()] || RISK_LEVELS.LOW
        return {
          type: "Feature",
          properties: {
            id: item.id,
            title: item.title,
            category: item.category,
            riskLevel: item.riskLevel,
            riskColor: riskMeta.color,
            weight: riskMeta.intensityWeight,
            incidentCount: item.incidentCount || 1,
            timeOfDay: item.timeOfDay,
            areaName: item.areaName,
          },
          geometry: {
            type: "Point",
            coordinates: item.coordinates,
          },
        }
      }),
    }
  }

  // hitung statistik wawasan risiko
  calculateRiskInsights(incidentList) {
    const total = incidentList.length
    const highRisk = incidentList.filter((i) => i.riskLevel === "high").length
    const mediumRisk = incidentList.filter((i) => i.riskLevel === "medium").length
    const lowRisk = incidentList.filter((i) => i.riskLevel === "low").length
    const safeSpots = incidentList.filter((i) => i.riskLevel === "safe").length

    return {
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      safeSpots,
      riskScore: total > 0 ? Math.round(((highRisk * 3 + mediumRisk * 2 + lowRisk * 1) / (total * 3)) * 100) : 0,
    }
  }

  // tambahkan laporan baru anonim ke dataset
  addNewReport(report) {
    const newIncident = {
      id: report.id || `inc-${Date.now()}`,
      title: report.category || "Laporan Insiden Baru",
      category: report.category || "Lainnya",
      riskLevel: "medium",
      location: report.location || "Lokasi Kejadian",
      areaName: report.location?.split(",")[0] || "Area Publik",
      coordinates: report.coordinates || [106.8315, -6.3685],
      incidentCount: 1,
      reportedAt: new Date().toISOString(),
      timeOfDay: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      moderationStatus: "Telah Terverifikasi Komunitas",
      description: report.description || "Laporan insiden baru dari pengguna.",
      evidenceImage: report.evidence?.previewUrl || null,
      verifiedCount: 1,
    }
    this.incidents = [newIncident, ...this.incidents]
    return newIncident
  }
}

export const heatmapService = new HeatmapService()
