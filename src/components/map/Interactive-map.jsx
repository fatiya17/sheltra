"use client"

import React, { useRef, useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import Link from "next/link"
import "mapbox-gl/dist/mapbox-gl.css"
import { 
  Info, 
  Trash2, 
  X, 
  Map as MapIcon,
  Loader2,
  Lock,
  ArrowUp
} from "lucide-react"

// Coordinates for Jakarta (Monas) as general default
const DEFAULT_CENTER = [106.82715, -6.17511]
const DEFAULT_ZOOM = 11.5

export default function InteractiveMap({ onLocationSelect }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const routeMarkerStartRef = useRef(null)
  const routeMarkerEndRef = useRef(null)

  // Token management
  const [token, setToken] = useState("")
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [showTokenPrompt, setShowTokenPrompt] = useState(true)

  // Map style default
  const mapStyle = "streets-v12" // Default street view style
  const [isLoading, setIsLoading] = useState(false)

  // Route Planning states
  const [routeStart, setRouteStart] = useState(null) // { lng, lat, name }
  const [routeEnd, setRouteEnd] = useState(null) // { lng, lat, name }
  const [selectingRoutePoint, setSelectingRoutePoint] = useState(null) // 'start' or 'end'
  const [routeDistance, setRouteDistance] = useState("")
  const [routeDuration, setRouteDuration] = useState("")
  const [isRoutingFallback, setIsRoutingFallback] = useState(false)

  // Autocomplete typing states
  const [startSearchText, setStartSearchText] = useState("")
  const [endSearchText, setEndSearchText] = useState("")
  const [startSuggestions, setStartSuggestions] = useState([])
  const [endSuggestions, setEndSuggestions] = useState([])
  const searchTimeoutRef = useRef(null)

  // Load token from localStorage or process.env on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("mapbox_user_token") || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (savedToken) {
      setToken(savedToken)
      setIsTokenValid(true)
      setShowTokenPrompt(false)
    }
  }, [])

  // Auto detect current location on mount/token load
  useEffect(() => {
    if (!isTokenValid) return

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const startLoc = { 
            lng: longitude, 
            lat: latitude, 
            name: "Mendapatkan lokasi saat ini..." 
          }
          setRouteStart(startLoc)
          setStartSearchText("Lokasi Saya Sekarang")
          reverseGeocode(longitude, latitude, "start")

          // Center map to current position
          const map = mapRef.current
          if (map) {
            map.flyTo({ center: [longitude, latitude], zoom: 15 })
          }
        },
        (error) => {
          console.warn("GPS auto-detect skipped on mount:", error)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [isTokenValid])

  // Initialize Map
  useEffect(() => {
    if (!token) return

    mapboxgl.accessToken = token

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
        bearing: 0,
        antialias: true
      })

      mapRef.current = map

      // Controls
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "bottom-right")
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }), "bottom-right")

      map.on("load", () => {
        // Overlay Google Maps standard road tiles
        map.addSource("google-tiles", {
          type: "raster",
          tiles: ["https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"],
          tileSize: 256
        })

        map.addLayer({
          id: "google-layer",
          type: "raster",
          source: "google-tiles",
          paint: { "raster-opacity": 1 }
        })

        // Init Route layer source
        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] }
          }
        })

        // Route path layer
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#00aa13", // Gojek Brand Green
            "line-width": 6,
            "line-opacity": 0.9
          }
        })

        // Route dashed helper line layer (in case fallback direct line is drawn)
        map.addLayer({
          id: "route-line-dashed",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#64748b",
            "line-width": 4,
            "line-dasharray": [2, 2],
            "line-opacity": 0.7
          }
        })

        // Set initial visibility
        map.setLayoutProperty("route-line", "visibility", "none")
        map.setLayoutProperty("route-line-dashed", "visibility", "none")
      })

      // Map click handler for selecting coordinates
      map.on("click", (e) => {
        const { lng, lat } = e.lngLat

        if (selectingRoutePoint === "start") {
          setRouteStart({ lng, lat, name: `Loading alamat...` })
          setStartSearchText("Mengambil alamat...")
          reverseGeocode(lng, lat, "start")
          setSelectingRoutePoint(null)
        } else if (selectingRoutePoint === "end") {
          setRouteEnd({ lng, lat, name: `Loading alamat...` })
          setEndSearchText("Mengambil alamat...")
          reverseGeocode(lng, lat, "end")
          setSelectingRoutePoint(null)
        }
      })

      return () => {
        if (routeMarkerStartRef.current) routeMarkerStartRef.current.remove()
        if (routeMarkerEndRef.current) routeMarkerEndRef.current.remove()
        map.remove()
      }
    } catch (error) {
      console.error("Mapbox load error:", error)
      setIsTokenValid(false)
      setShowTokenPrompt(true)
    }
  }, [token])

  // Update markers and request route when start/end changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 1. Manage Start Marker
    if (routeStart) {
      if (!routeMarkerStartRef.current) {
        // Create custom start marker (pink circle with white upward arrow)
        const el = document.createElement("div")
        el.className = "w-8 h-8 rounded-full bg-[#ffa2cf] border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer"
        el.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`

        routeMarkerStartRef.current = new mapboxgl.Marker(el)
          .setLngLat([routeStart.lng, routeStart.lat])
          .addTo(map)
      } else {
        routeMarkerStartRef.current.setLngLat([routeStart.lng, routeStart.lat])
      }
    } else if (routeMarkerStartRef.current) {
      routeMarkerStartRef.current.remove()
      routeMarkerStartRef.current = null
    }

    // 2. Manage End Marker
    if (routeEnd) {
      if (!routeMarkerEndRef.current) {
        // Create custom orange marker (Gojek style rounded orange pin-drop with white circle, anchored to bottom)
        const el = document.createElement("div")
        el.className = "w-9 h-11 flex items-center justify-center cursor-pointer drop-shadow-lg"
        el.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#e8195a"/><circle cx="19" cy="19" r="6.5" fill="white"/></svg>`

        routeMarkerEndRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([routeEnd.lng, routeEnd.lat])
          .addTo(map)
      } else {
        routeMarkerEndRef.current.setLngLat([routeEnd.lng, routeEnd.lat])
      }
    } else if (routeMarkerEndRef.current) {
      routeMarkerEndRef.current.remove()
      routeMarkerEndRef.current = null
    }

    // 3. Draw Route Path
    if (routeStart && routeEnd) {
      fetchRoute(routeStart, routeEnd)
    } else {
      // Clear route line
      if (map.isStyleLoaded() && map.getSource("route-source")) {
        map.getSource("route-source").setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        })
        map.setLayoutProperty("route-line", "visibility", "none")
        map.setLayoutProperty("route-line-dashed", "visibility", "none")
      }
      setRouteDistance("")
      setRouteDuration("")
      setIsRoutingFallback(false)
    }
  }, [routeStart, routeEnd])

  // Reset function
  const handleResetRoute = () => {
    setRouteStart(null)
    setRouteEnd(null)
    setStartSearchText("")
    setEndSearchText("")
    setStartSuggestions([])
    setEndSuggestions([])
    setSelectingRoutePoint(null)
  }

  // Reverse Geocoding via OSM Nominatim API
  const reverseGeocode = async (lng, lat, target) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`
      )
      const data = await response.json()
      const address = data.display_name
        ? data.display_name.split(",").slice(0, 3).join(",") // Just get top 3 parts for compact size
        : `Koordinat: ${lng.toFixed(5)}, ${lat.toFixed(5)}`

      if (target === "start") {
        setRouteStart(prev => prev ? { ...prev, name: address } : null)
        setStartSearchText(address)
      } else if (target === "end") {
        setRouteEnd(prev => prev ? { ...prev, name: address } : null)
        setEndSearchText(address)
      }
    } catch (error) {
      console.error("Geocode error:", error)
      const fallbackAddress = `Koordinat: ${lng.toFixed(5)}, ${lat.toFixed(5)}`
      if (target === "start") {
        setRouteStart(prev => prev ? { ...prev, name: fallbackAddress } : null)
        setStartSearchText(fallbackAddress)
      } else if (target === "end") {
        setRouteEnd(prev => prev ? { ...prev, name: fallbackAddress } : null)
        setEndSearchText(fallbackAddress)
      }
    }
  }

  // Autocomplete suggestions search typing handler
  const handleSearchInputChange = (val, type) => {
    if (type === "start") {
      setStartSearchText(val)
      if (!val.trim()) {
        setStartSuggestions([])
        return
      }
    } else {
      setEndSearchText(val)
      if (!val.trim()) {
        setEndSuggestions([])
        return
      }
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val, type)
    }, 450) // 450ms debounce
  }

  const fetchSuggestions = async (query, type) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id`
      )
      const data = await res.json()
      if (type === "start") {
        setStartSuggestions(data)
      } else {
        setEndSuggestions(data)
      }
    } catch (e) {
      console.error("Fetch suggestions error:", e)
    }
  }

  const handleSelectSuggestion = (item, type) => {
    const lng = parseFloat(item.lon)
    const lat = parseFloat(item.lat)
    const name = item.display_name.split(",").slice(0, 3).join(",")

    const map = mapRef.current

    if (type === "start") {
      setRouteStart({ lng, lat, name })
      setStartSearchText(name)
      setStartSuggestions([])
      if (map) map.flyTo({ center: [lng, lat], zoom: 15.5 })
    } else {
      setRouteEnd({ lng, lat, name })
      setEndSearchText(name)
      setEndSuggestions([])
      if (map) map.flyTo({ center: [lng, lat], zoom: 15.5 })
    }
  }

  const fitRouteBounds = (start, end) => {
    const map = mapRef.current
    if (!map) return

    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([start.lng, start.lat])
    bounds.extend([end.lng, end.lat])

    map.fitBounds(bounds, {
      padding: { 
        top: 180, 
        bottom: 240, 
        left: 60, 
        right: 60 
      },
      duration: 1500
    })
  }

  // Fetch Route from Mapbox Directions API
  const fetchRoute = async (start, end) => {
    const map = mapRef.current
    if (!map) return

    setIsLoading(true)
    setIsRoutingFallback(false)

    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${token}`
      )
      const json = await query.json()

      if (json.routes && json.routes.length > 0) {
        const routeData = json.routes[0]
        const routeGeoJSON = routeData.geometry

        // Update Source
        map.getSource("route-source").setData({
          type: "Feature",
          properties: {},
          geometry: routeGeoJSON
        })

        // Show line path, hide dashed
        map.setLayoutProperty("route-line", "visibility", "visible")
        map.setLayoutProperty("route-line-dashed", "visibility", "none")

        // Distance / duration info
        const distKm = (routeData.distance / 1000).toFixed(2)
        const durMin = Math.round(routeData.duration / 60)
        setRouteDistance(`${distKm} km`)
        setRouteDuration(`${durMin} menit`)
        
        // Zoom and center route
        fitRouteBounds(start, end)
      } else {
        throw new Error("No routes found")
      }
    } catch (err) {
      console.warn("Using fallback route line drawing.", err)
      setIsRoutingFallback(true)

      map.getSource("route-source").setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat]
          ]
        }
      })

      map.setLayoutProperty("route-line", "visibility", "none")
      map.setLayoutProperty("route-line-dashed", "visibility", "visible")

      // Estimate distance
      const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng)
      setRouteDistance(`${distance.toFixed(2)} km`)
      setRouteDuration(`${Math.round(distance * 15)} menit`) // 15 mins per km walking speed
      
      // Zoom and center route
      fitRouteBounds(start, end)
    } finally {
      setIsLoading(false)
    }
  }

  // Haversine distance formula for fallback
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Token Save Handler
  const handleSaveToken = (e) => {
    e.preventDefault()
    if (token.trim()) {
      localStorage.setItem("mapbox_user_token", token.trim())
      setIsTokenValid(true)
      setShowTokenPrompt(false)
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-900 font-sans">
      
      {/* Mapbox Div */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* FLOATING TOP PANEL: Gojek-style Unified Address Selector */}
      {!showTokenPrompt && (
        <div className="absolute top-4 left-4 right-4 md:left-6 md:w-[420px] md:right-auto z-45 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col gap-3 pointer-events-auto">
          
          {/* Header Row: Close Button & Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </Link>
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white tracking-tight">
              Set lokasi jemput
            </h3>
          </div>

          {/* Unified Input Card */}
          <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 p-0.5">
            
            {/* Input Row 1: Start Point */}
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <div className="w-6 h-6 rounded-full bg-[#ffa2cf] flex items-center justify-center text-white shrink-0 shadow-xs">
                <ArrowUp className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={startSearchText}
                  onChange={(e) => handleSearchInputChange(e.target.value, "start")}
                  placeholder="Cari lokasi jemput"
                  className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 py-0.5"
                />
                {startSearchText && (
                  <button
                    type="button"
                    onClick={() => { setRouteStart(null); setStartSearchText(""); setStartSuggestions([]) }}
                    className="absolute right-0 top-1 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Vertical Dots Connector & Horizontal Line Divider */}
            <div className="relative h-px bg-slate-200/70 dark:bg-slate-800 mx-3">
              <div className="absolute left-[10px] -top-3.5 bottom-0 flex flex-col gap-0.5 items-center justify-center z-10">
                <div className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700" />
                <div className="w-1 h-1 rounded-full bg-slate-355 dark:bg-slate-700" />
                <div className="w-1 h-1 rounded-full bg-slate-355 dark:bg-slate-700" />
              </div>
            </div>

            {/* Input Row 2: Destination */}
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                </div>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={endSearchText}
                  onChange={(e) => handleSearchInputChange(e.target.value, "end")}
                  placeholder="Cari lokasi tujuan"
                  className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 py-0.5"
                />
                {endSearchText && (
                  <button
                    type="button"
                    onClick={() => { setRouteEnd(null); setEndSearchText(""); setEndSuggestions([]) }}
                    className="absolute right-0 top-1 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Autocomplete Suggestions list for Start Input */}
          {startSuggestions.length > 0 && (
            <div className="z-50 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-inner p-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {startSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item, "start")}
                  className="w-full text-left py-2 px-3.5 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate transition-colors"
                >
                  {item.display_name}
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete Suggestions list for End Input */}
          {endSuggestions.length > 0 && (
            <div className="z-50 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-inner p-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {endSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item, "end")}
                  className="w-full text-left py-2 px-3.5 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate transition-colors"
                >
                  {item.display_name}
                </button>
              ))}
            </div>
          )}

          {/* Gojek-style Pill Buttons Row */}
          <div className="flex gap-2.5 mt-0.5">
            {/* Pill 1: Pilih Lewat Peta */}
            <button
              type="button"
              onClick={() => {
                // Toggles clicking on map to pick destination coordinate
                setSelectingRoutePoint(selectingRoutePoint === "end" ? null : "end")
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-bold shadow-xs transition-all ${
                selectingRoutePoint === "end"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Pilih lewat peta</span>
            </button>

            {/* Pill 2: Reset Rute */}
            <button
              type="button"
              onClick={handleResetRoute}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 shadow-xs transition-all ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>Reset rute</span>
            </button>
          </div>

        </div>
      )}

      {/* BOTTOM FLOATING SHEET (DRAWER): Clean Route Details Only */}
      {!showTokenPrompt && routeDistance && (
        <div className="absolute bottom-20 left-4 right-4 md:left-6 md:w-[420px] md:right-auto md:bottom-6 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200/60 dark:border-slate-850 shadow-2xl flex flex-col gap-3 pointer-events-auto">
          <div className="p-3.5 bg-primary/10 rounded-2xl flex flex-col gap-1.5 border border-primary/20">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Estimasi Jarak</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{routeDistance}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Waktu Tempuh</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{routeDuration}</span>
            </div>
            {isRoutingFallback && (
              <p className="text-[9px] text-slate-400 mt-1 leading-tight flex items-start gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                Garis lurus (Harap setup Mapbox Token untuk navigasi jalan raya)
              </p>
            )}
          </div>
        </div>
      )}

      {/* MAPBOX ACCESS TOKEN MODAL PROMPT */}
      {showTokenPrompt && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary-foreground flex items-center justify-center">
              <Lock className="w-6 h-6 text-pink-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-sans">
                Mapbox Token Diperlukan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light font-sans">
                Untuk memuat peta interaktif dan navigasi rute, masukkan Mapbox Public Access Token Anda.
              </p>
            </div>
            
            <form onSubmit={handleSaveToken} className="space-y-3">
              <input
                type="password"
                placeholder="pk.eyJ1Ijo..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full py-3 px-4 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:border-primary font-mono text-slate-800 dark:text-slate-200"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const testToken = "pk.eyJ1IjoiZmF0aXlhMTIzIiwiYSI6ImNseTFmZnp1MDBoYzgxMnBzdzhsdDNrdTAifQ.xxxx";
                    setToken(testToken);
                    setIsTokenValid(true);
                    setShowTokenPrompt(false);
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-150 dark:hover:bg-slate-750 transition-colors font-sans"
                >
                  Gunakan Demo
                </button>
                <button
                  type="submit"
                  disabled={!token.trim()}
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition-colors font-sans"
                >
                  Simpan Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
