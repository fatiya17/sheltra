"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Phone, MapPin, Volume2, VolumeX, Navigation, ChevronLeft, ShieldCheck, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { safeRouteService } from "@/features/safe-route/services/safe-route.service"
import { geocodeService } from "@/features/report/services/geocode.service"

export function SosActiveView({
  activeDurationSeconds = 0,
  isAlarmPlaying = true,
  isMuted = false,
  onToggleMute,
  onCancelSos,
  trustedContacts = [],
  dispatchResults = [],
  userLocation = {},
  safePoints = [],
  isOnline = true,
  desktopEmbedded = false,
  hideDesktopSos = false,
  activeTab = "main",
  setActiveTab,
}) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // state untuk navigasi
  const [isSafePointNavStarted, setIsSafePointNavStarted] = useState(false)
  const [safePointRoute, setSafePointRoute] = useState(null)
  const [originAddress, setOriginAddress] = useState("")
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // state untuk isdesktop
  const [isDesktop, setIsDesktop] = useState(false)

  // state bottom sheet draggable (mirip safe-route)
  const [sheetState, setSheetState] = useState("half")
  const [dragOffset, setDragOffset] = useState(0)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)

  // ref kontainer peta
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // format detik ke mm:ss
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // buka panggilan telepon kontak pertama
  const handleCallFirst = () => {
    if (trustedContacts.length > 0 && trustedContacts[0].phone) {
      window.location.href = `tel:${trustedContacts[0].phone}`
    }
  }

  const nearestSafePoint = safePoints[0] || null

  useEffect(() => {
    if (activeTab === "safepoint") return
    setIsSafePointNavStarted(false)
    setSafePointRoute(null)
    setIsLoadingRoute(false)
  }, [activeTab])

  // cek screen size
  useEffect(() => {
    if (typeof window === "undefined") return
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // touch handlers drag bottom sheet
  const handleTouchStart = (e) => {
    if (e.touches?.[0]) {
      startYRef.current = e.touches[0].clientY
      isDraggingRef.current = true
    }
  }

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return
    if (e.touches?.[0]) {
      const delta = e.touches[0].clientY - startYRef.current
      setDragOffset(delta)
    }
  }

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const delta = dragOffset
    setDragOffset(0)
    if (delta > 30) {
      setSheetState("minimized")
    } else if (delta < -30 && sheetState === "minimized") {
      setSheetState("half")
    } else if (Math.abs(delta) < 5) {
      setSheetState((prev) => (prev === "minimized" ? "half" : "minimized"))
    }
  }

  // mouse handler drag bottom sheet (desktop simulator)
  const handleMouseDown = (e) => {
    if (typeof window === "undefined") return
    startYRef.current = e.clientY
    isDraggingRef.current = true

    const handleMouseMove = (ev) => {
      if (!isDraggingRef.current) return
      setDragOffset(ev.clientY - startYRef.current)
    }

    const handleMouseUp = (ev) => {
      isDraggingRef.current = false
      const delta = ev.clientY - startYRef.current
      setDragOffset(0)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      if (delta > 30) {
        setSheetState("minimized")
      } else if (delta < -30 && sheetState === "minimized") {
        setSheetState("half")
      } else if (Math.abs(delta) < 5) {
        setSheetState((prev) => (prev === "minimized" ? "half" : "minimized"))
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // fetch alamat
  useEffect(() => {
    if (activeTab !== "safepoint" || !userLocation?.coords) return
    let active = true

    const fetchOriginAddress = async () => {
      try {
        const [lng, lat] = userLocation.coords
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

        // geocode lokasi asal
        const res = await geocodeService.reverseGeocode(lat, lng, mapboxToken)
        if (active && res) {
          const shortName =
            res.details?.residential ||
            res.details?.village ||
            res.details?.district ||
            res.location ||
            "Lokasi Anda"
          setOriginAddress(shortName)
        }
      } catch (err) {
        console.warn("gagal reverse geocode:", err)
      }
    }

    fetchOriginAddress()
    return () => { active = false }
  }, [activeTab, userLocation.coords])

  // fetch rute (hanya setelah klik "Navigasi")
  useEffect(() => {
    if (
      activeTab !== "safepoint" ||
      !isSafePointNavStarted ||
      !userLocation?.coords ||
      !nearestSafePoint
    ) {
      return
    }

    let active = true
    setIsLoadingRoute(true)

    const fetchRouteData = async () => {
      try {
        const data = await safeRouteService.calculateSafeRoutes({
          origin: { label: "Lokasi Anda", coordinates: userLocation.coords },
          destination: { label: nearestSafePoint.name, coordinates: nearestSafePoint.coordinates },
          travelMode: "walking",
        })

        if (active && data?.routes?.length > 0) {
          setSafePointRoute(data.routes[0])
        }
      } catch (err) {
        console.warn("gagal fetch rute:", err)
      } finally {
        if (active) setIsLoadingRoute(false)
      }
    }

    fetchRouteData()
    return () => { active = false }
  }, [activeTab, isSafePointNavStarted, userLocation.coords, nearestSafePoint])

  // render peta mapbox
  useEffect(() => {
    if (activeTab !== "safepoint" || !mapContainerRef.current) return

    let map = null

    import("mapbox-gl").then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

      try {
        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: userLocation.coords || [106.8105, -6.2307],
          zoom: 15,
          attributionControl: false,
        })

        mapInstanceRef.current = map

        map.on("load", () => {
          map.resize()

          // fallback layer google
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

          const startCoords = userLocation.coords || [106.8105, -6.2307]
          const endCoords = nearestSafePoint?.coordinates || startCoords

          // pin origin — percis safe-route (pink soft #ffa2cf)
          const startEl = document.createElement("div")
          startEl.className = "w-8 h-10 flex items-center justify-center cursor-pointer drop-shadow-xl"
          startEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#ffa2cf" stroke="#ffffff" stroke-width="2.4"/><path d="M19 29V14.2M19 14.2L13.4 19.8M19 14.2L24.6 19.8" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

          new mapboxgl.Marker({ element: startEl, anchor: "bottom" })
            .setLngLat(startCoords)
            .addTo(map)

          // pin tujuan — percis safe-route (rose/magenta #db2777 + circle putih)
          if (nearestSafePoint) {
            const endEl = document.createElement("div")
            endEl.className = "w-9 h-11 flex items-center justify-center cursor-pointer drop-shadow-xl"
            endEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#db2777" stroke="#ffffff" stroke-width="2.4"/><circle cx="19" cy="19" r="6.5" fill="white"/></svg>`

            new mapboxgl.Marker({ element: endEl, anchor: "bottom" })
              .setLngLat(endCoords)
              .addTo(map)
          }

          // gambar rute pink solid (mirip safe-route)
          if (safePointRoute?.coordinates && safePointRoute.coordinates.length >= 2) {
            map.addSource("safepoint-route-source", {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: { type: "LineString", coordinates: safePointRoute.coordinates },
              },
            })
            map.addLayer({
              id: "safepoint-route-layer",
              type: "line",
              source: "safepoint-route-source",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#ffa2cf",
                "line-width": 6,
                "line-opacity": 1,
              },
            })

            // fit bounds rute
            const bounds = new mapboxgl.LngLatBounds()
            safePointRoute.coordinates.forEach((coord) => bounds.extend(coord))
            map.fitBounds(bounds, {
              padding: isDesktop
                ? { top: 120, bottom: 120, left: 440, right: 60 }
                : { top: 220, bottom: 260, left: 40, right: 40 },
              duration: 1000,
            })
          } else {
            const bounds = new mapboxgl.LngLatBounds()
            bounds.extend(startCoords)
            bounds.extend(endCoords)
            map.fitBounds(bounds, { padding: 80, duration: 1000 })
          }
        })
      } catch (err) {
        console.warn("gagal load peta:", err)
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
  }, [activeTab, safePointRoute, nearestSafePoint, isDesktop])

  // tampilan tab safe point
  if (activeTab === "safepoint") {
    if (isDesktop) {
      // tampilan desktop
      return (
        <div className="fixed inset-0 w-screen h-screen bg-background z-50 select-none">
          {/* peta full-bleed desktop */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

          {/* loading rute */}
          {isSafePointNavStarted && isLoadingRoute && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-20">
              <div className="p-3 bg-card rounded-xl shadow-md border border-border flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs font-medium">Mencari Rute Tercepat...</span>
              </div>
            </div>
          )}

          {/* floating sidebar desktop — setengah tinggi */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <aside className="absolute top-4 left-4 z-10 w-[400px] bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-input pointer-events-auto flex flex-col" style={{ maxHeight: "50vh" }}>
              
              {/* card rute atas */}
              <div className="shrink-0">
                <div className="bg-card border-b border-input p-3 space-y-1.5">
                  {/* titik asal */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0">
                      <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {originAddress || "Lokasi Anda"}
                    </p>
                  </div>

                  {/* titik tujuan */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5 rounded-full bg-[#db2777] shrink-0">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {nearestSafePoint?.name || "Safe Point"}
                    </p>
                  </div>
                </div>

                {/* bar info rute */}
                <div className="bg-primary px-3 py-1.5 text-primary-foreground flex items-center justify-between text-xs font-semibold">
                  <span className="truncate">Ikuti rute menuju Safe Point</span>
                  <span className="bg-background/20 text-primary-foreground border-transparent text-[11px] px-2 py-0.5 rounded-full">
                    {safePointRoute
                      ? safePointRoute.duration
                      : nearestSafePoint
                      ? `~${nearestSafePoint.walkingTimeMinutes} mnt`
                      : "..."}
                  </span>
                </div>
              </div>

              {/* simulasi navigasi turn-by-turn */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {isSafePointNavStarted ? (
                  <>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Panduan Arah</p>
                    <NavSimulationSteps safePointRoute={safePointRoute} nearestSafePoint={nearestSafePoint} />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground font-medium">
                    Klik Navigasi untuk menampilkan panduan arah.
                  </p>
                )}
              </div>

              {/* footer — tombol sebelahan */}
              <div className="p-3 border-t border-border/60 bg-card shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  {nearestSafePoint && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl font-semibold text-[14px] bg-[#d6e4f0] hover:bg-[#c2d7e7] text-slate-800 border-none gap-1.5"
                      onClick={() => {
                        setIsSafePointNavStarted((prev) => {
                          if (prev) setSafePointRoute(null)
                          return !prev
                        })
                      }}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {isSafePointNavStarted ? "Matikan Navigasi" : "Navigasi"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="pill"
                    size="pill"
                    className={nearestSafePoint ? "" : "col-span-2"}
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Batalkan Darurat
                  </Button>
                </div>
              </div>
            </aside>

            {/* tombol kembali atas kanan */}
            <button
              type="button"
              onClick={() => setActiveTab("main")}
              className="absolute top-4 right-4 z-20 bg-card/95 backdrop-blur-md rounded-full px-4 py-2 text-xs font-semibold text-foreground shadow-lg border border-input hover:bg-muted transition-colors flex items-center gap-1.5 pointer-events-auto"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Kembali ke SOS
            </button>
          </div>

          <CancelDialog
            open={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={() => { setShowCancelDialog(false); onCancelSos() }}
          />
        </div>
      )
    } else {
      // tampilan mobile
      return (
        <div className="fixed inset-0 w-screen h-screen bg-background z-50 flex flex-col select-none">

          {/* top search card — percis safe-route mobile */}
          <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
            <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-input shadow-lg overflow-hidden">
              
              {/* baris asal & tujuan — tanpa background, transparan */}
              <div className="p-3 space-y-1.5">
                {/* asal */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] shrink-0">
                    <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {originAddress || "Lokasi Anda"}
                  </p>
                </div>

                {/* tujuan */}
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 rounded-full bg-[#db2777] shrink-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {nearestSafePoint?.name || "Safe Point"}
                  </p>
                </div>
              </div>

              {/* bar bawah pink — percis safe-route */}
              <div className="bg-primary px-3 py-1.5 text-primary-foreground flex items-center justify-between text-xs font-semibold">
                <span className="truncate">Ikuti rute menuju Safe Point</span>
                <span className="bg-background/20 text-primary-foreground text-[11px] px-2 py-0.5 rounded-full">
                  {safePointRoute
                    ? safePointRoute.duration
                    : nearestSafePoint
                    ? `~${nearestSafePoint.walkingTimeMinutes} mnt`
                    : "..."}
                </span>
              </div>
            </div>
          </div>

          {/* peta full-bleed */}
          <div className="absolute inset-0 w-full h-full z-0">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* loading overlay */}
          {isSafePointNavStarted && isLoadingRoute && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-20">
              <div className="p-3 bg-card rounded-xl shadow-md border border-border flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs font-medium">Mencari Rute Tercepat...</span>
              </div>
            </div>
          )}

          {/* bottom draggable sheet — percis safe-route */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-card/98 backdrop-blur-xl border-t border-input rounded-t-[28px] shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
            {/* drag handle */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              className="w-full py-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
            >
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors" />
            </div>

            {/* konten (yang bisa hide saat drag) */}
            <div
              style={{
                maxHeight:
                  sheetState === "minimized"
                    ? "0px"
                    : dragOffset > 0
                    ? `${Math.max(0, 280 - dragOffset)}px`
                    : "280px",
                opacity:
                  sheetState === "minimized"
                    ? 0
                    : dragOffset > 0
                    ? Math.max(0, 1 - dragOffset / 120)
                    : 1,
              }}
              className={`${dragOffset > 0 ? "" : "transition-all duration-300 ease-out"} ${
                sheetState === "minimized" ? "pointer-events-none" : ""
              }`}
            >
              <div className="overflow-y-auto px-4 space-y-3 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* info durasi/jarak */}
                <div>
                  <p className="text-base font-bold text-[#e62058]">Ikuti rute menuju Safe Point</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {safePointRoute
                      ? `${safePointRoute.duration} (${safePointRoute.distance})`
                      : nearestSafePoint
                      ? `~${nearestSafePoint.walkingTimeMinutes} mnt (${nearestSafePoint.distanceMeters}m)`
                      : "Menghitung jarak..."}
                  </p>
                </div>

                {/* simulasi navigasi */}
                {isSafePointNavStarted ? (
                  <NavSimulationSteps safePointRoute={safePointRoute} nearestSafePoint={nearestSafePoint} />
                ) : (
                  <p className="text-xs text-muted-foreground font-medium">
                    Klik Navigasi untuk menampilkan panduan arah.
                  </p>
                )}
              </div>
            </div>

            {/* footer tombol (selalu tampil, tidak ikut hide) */}
            <div className="shrink-0 px-4 pb-3 pt-2 border-t border-border/60 bg-card/98">
              <div className="grid grid-cols-2 gap-2">
                {nearestSafePoint && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl font-semibold text-[14px] bg-[#d6e4f0] hover:bg-[#c2d7e7] text-slate-800 border-none gap-1.5"
                    onClick={() => {
                      setIsSafePointNavStarted((prev) => {
                        if (prev) setSafePointRoute(null)
                        return !prev
                      })
                    }}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {isSafePointNavStarted ? "Matikan Navigasi" : "Navigasi"}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="pill"
                  size="pill"
                  className={nearestSafePoint ? "" : "col-span-2"}
                  onClick={() => setShowCancelDialog(true)}
                >
                  Batalkan Darurat
                </Button>
              </div>
            </div>
          </div>

          {/* tombol kembali - overlay */}
          <button
            type="button"
            onClick={() => setActiveTab("main")}
            className="absolute top-3 left-3 z-40 pointer-events-auto bg-card/90 backdrop-blur-sm rounded-full p-2 shadow-md border border-input"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <CancelDialog
            open={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={() => { setShowCancelDialog(false); onCancelSos() }}
          />
        </div>
      )
    }
  }

  // ----------------------------------------------------------------
  // tampilan utama sos aktif
  // ----------------------------------------------------------------
  return (
    <>
      {/* MOBILE: full-screen layout */}
      <div className="flex flex-col lg:hidden min-h-[calc(100vh-2rem)] bg-background">
        {/* header banner */}
        <div className="-mx-4 -mt-4 bg-[#e62058] text-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-base font-black">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">SOS Aktif</p>
            <p className="text-xs opacity-90 truncate">Alarm Berbunyi · Lokasi dibagikan Live</p>
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* peta */}
        <div
          className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden border border-border/40 shadow-xs mt-3"
          style={{ height: "46vw", maxHeight: 260, minHeight: 180 }}
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <MapPin className="w-8 h-8 text-[#e62058]" />
            <p className="text-xs font-medium">
              {userLocation.hasGps
                ? `${userLocation.coords?.[1]?.toFixed(4)}, ${userLocation.coords?.[0]?.toFixed(4)}`
                : "Lokasi tidak tersedia"}
            </p>
          </div>
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-full">
            {formatTimer(activeDurationSeconds)}
          </div>
        </div>

        {/* info kontak */}
        <div className="mt-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center shrink-0">
            {trustedContacts.slice(0, 2).map((c, i) => (
              <div
                key={c.id}
                className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${c.avatarBg || "bg-rose-400 text-white"} ${i > 0 ? "-ml-2" : ""}`}
              >
                {c.avatarInitial || c.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
            {trustedContacts.length > 2 && (
              <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-500 text-white flex items-center justify-center text-xs font-bold -ml-2">
                +{trustedContacts.length - 2}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#e62058]">
              {trustedContacts.length} Trusted Contact diberi tahu
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Lokasi & waktu diberikan otomatis
            </p>
          </div>
        </div>

        {/* tombol aksi */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            type="button"
            className="h-12 rounded-2xl font-bold text-sm bg-[#e62058] hover:bg-[#c91a4a] text-white gap-2"
            onClick={handleCallFirst}
          >
            <Phone className="w-4 h-4" />
            Hubungi
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl font-bold text-sm border-[#e62058] text-[#e62058] hover:bg-rose-50 dark:hover:bg-rose-950/30"
            onClick={() => setActiveTab("safepoint")}
          >
            Safe Point
          </Button>
        </div>

        <div className="flex-1" />

        {/* batalkan darurat */}
        <div className="pb-2 pt-4 mt-auto">
          <Button
            type="button"
            className="w-full h-12 rounded-2xl font-bold text-sm bg-[#e62058] hover:bg-[#c91a4a] text-white"
            onClick={() => setShowCancelDialog(true)}
          >
            Batalkan Darurat
          </Button>
        </div>
      </div>

      {/* DESKTOP: full-width banner above centered card */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-[#e62058] text-white shadow-md">
        <div className="w-full px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-base font-black">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">SOS Aktif</p>
            <p className="text-xs opacity-90">Alarm Berbunyi · Lokasi dibagikan Live</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 rounded-full bg-white text-[#e62058] hover:bg-white/90 font-bold"
              onClick={() => setShowCancelDialog(true)}
            >
              Batalkan Darurat
            </Button>
            <span className="text-sm font-mono font-bold bg-white/20 px-2.5 py-1 rounded-full">
              {formatTimer(activeDurationSeconds)}
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP: centered card layout */}
      <div className={`hidden lg:flex justify-center ${desktopEmbedded ? "" : "pt-16"}`}>
        <div className={`w-full grid gap-6 items-start ${desktopEmbedded ? "grid-cols-1 max-w-none" : "grid-cols-[minmax(280px,1fr)_minmax(320px,1.15fr)] max-w-4xl"}`}>

          {/* kolom kiri: peta + info kontak */}
          <div className="space-y-4">
            {/* peta */}
            <div
              className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden"
              style={{ height: desktopEmbedded ? "clamp(360px, 48vh, 520px)" : 240 }}
            >
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <MapPin className="w-8 h-8 text-[#e62058]" />
                <p className="text-xs font-medium">
                  {userLocation.hasGps
                    ? `${userLocation.coords?.[1]?.toFixed(4)}, ${userLocation.coords?.[0]?.toFixed(4)}`
                    : "Lokasi tidak tersedia"}
                </p>
              </div>
            </div>

            {/* info kontak tepercaya */}
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex items-center shrink-0">
                {trustedContacts.slice(0, 2).map((c, i) => (
                  <div
                    key={c.id}
                    className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${c.avatarBg || "bg-rose-400 text-white"} ${i > 0 ? "-ml-2" : ""}`}
                  >
                    {c.avatarInitial || c.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
                {trustedContacts.length > 2 && (
                  <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-500 text-white flex items-center justify-center text-xs font-bold -ml-2">
                    +{trustedContacts.length - 2}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#e62058]">
                  {trustedContacts.length} Trusted Contact diberi tahu
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Lokasi & waktu diberikan otomatis
                </p>
              </div>
            </div>
          </div>

          {/* kolom kanan: aksi + safe point + batalkan */}
          <div className="space-y-4">
            <div className={`grid grid-cols-2 gap-3 ${desktopEmbedded ? "w-1/2 ml-auto" : ""}`}>
              <Button
                type="button"
                className="h-12 rounded-2xl font-bold text-sm bg-[#e62058] hover:bg-[#c91a4a] text-white gap-2"
                onClick={handleCallFirst}
              >
                <Phone className="w-4 h-4" />
                Hubungi
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl font-bold text-sm border-[#e62058] text-[#e62058] hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => setActiveTab("safepoint")}
              >
                Safe Point
              </Button>
            </div>

            {!desktopEmbedded && (
              <Button
                type="button"
                className="w-full h-12 rounded-2xl font-bold text-sm bg-[#e62058] hover:bg-[#c91a4a] text-white"
                onClick={() => setShowCancelDialog(true)}
              >
                Batalkan Darurat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* dialog konfirmasi */}
      <CancelDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => {
          setShowCancelDialog(false)
          onCancelSos()
        }}
      />
    </>
  )
}

/** Ringkasan SOS untuk sidebar desktop */
export function SosActiveSidebar({ userLocation = {} }) {
  return (
    <div className="rounded-3xl bg-slate-50/95 dark:bg-slate-800 border border-white/60 shadow-sm px-5 py-6 flex flex-col items-center text-center">
      <div className="w-36 h-36 rounded-full bg-[#e62058] text-white text-3xl font-bold shadow-[0_10px_28px_rgba(230,32,88,0.35)] ring-[14px] ring-rose-200/90 flex items-center justify-center">
        SOS
      </div>
      <p className="mt-6 text-sm font-bold text-[#e62058]">SOS sedang aktif</p>
      <p className="mt-2 text-xs text-slate-500">
        {userLocation.hasGps
          ? `${userLocation.coords?.[1]?.toFixed(4)}, ${userLocation.coords?.[0]?.toFixed(4)}`
          : "Lokasi tidak tersedia"}
      </p>
    </div>
  )
}

// simulasi instruksi navigasi dari koordinat rute
function NavSimulationSteps({ safePointRoute, nearestSafePoint }) {
  if (!safePointRoute?.coordinates || safePointRoute.coordinates.length < 3) {
    return (
      <div className="text-xs text-muted-foreground italic py-2">
        {nearestSafePoint ? "Memuat panduan arah..." : "Rute belum tersedia."}
      </div>
    )
  }

  // hitung bearing antar dua titik
  const bearing = (a, b) => {
    const toRad = (d) => (d * Math.PI) / 180
    const dLon = toRad(b[0] - a[0])
    const y = Math.sin(dLon) * Math.cos(toRad(b[1]))
    const x = Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) - Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(dLon)
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  // hitung jarak antar dua koordinat (meter)
  const haversine = (a, b) => {
    const toRad = (d) => (d * Math.PI) / 180
    const R = 6371000
    const dLat = toRad(b[1] - a[1])
    const dLon = toRad(b[0] - a[0])
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
  }

  const coords = safePointRoute.coordinates
  const steps = []
  let accDist = 0

  // langkah pertama: jalan lurus
  steps.push({ type: "lurus", icon: "↑", label: "Jalan lurus ke depan", dist: 0 })

  for (let i = 1; i < coords.length - 1; i++) {
    const d = haversine(coords[i - 1], coords[i])
    accDist += d

    // cek perubahan arah setiap 30m+
    if (accDist > 30) {
      const b1 = bearing(coords[i - 1], coords[i])
      const b2 = bearing(coords[i], coords[i + 1])
      let diff = ((b2 - b1 + 540) % 360) - 180

      if (Math.abs(diff) > 25) {
        const isRight = diff > 0
        steps.push({
          type: isRight ? "kanan" : "kiri",
          icon: isRight ? "↱" : "↰",
          label: `Belok ${isRight ? "kanan" : "kiri"}`,
          dist: Math.round(accDist),
        })
        accDist = 0
      }
    }
  }

  // langkah terakhir: sampai tujuan
  const lastDist = haversine(coords[coords.length - 2], coords[coords.length - 1])
  accDist += lastDist
  steps.push({
    type: "tujuan",
    icon: "◉",
    label: nearestSafePoint?.name || "Tiba di Safe Point",
    dist: Math.round(accDist),
  })

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isFirst = idx === 0
        const isLast = idx === steps.length - 1
        return (
          <div key={idx} className="flex items-stretch gap-2.5">
            {/* garis vertikal + dot */}
            <div className="flex flex-col items-center w-5 shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                isFirst
                  ? "bg-primary/15 text-primary"
                  : isLast
                  ? "bg-emerald-500/15 text-emerald-600"
                  : step.type === "kanan"
                  ? "bg-amber-500/15 text-amber-600"
                  : "bg-sky-500/15 text-sky-600"
              }`}>
                {step.icon}
              </div>
              {!isLast && <div className="w-px flex-1 bg-border/60 min-h-[16px]" />}
            </div>

            {/* isi instruksi */}
            <div className={`pb-2.5 min-w-0 ${isLast ? "" : ""}`}>
              <p className="text-xs font-semibold text-foreground leading-tight">{step.label}</p>
              {step.dist > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {step.dist >= 1000 ? `${(step.dist / 1000).toFixed(1)} km` : `${step.dist} m`}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// dialog konfirmasi batalkan darurat
function CancelDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[380px] bg-card p-6 md:p-8 text-center flex flex-col items-center justify-center gap-4 rounded-2xl border-none">
        <Image src="/success.svg" alt="Konfirmasi pembatalan SOS" width={128} height={128} className="w-32 h-32 object-contain" />
        <div className="space-y-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">
              Batalkan SOS?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-slate-600 text-sm px-2 leading-relaxed">
            Pastikan Anda sudah berada di tempat aman sebelum membatalkan SOS.
          </DialogDescription>
        </div>
        <div className="w-full">
          <Button
            type="button"
            variant="pill"
            size="pill"
            className="w-full"
            onClick={onConfirm}
          >
            Ya, Saya sudah aman
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
