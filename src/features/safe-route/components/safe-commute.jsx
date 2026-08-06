"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowUp,
  Clock,
  Bookmark,
  LocateFixed,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Footprints,
  Bike,
  Car,
  Share2,
  Sun,
  Lightbulb,
  Navigation,
  Square,
  ChevronLeft,
  Search,
  MapPin,
  CheckCircle2,
  Circle,
  RotateCcw,
  Map,
  CarTaxiFront,
} from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLightbulb, faRoute, faChartSimple } from "@fortawesome/free-solid-svg-icons"
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  TRAVEL_MODES,
  SAVED_BOOKMARKS,
  RECENT_DESTINATIONS,
} from "../constants/safe-route.constants"
import { safeRouteService } from "../services/safe-route.service"
import { geocodeService } from "@/features/report/services/geocode.service"
import { RiskTimeline } from "./risk-timeline"
import { SafeRouteSearchModal } from "./safe-route-search-modal"
import { SafeRouteNavSimulation } from "./safe-route-nav-simulation"
import { PlaceSearchInput } from "./place-search-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"
import { useToast } from "@/components/ui/toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import "mapbox-gl/dist/mapbox-gl.css"

export default function SafeCommute() {
  const toast = useToast()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // ── Mobile flow step state ──────────────────────────────────────────
  // "home"         → Alur 1: Gojek-style destination input
  // "set-location" → Alur 2: Set Lokasi (origin + destination editable)
  // "loading"      → Alur 3: Mencari Rute Aman (animated steps)
  // "recommendations" → Alur 4: Rekomendasi Rute
  // "map"          → Alur 5: Main map view (existing)
  const [mobileStep, setMobileStep] = useState("home")

  // state pencarian di home (alur 1)
  const [homeSearchQuery, setHomeSearchQuery] = useState("")

  // state rute pencarian
  const [originText, setOriginText] = useState("Lokasi kamu saat ini")
  const [originCoords, setOriginCoords] = useState([106.8236, -6.2023])
  const [destinationText, setDestinationText] = useState("")
  const [destinationCoords, setDestinationCoords] = useState(null)
  const [departureTime, setDepartureTime] = useState("20:00")
  const [travelMode, setTravelMode] = useState("walking")

  // state hasil data rute
  const [routeData, setRouteData] = useState(null)
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)
  const [isDetectingGps, setIsDetectingGps] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)

  // state kontrol layer peta
  const [showSafePoints, setShowSafePoints] = useState(true)
  const [showRiskZones, setShowRiskZones] = useState(true)

  // state bottom sheet mobile ("minimized", "half", "expanded")
  const [sheetState, setSheetState] = useState("half")
  const [dragOffset, setDragOffset] = useState(0)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)

  // state navigasi
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [showGpsDialog, setShowGpsDialog] = useState(false)

  // loading step animasi alur 3
  const LOADING_STEPS = [
    { id: 1, label: "Menganalisis tingkat risiko", desc: "Menilai data laporan insiden di rute yang kamu tuju." },
    { id: 2, label: "Memeriksa kepadatan area", desc: "Menganalisis kepadatan lalu lintas dan keramaian." },
    { id: 3, label: "Mengecek kondisi pencahayaan jalan", desc: "Rute ini memiliki 78% area dengan pencahayaan baik." },
    { id: 4, label: "Mencari safe point terdekat", desc: "Menemukan tempat aman di sepanjang rute." },
    { id: 5, label: "Menghitung skor keamanan rute", desc: "Menggabungkan semua faktor untuk hasil akhir." },
  ]
  const [loadingStepsDone, setLoadingStepsDone] = useState([])
  const [loadingCurrentStep, setLoadingCurrentStep] = useState(1)

  const hasExtraContent = (routeData?.routes?.length || 0) > 2 || Boolean(routeData?.timeRiskAnalysis)

  // ── Touch / mouse drag handlers untuk bottom sheet ──────────────────
  const handleTouchStart = (e) => {
    if (e.touches?.[0]) { startYRef.current = e.touches[0].clientY; isDraggingRef.current = true }
  }
  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || !e.touches?.[0]) return
    const delta = e.touches[0].clientY - startYRef.current
    if (!hasExtraContent && sheetState === "half" && delta < 0) setDragOffset(0)
    else setDragOffset(delta)
  }
  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const delta = dragOffset; setDragOffset(0)
    if (delta > 30) setSheetState("minimized")
    else if (delta < -30) { if (sheetState === "minimized") setSheetState("half"); else if (hasExtraContent) setSheetState("expanded") }
    else if (Math.abs(delta) < 5) setSheetState((p) => (p === "minimized" ? "half" : "minimized"))
  }
  const handleMouseDown = (e) => {
    if (typeof window === "undefined") return
    startYRef.current = e.clientY; isDraggingRef.current = true
    const handleMouseMove = (mv) => {
      if (!isDraggingRef.current) return
      const delta = mv.clientY - startYRef.current
      if (!hasExtraContent && sheetState === "half" && delta < 0) setDragOffset(0)
      else setDragOffset(delta)
    }
    const handleMouseUp = (up) => {
      isDraggingRef.current = false
      const delta = up.clientY - startYRef.current; setDragOffset(0)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      if (delta > 30) setSheetState("minimized")
      else if (delta < -30) { if (sheetState === "minimized") setSheetState("half"); else if (hasExtraContent) setSheetState("expanded") }
      else if (Math.abs(delta) < 5) setSheetState((p) => (p === "minimized" ? "half" : "minimized"))
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // ── Derived values ──────────────────────────────────────────────────
  const routes = routeData?.routes || []
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]
  const safePoints = routeData?.safePoints || []
  const riskZones = routeData?.riskZones || []
  const isBlankSpot = routeData?.isBlankSpot || false

  // ── Helper popups ───────────────────────────────────────────────────
  const createSafePointPopup = (mapboxgl, sp) => {
    return new mapboxgl.Popup({ offset: 15, maxWidth: "260px" }).setHTML(`
      <div style="padding: 6px; font-family: inherit;">
        <div style="font-weight: 800; font-size: 13px; color: #0369a1; margin-bottom: 2px;">🛡️ ${sp.name}</div>
        <div style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 700; margin-bottom: 4px;">${sp.categoryLabel}</div>
        ${sp.features?.map((f) => `<div style="font-size: 11px; color: #475569;">• ${f}</div>`).join("") || ""}
      </div>
    `)
  }
  const createRiskZonePopup = (mapboxgl, zone) => {
    return new mapboxgl.Popup({ offset: 15, maxWidth: "260px" }).setHTML(`
      <div style="padding: 6px; font-family: inherit;">
        <div style="font-weight: 800; font-size: 13px; color: #b91c1c; margin-bottom: 2px;">⚠️ ${zone.name}</div>
        <div style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-weight: 700; margin-bottom: 4px;">Tingkat Risiko: ${zone.riskLevel} (${zone.incidentCount} Riwayat Laporan)</div>
        <div style="font-size: 11px; color: #475569;">${zone.reason}</div>
      </div>
    `)
  }

  // ── Mapbox init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return
    if (mapInstanceRef.current) return
    let map = null
    import("mapbox-gl").then((mod) => {
      const mapboxgl = mod.default
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
          map.addSource("google-tiles", { type: "raster", tiles: ["https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"], tileSize: 256 })
          map.addLayer({ id: "google-layer", type: "raster", source: "google-tiles", paint: { "raster-opacity": 1 } })
          setIsMapReady(true)
        })
      } catch (err) { console.warn("Gagal inisialisasi Mapbox:", err) }
    })
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
  }, [])

  // ── loadRoutes ──────────────────────────────────────────────────────
  const loadRoutes = useCallback(async (params, options = {}) => {
    const { showOverlay = true } = options
    if (showOverlay) setIsLoadingRoutes(true)
    try {
      const data = await safeRouteService.calculateSafeRoutes(params)
      setRouteData(data)
      if (data.routes?.length > 0) setSelectedRouteId(data.routes[0].id)
    } catch (err) {
      console.error("Gagal kalkulasi rute:", err)
      toast({ title: "Kalkulasi Gagal", body: "Gagal memuat rute aman.", type: "error" })
    } finally {
      if (showOverlay) setIsLoadingRoutes(false)
    }
  }, [toast])

  // ── Render rute & marker ────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    import("mapbox-gl").then((mod) => {
      const mapboxgl = mod.default
      const render = () => {
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []
        const currentStyle = map.getStyle()
        if (currentStyle?.layers) {
          currentStyle.layers.forEach((l) => {
            if (l.id.startsWith("route-layer-") || l.id === "safe-route-active-layer") { if (map.getLayer(l.id)) map.removeLayer(l.id) }
          })
        }
        if (currentStyle?.sources) {
          Object.keys(currentStyle.sources).forEach((sId) => {
            if (sId.startsWith("route-source-") || sId === "safe-route-active-source") { if (map.getSource(sId)) map.removeSource(sId) }
          })
        }
        if (activeRoute?.coordinates?.length >= 2) {
          const sourceId = "safe-route-active-source"; const layerId = "safe-route-active-layer"
          const geojson = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: activeRoute.coordinates } }
          if (!map.getSource(sourceId)) map.addSource(sourceId, { type: "geojson", data: geojson })
          else map.getSource(sourceId).setData(geojson)
          if (!map.getLayer(layerId)) {
            map.addLayer({ id: layerId, type: "line", source: sourceId, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": activeRoute.color || "#ffa2cf", "line-width": 5, "line-opacity": 0.92 } })
          }
        }
        if (showSafePoints) {
          safePoints.forEach((sp) => {
            const el = document.createElement("div")
            el.className = "w-7 h-7 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer"
            el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
            const popup = createSafePointPopup(mapboxgl, sp)
            const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat(sp.coordinates).setPopup(popup).addTo(map)
            markersRef.current.push(marker)
          })
        }
        if (showRiskZones) {
          riskZones.forEach((zone) => {
            const el = document.createElement("div")
            el.className = "w-8 h-8 rounded-full bg-rose-600/80 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer"
            el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
            const popup = createRiskZonePopup(mapboxgl, zone)
            const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat(zone.coordinates).setPopup(popup).addTo(map)
            markersRef.current.push(marker)
          })
        }
        if (activeRoute?.coordinates?.length >= 2) {
          const startCoords = activeRoute.coordinates[0]
          const endCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1]
          const startEl = document.createElement("div")
          startEl.className = "w-8 h-10 flex items-center justify-center cursor-pointer drop-shadow-xl"
          startEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#ffa2cf" stroke="#ffffff" stroke-width="2.4"/><path d="M19 29V14.2M19 14.2L13.4 19.8M19 14.2L24.6 19.8" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          const endEl = document.createElement("div")
          endEl.className = "w-9 h-11 flex items-center justify-center cursor-pointer drop-shadow-xl"
          endEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#db2777" stroke="#ffffff" stroke-width="2.4"/><circle cx="19" cy="19" r="6.5" fill="white"/></svg>`
          const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "bottom" }).setLngLat(startCoords).addTo(map)
          const endMarker = new mapboxgl.Marker({ element: endEl, anchor: "bottom" }).setLngLat(endCoords).addTo(map)
          markersRef.current.push(startMarker, endMarker)
          const bounds = new mapboxgl.LngLatBounds()
          activeRoute.coordinates.forEach((c) => bounds.extend(c))
          const isDesktop = window.innerWidth >= 768
          map.fitBounds(bounds, { padding: isDesktop ? { top: 140, bottom: 140, left: 540, right: 140 } : { top: 220, bottom: 260, left: 60, right: 60 }, duration: 1000 })
        }
      }
      if (map.isStyleLoaded()) render(); else map.once("load", render)
    })
  }, [routes, selectedRouteId, safePoints, riskZones, showSafePoints, showRiskZones, activeRoute, isMapReady])

  // ── Action handlers ─────────────────────────────────────────────────
  const handleSelectOriginPlace = (place) => {
    const label = place.fullAddress || place.name
    setOriginText(label); setOriginCoords(place.coordinates)
    loadRoutes({ origin: { label, coordinates: place.coordinates }, destination: { label: destinationText, coordinates: destinationCoords }, departureTime, travelMode })
  }
  const handleSelectDestPlace = (place) => {
    const label = place.fullAddress || place.name
    setDestinationText(label); setDestinationCoords(place.coordinates)
    loadRoutes({ origin: { label: originText, coordinates: originCoords }, destination: { label, coordinates: place.coordinates }, departureTime, travelMode })
  }
  const handleSelectBookmark = (bm) => {
    setDestinationText(bm.address); setDestinationCoords(bm.coordinates)
    loadRoutes({ origin: { label: originText, coordinates: originCoords }, destination: { label: bm.address, coordinates: bm.coordinates }, departureTime, travelMode })
  }
  const handleSelectRecentDestination = (rec) => {
    setDestinationText(rec.name); setDestinationCoords(rec.coordinates)
    loadRoutes({ origin: { label: originText, coordinates: originCoords }, destination: { label: rec.name, coordinates: rec.coordinates }, departureTime, travelMode })
  }
  const handleTimeChange = (newTime) => {
    setDepartureTime(newTime)
    loadRoutes({ origin: { label: originText, coordinates: originCoords }, destination: { label: destinationText, coordinates: destinationCoords }, departureTime: newTime, travelMode })
  }
  const handleModeChange = (newMode) => {
    setTravelMode(newMode)
    loadRoutes({ origin: { label: originText, coordinates: originCoords }, destination: { label: destinationText, coordinates: destinationCoords }, departureTime, travelMode: newMode })
  }
  const handleDetectGps = () => {
    setShowGpsDialog(true)
  }

  const handleGpsConfirm = () => {
    if (!navigator.geolocation) {
      toast({ body: "Browser tidak mendukung GPS.", type: "error" })
      setShowGpsDialog(false)
      return
    }
    setIsDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude; const lng = pos.coords.longitude
          const address = await geocodeService.reverseGeocodeMultiTier(lat, lng)
          const finalOrigin = address || "Lokasi Saya"
          setOriginText(finalOrigin); setOriginCoords([lng, lat])
          toast({ body: "Lokasi GPS berhasil digunakan.", type: "success" })
          if (mobileStep === "map") {
            loadRoutes({ origin: { label: finalOrigin, coordinates: [lng, lat] }, destination: { label: destinationText, coordinates: destinationCoords }, departureTime, travelMode }, { showOverlay: false })
          }
        } catch { setOriginText("Lokasi Saya"); setOriginCoords([pos.coords.longitude, pos.coords.latitude]) }
        finally { setIsDetectingGps(false); setShowGpsDialog(false) }
      },
      (err) => {
        setIsDetectingGps(false)
        setShowGpsDialog(false)
        if (err.code === err.PERMISSION_DENIED) {
          toast({ title: "Izin Lokasi Ditolak", body: "Silakan izinkan akses lokasi di pengaturan browser.", type: "error" })
        } else {
          toast({ body: "Gagal GPS: " + err.message, type: "error" })
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }
  const handleSearchSubmit = (params) => {
    setOriginText(params.origin.label); setOriginCoords(params.origin.coordinates)
    setDestinationText(params.destination.label); setDestinationCoords(params.destination.coordinates)
    if (params.departureTime) setDepartureTime(params.departureTime)
    if (params.travelMode) setTravelMode(params.travelMode)
    setIsMobileSearchOpen(false)
    loadRoutes({ origin: params.origin, destination: params.destination, departureTime: params.departureTime || departureTime, travelMode: params.travelMode || travelMode })
  }
  const handleShareTracking = () => {
    if (navigator.share) {
      navigator.share({ title: "Live Safe Tracking", text: `Saya menuju ${destinationText}.`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({ title: "Tautan Berhasil Disalin", body: "Link siap dibagikan.", type: "success" })
    }
  }
  const handleStartNavigation = () => {
    setIsNavigating((v) => !v)
    toast({ title: isNavigating ? "Navigasi Dihentikan" : "Navigasi Dimulai", body: isNavigating ? "Simulasi dihentikan." : "Ikuti instruksi di layar.", type: isNavigating ? "default" : "success" })
  }

  // ── Mobile flow handlers ────────────────────────────────────────────
  // Alur 1 → select a destination from home, fill destinationText and go to alur 2
  const handleHomeSelectDestination = (name, coords) => {
    setDestinationText(name)
    if (coords) setDestinationCoords(coords)
    setMobileStep("set-location")
  }

  // Alur 2 → tap "Cari rute aman" → animate loading steps then show recommendations
  const handleStartSearch = async () => {
    setMobileStep("loading")
    setLoadingStepsDone([])
    setLoadingCurrentStep(1)

    // run simulated loading steps with real route fetch in parallel
    const fetchPromise = loadRoutes({
      origin: { label: originText, coordinates: originCoords },
      destination: { label: destinationText, coordinates: destinationCoords || [106.8105, -6.2307] },
      departureTime,
      travelMode,
    }, { showOverlay: false })

    // animate steps one by one (1500ms each)
    for (let i = 1; i <= LOADING_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 1500))
      setLoadingCurrentStep(i + 1)
      setLoadingStepsDone((prev) => [...prev, i])
    }
    await fetchPromise
    setMobileStep("recommendations")
  }

  // Alur 4 → tap "Lihat Detail" on a route card → go to main map
  const handleViewRouteDetail = (routeId) => {
    setSelectedRouteId(routeId)
    setMobileStep("map")
  }

  // ── MOCK routes for recommendations screen (3 routes) ───────────────
  const mockRecommendationRoutes = [
    {
      id: "rec-route-1",
      label: "Rute 1",
      recommended: true,
      riskLabel: "Risiko Rendah",
      riskColor: "#16a34a",
      riskBg: "#dcfce7",
      duration: "16 Menit",
      safePoints: "7 titik aman",
      distance: "5 KM",
    },
    {
      id: "rec-route-2",
      label: "Rute 2",
      recommended: false,
      riskLabel: "Risiko Sedang",
      riskColor: "#d97706",
      riskBg: "#fef3c7",
      duration: "10 Menit",
      safePoints: "5 titik aman",
      distance: "3 KM",
    },
    {
      id: "rec-route-3",
      label: "Rute 3",
      recommended: false,
      riskLabel: "Risiko Tinggi",
      riskColor: "#dc2626",
      riskBg: "#fee2e2",
      duration: "12 Menit",
      safePoints: "2 titik aman",
      distance: "4 KM",
    },
  ]

  // use real routes from routeData when available, else mock
  const recommendationRoutes = routes.length >= 2
    ? routes.slice(0, 3).map((r, i) => ({
        id: r.id,
        label: `Rute ${i + 1}`,
        recommended: i === 0,
        riskLabel: r.riskLevel === "Rendah" ? "Risiko Rendah" : r.riskLevel === "Sedang" ? "Risiko Sedang" : "Risiko Tinggi",
        riskColor: r.riskLevel === "Rendah" ? "#16a34a" : r.riskLevel === "Sedang" ? "#d97706" : "#dc2626",
        riskBg: r.riskLevel === "Rendah" ? "#dcfce7" : r.riskLevel === "Sedang" ? "#fef3c7" : "#fee2e2",
        duration: r.duration,
        safePoints: `${r.safePointsCount} titik aman`,
        distance: r.distance,
      }))
    : mockRecommendationRoutes

  // ════════════════════════════════════════════════════════════════════
  // ALUR 1 — HOME: Gojek-style destination input
  // ── Resize map when switching to map step ──────────────────────────
  useEffect(() => {
    if (mobileStep === "map" && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.resize()
      }, 50)
    }
  }, [mobileStep])

  // flow screen content — rendered as overlay on top of the map
  // (map container always stays in DOM so Mapbox initialises correctly)
  const showFlowOverlay = mobileStep !== "map"

  // ════════════════════════════════════════════════════════════════════
  // ALUR 1 — HOME
  // ════════════════════════════════════════════════════════════════════
  const renderFlowScreen = () => {
    if (mobileStep === "home") return (
      <div className="h-full overflow-y-auto w-full bg-white flex flex-col">
        {/* pink gradient header */}
        <div className="bg-gradient-to-b from-[#e8195a] to-[#f43f7a] text-white pt-10 pb-16 px-5 relative overflow-hidden rounded-b-[36px]">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-pink-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Mau pergi kemana, Klee?</h1>
            <p className="text-sm text-pink-100">Sheltra siap menemani kamu &lt;3</p>
          </div>
        </div>

        {/* floating card with mini map + search */}
        <div className="px-4 -mt-10 relative z-20 flex-1 flex flex-col gap-0">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* mini map preview */}
            <div className="h-36 w-full bg-gray-100 relative overflow-hidden">
              {/* map placeholder illustration */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#e8f5e9 0%,#fce4ec 100%)" }}>
                <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 160" fill="none">
                  <rect x="0" y="0" width="400" height="160" fill="#f5f5f5"/>
                  <path d="M0 80 Q80 40 160 90 T320 60 T400 80" stroke="#ccc" strokeWidth="24" fill="none"/>
                  <path d="M0 100 Q100 60 200 100 T400 80" stroke="#e5e7eb" strokeWidth="16" fill="none"/>
                  <path d="M60 140 Q120 60 200 90 T360 50" stroke="#fca5a5" strokeWidth="3" strokeDasharray="8 4" fill="none"/>
                </svg>
                <div className="absolute top-1/2 left-[28%] -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-[#e8195a] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <div className="absolute top-1/3 right-[20%] w-6 h-8 flex items-end justify-center">
                  <svg viewBox="0 0 24 32" width="24" height="32" fill="none"><path d="M12 0C5.4 0 0 5.4 0 12C0 20.5 12 32 12 32C12 32 24 20.5 24 12C24 5.4 18.6 0 12 0Z" fill="#dc2626"/><circle cx="12" cy="12" r="4" fill="white"/></svg>
                </div>
              </div>
            </div>

            {/* search input — modal style */}
            <div className="px-3.5 py-3 flex items-center gap-3 border-t border-border/60">
              <div className="relative w-6 h-6 rounded-full bg-[#db2777] shrink-0 shadow-2xs">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <input
                type="text"
                value={homeSearchQuery}
                onChange={(e) => setHomeSearchQuery(e.target.value)}
                placeholder="Tujuan"
                className="flex-1 text-sm text-foreground placeholder-muted-foreground outline-none bg-transparent"
                onKeyDown={(e) => { if (e.key === "Enter" && homeSearchQuery.trim()) handleHomeSelectDestination(homeSearchQuery.trim(), null) }}
              />
              <button type="button" onClick={() => homeSearchQuery.trim() && handleHomeSelectDestination(homeSearchQuery.trim(), null)} className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-pink-50 hover:text-[#e8195a] transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* recent destinations list */}
          <div className="mt-2 bg-white rounded-3xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {RECENT_DESTINATIONS.slice(0, 4).map((rec) => (
              <button key={rec.id} type="button" onClick={() => handleHomeSelectDestination(rec.name, rec.coordinates)} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-pink-50/40 transition-colors text-left">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{rec.name}</p>
                  <p className="text-xs text-gray-400 truncate">{rec.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )

    // ════════════════════════════════════════════════════════════════════
  // ALUR 2 — SET LOKASI: editable origin + destination
  // ════════════════════════════════════════════════════════════════════
    if (mobileStep === "set-location") return (
      <div className="h-full overflow-y-auto w-full bg-white flex flex-col">
        {/* top bar */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button type="button" onClick={() => setMobileStep("home")} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-pink-50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Set Lokasi</h1>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto pb-32">
          {/* greeting */}
          <p className="text-base font-semibold text-gray-800">Mau pergi kemana, Klee?</p>

          {/* origin + destination inputs — modal style card with connector */}
          <div className="bg-white border border-input rounded-3xl p-3.5 shadow-sm space-y-2">
            {/* origin — pulsing current location style */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                {originText === "Lokasi kamu saat ini" || originText === "Lokasi Saya" ? (
                  <>
                    <div className="absolute w-6 h-6 bg-sky-500/30 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
                    <div className="w-3 h-3 bg-sky-500 rounded-full border-2 border-white shadow-sm relative z-10" />
                  </>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                    <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <input
                type="text"
                value={originText}
                onChange={(e) => setOriginText(e.target.value)}
                placeholder="Lokasi kamu saat ini"
                className="flex-1 text-sm text-foreground placeholder-muted-foreground outline-none bg-transparent min-w-0"
              />
              {isDetectingGps ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              ) : (
                <button type="button" onClick={handleDetectGps} className="shrink-0">
                  <LocateFixed className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              )}
            </div>

            {/* connector dots */}
            <div className="relative h-px mx-1">
              <div className="absolute left-[30px] right-0 top-0 h-px bg-border/80" />
              <div className="absolute left-[6.5px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 items-center justify-center z-10 pointer-events-none">
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
              </div>
            </div>

            {/* destination */}
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-6 rounded-full bg-[#db2777] shrink-0 shadow-2xs">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <input
                type="text"
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                placeholder="Cari lokasi tujuan..."
                className="flex-1 text-sm text-foreground placeholder-muted-foreground outline-none bg-transparent min-w-0"
              />
            </div>
          </div>

          {/* recent suggestions */}
          <div className="divide-y divide-gray-100">
            {RECENT_DESTINATIONS.slice(0, 4).map((rec) => (
              <button key={rec.id} type="button" onClick={() => { setDestinationText(rec.name); setDestinationCoords(rec.coordinates) }} className="w-full px-2 py-3.5 flex items-center gap-3 hover:bg-pink-50/40 transition-colors text-left">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{rec.name}</p>
                  <p className="text-xs text-gray-400 truncate leading-snug">{rec.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* sticky bottom CTA */}
        <div className="sticky bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-white border-t border-gray-100 shadow-xl">
          <button
            type="button"
            onClick={handleStartSearch}
            disabled={!destinationText.trim()}
            className="w-full py-4 rounded-2xl bg-[#e8195a] hover:bg-[#c01248] disabled:opacity-40 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 transition-all"
          >
            <ShieldCheck className="w-5 h-5" />
            Cari rute aman
          </button>
        </div>

        {/* GPS permission dialog */}
        <Dialog open={showGpsDialog} onOpenChange={(open) => !open && !isDetectingGps && setShowGpsDialog(false)}>
          <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[400px] bg-card p-6 rounded-2xl border-none">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                Deteksi Lokasi Otomatis
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Kami akan menggunakan GPS perangkat untuk mendeteksi lokasi kamu saat ini.
              </DialogDescription>
            </DialogHeader>

            {isDetectingGps ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                {/* pulsing location indicator */}
                <div className="relative flex items-center justify-center w-16 h-16">
                  <div className="absolute w-16 h-16 bg-sky-500/30 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
                  <div className="absolute w-10 h-10 bg-sky-500/20 rounded-full" />
                  <div className="w-4 h-4 bg-sky-500 rounded-full border-2 border-white shadow-md relative z-10" />
                </div>
                <p className="text-sm text-muted-foreground">Mendeteksi lokasi kamu...</p>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowGpsDialog(false)} className="flex-1">
                  Batal
                </Button>
                <Button type="button" variant="pill" size="pill" onClick={handleGpsConfirm} className="flex-1">
                  <LocateFixed className="w-4 h-4" />
                  Izinkan Lokasi
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )

    // ════════════════════════════════════════════════════════════════════
  // ALUR 3 — LOADING: Mencari Rute Aman
  // ════════════════════════════════════════════════════════════════════
    if (mobileStep === "loading") return (
      <div className="h-full overflow-y-auto w-full bg-white flex flex-col">
        {/* top bar */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button type="button" onClick={() => setMobileStep("set-location")} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Mencari Rute Aman</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-6 gap-6">
          {/* map illustration — using asset */}
          <div className="w-48 h-48 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner overflow-hidden relative mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/load-image.svg" alt="Mencari rute aman" className="w-full h-full object-contain p-3" />
          </div>

          {/* heading */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-gray-900 leading-snug">Sedang mencari rute<br/>paling aman...</h2>
          </div>

          {/* animated steps */}
          <div className="w-full space-y-4">
            {LOADING_STEPS.map((step) => {
              const isDone = loadingStepsDone.includes(step.id)
              const isCurrent = loadingCurrentStep === step.id && !isDone
              const isPending = !isDone && !isCurrent

              // icon tetap untuk masing-masing step (kiri selalu tampil icon, background selalu pink)
              const StepIcon = () => {
                if (step.id === 1) return <Map className="w-5 h-5 text-white" />
                if (step.id === 2) return <CarTaxiFront className="w-5 h-5 text-white" />
                if (step.id === 3) return <FontAwesomeIcon icon={faLightbulb} style={{ width: 18, height: 18, color: "#ffffff" }} />
                if (step.id === 4) return <FontAwesomeIcon icon={faRoute} style={{ width: 18, height: 18, color: "#ffffff" }} />
                return <FontAwesomeIcon icon={faChartSimple} style={{ width: 18, height: 18, color: "#ffffff" }} />
              }

              return (
                <div key={step.id} className={`flex items-center gap-3 transition-all duration-500 ${isPending ? "opacity-40" : "opacity-100"}`}>
                  {/* kiri: icon tetap, bg selalu pink */}
                  <div className="w-10 h-10 rounded-full bg-[#e8195a] flex items-center justify-center shrink-0 shadow-md shadow-pink-300/40">
                    <StepIcon />
                  </div>

                  {/* tengah: teks */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${isPending ? "text-gray-400" : "text-gray-900"}`}>{step.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>

                  {/* kanan: status berubah (circle → spinner → checkmark) */}
                  <div className="shrink-0 transition-all duration-300">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-[#e8195a]" />
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#e8195a]/30 border-t-[#e8195a] animate-spin" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )

    // ════════════════════════════════════════════════════════════════════
    // ALUR 4 — REKOMENDASI RUTE
    // ════════════════════════════════════════════════════════════════════
    if (mobileStep === "recommendations") return (
      <div className="h-full overflow-y-auto w-full bg-white flex flex-col">
        {/* top bar */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-100">
          <button type="button" onClick={() => setMobileStep("set-location")} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Rekomendasi Rute</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8">
          {/* origin + destination — modal style card */}
          <div className="bg-white border border-input rounded-3xl p-3.5 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-xs">
                <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <p className="text-sm text-foreground truncate flex-1 min-w-0">{originText}</p>
            </div>
            <div className="relative h-px mx-1">
              <div className="absolute left-[30px] right-0 top-0 h-px bg-border/80" />
              <div className="absolute left-[6.5px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 items-center z-10 pointer-events-none">
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-6 rounded-full bg-[#db2777] shrink-0 shadow-2xs">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <p className="text-sm text-foreground truncate flex-1 min-w-0">{destinationText}</p>
            </div>
          </div>

          {/* meta row */}
          <div className="flex items-center px-1">
            <p className="text-[11px] text-muted-foreground">Ditemukan <span className="font-semibold text-foreground">{recommendationRoutes.length} alternatif rute</span></p>
          </div>

          {/* route cards */}
          {recommendationRoutes.map((route, idx) => (
            <div key={route.id} className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              {/* card header row */}
              <div className="px-4 pt-4 pb-3 space-y-2">
                {/* "Disarankan" badge — sits above title row */}
                {route.recommended && (
                  <Badge variant="green" className="text-[11px] font-bold px-2.5 gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block shrink-0" />
                    Disarankan
                  </Badge>
                )}

                {/* title + risk badge on same row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-foreground">{route.label}</span>
                  <Badge
                    variant={route.riskLabel === "Risiko Rendah" ? "pink" : route.riskLabel === "Risiko Sedang" ? "yellow" : "red"}
                    className="text-[11px] font-semibold px-3 h-6 shrink-0"
                  >
                    {route.riskLabel}
                  </Badge>
                </div>

                {/* stats row — icons + values only, single line */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold text-foreground">{route.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold text-foreground">{route.safePoints}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold text-foreground">{route.distance}</span>
                  </div>
                </div>
              </div>

              {/* mini map */}
              <div className="h-28 mx-4 mb-3 rounded-2xl overflow-hidden bg-muted/30 relative border border-border/60">
                <svg viewBox="0 0 320 112" className="w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
                  <rect width="320" height="112" fill="#f0f4f8"/>
                  <rect x="0" y="30" width="80" height="55" rx="4" fill="#e2e8f0"/>
                  <rect x="100" y="10" width="60" height="40" rx="4" fill="#e2e8f0"/>
                  <rect x="180" y="50" width="70" height="50" rx="4" fill="#e2e8f0"/>
                  <rect x="260" y="20" width="55" height="45" rx="4" fill="#e2e8f0"/>
                  <path
                    d={idx === 0 ? "M 30 70 Q 100 30 190 55 T 290 40" : idx === 1 ? "M 30 80 Q 120 40 200 70 T 290 55" : "M 30 60 Q 90 90 160 60 T 290 70"}
                    stroke={route.riskLabel === "Risiko Rendah" ? "#16a34a" : route.riskLabel === "Risiko Sedang" ? "#d97706" : "#dc2626"}
                    strokeWidth="3.5" strokeLinecap="round" fill="none"
                  />
                  <circle cx="30" cy={idx === 0 ? 70 : idx === 1 ? 80 : 60} r="7" fill="#fca5a5" stroke="white" strokeWidth="2.5"/>
                  <svg x="278" y={idx === 0 ? 28 : idx === 1 ? 43 : 58} width="22" height="28" viewBox="0 0 38 48" fill="none">
                    <path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48S38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#dc2626" stroke="#fff" strokeWidth="3"/>
                    <circle cx="19" cy="19" r="6.5" fill="white"/>
                  </svg>
                </svg>
              </div>

              {/* CTA */}
              <div className="px-4 pb-4">
                <Button
                  type="button"
                  variant={route.recommended ? "default" : "outline"}
                  onClick={() => handleViewRouteDetail(route.id)}
                  className={`w-full rounded-2xl py-3 font-bold text-sm h-auto ${route.recommended ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/30" : "border-primary text-primary hover:bg-primary/5"}`}
                >
                  Lihat Detail
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // ALUR 5 — MAIN MAP VIEW (existing desktop + mobile bottom sheet)
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="relative w-full h-full overflow-hidden bg-white select-none">
      
      {/* mapbox layer */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* flow overlay — Alur 1-4 (home / set-location / loading / recommendations) */}
      {showFlowOverlay && (
        <div className="absolute inset-0 z-50 bg-white">
          {renderFlowScreen()}
        </div>
      )}

      {/* top right filter toggles */}
      {mobileStep === "map" && (
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <Button type="button" variant="outline" size="xs" onClick={() => setShowSafePoints(!showSafePoints)}
          className={`rounded-full shadow-lg backdrop-blur-md transition-all ${showSafePoints ? "bg-sky-500 text-white border-sky-600 shadow-sky-500/20 hover:bg-sky-600 hover:text-white" : "bg-white/90 text-muted-foreground border-input"}`}>
          <ShieldCheck className="w-3.5 h-3.5" /><span>Safe Points ({safePoints.length})</span>
        </Button>
        <Button type="button" variant="outline" size="xs" onClick={() => setShowRiskZones(!showRiskZones)}
          className={`rounded-full shadow-lg backdrop-blur-md transition-all ${showRiskZones ? "bg-rose-600 text-white border-rose-700 shadow-rose-600/20 hover:bg-rose-700 hover:text-white" : "bg-white/90 text-muted-foreground border-input"}`}>
          <AlertTriangle className="w-3.5 h-3.5" /><span>Zona Rawan ({riskZones.length})</span>
        </Button>
      </div>
      )}

      {/* back to recommendations button (mobile) */}
      {mobileStep === "map" && (
      <div className="md:hidden absolute top-4 left-4 z-30 pointer-events-auto">
        <button type="button" onClick={() => setMobileStep("recommendations")}
          className="h-9 px-3 rounded-full bg-white/95 border border-input shadow-md flex items-center gap-1.5 text-sm font-semibold text-foreground hover:bg-pink-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Rute</span>
        </button>
      </div>
      )}

      {/* ── DESKTOP FLOATING SIDEBAR ── */}
      {mobileStep === "map" && (
      <aside className="hidden md:flex flex-col absolute top-4 bottom-4 left-4 z-30 w-[440px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-xl border border-input rounded-3xl shadow-2xl overflow-hidden pointer-events-auto">
        {isNavigating && activeRoute ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="bg-white border border-input rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0"><ArrowUp className="w-3 h-3 stroke-[3]" /></div><p className="text-sm font-medium text-foreground truncate">{originText}</p></div>
              <div className="flex items-center gap-2"><div className="relative w-5 h-5 rounded-full bg-[#db2777] shrink-0"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" /></div><p className="text-sm font-medium text-foreground truncate">{destinationText}</p></div>
            </div>
            <div className="bg-primary px-3 py-1.5 text-primary-foreground flex items-center justify-between text-xs font-semibold rounded-xl">
              <span className="truncate">Ikuti rute menuju tujuan</span>
              <span className="bg-background/20 text-primary-foreground border-transparent text-[11px] px-2 py-0.5 rounded-full">{activeRoute.duration} • {activeRoute.distance}</span>
            </div>
            <SafeRouteNavSimulation route={activeRoute} safePoints={safePoints} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* origin / destination search inputs */}
            <div className="bg-white border border-input rounded-2xl p-3 shadow-xs space-y-2">
              <PlaceSearchInput value={originText} onChange={(val) => { setOriginText(val); setOriginCoords(null) }} onSelectPlace={handleSelectOriginPlace}
                placeholder="Cari lokasi jemput / titik awal..."
                icon={<div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0 shadow-2xs"><ArrowUp className="w-3.5 h-3.5 stroke-[3]" /></div>} />
              <div className="relative h-px mx-1"><div className="absolute left-[30px] right-0 top-0 h-px bg-border/80" /><div className="absolute left-[6.5px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 items-center justify-center z-10 pointer-events-none"><div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" /><div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" /><div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" /></div></div>
              <PlaceSearchInput value={destinationText} onChange={(val) => { setDestinationText(val); setDestinationCoords(null) }} onSelectPlace={handleSelectDestPlace}
                placeholder="Cari lokasi tujuan perjalanan..."
                icon={<div className="relative w-6 h-6 rounded-full bg-[#db2777] shrink-0 shadow-2xs"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white" /></div>} />
            </div>
            {/* GPS + time + mode */}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleDetectGps} disabled={isDetectingGps} className="flex items-center gap-1.5 h-[30px] px-3 rounded-full border border-input bg-white hover:bg-muted text-xs font-semibold text-foreground shadow-2xs transition-all">
                {isDetectingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <LocateFixed className="w-3.5 h-3.5 text-primary" />}<span>Lokasi Saya</span>
              </button>
              <TimePicker value={departureTime} onChange={(val) => handleTimeChange(val)} showSuffix={false} triggerClassName="h-[30px] px-3 rounded-full border border-input bg-white text-xs font-semibold text-foreground shadow-2xs gap-1.5 hover:bg-muted/30 w-auto" />
              <div className="flex items-center h-[30px] bg-muted/70 p-0.5 rounded-full border border-input">
                {TRAVEL_MODES.map((mode) => {
                  const isSelected = travelMode === mode.id
                  return (
                    <button key={mode.id} type="button" onClick={() => handleModeChange(mode.id)} className={`h-full px-2 rounded-full transition-all flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground shadow-xs font-semibold" : "text-muted-foreground hover:bg-muted"}`} title={mode.label}>
                      {mode.id === "walking" && <Footprints className="w-3.5 h-3.5" />}{mode.id === "motorcycle" && <Bike className="w-3.5 h-3.5" />}{mode.id === "car" && <Car className="w-3.5 h-3.5" />}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* bookmarks */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SAVED_BOOKMARKS.map((bm) => (
                <button key={bm.id} type="button" onClick={() => handleSelectBookmark(bm)} className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-input bg-white hover:bg-muted text-xs font-semibold text-foreground whitespace-nowrap shadow-2xs transition-all">
                  <Bookmark className="w-3 h-3 text-muted-foreground fill-muted-foreground/30" /><span>{bm.name}</span>
                </button>
              ))}
            </div>
            {/* recent destinations */}
            <div className="pt-1 border-t border-border/50 divide-y divide-border/60">
              {RECENT_DESTINATIONS.map((rec) => (
                <div key={rec.id} onClick={() => handleSelectRecentDestination(rec)} className="py-3 px-1 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/20 transition-all group">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Clock className="w-4 h-4 text-muted-foreground fill-muted-foreground/20 shrink-0 mt-0.5" />
                    <div className="min-w-0"><p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">{rec.name}</p><p className="text-xs text-muted-foreground truncate">{rec.detail}</p></div>
                  </div>
                  <Bookmark className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
            {/* blank spot banner */}
            {isBlankSpot && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm"><AlertTriangle className="w-4 h-4 shrink-0" /><span>Area Minim Data (Blank Spot)</span></div>
                <p className="text-xs text-muted-foreground leading-relaxed">{routeData?.disclaimer || "Data keamanan minim di area ini."}</p>
              </div>
            )}
            {/* route list */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center justify-between"><span>Pilihan Rute</span><span className="text-xs font-normal text-muted-foreground">{routes.length} alternatif</span></p>
              {routes.map((route) => {
                const isSelected = selectedRouteId === route.id
                const isPink = !route.isBlankSpot && route.safetyScore >= 80
                const bgClass = isPink ? "bg-[#FCCADC] text-[#83004B]" : "bg-[#F8DA9D] text-[#584400]"
                return (
                  <div key={route.id} onClick={() => setSelectedRouteId(route.id)} className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 select-none ${isSelected ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30" : "border-input bg-white hover:bg-muted/30"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold shrink-0 ${bgClass}`}>
                          {travelMode === "walking" ? <Footprints className="w-4 h-4" /> : travelMode === "car" ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                        </div>
                        <div><p className="text-[13px] font-semibold text-foreground">{route.title}</p><p className="text-xs text-muted-foreground">{route.duration} • {route.distance}</p></div>
                      </div>
                      {route.isBlankSpot ? <Badge variant="yellow">Data Terbatas</Badge> : route.safetyScore >= 80 ? <Badge variant="pink">Skor {route.safetyScore}/100</Badge> : <Badge variant="yellow">Skor {route.safetyScore}/100</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground"><Sun className="w-3 h-3 text-amber-500" /><span>Penerangan {route.lightingScore}%</span></div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="w-3 h-3 text-sky-500" /><span>{route.safePointsCount} Safe Points</span></div>
                    </div>
                    {isSelected && route.currentHourAdvice && (
                      <div className="p-2 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" /><span>{route.currentHourAdvice}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {routeData?.timeRiskAnalysis && (
              <div className="pt-2 border-t border-border/50"><RiskTimeline analysis={routeData.timeRiskAnalysis} departureTime={departureTime} onSelectHour={handleTimeChange} /></div>
            )}
          </div>
        )}
        {/* desktop bottom action bar */}
        <div className="p-3 border-t border-border/60 bg-white flex items-center gap-2">
          <Button type="button" variant="outline" size="pill" onClick={handleShareTracking} className="flex-shrink-0" title="Protected Trip">
            <Share2 className="w-4 h-4 text-black" /><span>Protected Trip</span>
          </Button>
          <Button type="button" variant="pill" size="pill" onClick={handleStartNavigation} className="flex-1 w-full">
            {isNavigating ? <><Square className="w-4 h-4" /><span>Matikan Navigasi</span></> : <><Navigation className="w-4 h-4" /><span>Mulai Navigasi</span></>}
          </Button>
        </div>
      </aside>
      )}

      {/* ── MOBILE: top search card + bottom sheet ── */}
      {mobileStep === "map" && (
      <div className="md:hidden">
        {/* top floating search card */}
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
          <div onClick={() => setIsMobileSearchOpen(true)} className="bg-white/95 backdrop-blur-md rounded-2xl border border-input shadow-lg overflow-hidden cursor-pointer">
            <div className="p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0"><ArrowUp className="w-2.5 h-2.5 stroke-[3]" /></div>
                <p className="text-sm font-medium text-foreground truncate">{originText}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#db2777] flex items-center justify-center text-white shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>
                <p className="text-sm font-medium text-foreground truncate">{destinationText}</p>
              </div>
            </div>
            <div className="bg-primary px-3 py-1.5 text-primary-foreground flex items-center justify-between text-xs font-semibold">
              <span className="truncate">{isBlankSpot ? "Data Keamanan Terbatas" : `Rute Teraman • ${activeRoute?.safePointsCount || 5} Safe Points`}</span>
              <Badge variant="outline" className="bg-background/20 text-primary-foreground border-transparent text-[11px]">{departureTime}</Badge>
            </div>
          </div>
        </div>

        {/* bottom draggable sheet */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-xl border-t border-input rounded-t-[28px] shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
          <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown}
            className="w-full py-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors" />
          </div>
          <div style={{ maxHeight: sheetState === "minimized" ? "0px" : dragOffset > 0 ? `${Math.max(0, 320 - dragOffset)}px` : sheetState === "expanded" && hasExtraContent ? "60vh" : "320px", opacity: sheetState === "minimized" ? 0 : dragOffset > 0 ? Math.max(0, 1 - dragOffset / 120) : 1 }}
            className={`overflow-y-auto px-4 space-y-3 ${dragOffset > 0 ? "" : "transition-all duration-300 ease-out"} ${sheetState === "minimized" ? "pointer-events-none pb-0" : "pb-2"}`}>
            {/* travel mode tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              {TRAVEL_MODES.map((mode) => {
                const isSelected = travelMode === mode.id
                return (
                  <button key={mode.id} type="button" onClick={() => handleModeChange(mode.id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"}`}>
                    {mode.id === "walking" && <Footprints className="w-3 h-3" />}{mode.id === "motorcycle" && <Bike className="w-3 h-3" />}{mode.id === "car" && <Car className="w-3 h-3" />}<span>{mode.label}</span>
                  </button>
                )
              })}
            </div>

            {isNavigating && activeRoute ? (
              <div className="space-y-4">
                <div className="bg-white border border-input rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0"><ArrowUp className="w-3 h-3 stroke-[3]" /></div><p className="text-sm font-medium text-foreground truncate">{originText}</p></div>
                  <div className="flex items-center gap-2"><div className="relative w-5 h-5 rounded-full bg-[#db2777] shrink-0"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" /></div><p className="text-sm font-medium text-foreground truncate">{destinationText}</p></div>
                </div>
                <div className="bg-primary px-3 py-1.5 text-primary-foreground flex items-center justify-between text-xs font-semibold rounded-xl">
                  <span className="truncate">Ikuti rute menuju tujuan</span>
                  <span className="bg-background/20 text-primary-foreground border-transparent text-[11px] px-2 py-0.5 rounded-full">{activeRoute.duration} • {activeRoute.distance}</span>
                </div>
                <SafeRouteNavSimulation route={activeRoute} safePoints={safePoints} />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {routes.map((route) => {
                    const isSelected = selectedRouteId === route.id
                    const isPink = !route.isBlankSpot && route.safetyScore >= 80
                    const bgClass = isPink ? "bg-[#FCCADC] text-[#83004B]" : "bg-[#F8DA9D] text-[#584400]"
                    return (
                      <div key={route.id} onClick={() => setSelectedRouteId(route.id)} className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 select-none ${isSelected ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30" : "border-input bg-white hover:bg-muted/30"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold shrink-0 ${bgClass}`}>
                              {travelMode === "walking" ? <Footprints className="w-4 h-4" /> : travelMode === "car" ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                            </div>
                            <div><p className="text-[13px] font-semibold text-foreground">{route.title}</p><p className="text-xs text-muted-foreground">{route.duration} • {route.distance}</p></div>
                          </div>
                          {route.isBlankSpot ? <Badge variant="yellow">Data Terbatas</Badge> : route.safetyScore >= 80 ? <Badge variant="pink">Skor {route.safetyScore}/100</Badge> : <Badge variant="yellow">Skor {route.safetyScore}/100</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-muted-foreground">
                          <div className="flex items-center gap-1"><Sun className="w-3 h-3 text-amber-500" /><span>Penerangan {route.lightingScore}%</span></div>
                          <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-sky-500" /><span>{route.safePointsCount} Safe Points</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {routeData?.timeRiskAnalysis && (
                  <div className="pt-2 border-t border-border/50"><RiskTimeline analysis={routeData.timeRiskAnalysis} departureTime={departureTime} onSelectHour={handleTimeChange} /></div>
                )}
              </>
            )}
          </div>

          {/* bottom action bar */}
          <div className="p-3 border-t border-border/60 bg-white shrink-0 flex items-center gap-2.5 shadow-lg">
            <button type="button" onClick={handleShareTracking} className="py-3 px-3.5 rounded-2xl border border-input bg-muted/40 hover:bg-muted text-foreground text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs">
              <Share2 className="w-4 h-4 text-primary" /><span>Protected Trip</span>
            </button>
            <button type="button" onClick={handleStartNavigation} className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all select-none">
              {isNavigating ? <><Square className="w-4 h-4" /><span>Matikan Navigasi</span></> : <><Navigation className="w-4 h-4" /><span>Mulai Navigasi</span></>}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* mobile search modal */}
      <SafeRouteSearchModal isOpen={isMobileSearchOpen} onClose={() => setIsMobileSearchOpen(false)} initialOrigin={{ label: originText, coordinates: originCoords }} initialDestination={{ label: destinationText, coordinates: destinationCoords }} initialTime={departureTime} initialMode={travelMode} onSearch={handleSearchSubmit} />

      {/* loading overlay */}
      {isLoadingRoutes && (
        <div className="absolute inset-0 z-40 bg-background/60 backdrop-blur-xs flex items-center justify-center">
          <div className="p-4 rounded-2xl bg-card border border-input shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-semibold text-foreground">Mengkalkulasi Rute Teraman...</span>
          </div>
        </div>
      )}
    </div>
  )
}
