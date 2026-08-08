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
import "mapbox-gl/dist/mapbox-gl.css"

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

        // gambar titik-titik lingkaran rute
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
          safePoints.forEach((point) => {
            const el = document.createElement("div")
            el.className =
              "w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform"
            el.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
              </svg>
            `

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
              "w-8 h-8 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center border-2 border-rose-500 animate-pulse cursor-pointer hover:scale-110 transition-transform"
            el.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            `

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

          // pin jemput primary
          const startEl = document.createElement("div")
          startEl.className = "w-8 h-10 flex items-center justify-center cursor-pointer drop-shadow-xl"
          startEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#ffa2cf" stroke="#ffffff" stroke-width="2.4"/><path d="M19 29V14.2M19 14.2L13.4 19.8M19 14.2L24.6 19.8" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

          const startMarker = new mapboxgl.Marker({ element: startEl })
            .setLngLat(startCoords)
            .addTo(map)

          // pin tujuan rose
          const endEl = document.createElement("div")
          endEl.className = "w-9 h-11 flex items-center justify-center cursor-pointer drop-shadow-xl"
          endEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#e8195a"/><circle cx="19" cy="19" r="6.5" fill="white"/></svg>`

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
  }, [routes, selectedRouteId, safePoints, riskZones, showSafePoints, showRiskZones, activeRoute])

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