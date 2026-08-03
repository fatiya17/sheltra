"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import {
  ChevronLeft,
  Menu,
  Search,
  X,
  MapPin,
  Clock,
  ShieldCheck,
  LocateFixed,
  Plus,
  Compass,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Navigation,
  CalendarDays,
  Filter,
} from "lucide-react"
import {
  RISK_LEVELS,
  TIME_RANGE_OPTIONS,
  HEATMAP_DEFAULT_CENTER,
  HEATMAP_DEFAULT_ZOOM,
  MOCK_HEATMAP_INCIDENTS,
} from "../constants/heatmap.constants"
import { PlaceSearchInput } from "@/features/safe-route/components/place-search-input"
import { HeatmapLegend } from "./heatmap-legend"
import { TimePicker } from "@/components/ui/time-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReportForm } from "@/features/report/components/report-form"
import { useRouter } from "next/navigation"
import "mapbox-gl/dist/mapbox-gl.css"

export function InteractiveHeatmap() {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const router = useRouter()

  // state filter dan data
  const [selectedTimeRange, setSelectedTimeRange] = useState("today")
  const [selectedTime, setSelectedTime] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [incidents, setIncidents] = useState(MOCK_HEATMAP_INCIDENTS)

  // filter data berdasarkan rentang waktu dan search query
  const displayIncidents = useMemo(() => {
    let list = incidents

    // filter waktu kejadian (berdasarkan rentang hari)
    if (selectedTimeRange !== "all") {
      const now = Date.now()
      const days = selectedTimeRange === "today" ? 1 : selectedTimeRange === "7d" ? 7 : 30
      const cutoffTime = now - days * 24 * 60 * 60 * 1000

      list = list.filter((item) => {
        if (!item.reportedAt) return true
        const itemTime = new Date(item.reportedAt).getTime()
        return itemTime >= cutoffTime
      })
    }

    // filter berdasarkan jam spesifik jika ada
    if (selectedTime) {
      list = list.filter((item) => {
        if (!item.reportedAt) return true
        const itemHour = new Date(item.reportedAt).getHours()
        const [filterHour] = selectedTime.split(":").map(Number)
        // toleransi +/- 1 jam
        return Math.abs(itemHour - filterHour) <= 1 || Math.abs(itemHour - filterHour) >= 23
      })
    }

    // filter pencarian teks
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.areaName?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      )
    }

    return list
  }, [selectedTimeRange, selectedTime, searchQuery, incidents])

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
          center: HEATMAP_DEFAULT_CENTER,
          zoom: HEATMAP_DEFAULT_ZOOM,
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
            paint: { "raster-opacity": 0.85 },
          })

          setIsMapReady(true)
        })
      } catch (err) {
        console.warn("Gagal inisialisasi peta heatmap:", err)
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

  // render visual hotspot & titik insiden
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isMapReady) return

    import("mapbox-gl").then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default

      // bersihkan marker lama
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      displayIncidents.forEach((item) => {
        const riskMeta = RISK_LEVELS[item.riskLevel?.toUpperCase()]
        const isSelected = selectedIncident?.id === item.id

        const el = document.createElement("div")
        el.className = `relative flex flex-col items-center justify-center transition-transform duration-200 pointer-events-none has-[.inner-circle:hover]:z-[9999] ${
          isSelected ? "scale-125 z-40" : "z-10"
        }`

        // kondisi titik dot biasa (biru / ungu)
        if (item.isDot) {
          const dotColor = item.color || "#3b82f6"
          el.style.width = "16px"
          el.style.height = "16px"
          el.innerHTML = `
            <div class="relative flex items-center justify-center w-full h-full">
              <!-- wadah untuk buletan dan tooltip dengan pointer-events-auto -->
              <div class="inner-circle group relative z-50 pointer-events-auto flex items-center justify-center cursor-pointer">
                <!-- tooltip dekat buletan warna pin -->
                <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 pointer-events-none z-[9999] whitespace-nowrap">
                  <div 
                    class="relative flex flex-col items-center text-white px-2.5 py-1 rounded-xl shadow-lg border border-white/20 text-xs font-medium leading-tight"
                    style="background-color: ${dotColor};"
                  >
                    <span class="font-bold text-white text-[11px] drop-shadow-xs">${item.areaName || item.title}</span>
                    <span class="text-[10px] text-white/90 font-medium mt-0.5 max-w-[170px] truncate text-center drop-shadow-xs">
                      ${item.category}
                    </span>
                    <!-- panah kecil tooltip -->
                    <div 
                      class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-white/20"
                      style="background-color: ${dotColor};"
                    ></div>
                  </div>
                </div>

                <!-- titik dot biasa -->
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
          // kondisi hotspot glow (merah / kuning / oranye / hijau)
          const glowSize = item.glowSize || 130
          el.style.width = `${glowSize}px`
          el.style.height = `${glowSize}px`

          const glowColor = riskMeta?.glowColor || "rgba(239, 68, 68, 0.55)"
          const pulseColor = riskMeta?.pulseColor || "rgba(239, 68, 68, 0.2)"
          const solidColor = riskMeta?.color || "#ef4444"

          el.innerHTML = `
            <div class="relative flex items-center justify-center w-full h-full pointer-events-none">
              <!-- tooltip dipindahkan ke inner-circle -->

              <!-- lingkaran glow blur -->
              <div 
                class="absolute rounded-full pointer-events-none transition-transform duration-300"
                style="
                  width: ${glowSize}px;
                  height: ${glowSize}px;
                  background: radial-gradient(circle, ${glowColor} 0%, ${pulseColor} 48%, rgba(255,255,255,0) 70%);
                  filter: blur(10px);
                "
              ></div>

              <!-- wadah untuk buletan dan tooltip dengan pointer-events-auto -->
              <div class="inner-circle group relative z-50 pointer-events-auto flex items-center justify-center cursor-pointer">
                <!-- tooltip dekat buletan warna pin -->
                <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 pointer-events-none z-[9999] whitespace-nowrap">
                  <div 
                    class="relative flex flex-col items-center text-white px-2.5 py-1 rounded-xl shadow-xl border border-white/20 text-xs font-medium leading-tight"
                    style="background-color: ${solidColor};"
                  >
                    <span class="font-bold text-white text-[11px] drop-shadow-xs">${item.areaName || item.title}</span>
                    <span class="text-[10px] text-white/90 font-medium mt-0.5 max-w-[180px] truncate text-center drop-shadow-xs">
                      ${item.category} • ${riskMeta?.label || 'Tinggi'}
                    </span>
                    <!-- panah kecil tooltip -->
                    <div 
                      class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-white/20"
                      style="background-color: ${solidColor};"
                    ></div>
                  </div>
                </div>

                <!-- titik solid di tengah -->
                <div 
                  class="relative z-10 w-4 h-4 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-125 border-2 border-white ${
                    isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                  }"
                  style="background-color: ${solidColor};"
                >
                  ${
                    item.hasCenterHole
                      ? `<div class="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></div>`
                      : ""
                  }
                </div>
              </div>
            </div>
          `
        }

        // event klik buka detail
        el.addEventListener("click", (e) => {
          e.stopPropagation()
          setSelectedIncident(item)
          map.flyTo({
            center: item.coordinates,
            zoom: 14.5,
            duration: 800,
          })
        })

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(item.coordinates)
          .addTo(map)

        markersRef.current.push(marker)
      })
    })
  }, [displayIncidents, isMapReady, selectedIncident])

  // handler tombol kembali
  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back()
    }
  }

  // handler pilih preset lokasi
  const handleSelectPreset = (preset) => {
    setSearchQuery(preset.name)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: preset.coordinates,
        zoom: 14.5,
        duration: 900,
      })
    }
  }

  // handler zoom in / zoom out
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn({ duration: 300 })
    }
  }

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut({ duration: 300 })
    }
  }

  // handler pusatkan ke lokasi gps
  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 900,
          })
        }
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, timeout: 6000 }
    )
  }

  // handler submit laporan baru
  const handleNewReportSubmit = (newReportData) => {
    const coords = newReportData.coordinates || HEATMAP_DEFAULT_CENTER
    const createdItem = {
      id: `inc-${Date.now()}`,
      title: newReportData.category || "Laporan Insiden Baru",
      category: newReportData.category || "Lainnya",
      riskLevel: "high",
      location: newReportData.location || "Lokasi Kejadian",
      areaName: "Area Laporan",
      coordinates: coords,
      reportedAt: new Date().toISOString(),
      timeOfDay: "Baru Saja",
      moderationStatus: "Menunggu Verifikasi",
      description: newReportData.description || "Laporan insiden baru dari pengguna.",
      evidenceImage: newReportData.evidence?.url || null,
      glowSize: 130,
      hasCenterHole: false,
    }

    setIncidents((prev) => [createdItem, ...prev])
    setIsReportModalOpen(false)
    setSelectedIncident(createdItem)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: coords,
        zoom: 14.8,
        duration: 800,
      })
    }
  }

  return (
    <div className="w-full h-screen bg-[#f8fafc] dark:bg-background relative flex overflow-hidden">
      {/* ========================================================================= */}
      {/* TAMPILAN 1: DESKTOP FLOATING SIDEBAR (SEBELAH KIRI LEBAR & RESPONSIF)     */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col absolute top-4 bottom-4 left-4 z-30 w-[420px] lg:w-[450px] max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-xl border border-input rounded-3xl shadow-2xl overflow-hidden pointer-events-auto">
        {/* header desktop sidebar */}
        <div className="p-4 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground transition-colors"
                title="Kembali"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h1 className="text-lg font-bold font-heading text-foreground tracking-tight">
                Map Interaktif
              </h1>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Pantau zona risiko, penerangan minim, dan pos keamanan siaga real-time di sekitar Anda.
          </p>

          {/* input pencarian lokasi gaya safe-route */}
          <div className="bg-card border border-input rounded-2xl p-3 shadow-xs">
            <PlaceSearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              onSelectPlace={(place) => {
                setSearchQuery(place.name || place.address || "")
                if (place.coordinates && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo({
                    center: place.coordinates,
                    zoom: 14.8,
                    duration: 1000,
                  })
                }
              }}
              placeholder="Cari lokasi atau titik tujuan..."
              icon={<Search className="w-4 h-4 text-muted-foreground ml-0.5" />}
            />
          </div>

          {/* filter waktu dan hari desktop */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none flex-nowrap pb-1">
            <div className="flex items-center shrink-0 bg-card p-1 rounded-full border border-input shadow-xs">
              {TIME_RANGE_OPTIONS.map((opt) => {
                const isSelected = selectedTimeRange === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedTimeRange(opt.id)}
                    className={`text-xs font-semibold transition-all rounded-full px-3.5 py-1 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <div className="shrink-0">
              <TimePicker
                value={selectedTime}
                onChange={setSelectedTime}
                showSuffix={false}
                placeholder="Semua Waktu"
                triggerClassName="h-[30px] px-3 rounded-full border border-input bg-card text-xs font-semibold text-foreground shadow-xs gap-1.5 hover:bg-muted/30 w-auto"
              />
            </div>
          </div>
        </div>

        {/* konten scrollable sidebar desktop */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* legenda risiko di sidebar */}
          <HeatmapLegend className="p-4 rounded-2xl shadow-xs" />

          {/* daftar hotspot & insiden aktif */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Titik & Hotspot Terpantau ({displayIncidents.length})
              </p>
              <span className="text-[11px] text-muted-foreground">Klik untuk zoom</span>
            </div>

            <div className="space-y-2">
              {displayIncidents.map((item) => {
                const isSelected = selectedIncident?.id === item.id
                const riskMeta = RISK_LEVELS[item.riskLevel?.toUpperCase()]

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedIncident(item)
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo({
                          center: item.coordinates,
                          zoom: 14.8,
                          duration: 800,
                        })
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 select-none ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                        : "border-input bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: riskMeta?.color || item.color || "#3b82f6",
                          }}
                        />
                        <p className="text-xs font-bold text-foreground truncate">
                          {item.title}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                        {item.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        {item.location}
                      </span>
                      <span className="shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timeOfDay}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* tombol aksi bottom desktop */}
        <div className="p-3 border-t border-border/60 bg-card flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="pill"
            onClick={handleLocateMe}
            className="flex-shrink-0 text-xs font-semibold"
            title="Pusatkan ke lokasi saya"
          >
            <LocateFixed className="w-3.5 h-3.5 text-primary" />
            <span>Lokasi Saya</span>
          </Button>

          <Button
            type="button"
            variant="pill"
            size="pill"
            onClick={() => router.push("/")}
            className="flex-1 w-full text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Laporkan Insiden</span>
          </Button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* TAMPILAN 2: MOBILE LAYOUT (SESUAI GAMBAR 2 DENGAN FLOATING CARDS)         */}
      {/* ========================================================================= */}
      <div className="md:hidden w-full h-full flex flex-col p-3 z-30 pointer-events-none relative">
        <div className="w-full max-w-lg mx-auto flex flex-col space-y-3 pointer-events-auto">
          {/* search bar lokasi mobile */}
          <div className="bg-card/95 backdrop-blur-md border border-input rounded-2xl p-2.5 shadow-xs w-full">
            <PlaceSearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              onSelectPlace={(place) => {
                setSearchQuery(place.name || place.address || "")
                if (place.coordinates && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo({
                    center: place.coordinates,
                    zoom: 14.8,
                    duration: 1000,
                  })
                }
              }}
              placeholder="Cari lokasi atau titik tujuan..."
              icon={<Search className="w-4 h-4 text-muted-foreground ml-0.5" />}
            />
          </div>

          {/* filter bar waktu dan hari mobile */}
          <div className="flex items-center justify-between px-1 py-0.5 w-full">
            <div className="shrink-0">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="h-[30px] px-3 rounded-full border border-input bg-card text-xs font-semibold text-foreground shadow-xs gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary data-[state=open]:bg-primary data-[state=open]:text-primary-foreground data-[state=open]:border-primary !focus:ring-0 !focus:border-transparent focus:outline-none w-auto">
                  <Filter className="w-3.5 h-3.5 opacity-80" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="shrink-0">
              <TimePicker
                value={selectedTime}
                onChange={setSelectedTime}
                showSuffix={false}
                placeholder="Semua Waktu"
                triggerClassName="h-[30px] px-3 rounded-full border border-input bg-card text-xs font-semibold text-foreground shadow-xs gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary data-[state=open]:bg-primary data-[state=open]:text-primary-foreground data-[state=open]:border-primary !focus:ring-0 !focus:border-transparent focus:outline-none w-auto [&>svg]:opacity-80"
              />
            </div>
          </div>
        </div>

        {/* floating bottom card legenda risiko di mobile */}
        <div className="mt-auto w-full max-w-lg mx-auto pointer-events-auto flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform active:scale-95"
            title="Laporkan Insiden"
          >
            <Plus className="w-6 h-6" />
          </button>
          
          <div className="w-full">
            <HeatmapLegend />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAP VIEWPORT CANVAS UTAMA (FULLSCREEN LAYAR LEBAR & MOBILE)               */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-10">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* kontrol floating peta di desktop (zoom & locate me) */}
      <div className="hidden md:flex flex-col gap-2 absolute top-4 right-4 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={handleLocateMe}
          className="w-10 h-10 rounded-2xl bg-card/95 backdrop-blur-md border border-input shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all active:scale-95"
          title="Lokasi Saya"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-2xl bg-card/95 backdrop-blur-md border border-input shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all active:scale-95"
          title="Perbesar Peta"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-2xl bg-card/95 backdrop-blur-md border border-input shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all active:scale-95"
          title="Perkecil Peta"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG DETAIL INSIDEN SAAT HOTSPOT / TITIK DIKLIK                         */}
      {/* ========================================================================= */}
      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-md bg-white dark:bg-card p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-border shadow-2xl">
          {selectedIncident && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {selectedIncident.riskLevel && (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          RISK_LEVELS[selectedIncident.riskLevel?.toUpperCase()]?.color ||
                          selectedIncident.color ||
                          "#3b82f6",
                      }}
                    />
                  )}
                  <DialogTitle className="text-base font-bold font-heading text-slate-900 dark:text-foreground">
                    {selectedIncident.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedIncident.location || selectedIncident.areaName}
                </DialogDescription>
              </div>

              {/* info detail insiden */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-muted/50 border border-slate-100 dark:border-border/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-semibold text-xs">
                    {selectedIncident.category}
                  </Badge>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedIncident.timeOfDay}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {selectedIncident.description}
                </p>
              </div>

              {/* status moderasi */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>{selectedIncident.moderationStatus}</span>
              </div>

              {/* tombol tutup dialog */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl text-xs font-semibold"
                  onClick={() => setSelectedIncident(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG MODAL LAPORKAN INSIDEN ANONIM                                      */}
      {/* ========================================================================= */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg bg-card p-5 sm:p-6 rounded-3xl border border-input shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-base sm:text-lg font-bold font-heading">
            Laporkan Insiden Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pb-2">
            Laporan anonim Anda akan langsung dimoderasi dan dimasukkan ke heatmap keselamatan.
          </DialogDescription>
          <ReportForm onSuccess={handleNewReportSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
