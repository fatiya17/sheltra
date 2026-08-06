"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Loader2, Navigation, Pencil, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { geocodeService } from "../services/geocode.service"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../constants/report.constants"
import "mapbox-gl/dist/mapbox-gl.css"

function createCustomPinElement() {
  const el = document.createElement("div")
  el.className =
    "relative flex flex-col items-center justify-end cursor-pointer pointer-events-none drop-shadow-xl"
  el.style.width = "56px"
  el.style.height = "72px"
  el.innerHTML = `
    <svg class="relative z-10 -mb-[16px]" viewBox="0 0 38 48" width="32" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#e8195a" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="19" cy="19" r="6.5" fill="#ffffff"/>
    </svg>
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="absolute w-12 h-12 bg-sky-500/50 rounded-full animate-ping" style="animation-duration: 2s;"></div>
      <div class="absolute w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-white shadow-sm"></div>
    </div>
  `
  return el
}

function ManualLocationMap({ onLocationUpdate }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const updateLocationRef = useRef(null)

  const updateLocationFromCoords = useCallback(
    async (latitude, longitude, shouldCenterMap = false) => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
        const { location, details } = await geocodeService.reverseGeocode(
          latitude,
          longitude,
          token
        )

        onLocationUpdate(location, details)

        if (mapInstanceRef.current) {
          const mapboxgl = (await import("mapbox-gl")).default

          if (markerRef.current) {
            markerRef.current.setLngLat([longitude, latitude])
          } else {
            const markerEl = createCustomPinElement()
            const marker = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
              .setLngLat([longitude, latitude])
              .addTo(mapInstanceRef.current)
            markerRef.current = marker
          }

          if (shouldCenterMap) {
            mapInstanceRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 16,
            })
          }
        }
      } catch (error) {
        console.error("Error geocoding location:", error)
      }
    },
    [onLocationUpdate]
  )

  useEffect(() => {
    updateLocationRef.current = updateLocationFromCoords
  }, [updateLocationFromCoords])

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return
    if (mapInstanceRef.current) return

    let map = null
    let cancelled = false

    const initMap = () => {
      if (cancelled || !mapContainerRef.current || mapInstanceRef.current) return

      import("mapbox-gl").then((mapboxglModule) => {
        if (cancelled || !mapContainerRef.current || mapInstanceRef.current) return

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
            map.getCanvas().style.cursor = "crosshair"

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

            setTimeout(() => map.resize(), 100)
            setTimeout(() => map.resize(), 300)
          })

          map.on("error", (e) => {
            if (
              !navigator.onLine ||
              e?.error?.message?.includes("Failed to fetch") ||
              e?.error?.status === 0
            ) {
              return
            }
            console.warn("Map tile warning:", e?.error?.message || e)
          })

          map.on("mouseenter", () => {
            if (map) map.getCanvas().style.cursor = "crosshair"
          })
          map.on("mouseover", () => {
            if (map) map.getCanvas().style.cursor = "crosshair"
          })

          map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")

          const markerEl = createCustomPinElement()
          const marker = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
            .setLngLat(DEFAULT_MAP_CENTER)
            .addTo(map)
          markerRef.current = marker

          map.on("click", async (e) => {
            const { lng, lat } = e.lngLat
            if (markerRef.current) {
              markerRef.current.setLngLat([lng, lat])
            }
            map.panTo([lng, lat])
            if (updateLocationRef.current) {
              await updateLocationRef.current(lat, lng, false)
            }
          })
        } catch (e) {
          console.error("Mapbox init error:", e)
        }
      })
    }

    const initTimer = setTimeout(initMap, 50)

    return () => {
      cancelled = true
      clearTimeout(initTimer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      markerRef.current = null
    }
  }, [])

  return (
    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-input bg-muted/10">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}

export function LocationPicker({ value, onChange, onAddressDetailsChange, errorMessage, hasError }) {
  const toast = useToast()
  const [dialogMode, setDialogMode] = useState(null)
  const [isDetectingGPS, setIsDetectingGPS] = useState(false)
  const [gpsFailed, setGpsFailed] = useState(false)
  const [pendingLocation, setPendingLocation] = useState("")
  const [pendingDetails, setPendingDetails] = useState(null)

  const updateLocationFromCoords = useCallback(
    async (latitude, longitude) => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
        const { location, details } = await geocodeService.reverseGeocode(
          latitude,
          longitude,
          token
        )
        setPendingLocation(location)
        setPendingDetails(details)
      } catch (error) {
        console.error("Error geocoding location:", error)
      }
    },
    []
  )

  const handleUseGPS = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast({ body: "Browser Anda tidak mendukung fitur deteksi GPS.", type: "error" })
      setGpsFailed(true)
      return
    }

    setIsDetectingGPS(true)
    setGpsFailed(false)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await updateLocationFromCoords(latitude, longitude)
        setIsDetectingGPS(false)
      },
      (error) => {
        console.error("GPS error:", error)
        setIsDetectingGPS(false)
        setGpsFailed(true)
        let errMsg = "Gagal mendeteksi lokasi."
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = "Izin akses lokasi ditolak oleh pengguna."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = "Informasi lokasi tidak tersedia."
        } else if (error.code === error.TIMEOUT) {
          errMsg = "Waktu permintaan lokasi habis."
        }
        toast({ body: errMsg, type: "error" })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [toast, updateLocationFromCoords])

  const openAutoDialog = () => {
    setPendingLocation(value || "")
    setPendingDetails(null)
    setGpsFailed(false)
    setDialogMode("auto")
  }

  const openManualDialog = () => {
    setPendingLocation(value || "")
    setPendingDetails(null)
    setDialogMode("manual")
  }

  const closeDialog = () => {
    setDialogMode(null)
    setGpsFailed(false)
    setIsDetectingGPS(false)
  }

  const confirmLocation = () => {
    if (!pendingLocation.trim()) return
    onChange(pendingLocation)
    if (onAddressDetailsChange) onAddressDetailsChange(pendingDetails)
    closeDialog()
  }

  const handleManualLocationUpdate = useCallback((location, details) => {
    setPendingLocation(location)
    setPendingDetails(details)
  }, [])

  useEffect(() => {
    if (dialogMode === "auto") {
      handleUseGPS()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogMode])

  return (
    <div className="flex flex-col gap-1.5 space-y-2">
      <Label>
        Lokasi Kejadian <span className="text-red-500">*</span>
      </Label>

      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-primary pointer-events-none" />
        <Input
          placeholder="Contoh: Jl. Margonda Raya dekat Halte Stasiun UI"
          className="pl-9 focus:!border-primary focus:!ring-primary aria-invalid:border-red-500 aria-invalid:focus:!border-red-500 aria-invalid:focus:!ring-red-500"
          value={value}
          aria-invalid={hasError ? "true" : "false"}
          onChange={(e) => {
            onChange(e.target.value)
            if (onAddressDetailsChange) onAddressDetailsChange(null)
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={openAutoDialog}
          className="focus:border-primary focus:ring-primary"
        >
          <Navigation className="w-4 h-4" />
          Deteksi Auto
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={openManualDialog}
        >
          <Pencil className="w-4 h-4" />
          Ubah Manual
        </Button>
      </div>

      {errorMessage && (
        <p className="text-xs font-medium text-red-500 mt-1">{errorMessage}</p>
      )}

      {/* dialog deteksi lokasi otomatis */}
      <Dialog open={dialogMode === "auto"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent
          className="w-full max-w-[calc(100%-2rem)] sm:max-w-[420px] bg-card p-6 rounded-2xl border-none"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Deteksi Lokasi Otomatis
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Kami akan menggunakan GPS perangkat Anda untuk mendeteksi lokasi kejadian.
            </DialogDescription>
          </DialogHeader>

          {gpsFailed && (
            <Alert className="border-dashed border-primary/40 bg-primary/10">
              <AlertTriangle className="text-primary" />
              <AlertDescription className="text-foreground text-sm">
                Kami tidak dapat mendeteksi lokasi Anda. Silakan pilih lokasi kejadian secara
                manual.
              </AlertDescription>
            </Alert>
          )}

          {isDetectingGPS && (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Mendeteksi lokasi Anda...</p>
            </div>
          )}

          {!isDetectingGPS && pendingLocation && !gpsFailed && (
            <div className="space-y-2">
              <Label>Lokasi Terpilih</Label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-4 h-4 text-primary pointer-events-none" />
                <Input
                  className="pl-9 bg-card focus:!border-primary focus:!ring-primary"
                  value={pendingLocation}
                  readOnly
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!isDetectingGPS && pendingLocation && !gpsFailed && (
              <Button
                type="button"
                variant="primary"
                onClick={confirmLocation}
                className="flex-1"
              >
                Pilih lokasi ini
              </Button>
            )}
            {gpsFailed && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  closeDialog()
                  openManualDialog()
                }}
                className="flex-1"
              >
                Pilih manual
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={closeDialog}
              className="flex-1 focus:border-primary focus:ring-primary"
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* dialog pilih lokasi manual */}
      <Dialog open={dialogMode === "manual"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent
          className="w-full max-w-[calc(100%-2rem)] sm:max-w-[480px] bg-card p-6 rounded-2xl border-none"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Pilih Lokasi Secara Manual
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Klik pada peta untuk memilih lokasi kejadian.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Lokasi Kejadian</Label>
              <span className="text-xs text-muted-foreground">Gunakan kontrol peta</span>
            </div>

            <ManualLocationMap onLocationUpdate={handleManualLocationUpdate} />

            <div className="space-y-2">
              <Label>Lokasi Terpilih</Label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-4 h-4 text-primary pointer-events-none" />
                <Input
                  className="pl-9 bg-card focus:!border-primary focus:!ring-primary"
                  placeholder="Klik peta untuk memilih lokasi"
                  value={pendingLocation}
                  onChange={(e) => {
                    setPendingLocation(e.target.value)
                    setPendingDetails(null)
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={confirmLocation}
              disabled={!pendingLocation.trim()}
              className="flex-1"
            >
              Pilih lokasi ini
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={closeDialog}
              className="flex-1 focus:border-primary focus:ring-primary"
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
