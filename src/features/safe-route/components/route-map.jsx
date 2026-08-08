"use client"

import React, { useEffect, useRef, useState } from "react"
import { ShieldCheck, AlertTriangle, Eye, Layers } from "lucide-react"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../constants/safe-route.constants"
import { IncidentDetailDrawer } from "@/features/heatmap/components/incident-detail-drawer"
import { RISK_LEVELS } from "@/features/heatmap/constants/heatmap.constants"
import { enrichHeatmapIncident } from "@/features/heatmap/services/heatmap.service"
import "mapbox-gl/dist/mapbox-gl.css"

// normalisasi zona risiko ke format hotspot heatmap
const normalizeRiskZoneForHeatmap = (zone) => {
  const levelStr = String(zone.riskLevel || "").toLowerCase()
  let level = "high"
  if (levelStr.includes("tinggi") || levelStr === "high") level = "high"
  else if (levelStr.includes("sedang") || levelStr === "medium") level = "medium"
  else if (levelStr.includes("rendah") || levelStr === "low") level = "low"
  else if (levelStr.includes("aman") || levelStr === "safe") level = "safe"

  const title = zone.title || zone.name || "Zona Rawan Insiden"
  const category = zone.category || zone.reason || "Area Rawan Kejahatan"
  const location = zone.location || zone.name || "Area Sekitar Rute"
  const areaName = zone.areaName || zone.name?.replace(/Area |Gang |Jalur /gi, "") || "Zona Rawan"
  const incidentCount = zone.incidentCount || zone.totalReports || 3
  const riskScore = zone.riskScore || (level === "high" ? 85 : level === "medium" ? 65 : 35)

  return {
    ...zone,
    id: zone.id || `rz-${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    name: title,
    category,
    riskLevel: level,
    location,
    areaName,
    incidentCount,
    totalReports: incidentCount,
    riskScore,
    coordinates: zone.coordinates,
    glowSize: zone.glowSize || (level === "high" ? 150 : 120),
    hasCenterHole: zone.hasCenterHole !== undefined ? zone.hasCenterHole : level === "high",
    timeOfDay: zone.timeOfDay || "19.00 - 02.00 WIB",
    peakHours: zone.peakHours || "20.00 - 01.00 WIB",
    safePoint: zone.safePoint || "Pos Polisi Terdekat",
    safeDistance: zone.safeDistance || "350 m",
    incidentTypes: zone.incidentTypes || [
      { name: "Penerangan Minim", total: Math.max(1, Math.floor(incidentCount * 0.6)), color: "#f59e0b" },
      { name: "Catcalling", total: Math.max(1, Math.floor(incidentCount * 0.3)), color: "#ec4899" },
      { name: "Jalan Sepi", total: Math.max(1, Math.floor(incidentCount * 0.1)), color: "#7c3aed" },
    ],
  }
}

// normalisasi safe point ke format dot heatmap
const normalizeSafePointForHeatmap = (point) => {
  const title = point.name || "Titik Aman (Safe Point)"
  const category = point.categoryLabel || "Pos Keamanan / Titik Aman"
  const location = point.address || point.name || "Area Aman"
  const areaName = point.name || "Safe Point"

  return {
    ...point,
    id: point.id || `sp-${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    name: title,
    category,
    categoryLabel: category,
    riskLevel: "safe",
    location,
    areaName,
    incidentCount: 0,
    totalReports: 0,
    riskScore: 10,
    coordinates: point.coordinates,
    isDot: true,
    color: "#0284c7",
    timeOfDay: "24 Jam Siaga",
    peakHours: "24 Jam",
    safePoint: title,
    safeDistance: "0 m",
    features: point.features || ["Penjagaan 24 Jam", "Lampu Penerangan Terang", "Jalur Evakuasi"],
    incidentTypes: [],
  }
}

export function RouteMap({
  routes = [],
  safePoints = [],
  riskZones = [],
  selectedRouteId,
  onSelectRoute,
  onSelectIncident,
  className = "",
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const [showSafePoints, setShowSafePoints] = useState(true)
  const [showRiskZones, setShowRiskZones] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState(null)

  // inisialisasi peta mapboxmapbox
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return
    if (mapInstanceRef.current) return

    let map = null

    import("mapbox-gl").then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

      try {
        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: DEFAULT_MAP_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
        })

        mapInstanceRef.current = map

        map.on("load", () => {
          map.resize()

          // tambahkan fallback layer google raster
          map.addSource("google-tiles", {
            type: "raster",
            tiles: ["https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"],
            tileSize: 256,
          })

          map.addLayer({
            id: "google-layer",
            type: "raster",
            source: "google-tiles",
            paint: { "raster-opacity": 1 },
          })
        })
      } catch (err) {
        console.warn("Gagal inisialisasi Mapbox:", err)
      }
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // gambar layer rute & marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    import("mapbox-gl").then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default

      const renderLayers = () => {
        // bersihkan marker lama
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]
        routes.forEach((route) => {
          const sourceId = `route-source-${route.id}`
          const layerId = `route-layer-${route.id}`
          const dotsSourceId = `route-dots-source-${route.id}`
          const dotsCasingId = `route-dots-casing-${route.id}`
          const dotsLayerId = `route-dots-layer-${route.id}`

          if (map.getLayer(layerId)) map.removeLayer(layerId)
          if (map.getLayer(dotsLayerId)) map.removeLayer(dotsLayerId)
          if (map.getLayer(dotsCasingId)) map.removeLayer(dotsCasingId)
          if (map.getSource(sourceId)) map.removeSource(sourceId)
          if (map.getSource(dotsSourceId)) map.removeSource(dotsSourceId)
        })

        // gambar titik-titik rute (screen space dots)
        if (activeRoute && activeRoute.coordinates?.length >= 2) {
          const route = activeRoute
          const dotsSourceId = `route-dots-source-${route.id}`
          const dotsCasingId = `route-dots-casing-${route.id}`
          const dotsLayerId = `route-dots-layer-${route.id}`

          const updateScreenDots = () => {
            try {
              const src = map.getSource(dotsSourceId)
              if (src) {
                src.setData(generateScreenSpaceDots(route.coordinates, map, 20))
              }
            } catch (e) {}
          }

          const dotsGeoJson = generateScreenSpaceDots(route.coordinates, map, 20)
          if (!map.getSource(dotsSourceId)) {
            map.addSource(dotsSourceId, { type: "geojson", data: dotsGeoJson })
          } else {
            map.getSource(dotsSourceId).setData(dotsGeoJson)
          }

          if (!map.getLayer(dotsCasingId)) {
            map.addLayer({
              id: dotsCasingId,
              type: "circle",
              source: dotsSourceId,
              paint: {
                "circle-radius": 5.5,
                "circle-color": "#ffffff",
                "circle-opacity": 0.95,
              },
            })
          }

          if (!map.getLayer(dotsLayerId)) {
            map.addLayer({
              id: dotsLayerId,
              type: "circle",
              source: dotsSourceId,
              paint: {
                "circle-radius": 3.8,
                "circle-color": route.color || "#e8195a",
                "circle-opacity": 1,
              },
            })
          }

          map.off("zoom", updateScreenDots)
          map.off("zoomend", updateScreenDots)
          map.off("moveend", updateScreenDots)
          map.on("zoom", updateScreenDots)
          map.on("zoomend", updateScreenDots)
          map.on("moveend", updateScreenDots)
        }

        // render marker safe points
        if (showSafePoints && safePoints.length > 0) {
          safePoints.forEach((rawPoint) => {
            const item = normalizeSafePointForHeatmap(rawPoint)
            const isSelected = selectedIncident?.id === item.id
            const dotColor = item.color || "#0284c7"

            const el = document.createElement("div")
            el.className = `relative flex flex-col items-center justify-center transition-transform duration-200 pointer-events-none has-[.inner-circle:hover]:z-[45] ${
              isSelected ? "scale-125 z-30" : "z-10"
            }`
            el.style.width = "16px"
            el.style.height = "16px"

            el.innerHTML = `
              <div class="relative flex items-center justify-center w-full h-full">
                <div class="inner-circle group relative z-30 pointer-events-auto flex items-center justify-center cursor-pointer">
                  <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 pointer-events-none z-[45] whitespace-nowrap">
                    <div 
                      class="relative flex flex-col items-center text-white px-2.5 py-1 rounded-xl shadow-lg border border-white/20 text-xs font-medium leading-tight"
                      style="background-color: ${dotColor};"
                    >
                      <span class="font-bold text-white text-[11px] drop-shadow-xs">${item.areaName || item.title}</span>
                      <span class="text-[10px] text-white/90 font-medium mt-0.5 max-w-[170px] truncate text-center drop-shadow-xs">
                        🛡️ ${item.category || item.categoryLabel || 'Titik Aman'}
                      </span>
                      <div 
                        class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-white/20"
                        style="background-color: ${dotColor};"
                      ></div>
                    </div>
                  </div>

                  <div 
                    class="w-3.5 h-3.5 rounded-full shadow-md transition-transform duration-200 group-hover:scale-125 border-2 border-white ${
                      isSelected ? "ring-2 ring-sky-400 ring-offset-2" : ""
                    }"
                    style="background-color: ${dotColor};"
                  ></div>
                </div>
              </div>
            `

            // klik buka detail drawer
            el.addEventListener("click", (e) => {
              e.stopPropagation()
              setSelectedIncident(item)
              if (onSelectIncident) onSelectIncident(item)
              if (map) {
                map.flyTo({
                  center: item.coordinates,
                  zoom: 15,
                  duration: 800,
                })
              }
            })

            const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
              .setLngLat(item.coordinates)
              .addTo(map)

            if (marker.getElement()) marker.getElement().style.zIndex = "20"
            markersRef.current.push(marker)
          })
        }

        // render marker zona risiko heatmap
        if (showRiskZones && riskZones.length > 0) {
          riskZones.forEach((rawZone) => {
            const item = normalizeRiskZoneForHeatmap(rawZone)
            const levelUpper = (item.riskLevel || "high").toUpperCase()
            const riskMeta = RISK_LEVELS[levelUpper] || RISK_LEVELS.HIGH
            const isSelected = selectedIncident?.id === item.id

            const el = document.createElement("div")
            el.className = `relative flex flex-col items-center justify-center transition-transform duration-200 pointer-events-none has-[.inner-circle:hover]:z-[45] ${
              isSelected ? "scale-125 z-30" : "z-10"
            }`

            if (item.isDot) {
              const dotColor = item.color || "#3b82f6"
              el.style.width = "16px"
              el.style.height = "16px"
              el.innerHTML = `
                <div class="relative flex items-center justify-center w-full h-full">
                  <div class="inner-circle group relative z-30 pointer-events-auto flex items-center justify-center cursor-pointer">
                    <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 pointer-events-none z-[45] whitespace-nowrap">
                      <div 
                        class="relative flex flex-col items-center text-white px-2.5 py-1 rounded-xl shadow-lg border border-white/20 text-xs font-medium leading-tight"
                        style="background-color: ${dotColor};"
                      >
                        <span class="font-bold text-white text-[11px] drop-shadow-xs">${item.areaName || item.title || item.name}</span>
                        <span class="text-[10px] text-white/90 font-medium mt-0.5 max-w-[170px] truncate text-center drop-shadow-xs">
                          ${item.category || item.reason || 'Insiden'}
                        </span>
                        <div 
                          class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-white/20"
                          style="background-color: ${dotColor};"
                        ></div>
                      </div>
                    </div>

                    <div 
                      class="w-3.5 h-3.5 rounded-full shadow-md transition-transform duration-200 group-hover:scale-125 border-2 border-white ${
                        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                      }"
                      style="background-color: ${dotColor};"
                    ></div>
                  </div>
                </div>
              `
            } else {
              // visual hotspot glow sama persis interactive map
              const glowSize = item.glowSize || 130
              el.style.width = `${glowSize}px`
              el.style.height = `${glowSize}px`

              const glowColor = riskMeta?.glowColor || "rgba(239, 68, 68, 0.55)"
              const pulseColor = riskMeta?.pulseColor || "rgba(239, 68, 68, 0.2)"
              const solidColor = riskMeta?.color || "#ef4444"

              el.innerHTML = `
                <div class="relative flex items-center justify-center w-full h-full pointer-events-none">
                  <div 
                    class="absolute rounded-full pointer-events-none transition-transform duration-300"
                    style="
                      width: ${glowSize}px;
                      height: ${glowSize}px;
                      background: radial-gradient(circle, ${glowColor} 0%, ${pulseColor} 48%, rgba(255,255,255,0) 70%);
                      filter: blur(10px);
                    "
                  ></div>

                  <div class="inner-circle group relative z-30 pointer-events-auto flex items-center justify-center cursor-pointer">
                    <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 pointer-events-none z-[45] whitespace-nowrap">
                      <div 
                        class="relative flex flex-col items-center text-white px-2.5 py-1 rounded-xl shadow-xl border border-white/20 text-xs font-medium leading-tight"
                        style="background-color: ${solidColor};"
                      >
                        <span class="font-bold text-white text-[11px] drop-shadow-xs">${item.areaName || item.title || item.name}</span>
                        <span class="text-[10px] text-white/90 font-medium mt-0.5 max-w-[180px] truncate text-center drop-shadow-xs">
                          ${item.category || item.reason || 'Zona Rawan'} • ${riskMeta?.label || 'Tinggi'}
                        </span>
                        <div 
                          class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-white/20"
                          style="background-color: ${solidColor};"
                        ></div>
                      </div>
                    </div>

                    <div 
                      class="relative z-10 w-4 h-4 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-125 border-2 border-white ${
                        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                      }"
                      style="background-color: ${solidColor};"
                    >
                      ${
                        item.hasCenterHole || item.riskLevel === "high" || item.riskLevel === "Tinggi"
                          ? `<div class="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></div>`
                          : ""
                      }
                    </div>
                  </div>
                </div>
              `
            }

            // klik buka detail drawer
            el.addEventListener("click", (e) => {
              e.stopPropagation()
              setSelectedIncident(item)
              if (map) {
                map.flyTo({
                  center: item.coordinates,
                  zoom: 14.5,
                  duration: 800,
                })
              }
            })

            const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
              .setLngLat(item.coordinates)
              .addTo(map)

            if (marker.getElement()) marker.getElement().style.zIndex = item.isDot ? "20" : "15"
            markersRef.current.push(marker)
          })
        }

        // render marker titik awal & tujuan - layer paling atas
        if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length >= 2) {
          const startCoords = activeRoute.coordinates[0]
          const endCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1]

          // marker titik awal
          const startEl = document.createElement("div")
          startEl.className = "relative z-[90] w-8 h-10 flex items-center justify-center cursor-pointer drop-shadow-xl select-none"
          startEl.style.zIndex = "90"
          startEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#ffa2cf" stroke="#ffffff" stroke-width="2.4"/><path d="M19 29V14.2M19 14.2L13.4 19.8M19 14.2L24.6 19.8" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

          const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "bottom" })
            .setLngLat(startCoords)
            .addTo(map)

          // marker tujuan
          const endEl = document.createElement("div")
          endEl.className = "relative z-[90] w-9 h-11 flex items-center justify-center cursor-pointer drop-shadow-xl select-none"
          endEl.style.zIndex = "90"
          endEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#e8195a" stroke="#ffffff" stroke-width="2.4"/><circle cx="19" cy="19" r="6.5" fill="white"/></svg>`

          const endMarker = new mapboxgl.Marker({ element: endEl, anchor: "bottom" })
            .setLngLat(endCoords)
            .addTo(map)

          if (startMarker.getElement()) startMarker.getElement().style.zIndex = "90"
          if (endMarker.getElement()) endMarker.getElement().style.zIndex = "90"

          markersRef.current.push(startMarker, endMarker)

          // fit bounds rute aktif
          const bounds = new mapboxgl.LngLatBounds()
          activeRoute.coordinates.forEach((coord) => bounds.extend(coord))
          map.fitBounds(bounds, { padding: 50, duration: 1000 })
        }
      }

      if (map.isStyleLoaded()) {
        renderLayers()
      } else {
        map.once("load", renderLayers)
      }
    })
  }, [routes, selectedRouteId, safePoints, riskZones, showSafePoints, showRiskZones, onSelectRoute, selectedIncident])

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-input shadow-xs bg-slate-100 dark:bg-slate-900">
      {/* kontainer peta mapbox */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* kontrol toggle layer */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          type="button"
          onClick={() => setShowSafePoints(!showSafePoints)}
          className={`px-2.5 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all select-none ${
            showSafePoints
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-background/90 text-muted-foreground hover:bg-background border-input"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Safe Points ({safePoints.length})
        </button>

        <button
          type="button"
          onClick={() => setShowRiskZones(!showRiskZones)}
          className={`px-2.5 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all select-none ${
            showRiskZones
              ? "bg-rose-600 text-white border-rose-700"
              : "bg-background/90 text-muted-foreground hover:bg-background border-input"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Zona Rawan ({riskZones.length})
        </button>
      </div>

      {/* legenda peta */}
      <div className="absolute bottom-20 md:bottom-3 left-3 right-3 md:right-auto bg-background/90 backdrop-blur-md border border-input rounded-lg p-2 text-xs flex flex-wrap items-center gap-3 shadow-md z-10">
        <div className="flex items-center gap-1">
          <span className="w-3 h-1 bg-emerald-500 rounded-full" />
          <span>Rute Teraman</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-1 bg-amber-500 rounded-full" />
          <span>Rute Alternatif</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Safe Point 24 Jam</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Zona Rawan</span>
        </div>
      </div>

      {/* drawer detail insiden hotspot */}
      <IncidentDetailDrawer
        incident={selectedIncident ? enrichHeatmapIncident(selectedIncident) : null}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onOpenReport={() => {}}
      />
    </div>
  )
}

// interpolasi titik-titik lingkaran sempurna berbasis piksel layar konstan
function generateScreenSpaceDots(coordinates, map, pixelSpacing = 20) {
  if (!coordinates || coordinates.length < 2 || !map || typeof map.project !== "function") {
    return { type: "FeatureCollection", features: [] }
  }

  const features = []
  let leftover = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const c1 = coordinates[i]
    const c2 = coordinates[i + 1]
    const p1 = map.project(c1)
    const p2 = map.project(c2)

    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const segPixelDist = Math.sqrt(dx * dx + dy * dy)

    if (segPixelDist <= 0) continue

    let dist = leftover > 0 ? leftover : 0
    while (dist <= segPixelDist) {
      const t = dist / segPixelDist
      const x = p1.x + dx * t
      const y = p1.y + dy * t
      const unprojected = map.unproject([x, y])

      features.push({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [unprojected.lng, unprojected.lat],
        },
      })
      dist += pixelSpacing
    }
    leftover = dist - segPixelDist
  }

  return {
    type: "FeatureCollection",
    features,
  }
}

