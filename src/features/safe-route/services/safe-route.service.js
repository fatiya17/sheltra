import {
  MOCK_ROUTES,
  MOCK_SAFE_POINTS,
  MOCK_RISK_ZONES,
  ROUTE_PRESETS,
  HOURLY_RISK_FACTORS,
} from "../constants/safe-route.constants"

// helper cek apakah area blank spot
function checkIsBlankSpot(originLabel, destLabel, isExplicitBlank) {
  if (isExplicitBlank) return true
  const query = `${originLabel} ${destLabel}`.toLowerCase()
  return (
    query.includes("blank") ||
    query.includes("terpencil") ||
    query.includes("sukatani") ||
    query.includes("pinggiran") ||
    query.includes("perbatasan")
  )
}

// helper hitung modifier risiko berdasarkan jam
function calculateTimeModifier(hour) {
  if (hour >= 6 && hour < 18) {
    return {
      scoreOffset: 0,
      riskTag: "Rendah",
      advice: "Pencahayaan & keramaian rute dalam kondisi optimal.",
    }
  } else if (hour >= 18 && hour < 21) {
    return {
      scoreOffset: -6,
      riskTag: "Waspada",
      advice: "Matahari terbenam. Pertahankan rute jalan utama yang berpenerangan.",
    }
  } else if (hour >= 21 && hour < 24) {
    return {
      scoreOffset: -14,
      riskTag: "Sedang - Perlu Waspada",
      advice: "Waktu larut malam. Pastikan melewati Safe Points 24 jam dan bagikan live tracking.",
    }
  } else {
    return {
      scoreOffset: -22,
      riskTag: "Tinggi - Waspada Ekstra",
      advice: "Tengah malam / dini hari. Hindari gang sepi & prioritaskan transportasi aman.",
    }
  }
}

// helper mapping profil rute mapbox
function getDirectionsProfile(mode) {
  switch (mode) {
    case "motorcycle":
    case "car":
      return "driving-traffic"
    case "bike":
      return "cycling"
    case "walking":
    default:
      return "walking"
  }
}

// helper format jarak & durasi
function formatDuration(seconds) {
  const mins = Math.max(1, Math.round(seconds / 60))
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remMins = mins % 60
    return `${hours} jam ${remMins > 0 ? `${remMins} mnt` : ""}`
  }
  return `${mins} mnt`
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

function calculatePolylineLength(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return 0

  return coordinates.reduce((total, current, index) => {
    if (index === 0) return total

    const previous = coordinates[index - 1]
    const avgLat = ((current[1] + previous[1]) / 2) * (Math.PI / 180)
    const deltaLng = (current[0] - previous[0]) * 111320 * Math.cos(avgLat)
    const deltaLat = (current[1] - previous[1]) * 110540
    return total + Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat)
  }, 0)
}

function calculateStraightDistance(start, end) {
  if (!start || !end) return 0

  const avgLat = ((start[1] + end[1]) / 2) * (Math.PI / 180)
  const deltaLng = (end[0] - start[0]) * 111320 * Math.cos(avgLat)
  const deltaLat = (end[1] - start[1]) * 110540
  return Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat)
}

function isMeaningfulRoadRoute(route) {
  const coordinates = route?.coordinates || []
  if (coordinates.length < 4) return false

  const routeLength = calculatePolylineLength(coordinates)
  const straightDistance = calculateStraightDistance(coordinates[0], coordinates[coordinates.length - 1])

  if (!straightDistance) return false

  return routeLength / straightDistance >= 1.08
}

