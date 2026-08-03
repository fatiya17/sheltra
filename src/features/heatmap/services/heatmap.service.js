import { MOCK_HEATMAP_INCIDENTS, TIME_RANGE_OPTIONS, RISK_LEVELS } from "../constants/heatmap.constants"

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
