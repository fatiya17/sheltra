"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  ArrowUp,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  LocateFixed,
  Share2,
  Users,
  Sun,
  Clock,
  ChevronUp,
  ChevronDown,
  Footprints,
  Bike,
  Car,
  Square,
} from "lucide-react"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, TRAVEL_MODES } from "../constants/safe-route.constants"
import { RiskTimeline } from "./risk-timeline"
import { SafeRouteNavSimulation } from "./safe-route-nav-simulation"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
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

export function SafeRouteMapView({
  routeData,
  selectedRouteId,
  onSelectRoute,
  onBack,
  onOpenSearch,
  onTimeChange,
  onModeChange,
}) {
  const toast = useToast()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // state kontrol layer peta
  const [showSafePoints, setShowSafePoints] = useState(true)
  const [showRiskZones, setShowRiskZones] = useState(true)
  // state insiden heatmap terpilih
  const [selectedIncident, setSelectedIncident] = useState(null)
  // state tinggi bottom sheet mobile ("minimized", "half", "expanded")
  const [sheetState, setSheetState] = useState("half")
  const [dragOffset, setDragOffset] = useState(0)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)

  const hasExtraContent = (routeData?.routes?.length || 0) > 2 || Boolean(routeData?.timeRiskAnalysis)

  // touch event handler untuk mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      startYRef.current = e.touches[0].clientY
      isDraggingRef.current = true
    }
  }

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return
    if (e.touches && e.touches[0]) {
      const currentY = e.touches[0].clientY
      const delta = currentY - startYRef.current
      if (!hasExtraContent && sheetState === "half" && delta < 0) {
        setDragOffset(0)
      } else {
        setDragOffset(delta)
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const delta = dragOffset
    setDragOffset(0)

    if (delta > 30) {
      setSheetState("minimized")
    } else if (delta < -30) {
      if (sheetState === "minimized") {
        setSheetState("half")
      } else if (hasExtraContent) {
        setSheetState("expanded")
      }
    } else if (Math.abs(delta) < 5) {
      setSheetState((prev) => (prev === "minimized" ? "half" : "minimized"))
    }
  }

  // mouse event handler untuk desktop/simulator
  const handleMouseDown = (e) => {
    if (typeof window === "undefined") return
    startYRef.current = e.clientY
    isDraggingRef.current = true

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return
      const delta = moveEvent.clientY - startYRef.current
      if (!hasExtraContent && sheetState === "half" && delta < 0) {
        setDragOffset(0)
      } else {
        setDragOffset(delta)
      }
    }

    const handleMouseUp = (upEvent) => {
      isDraggingRef.current = false
      const delta = upEvent.clientY - startYRef.current
      setDragOffset(0)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      if (delta > 30) {
        setSheetState("minimized")
      } else if (delta < -30) {
        if (sheetState === "minimized") {
          setSheetState("half")
        } else if (hasExtraContent) {
          setSheetState("expanded")
        }
      } else if (Math.abs(delta) < 5) {
        setSheetState((prev) => (prev === "minimized" ? "half" : "minimized"))
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  const [isNavigating, setIsNavigating] = useState(false)

  const routes = routeData?.routes || []
  const safePoints = routeData?.safePoints || []
  const riskZones = routeData?.riskZones || []
  const isBlankSpot = routeData?.isBlankSpot
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

  // inisialisasi mapbox instance
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
          attributionControl: false,
        })

        mapInstanceRef.current = map

        map.on("load", () => {
          map.resize()

          // fallback layer google raster
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

  // render rute & layer interaktif di peta
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    import("mapbox-gl").then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default

      const render = () => {
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

        // render safe points
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

        // render zona risiko heatmap
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

        // render pin titik awal & tujuan - layer paling atas
        if (activeRoute && activeRoute.coordinates.length >= 2) {
          const startCoords = activeRoute.coordinates[0]
          const endCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1]

          // pin jemput primary
          const startEl = document.createElement("div")
          startEl.className = "relative z-[90] w-8 h-10 flex items-center justify-center cursor-pointer drop-shadow-xl select-none"
          startEl.style.zIndex = "90"
          startEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#ffa2cf" stroke="#ffffff" stroke-width="2.4"/><path d="M19 29V14.2M19 14.2L13.4 19.8M19 14.2L24.6 19.8" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

          const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "bottom" })
            .setLngLat(startCoords)
            .addTo(map)

          // pin tujuan rose
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

          // fit bounds rute
          const bounds = new mapboxgl.LngLatBounds()
          activeRoute.coordinates.forEach((coord) => bounds.extend(coord))

          const isDesktop = window.innerWidth >= 768
          map.fitBounds(bounds, {
            padding: isDesktop
              ? { top: 100, bottom: 140, left: 470, right: 60 }
              : { top: 170, bottom: 240, left: 30, right: 30 },
            duration: 1000,
          })
        }
      }

      if (map.isStyleLoaded()) {
        render()
      } else {
        map.once("load", render)
      }
    })
  }, [routes, selectedRouteId, safePoints, riskZones, showSafePoints, showRiskZones, activeRoute, selectedIncident])

  // handler share tracking
  const handleShareTracking = () => {
    if (navigator.share) {
      navigator.share({
        title: "Live Safe Tracking - Safe Commute",
        text: `Saya sedang dalam perjalanan menuju ${routeData?.destination?.label} melalui Rute Teraman.`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard?.writeText(window.location.href)
      toast({
        title: "Tautan Live Tracking Disalin",
        body: "Bagikan tautan ini ke kontak darurat atau keluarga Anda.",
        type: "success",
      })
    }
  }

  // handler mulai navigasi
  const handleStartNavigation = () => {
    if (isNavigating) {
      setIsNavigating(false)
      toast({
        title: "Navigasi Dihentikan",
        body: "Simulasi navigasi telah dihentikan.",
        type: "default",
      })
    } else {
      setIsNavigating(true)
      toast({
        title: "Navigasi Dimulai",
        body: "Simulasi panduan arah dimulai. Ikuti instruksi di layar.",
        type: "success",
      })
    }
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden font-sans select-none">
      {/* kontainer canvas mapbox penuh */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* TOP FLOATING SEARCH BAR (RESPONSIF) — disembunyikan saat navigasi aktif di mobile */}
      {!isNavigating && (
        <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:w-[420px] z-30 pointer-events-auto">
          <div
            onClick={onOpenSearch}
            className="bg-white/95 backdrop-blur-md rounded-2xl border border-input shadow-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
          >
            <div className="p-3.5 space-y-2">
              {/* titik jemput */}
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#ffa2cf] flex items-center justify-center text-white shrink-0 shadow-2xs">
                  <ArrowUp className="w-3 h-3 stroke-[3]" />
                </div>
                <p className="text-sm font-semibold text-foreground truncate">
                  {routeData?.origin?.label || "Stasiun Sudirman"}
                </p>
              </div>

              {/* titik tujuan */}
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-white flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">
                  {routeData?.destination?.label || "Jl. Senopati No. 45"}
                </p>
              </div>
            </div>

            {/* banner strip primary */}
            <div className="bg-primary px-3.5 py-2 text-primary-foreground flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-1.5 truncate">
                {isBlankSpot ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                    <span className="truncate">Data Keamanan Terbatas di Area Ini</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
                    <span className="truncate">
                      Rute Teraman Terpilih • {activeRoute?.safePointsCount || 5} Safe Points 24 Jam
                    </span>
                  </>
                )}
              </span>
              <Badge variant="outline" className="bg-background/20 text-primary-foreground border-transparent text-[11px] shrink-0">
                {routeData?.departureTime || "20:00"}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTONS DI PETA */}
      <div className="absolute top-36 left-4 md:top-4 md:right-6 md:left-auto z-20 flex flex-wrap md:flex-col gap-2 pointer-events-auto">
        {/* tombol kembali */}
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white border border-input shadow-lg flex items-center justify-center text-foreground transition-all"
          title="Kembali ke Beranda"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* toggle safe points */}
        <button
          type="button"
          onClick={() => setShowSafePoints(!showSafePoints)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
            showSafePoints
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white/90 text-muted-foreground border-input"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safe Points ({safePoints.length})</span>
        </button>

        {/* toggle zona rawan */}
        <button
          type="button"
          onClick={() => setShowRiskZones(!showRiskZones)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
            showRiskZones
              ? "bg-rose-600 text-white border-rose-700"
              : "bg-white/90 text-muted-foreground border-input"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Zona Rawan ({riskZones.length})</span>
        </button>
      </div>

      {/* BOTTOM SHEET / SIDE PANEL (RESPONSIF) */}
      <div className="absolute bottom-[60px] md:bottom-6 left-0 right-0 md:left-6 md:right-auto md:w-[420px] z-30 bg-white/98 backdrop-blur-xl border-t md:border border-input md:rounded-3xl rounded-t-[28px] shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
        {/* drag handle bar (hanya tampil di mobile) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="w-full py-2.5 flex md:hidden flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
          title="Tarik ke atas atau ke bawah untuk mengatur ukuran"
        >
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors" />
        </div>

        {/* konten scrollable sheet yang menyusut saat di-drag atau minimized */}
        <div
          style={{
            maxHeight:
              sheetState === "minimized"
                ? "0px"
                : dragOffset > 0
                ? `${Math.max(0, 320 - dragOffset)}px`
                : sheetState === "expanded" && hasExtraContent
                ? "60vh"
                : "320px",
            opacity:
              sheetState === "minimized"
                ? 0
                : dragOffset > 0
                ? Math.max(0, 1 - dragOffset / 120)
                : 1,
          }}
          className={`overflow-y-auto px-4 space-y-3.5 ${
            dragOffset > 0 ? "" : "transition-all duration-300 ease-out"
          } ${sheetState === "minimized" ? "pointer-events-none pb-0" : "pb-2"}`}
        >
          {/* mode transportasi tabs */}
          <div className="flex items-center justify-center gap-6 border-b border-border/60 pb-1">
            {TRAVEL_MODES.map((mode) => {
              const isSelected = (routeData?.travelMode || "walking") === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onModeChange && onModeChange(mode.id)}
                  className={`flex items-center gap-1.5 pb-2 text-sm font-semibold transition-all bg-transparent ${
                    isSelected
                      ? "text-primary border-b-2 border-primary -mb-px"
                      : "text-muted-foreground border-b-2 border-transparent -mb-px"
                  }`}
                >
                  {mode.id === "walking" && <Footprints className="w-3.5 h-3.5" />}
                  {mode.id === "motorcycle" && <Bike className="w-3.5 h-3.5" />}
                  {mode.id === "car" && <Car className="w-3.5 h-3.5" />}
                  <span>{mode.label}</span>
                </button>
              )
            })}
          </div>

          {isNavigating && activeRoute ? (
            <div className="space-y-3">
              <div className="bg-primary px-3 py-1.5 text-primary-foreground flex items-center justify-between text-xs font-semibold rounded-xl">
                <span className="truncate">Ikuti rute menuju tujuan</span>
                <span className="bg-background/20 text-primary-foreground border-transparent text-[11px] px-2 py-0.5 rounded-full">
                  {activeRoute.duration} • {activeRoute.distance}
                </span>
              </div>

              <SafeRouteNavSimulation route={activeRoute} safePoints={safePoints} />

              <button
                type="button"
                onClick={() => setIsNavigating(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                Matikan Navigasi
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* daftar alternatif rute */}
              <div className="space-y-2.5">
                {routes.map((route) => {
                  const isSelected = selectedRouteId === route.id
                  return (
                    <div
                      key={route.id}
                      onClick={() => onSelectRoute(route.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative select-none ${
                        isSelected
                          ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
                          : "border-input bg-white hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-primary/15 text-foreground flex items-center justify-center font-semibold shrink-0">
                            {routeData?.travelMode === "walking" ? (
                              <Footprints className="w-5 h-5 text-primary" />
                            ) : routeData?.travelMode === "car" ? (
                              <Car className="w-5 h-5 text-primary" />
                            ) : (
                              <Bike className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground">
                                {route.title}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {route.duration} • {route.distance}
                            </p>
                          </div>
                        </div>

                        {/* skor keamanan & radio selector */}
                        <div className="flex items-center gap-2">
                          {route.isBlankSpot ? (
                            <Badge variant="yellow">Data Terbatas</Badge>
                          ) : route.safetyScore >= 80 ? (
                            <Badge variant="pink">
                              Skor {route.safetyScore} ({route.riskLevel})
                            </Badge>
                          ) : (
                            <Badge variant="orange">
                              Skor {route.safetyScore} ({route.riskLevel})
                            </Badge>
                          )}

                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/50"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                          </div>
                        </div>
                      </div>

                      {/* rincian pencahayaan & safe points */}
                      {!route.isBlankSpot && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            <strong>{route.safePointsCount} Safe Points 24 Jam</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            Pencahayaan: <strong>{route.lightingScore}%</strong>
                          </span>
                        </div>
                      )}

                      {/* disclaimer jika blank spot */}
                      {route.isBlankSpot && route.disclaimer && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-tight">
                          {route.disclaimer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* section prediksi risiko per jam jika expanded */}
              {sheetState === "expanded" && routeData && (
                <div className="pt-2 pb-1 border-t border-border/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-primary" />
                    Rincian Perjalanan
                  </h3>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
                    <RiskTimeline
                      timeAnalysis={routeData.timeRiskAnalysis}
                      selectedTime={routeData.departureTime}
                      onSelectTime={onTimeChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR (MENYATU RAPI DI DASAR SHEET) */}
        <div className="p-3 md:p-4 border-t border-border/60 bg-white shrink-0 flex items-center gap-2.5 md:gap-3 shadow-lg">
          <button
            type="button"
            onClick={handleShareTracking}
            className="py-3 px-3.5 rounded-2xl border border-input bg-muted/40 hover:bg-muted text-foreground text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            title="Bagikan Live Tracking"
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span>Live Tracking</span>
          </button>

          <button
            type="button"
            onClick={handleStartNavigation}
            className="flex-1 py-3 md:py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all select-none"
          >
            {isNavigating ? (
              <>
                <Square className="w-4 h-4" />
                <span>Matikan Navigasi</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Mulai Navigasi Aman</span>
              </>
            )}
          </button>
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