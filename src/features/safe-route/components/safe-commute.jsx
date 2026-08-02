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
  ChevronUp,
  Sun,
  CheckCircle2,
  Lightbulb,
  Send,
  Navigation,
} from "lucide-react"
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
import { PlaceSearchInput } from "./place-search-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"
import { useToast } from "@/components/ui/toast"
import "mapbox-gl/dist/mapbox-gl.css"

export default function SafeCommute() {
  const toast = useToast()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // state rute pencarian
  const [originText, setOriginText] = useState("Stasiun Sudirman, Menteng, Jakarta Pusat")
  const [originCoords, setOriginCoords] = useState([106.8236, -6.2023])
  const [destinationText, setDestinationText] = useState("Jl. Senopati No. 45, Kebayoran Baru")
  const [destinationCoords, setDestinationCoords] = useState([106.8105, -6.2307])
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
  const [isSheetExpanded, setIsSheetExpanded] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  const routes = routeData?.routes || []
  const safePoints = routeData?.safePoints || []
  const riskZones = routeData?.riskZones || []
  const isBlankSpot = routeData?.isBlankSpot
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

  // helper popup safe point
  const createSafePointPopup = (mapboxgl, point) => {
    return new mapboxgl.Popup({ offset: 15, maxWidth: "260px" }).setHTML(`
      <div style="padding: 6px; font-family: inherit;">
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
          ${point.name}
        </div>
        <div style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 700; margin-bottom: 4px;">
          ${point.categoryLabel}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
          ${point.address}
        </div>
        <div style="font-size: 10px; color: #e26d9b; font-weight: 700;">
          ${point.is24Hours ? "✓ Siaga 24 Jam" : "Jam Operasional Terjadwal"}
        </div>
      </div>
    `)
  }

  // helper popup zona risiko
  const createRiskZonePopup = (mapboxgl, zone) => {
    return new mapboxgl.Popup({ offset: 15, maxWidth: "260px" }).setHTML(`
      <div style="padding: 6px; font-family: inherit;">
        <div style="font-weight: 800; font-size: 13px; color: #b91c1c; margin-bottom: 2px;">
          ⚠️ ${zone.name}
        </div>
        <div style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-weight: 700; margin-bottom: 4px;">
          Tingkat Risiko: ${zone.riskLevel} (${zone.incidentCount} Riwayat Laporan)
        </div>
        <div style="font-size: 11px; color: #475569;">
          ${zone.reason}
        </div>
      </div>
    `)
  }

  // inisialisasi peta mapbox
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

          setIsMapReady(true)
        })
      } catch (err) {
        console.warn("Gagal inisialisasi Mapbox:", err)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // kalkulasi rute
  const loadRoutes = useCallback(
    async (params, options = {}) => {
      const { showOverlay = true } = options

      if (showOverlay) {
        setIsLoadingRoutes(true)
      }

      try {
        const data = await safeRouteService.calculateSafeRoutes(params)
        setRouteData(data)
        if (data.routes && data.routes.length > 0) {
          setSelectedRouteId(data.routes[0].id)
        }
      } catch (err) {
        console.error("Gagal kalkulasi rute:", err)
        toast({
          title: "Kalkulasi Gagal",
          body: "Gagal memuat rute aman. Menggunakan fallback lokal.",
          type: "error",
        })
      } finally {
        if (showOverlay) {
          setIsLoadingRoutes(false)
        }
      }
    },
    [toast]
  )

  // inisialisasi rute pertama
  useEffect(() => {
    loadRoutes({
      origin: { label: originText, coordinates: originCoords },
      destination: { label: destinationText, coordinates: destinationCoords },
      departureTime,
      travelMode,
    })
  }, [])

  // render rute & marker di peta
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

        // bersihkan SEMUA layer & source rute sebelumnya
        const currentStyle = map.getStyle()
        if (currentStyle && currentStyle.layers) {
          currentStyle.layers.forEach((l) => {
            if (l.id.startsWith("route-layer-") || l.id === "safe-route-active-layer") {
              if (map.getLayer(l.id)) map.removeLayer(l.id)
            }
          })
        }
        if (currentStyle && currentStyle.sources) {
          Object.keys(currentStyle.sources).forEach((sId) => {
            if (sId.startsWith("route-source-") || sId === "safe-route-active-source") {
              if (map.getSource(sId)) map.removeSource(sId)
            }
          })
        }

        // gambar hanya 1 garis rute yang sedang aktif
        if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length >= 2) {
          const sourceId = "safe-route-active-source"
          const layerId = "safe-route-active-layer"
          const isSelected = activeRoute.id === selectedRouteId

          const geojson = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: activeRoute.coordinates,
            },
          }

          map.addSource(sourceId, {
            type: "geojson",
            data: geojson,
          })

          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": activeRoute.color || (isSelected ? "#ffa2cf" : "#94a3b8"),
              "line-width": 6,
              "line-opacity": 1,
              "line-dasharray": activeRoute.isBlankSpot ? [2, 2] : [1],
            },
          })
        }

        // render safe points
        if (showSafePoints && safePoints.length > 0) {
          safePoints.forEach((point) => {
            const el = document.createElement("div")
            el.className =
              "w-7 h-7 rounded-full bg-sky-500 text-white border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
            el.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`

            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat(point.coordinates)
              .setPopup(createSafePointPopup(mapboxgl, point))
              .addTo(map)

            markersRef.current.push(marker)
          })
        }

        // render zona risiko
        if (showRiskZones && riskZones.length > 0) {
          riskZones.forEach((zone) => {
            const el = document.createElement("div")
            el.className =
              "w-7 h-7 rounded-full bg-rose-600 text-white border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-125 animate-pulse"
            el.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`

            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat(zone.coordinates)
              .setPopup(createRiskZonePopup(mapboxgl, zone))
              .addTo(map)

            markersRef.current.push(marker)
          })
        }

        // render pin titik awal & tujuan
        if (activeRoute && activeRoute.coordinates.length >= 2) {
          const startCoords = activeRoute.coordinates[0]
          const endCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1]

          // pin jemput origin (pink soft/primary)
          const startEl = document.createElement("div")
          startEl.className = "w-8 h-10 flex items-center justify-center cursor-pointer drop-shadow-xl"
          startEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#ffa2cf" stroke="#ffffff" stroke-width="2.4"/><path d="M19 29V14.2M19 14.2L13.4 19.8M19 14.2L24.6 19.8" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

          const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "bottom" })
            .setLngLat(startCoords)
            .addTo(map)

          // pin tujuan destination (rose/magenta)
          const endEl = document.createElement("div")
          endEl.className = "w-9 h-11 flex items-center justify-center cursor-pointer drop-shadow-xl"
          endEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#db2777" stroke="#ffffff" stroke-width="2.4"/><circle cx="19" cy="19" r="6.5" fill="white"/></svg>`

          const endMarker = new mapboxgl.Marker({ element: endEl, anchor: "bottom" })
            .setLngLat(endCoords)
            .addTo(map)

          markersRef.current.push(startMarker, endMarker)

          // fit bounds rute
          const bounds = new mapboxgl.LngLatBounds()
          activeRoute.coordinates.forEach((coord) => bounds.extend(coord))

          const isDesktop = window.innerWidth >= 768
          map.fitBounds(bounds, {
            padding: isDesktop
              ? { top: 140, bottom: 140, left: 540, right: 140 }
              : { top: 220, bottom: 260, left: 60, right: 60 },
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
  }, [routes, selectedRouteId, safePoints, riskZones, showSafePoints, showRiskZones, activeRoute, isMapReady])

  // handler pilih tempat jemput database asli
  const handleSelectOriginPlace = (place) => {
    const label = place.fullAddress || place.name
    setOriginText(label)
    setOriginCoords(place.coordinates)
    loadRoutes({
      origin: { label, coordinates: place.coordinates },
      destination: { label: destinationText, coordinates: destinationCoords },
      departureTime,
      travelMode,
    })
  }

  // handler pilih tempat tujuan database asli
  const handleSelectDestPlace = (place) => {
    const label = place.fullAddress || place.name
    setDestinationText(label)
    setDestinationCoords(place.coordinates)
    loadRoutes({
      origin: { label: originText, coordinates: originCoords },
      destination: { label, coordinates: place.coordinates },
      departureTime,
      travelMode,
    })
  }

  // handler pilih bookmark
  const handleSelectBookmark = (bookmark) => {
    setDestinationText(bookmark.address)
    setDestinationCoords(bookmark.coordinates)
    loadRoutes({
      origin: { label: originText, coordinates: originCoords },
      destination: { label: bookmark.address, coordinates: bookmark.coordinates },
      departureTime,
      travelMode,
    })
  }

  // handler pilih riwayat lokasi
  const handleSelectRecentDestination = (rec) => {
    setDestinationText(rec.name)
    setDestinationCoords(rec.coordinates)
    loadRoutes({
      origin: { label: originText, coordinates: originCoords },
      destination: { label: rec.name, coordinates: rec.coordinates },
      departureTime,
      travelMode,
    })
  }

  // handler ganti waktu
  const handleTimeChange = (newTime) => {
    setDepartureTime(newTime)
    loadRoutes({
      origin: { label: originText, coordinates: originCoords },
      destination: { label: destinationText, coordinates: destinationCoords },
      departureTime: newTime,
      travelMode,
    })
  }

  // handler ganti mode
  const handleModeChange = (newMode) => {
    setTravelMode(newMode)
    loadRoutes({
      origin: { label: originText, coordinates: originCoords },
      destination: { label: destinationText, coordinates: destinationCoords },
      departureTime,
      travelMode: newMode,
    })
  }

  // handler deteksi gps
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast({ body: "Geolocation tidak didukung pada browser ini.", type: "error" })
      return
    }

    setIsDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const address = await geocodeService.reverseGeocodeMultiTier(lat, lng)
          const finalOrigin = address || "Lokasi Saya"
          setOriginText(finalOrigin)
          setOriginCoords([lng, lat])
          loadRoutes(
            {
              origin: { label: finalOrigin, coordinates: [lng, lat] },
              destination: { label: destinationText, coordinates: destinationCoords },
              departureTime,
              travelMode,
            },
            { showOverlay: false }
          )
          toast({ body: "Lokasi GPS berhasil digunakan.", type: "success" })
        } catch {
          const fallback = "Lokasi Saya"
          setOriginText(fallback)
          setOriginCoords([pos.coords.longitude, pos.coords.latitude])
        } finally {
          setIsDetectingGps(false)
        }
      },
      (err) => {
        setIsDetectingGps(false)
        toast({ body: "Gagal mendeteksi lokasi GPS: " + err.message, type: "error" })
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // handler submit modal pencarian
  const handleSearchSubmit = (params) => {
    setOriginText(params.origin.label)
    setOriginCoords(params.origin.coordinates)
    setDestinationText(params.destination.label)
    setDestinationCoords(params.destination.coordinates)
    if (params.departureTime) setDepartureTime(params.departureTime)
    if (params.travelMode) setTravelMode(params.travelMode)
    setIsMobileSearchOpen(false)
    loadRoutes({
      origin: params.origin,
      destination: params.destination,
      departureTime: params.departureTime || departureTime,
      travelMode: params.travelMode || travelMode,
    })
  }

  // handler share tracking
  const handleShareTracking = () => {
    if (navigator.share) {
      navigator.share({
        title: "Live Safe Tracking - Safe Commute",
        text: `Saya sedang dalam perjalanan menuju ${destinationText} melalui Rute Teraman.`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Tautan Berhasil Disalin",
        body: "Link live tracking siap dibagikan ke keluarga atau kerabat terdekat.",
        type: "success",
      })
    }
  }

  // handler mulai navigasi
  const handleStartNavigation = () => {
    setIsNavigating(!isNavigating)
    if (!isNavigating) {
      toast({
        title: "Navigasi Dimulai",
        body: "Sistem mendeteksi deviasi rute dan menyiagakan Safe Points di jalur Anda.",
        type: "success",
      })
    } else {
      toast({
        title: "Navigasi Dihentikan",
        body: "Perjalanan telah selesai dengan aman.",
        type: "default",
      })
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-muted/20 select-none">
      {/* layer peta mapbox */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* quick toggle overlay filter safe points & risk zones */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {/* toggle safe points */}
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => setShowSafePoints(!showSafePoints)}
          className={`rounded-full shadow-lg backdrop-blur-md transition-all ${
            showSafePoints
              ? "bg-sky-500 text-white border-sky-600 shadow-sky-500/20 hover:bg-sky-600 hover:text-white"
              : "bg-card/90 text-muted-foreground border-input"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safe Points ({safePoints.length})</span>
        </Button>

        {/* toggle zona rawan */}
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => setShowRiskZones(!showRiskZones)}
          className={`rounded-full shadow-lg backdrop-blur-md transition-all ${
            showRiskZones
              ? "bg-rose-600 text-white border-rose-700 shadow-rose-600/20 hover:bg-rose-700 hover:text-white"
              : "bg-card/90 text-muted-foreground border-input"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Zona Rawan ({riskZones.length})</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: DESKTOP FLOATING SIDEBAR (SEBELAH KIRI LEBAR & RESPONSIF)     */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col absolute top-4 bottom-4 left-4 z-30 w-[440px] max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-xl border border-input rounded-3xl shadow-2xl overflow-hidden pointer-events-auto">
        {/* konten scrollable sidebar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* input pencarian database asli */}
          <div className="bg-card border border-input rounded-2xl p-3 shadow-xs space-y-2">
            {/* titik jemput */}
            <PlaceSearchInput
              value={originText}
              onChange={(val) => {
                setOriginText(val)
                setOriginCoords(null)
              }}
              onSelectPlace={handleSelectOriginPlace}
              placeholder="Cari lokasi jemput / titik awal..."
              icon={
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0 shadow-2xs">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              }
            />

            {/* divider konektor titik 3 */}
            <div className="relative h-px mx-1">
              <div className="absolute left-[30px] right-0 top-0 h-px bg-border/80" />
              <div className="absolute left-[6.5px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 items-center justify-center z-10 pointer-events-none">
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
              </div>
            </div>

            {/* titik tujuan */}
            <PlaceSearchInput
              value={destinationText}
              onChange={(val) => {
                setDestinationText(val)
                setDestinationCoords(null)
              }}
              onSelectPlace={handleSelectDestPlace}
              placeholder="Cari lokasi tujuan perjalanan..."
              icon={
                <div className="relative w-6 h-6 rounded-full bg-[#db2777] shrink-0 shadow-2xs">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              }
            />
          </div>

          {/* aksi cepat & pengaturan waktu */}
          <div className="flex flex-wrap items-center gap-2">
            {/* tombol gps */}
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={isDetectingGps}
              className="flex items-center gap-1.5 h-[30px] px-3 rounded-full border border-input bg-card hover:bg-muted text-xs font-semibold text-foreground shadow-2xs transition-all"
            >
              {isDetectingGps ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-primary" />
              )}
              <span>Lokasi Saya</span>
            </button>

            {/* jam keberangkatan */}
            <TimePicker
              value={departureTime}
              onChange={(val) => handleTimeChange(val)}
              showSuffix={false}
              triggerClassName="h-[30px] px-3 rounded-full border border-input bg-card text-xs font-semibold text-foreground shadow-2xs gap-1.5 hover:bg-muted/30 w-auto"
            />

            {/* pilihan mode perjalanan */}
            <div className="flex items-center h-[30px] bg-muted/70 p-0.5 rounded-full border border-input">
              {TRAVEL_MODES.map((mode) => {
                const isSelected = travelMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={`h-full px-2 rounded-full transition-all flex items-center justify-center ${
                      isSelected ? "bg-primary text-primary-foreground shadow-xs font-semibold" : "text-muted-foreground hover:bg-muted"
                    }`}
                    title={mode.label}
                  >
                    {mode.id === "walking" && <Footprints className="w-3.5 h-3.5" />}
                    {mode.id === "motorcycle" && <Bike className="w-3.5 h-3.5" />}
                    {mode.id === "car" && <Car className="w-3.5 h-3.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* bookmark lokasi cepat */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SAVED_BOOKMARKS.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => handleSelectBookmark(bm)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-input bg-card hover:bg-muted text-xs font-semibold text-foreground whitespace-nowrap shadow-2xs transition-all"
                >
                  <Bookmark className="w-3 h-3 text-muted-foreground fill-muted-foreground/30" />
                  <span>{bm.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* riwayat tujuan terakhir tanpa label */}
          <div className="pt-1 border-t border-border/50">
            <div className="divide-y divide-border/60">
              {RECENT_DESTINATIONS.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleSelectRecentDestination(rec)}
                  className="py-3 px-1 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/20 transition-all group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 fill-muted-foreground/20" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {rec.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{rec.detail}</p>
                    </div>
                  </div>
                  <Bookmark className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* banner edge case blank spot */}
          {isBlankSpot && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground space-y-1">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Area Minim Data Keamanan (Blank Spot)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {routeData?.disclaimer ||
                  "Sistem menampilkan rute default jalan raya dengan disclaimer karena minimnya riwayat laporan di area ini."}
              </p>
            </div>
          )}

          {/* daftar alternatif rute */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Pilihan Rute Perjalanan</span>
              <span className="text-xs font-normal text-muted-foreground">
                {routes.length} alternatif ditemukan
              </span>
            </p>

            <div className="space-y-2">
              {routes.map((route) => {
                const isSelected = selectedRouteId === route.id
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 select-none ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                        : "border-input bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const isPink = !route.isBlankSpot && route.safetyScore >= 80;
                          const bgClass = isPink 
                            ? "bg-[#FCCADC] text-[#83004B] dark:bg-[#83004B]/20 dark:text-[#FCCADC]"
                            : "bg-[#F8DA9D] text-[#584400] dark:bg-[#584400]/20 dark:text-[#F8DA9D]";
                            
                          return (
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold shrink-0 transition-colors ${bgClass}`}>
                              {travelMode === "walking" ? (
                                <Footprints className="w-4 h-4" />
                              ) : travelMode === "car" ? (
                                <Car className="w-4 h-4" />
                              ) : (
                                <Bike className="w-4 h-4" />
                              )}
                            </div>
                          );
                        })()}
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">
                            {route.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {route.duration} • {route.distance}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {route.isBlankSpot ? (
                          <Badge variant="yellow">Data Terbatas</Badge>
                        ) : route.safetyScore >= 80 ? (
                          <Badge variant="pink">
                            Skor {route.safetyScore}/100
                          </Badge>
                        ) : (
                          <Badge variant="yellow">
                            Skor {route.safetyScore}/100
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* highlight rute */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Penerangan {route.lightingScore}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <ShieldCheck className="w-3 h-3 text-sky-500" />
                        <span>{route.safePointsCount} Safe Points</span>
                      </div>
                    </div>

                    {/* rincian tips waktu jika terpilih */}
                    {isSelected && route.currentHourAdvice && (
                      <div className="p-2 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" />
                        <span>{route.currentHourAdvice}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* analisis prediksi risiko berbasis waktu */}
          {routeData?.timeRiskAnalysis && (
            <div className="pt-2 border-t border-border/50">
              <RiskTimeline
                analysis={routeData.timeRiskAnalysis}
                departureTime={departureTime}
                onSelectHour={handleTimeChange}
              />
            </div>
          )}
        </div>

        {/* tombol aksi bottom sticky di desktop sidebar */}
        <div className="p-3 border-t border-border/60 bg-card flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="pill"
            onClick={handleShareTracking}
            className="flex-shrink-0"
            title="Bagikan live tracking ke kerabat"
          >
            <Share2 className="w-4 h-4 text-black" />
            <span>Tracking</span>
          </Button>

          <Button
            type="button"
            variant="pill"
            size="pill"
            onClick={handleStartNavigation}
            className="flex-1 w-full"
          >
            {isNavigating ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Navigasi Berjalan</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Mulai Navigasi Aman</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* TAMPILAN 2: MOBILE VIEW (TOP SEARCH BAR & BOTTOM EXPANDABLE SHEET)        */}
      {/* ========================================================================= */}
      <div className="md:hidden">
        {/* top floating search card */}
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
          <div
            onClick={() => setIsMobileSearchOpen(true)}
            className="bg-card/95 backdrop-blur-md rounded-2xl border border-input shadow-lg overflow-hidden cursor-pointer"
          >
            <div className="p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0">
                  <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{originText}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#db2777] flex items-center justify-center text-white shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{destinationText}</p>
              </div>
            </div>

            <div className="bg-primary px-3 py-1.5 text-primary-foreground flex items-center justify-between text-xs font-semibold">
              <span className="truncate">
                {isBlankSpot
                  ? "Data Keamanan Terbatas"
                  : `Rute Teraman • ${activeRoute?.safePointsCount || 5} Safe Points`}
              </span>
              <Badge variant="outline" className="bg-background/20 text-primary-foreground border-transparent text-[11px]">
                {departureTime}
              </Badge>
            </div>
          </div>
        </div>

        {/* bottom draggable sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 bg-card/98 backdrop-blur-xl border-t border-input rounded-t-[28px] shadow-2xl transition-all duration-300 flex flex-col pointer-events-auto ${
            isSheetExpanded ? "max-h-[82vh]" : "max-h-[56vh]"
          }`}
        >
          {/* drag handle bar */}
          <div
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
            className="w-full pt-2.5 pb-1.5 flex flex-col items-center justify-center cursor-pointer select-none"
          >
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mb-1" />
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <span>{isSheetExpanded ? "Tutup Rincian" : "Tampilkan Prediksi Waktu"}</span>
              {isSheetExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </div>
          </div>

          {/* konten bottom sheet */}
          <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
            {/* mode transportasi tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              {TRAVEL_MODES.map((mode) => {
                const isSelected = travelMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {mode.id === "walking" && <Footprints className="w-3 h-3" />}
                    {mode.id === "motorcycle" && <Bike className="w-3 h-3" />}
                    {mode.id === "car" && <Car className="w-3 h-3" />}
                    <span>{mode.label}</span>
                  </button>
                )
              })}
            </div>

            {/* daftar alternatif rute */}
            <div className="space-y-2">
              {routes.map((route) => {
                const isSelected = selectedRouteId === route.id
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 select-none ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                        : "border-input bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const isPink = !route.isBlankSpot && route.safetyScore >= 80;
                          const bgClass = isPink 
                            ? "bg-[#FCCADC] text-[#83004B] dark:bg-[#83004B]/20 dark:text-[#FCCADC]"
                            : "bg-[#F8DA9D] text-[#584400] dark:bg-[#584400]/20 dark:text-[#F8DA9D]";
                            
                          return (
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold shrink-0 transition-colors ${bgClass}`}>
                              {travelMode === "walking" ? (
                                <Footprints className="w-4 h-4" />
                              ) : travelMode === "car" ? (
                                <Car className="w-4 h-4" />
                              ) : (
                                <Bike className="w-4 h-4" />
                              )}
                            </div>
                          );
                        })()}
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">
                            {route.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {route.duration} • {route.distance}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {route.isBlankSpot ? (
                          <Badge variant="yellow">Data Terbatas</Badge>
                        ) : route.safetyScore >= 80 ? (
                          <Badge variant="pink">
                            Skor {route.safetyScore}/100
                          </Badge>
                        ) : (
                          <Badge variant="yellow">
                            Skor {route.safetyScore}/100
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Penerangan {route.lightingScore}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-500" />
                        <span>{route.safePointsCount} Safe Points</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* analisis prediksi risiko berbasis waktu */}
            {routeData?.timeRiskAnalysis && (
              <div className="pt-2 border-t border-border/50">
                <RiskTimeline
                  analysis={routeData.timeRiskAnalysis}
                  departureTime={departureTime}
                  onSelectHour={handleTimeChange}
                />
              </div>
            )}
          </div>

          {/* bottom action bar */}
          <div className="p-3 border-t border-border/60 bg-card flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShareTracking}
              className="py-3 px-3 rounded-2xl border border-input bg-muted/40 hover:bg-muted text-foreground text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-primary" />
              <span>Live Tracking</span>
            </button>

            <button
              type="button"
              onClick={handleStartNavigation}
              className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all select-none"
            >
              {isNavigating ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Navigasi Berjalan</span>
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
      </div>

      {/* modal pencarian modal pada layar mobile */}
      <SafeRouteSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        initialOrigin={{ label: originText, coordinates: originCoords }}
        initialDestination={{ label: destinationText, coordinates: destinationCoords }}
        initialTime={departureTime}
        initialMode={travelMode}
        onSearch={handleSearchSubmit}
      />

      {/* overlay loading kalkulasi rute */}
      {isLoadingRoutes && (
        <div className="absolute inset-0 z-40 bg-background/60 backdrop-blur-xs flex items-center justify-center">
          <div className="p-4 rounded-2xl bg-card border border-input shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Mengkalkulasi Rute Teraman...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
