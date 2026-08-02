"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, MapPinned, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { geocodeService } from "../services/geocode.service"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../constants/report.constants"
import "mapbox-gl/dist/mapbox-gl.css"

function createCustomPinElement() {
  const el = document.createElement("div")
  el.className = "relative flex flex-col items-center justify-end cursor-pointer pointer-events-none drop-shadow-xl"
  el.style.width = "56px"
  el.style.height = "72px"
  el.innerHTML = `
    <svg class="relative z-10 -mb-[16px]" viewBox="0 0 38 48" width="32" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#db2777" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="19" cy="19" r="6.5" fill="#ffffff"/>
    </svg>
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="absolute w-12 h-12 bg-sky-500/50 rounded-full animate-ping" style="animation-duration: 2s;"></div>
      <div class="absolute w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-white shadow-sm"></div>
    </div>
  `
  return el
}

export function LocationPicker({ value, onChange, onAddressDetailsChange }) {
  const toast = useToast()
  const [isDetectingGPS, setIsDetectingGPS] = useState(false)

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const updateLocationRef = useRef(null)

  // reverse geocode & sinkronisasi lokasi
  const updateLocationFromCoords = useCallback(
    async (latitude, longitude, shouldCenterMap = false) => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
        const { location, details } = await geocodeService.reverseGeocode(
          latitude,
          longitude,
          token
        )

        if (onAddressDetailsChange) onAddressDetailsChange(details)
        onChange(location)

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
    [onChange, onAddressDetailsChange]
  )

  useEffect(() => {
    updateLocationRef.current = updateLocationFromCoords
  }, [updateLocationFromCoords])

  // handler tombol deteksi gps
  const handleUseGPS = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast({ body: "Browser Anda tidak mendukung fitur deteksi GPS.", type: "error" })
      return
    }

    setIsDetectingGPS(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await updateLocationFromCoords(latitude, longitude, true)
        setIsDetectingGPS(false)
      },
      (error) => {
        console.error("GPS error:", error)
        setIsDetectingGPS(false)
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

  // inisialisasi mapbox gl map
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
        })

        map.on("error", (e) => {
          // abaikan tile error saat offline
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      markerRef.current = null
    }
  }, [])

  return (
    <div className="flex flex-col gap-1.5 space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          Lokasi Kejadian <span className="text-red-500">*</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleUseGPS}
          disabled={isDetectingGPS}
          className="h-7 w-7 text-black border-input disabled:opacity-75 flex items-center justify-center rounded-md"
          title="Deteksi Lokasi Saat Ini"
        >
          {isDetectingGPS ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MapPinned className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-primary pointer-events-none" />
        <Input
          placeholder="Contoh: Jl. Margonda Raya dekat Halte Stasiun UI"
          className="pl-9 focus:border-primary focus:ring-primary aria-invalid:focus:border-primary aria-invalid:focus:ring-primary"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            if (onAddressDetailsChange) onAddressDetailsChange(null)
          }}
        />
      </div>

      <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-input bg-muted/10">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
