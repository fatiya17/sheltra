"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  X,
  ArrowUp,
  MapPin,
  Clock,
  Bookmark,
  LocateFixed,
  Loader2,
  Navigation,
  ShieldCheck,
  Footprints,
  Bike,
  Car,
} from "lucide-react"
import {
  SAVED_BOOKMARKS,
  RECENT_DESTINATIONS,
  TRAVEL_MODES,
} from "../constants/safe-route.constants"
import { geocodeService } from "@/features/report/services/geocode.service"
import { PlaceSearchInput } from "./place-search-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"
import { useToast } from "@/components/ui/toast"

export function SafeRouteSearchModal({
  isOpen,
  onClose,
  initialOrigin,
  initialDestination,
  initialTime = "20:00",
  initialMode = "walking",
  onSearch,
}) {
  const toast = useToast()

  // --- State Declarations ---
  const [originText, setOriginText] = useState(
    initialOrigin?.label || "Stasiun Sudirman, Menteng, Jakarta Pusat"
  )
  const [originCoords, setOriginCoords] = useState(
    initialOrigin?.coordinates || [106.8236, -6.2023]
  )
  const [destinationText, setDestinationText] = useState(
    initialDestination?.label || "Jl. Senopati No. 45, Kebayoran Baru"
  )
  const [destinationCoords, setDestinationCoords] = useState(
    initialDestination?.coordinates || [106.8105, -6.2307]
  )
  const [departureTime, setDepartureTime] = useState(initialTime)
  const [travelMode, setTravelMode] = useState(initialMode)
  const [isDetectingGps, setIsDetectingGps] = useState(false)

  // Sync inputs to the latest parent values only when the modal opens,
  // so the modal matches the desktop/mobile map state (and never [object Object]).
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setOriginText(initialOrigin?.label || "Stasiun Sudirman, Menteng, Jakarta Pusat")
      setOriginCoords(initialOrigin?.coordinates || [106.8236, -6.2023])
      setDestinationText(initialDestination?.label || "Jl. Senopati No. 45, Kebayoran Baru")
      setDestinationCoords(initialDestination?.coordinates || [106.8105, -6.2307])
      setDepartureTime(initialTime)
      setTravelMode(initialMode)
    }
    prevOpenRef.current = isOpen
  }, [isOpen, initialOrigin, initialDestination, initialTime, initialMode])

  // --- Handlers ---
  const handleOriginTextChange = useCallback((val) => {
    setOriginText(val)
    setOriginCoords(null)
  }, [])

  const handleOriginSelect = useCallback((place) => {
    setOriginText(place.fullAddress || place.name)
    setOriginCoords(place.coordinates)
  }, [])

  const handleDestinationTextChange = useCallback((val) => {
    setDestinationText(val)
    setDestinationCoords(null)
  }, [])

  const handleDestinationSelect = useCallback((place) => {
    setDestinationText(place.fullAddress || place.name)
    setDestinationCoords(place.coordinates)
  }, [])

  const handleLocationPresetSelect = useCallback((address, coordinates) => {
    setDestinationText(address)
    setDestinationCoords(coordinates)
  }, [])

  const handleUseCurrentLocation = useCallback(() => {
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
          const finalLabel = address || "Lokasi Saya"
          setOriginText(finalLabel)
          setOriginCoords([lng, lat])
          toast({ body: "Lokasi saat ini berhasil ditemukan.", type: "success" })
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
        toast({ body: "Gagal mengambil lokasi GPS: " + err.message, type: "error" })
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [toast])

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault()
    if (!originText.trim() || !destinationText.trim()) {
      toast({ body: "Silakan isi titik jemput dan tujuan.", type: "error" })
      return
    }

    onSearch({
      origin: { label: originText.trim(), coordinates: originCoords },
      destination: { label: destinationText.trim(), coordinates: destinationCoords },
      departureTime,
      travelMode,
    })
  }, [originText, destinationText, originCoords, destinationCoords, departureTime, travelMode, onSearch, toast])

  if (!isOpen) return null

  // --- Render Elements ---
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* card modal responsif */}
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-white sm:rounded-3xl sm:border sm:border-input shadow-2xl overflow-hidden flex flex-col">
        
        {/* top navigation bar */}
        <div className="p-4 flex items-center justify-between border-b border-border/60 bg-white/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold font-heading text-foreground">
              Mau ke mana hari ini?
            </h2>
          </div>
          <Badge variant="pink" className="font-semibold">
            Safe Commute
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* input card pencarian database asli */}
          <div className="bg-white border border-input rounded-3xl p-3.5 shadow-sm space-y-2">
            
            {/* titik jemput / origin */}
            <PlaceSearchInput
              value={originText}
              onChange={handleOriginTextChange}
              onSelectPlace={handleOriginSelect}
              placeholder="Cari lokasi jemput / titik awal..."
              icon={
                <div className="w-6 h-6 rounded-full bg-[#ffa2cf] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              }
            />

            {/* connector titik 3 */}
            <div className="relative h-px mx-1">
              <div className="absolute left-[30px] right-0 top-0 h-px bg-border/80" />
              <div className="absolute left-[6.5px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 items-center justify-center z-10 pointer-events-none">
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50 shrink-0" />
              </div>
            </div>

            {/* titik tujuan / destination */}
            <PlaceSearchInput
              value={destinationText}
              onChange={handleDestinationTextChange}
              onSelectPlace={handleDestinationSelect}
              placeholder="Cari lokasi tujuan..."
              icon={
                <div className="relative w-6 h-6 rounded-full bg-primary shrink-0 shadow-2xs">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              }
            />
          </div>

          {/* pills aksi cepat & pengaturan waktu */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* tombol gps lokasi saya */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingGps}
              className="flex items-center gap-1.5 h-[30px] px-3 rounded-full border border-input bg-white hover:bg-muted text-xs font-semibold text-foreground shadow-2xs transition-all"
            >
              {isDetectingGps ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-primary" />
              )}
              <span>Lokasi Saya</span>
            </button>

            {/* waktu keberangkatan */}
            <TimePicker
              value={departureTime}
              onChange={setDepartureTime}
              showSuffix={false}
              triggerClassName="h-[30px] px-3 rounded-full border border-input bg-white text-xs font-semibold text-foreground shadow-2xs gap-1.5 hover:bg-muted/30 w-auto"
            />

            {/* pilihan mode perjalanan */}
            <div className="flex items-center h-[30px] p-0.5 gap-1">
              {TRAVEL_MODES.map((mode) => {
                const isSelected = travelMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTravelMode(mode.id)}
                    className={`h-full px-2 transition-all flex items-center justify-center bg-transparent ${
                      isSelected
                        ? "text-primary border-b-2 border-primary font-semibold"
                        : "text-muted-foreground border-b-2 border-transparent"
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

          {/* bookmark tersimpan */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SAVED_BOOKMARKS.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => handleLocationPresetSelect(bm.address, bm.coordinates)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-input bg-white hover:bg-muted text-sm font-semibold text-foreground whitespace-nowrap shadow-2xs transition-all"
                >
                  <Bookmark className="w-3 h-3 text-muted-foreground fill-muted-foreground/30" />
                  <span>{bm.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* riwayat tujuan */}
          <div className="pt-2 border-t border-border/50">
            <div className="divide-y divide-border/60">
              {RECENT_DESTINATIONS.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleLocationPresetSelect(rec.name, rec.coordinates)}
                  className="py-3.5 px-1 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/20 transition-all group"
                >
                  <div className="flex items-start gap-3 min-w-0">
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
        </div>

        {/* bottom action button */}
        <div className="p-4 border-t border-border/60 bg-white/95 backdrop-blur-md sticky bottom-0">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all select-none"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cari Rute Teraman</span>
          </button>
        </div>
      </div>
    </div>
  )
}