export const safeRouteService = {
  // kalkulasi rute aman dinamis / preset
  async calculateSafeRoutes({
    origin,
    destination,
    departureTime = "20:00",
    travelMode = "walking",
    presetId = null,
    isBlankSpotMode = false,
  }) {
    const isBlank =
      isBlankSpotMode ||
      presetId === "preset-blank-spot" ||
      checkIsBlankSpot(origin?.label || "", destination?.label || "", false)

    // penanganan edge case blank spot
    if (isBlank) {
      const blankRoutes = MOCK_ROUTES["preset-blank-spot"]
      return {
        routes: blankRoutes,
        origin: origin || ROUTE_PRESETS[2].origin,
        destination: destination || ROUTE_PRESETS[2].destination,
        departureTime,
        travelMode,
        isBlankSpot: true,
        disclaimer:
          "Data keamanan & riwayat insiden belum tersedia di area ini. Rute ditampilkan berdasarkan jaringan jalan umum standar.",
        timeRiskAnalysis: {
          isTimeDataLimited: true,
          generalRiskLevel: "Tidak Terdefinisi (Data Minim)",
          notice: "Prediksi per jam tidak tersedia untuk area ini; menampilkan rute dasar jalan raya.",
          hourlyTimeline: [],
        },
        safePoints: [],
        riskZones: [],
      }
    }

    const [hourStr] = departureTime.split(":")
    const hourNum = parseInt(hourStr || "20", 10)
    const timeMod = calculateTimeModifier(hourNum)

    // coba hitung rute asli jika koordinat tersedia
    const hasRealCoords =
      origin?.coordinates &&
      destination?.coordinates &&
      origin.coordinates.length === 2 &&
      destination.coordinates.length === 2

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    let dynamicRoutes = null

    if (hasRealCoords) {
      try {
        const profile = getDirectionsProfile(travelMode)
        const originCoordStr = `${origin.coordinates[0]},${origin.coordinates[1]}`
        const destCoordStr = `${destination.coordinates[0]},${destination.coordinates[1]}`

        let rawRoutes = []

        if (mapboxToken) {
          try {
            const dirUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originCoordStr};${destCoordStr}?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken}&alternatives=true`
            const res = await fetch(dirUrl)
            if (res.ok) {
              const dirData = await res.json()
              if (dirData.routes && dirData.routes.length > 0) {
                rawRoutes = dirData.routes
              }
            }

            // jika hanya dapat 1 rute dari mapbox, ambil rute alternatif kedua
            if (rawRoutes.length === 1) {
              const altProfile = profile === "walking" ? "driving" : "walking"
              const altUrl = `https://api.mapbox.com/directions/v5/mapbox/${altProfile}/${originCoordStr};${destCoordStr}?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken}`
              const altRes = await fetch(altUrl)
              if (altRes.ok) {
                const altData = await altRes.json()
                if (altData.routes && altData.routes.length > 0) {
                  rawRoutes.push(altData.routes[0])
                }
              }
            }
          } catch (mErr) {
            console.warn("mapbox directions gagal:", mErr)
          }
        }

        // fallback ke OSRM jika mapbox gagal atau tidak ada token
        if (rawRoutes.length === 0) {
          try {
            const osrmProfile = travelMode === "walking" ? "foot" : travelMode === "motorcycle" ? "bike" : "driving"
            const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${originCoordStr};${destCoordStr}?overview=full&geometries=geojson&alternatives=true`
            const osrmRes = await fetch(osrmUrl)
            if (osrmRes.ok) {
              const osrmData = await osrmRes.json()
              if (osrmData.routes && osrmData.routes.length > 0) {
                rawRoutes = osrmData.routes
              }
            }
          } catch (oErr) {
            console.warn("osrm directions gagal:", oErr)
          }
        }

        if (rawRoutes.length > 0) {
          dynamicRoutes = rawRoutes.map((r, idx) => {
            const isPrimary = idx === 0
            const baseScore = isPrimary ? 94 : 72
            const adjustedScore = Math.max(
              20,
              Math.min(99, baseScore + timeMod.scoreOffset)
            )

            let riskLevel = "Rendah"
            if (adjustedScore < 60) riskLevel = "Tinggi"
            else if (adjustedScore < 80) riskLevel = "Sedang"

            return {
              id: `real-route-${idx + 1}`,
              title: isPrimary
                ? "Rute Teraman"
                : "Rute Tercepat (Jalur Alternatif)",
              tag: isPrimary ? "Paling Direkomendasikan" : "Jalur Alternatif",
              isSafest: isPrimary,
              isBlankSpot: false,
              safetyScore: adjustedScore,
              riskLevel,
              duration: formatDuration(r.duration),
              distance: formatDistance(r.distance),
              lightingScore: isPrimary ? 95 : 68,
              crowdDensityScore: isPrimary ? 90 : 58,
              safePointsCount: isPrimary ? 5 : 2,
              passedSafePointIds: ["sp-1", "sp-2", "sp-3", "sp-4", "sp-6"],
              incidentReportsCount: isPrimary ? 0 : 1,
              highlights: isPrimary
                ? [
                    "Melewati jalur utama berpenerangan baik",
                    "Terhubung ke titik aman dan pos siaga 24 jam",
                    "Kepadatan lalu lintas & pejalan kaki aman",
                  ]
                : [
                    "Jalur alternatif melalui jalan penghubung",
                    "Penerangan sedang di beberapa ruas jalan",
                  ],
              color: isPrimary ? "#ffa2cf" : "#f59e0b",
              coordinates: r.geometry.coordinates,
              currentHourAdvice: timeMod.advice,
            }
          })
        }
      } catch (err) {
        console.warn("Gagal kalkulasi rute dinamis:", err)
      }
    }

    // tentukan dataset rute
    let baseRouteList = []
    if (dynamicRoutes && dynamicRoutes.length > 0) {
      baseRouteList = dynamicRoutes
    } else if (presetId && MOCK_ROUTES[presetId]) {
      baseRouteList = MOCK_ROUTES[presetId]
    } else if (
      origin?.label?.toLowerCase().includes("blok m") ||
      destination?.label?.toLowerCase().includes("gandaria")
    ) {
      baseRouteList = MOCK_ROUTES["preset-blokm-gandaria"]
    } else {
      baseRouteList = MOCK_ROUTES["preset-sudirman-senopati"]
    }

    // sesuaikan skor berdasarkan waktu jika belum dihitung
    const adjustedRoutes = baseRouteList.map((route) => {
      if (route.currentHourAdvice) return route

      const adjustedScore = Math.max(
        15,
        Math.min(99, route.safetyScore + timeMod.scoreOffset)
      )
      let riskLevel = "Rendah"
      if (adjustedScore < 60) riskLevel = "Tinggi"
      else if (adjustedScore < 80) riskLevel = "Sedang"

      return {
        ...route,
        safetyScore: adjustedScore,
        riskLevel,
        currentHourAdvice: timeMod.advice,
      }
    })

    // buat timeline prediksi risiko per jam
    const hourlyTimeline = HOURLY_RISK_FACTORS.map((item) => {
      const [h] = item.hour.split(":")
      const hInt = parseInt(h, 10)
      const isSelectedHour = Math.abs(hInt - hourNum) <= 1
      return {
        ...item,
        isSelected: isSelectedHour,
        adjustedRisk: Math.min(
          95,
          Math.max(5, item.baseRisk + (travelMode === "walking" ? 5 : 0))
        ),
      }
    })

    return {
      routes: adjustedRoutes,
      origin: origin || ROUTE_PRESETS[0].origin,
      destination: destination || ROUTE_PRESETS[0].destination,
      departureTime,
      travelMode,
      isBlankSpot: false,
      disclaimer: null,
      timeRiskAnalysis: {
        isTimeDataLimited: false,
        currentHour: departureTime,
        currentHourRiskLevel: timeMod.riskTag,
        contextualAdvice: timeMod.advice,
        hourlyTimeline,
      },
      safePoints: MOCK_SAFE_POINTS,
      riskZones: MOCK_RISK_ZONES,
    }
  },
}
