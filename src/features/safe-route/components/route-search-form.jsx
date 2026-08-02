"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TimePicker } from "@/components/ui/time-picker"
import { useToast } from "@/components/ui/toast"
import {
  MapPin,
  Navigation,
  Clock,
  Footprints,
  Bike,
  Car,
  Search,
  LocateFixed,
  Loader2,
} from "lucide-react"
import { TRAVEL_MODES } from "../constants/safe-route.constants"
import { geocodeService } from "@/features/report/services/geocode.service"

export function RouteSearchForm({
  onSearch,
  isLoading,
  initialOrigin = "",
  initialDestination = "",
  initialTime = "20:00",
  initialMode = "walking",
}) {
  const toast = useToast()
  const [origin, setOrigin] = useState(initialOrigin)
  const [destination, setDestination] = useState(initialDestination)
  const [departureTime, setDepartureTime] = useState(initialTime)
  const [travelMode, setTravelMode] = useState(initialMode)
  const [isDetectingGps, setIsDetectingGps] = useState(false)

  // handler deteksi lokasi gps
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ body: "Geolocation tidak didukung di browser ini.", type: "error" })
      return
    }

    setIsDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const address = await geocodeService.reverseGeocodeMultiTier(lat, lng)
          setOrigin(address || "Lokasi Saya")
          toast({ body: "Lokasi saat ini berhasil ditemukan.", type: "success" })
        } catch {
          setOrigin("Lokasi Saya")
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
  }

  // handler submit cari rute
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) {
      toast({ body: "Silakan isi titik awal dan tujuan.", type: "error" })
      return
    }

    onSearch({
      origin: { label: origin.trim() },
      destination: { label: destination.trim() },
      departureTime,
      travelMode,
    })
  }

  return (
    <Card className="p-4 md:p-6 space-y-4">
      {/* header card */}
      <CardHeader className="pb-3 px-0 pt-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl font-semibold font-heading flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Cari Rute Aman
          </CardTitle>
        </div>
        <CardDescription>
          Rekomendasi rute teraman berbasis pencahayaan, keramaian, & riwayat insiden.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* form input perjalanan */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* titik awal / origin */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Titik Awal (Origin)
              </Label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingGps}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                {isDetectingGps ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LocateFixed className="w-3 h-3" />
                )}
                Lokasi Saya
              </button>
            </div>
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Masukkan alamat atau stasiun awal..."
              className="text-sm font-medium"
            />
          </div>

          {/* titik tujuan / destination */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Titik Tujuan (Destination)
            </Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Masukkan alamat tujuan..."
              className="text-sm font-medium"
            />
          </div>

          {/* waktu keberangkatan & mode */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* waktu */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Waktu Perjalanan
              </Label>
              <TimePicker
                value={departureTime}
                onChange={(val) => setDepartureTime(val)}
                className="w-full text-sm h-9"
              />
            </div>

            {/* mode transportasi */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Mode Transportasi</Label>
              <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded-lg border border-input">
                {TRAVEL_MODES.map((mode) => {
                  const isSelected = travelMode === mode.id
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTravelMode(mode.id)}
                      title={mode.label}
                      className={`flex items-center justify-center p-1.5 rounded-md transition-all ${
                        isSelected
                          ? "bg-card text-foreground shadow-xs font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mode.id === "walking" && <Footprints className="w-4 h-4" />}
                      {mode.id === "motorcycle" && <Bike className="w-4 h-4" />}
                      {mode.id === "car" && <Car className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* tombol submit cari rute */}
          <Button
            type="submit"
            disabled={isLoading}
            variant="pill"
            size="pill"
            className="w-full mt-2 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menganalisis Rute Teraman...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Cari Rute Aman
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
