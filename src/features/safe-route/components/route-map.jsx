"use client"

import React, { useEffect, useRef, useState } from "react"
import { ShieldCheck, AlertTriangle, Eye, Layers } from "lucide-react"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../constants/safe-route.constants"
import "mapbox-gl/dist/mapbox-gl.css"

export function RouteMap({
  routes = [],
  selectedRouteId,
  onSelectRoute,
  safePoints = [],
  riskZones = [],
  originCoords,
  destCoords,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const [showSafePoints, setShowSafePoints] = useState(true)
  const [showRiskZones, setShowRiskZones] = useState(true)

  // helper buat popup marker safe point
  const createSafePointPopup = (mapboxgl, point) => {
    return new mapboxgl.Popup({ offset: 15, maxWidth: "260px" }).setHTML(`
      <div style="padding: 6px; font-family: inherit;">
        <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px;">
          ${point.name}
        </div>
        <div style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 600; margin-bottom: 4px;">
          ${point.categoryLabel}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
          ${point.address}
        </div>
        <div style="font-size: 10px; color: #059669; font-weight: 600;">
          ${point.is24Hours ? "✓ Siaga 24 Jam" : "Jam Operasional Terjadwal"}
        </div>
      </div>
    `)
  }

  // helper buat popup zona risiko
  const createRiskZonePopup = (mapboxgl, zone) => {
    return new mapboxgl.Popup({ offset: 15, maxWidth: "260px" }).setHTML(`
      <div style="padding: 6px; font-family: inherit;">
        <div style="font-weight: 700; font-size: 12px; color: #b91c1c; margin-bottom: 2px;">
          ⚠️ ${zone.name}
        </div>
        <div style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-weight: 600; margin-bottom: 4px;">
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
        })

        mapInstanceRef.current = map

        map.on("load", () => {
          map.resize()

          // tambahkan fallback layer google raster
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

  // gambar layer rute & marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    import("mapbox-gl").then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default

      const renderLayers = () => {
        // bersihkan marker lama
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

        routes.forEach((route) => {
          const sourceId = `route-source-${route.id}`
          const layerId = `route-layer-${route.id}`

          if (map.getLayer(layerId)) {
            map.removeLayer(layerId)
          }

          if (map.getSource(sourceId)) {
            map.removeSource(sourceId)
          }
        })

        // gambar garis rute
        if (activeRoute) {
          const route = activeRoute
          const sourceId = `route-source-${route.id}`
          const layerId = `route-layer-${route.id}`
          const isSelected = route.id === selectedRouteId

          const geojson = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: route.coordinates,
            },
          }

          if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData(geojson)
          } else {
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
                "line-color": route.color || "#10b981",
                "line-width": isSelected ? 7 : 4,
                "line-opacity": 1,
              },
            })

            // event klik garis rute
            map.on("click", layerId, () => {
              if (onSelectRoute) onSelectRoute(route.id)
            })

            map.on("mouseenter", layerId, () => {
              map.getCanvas().style.cursor = "pointer"
            })
            map.on("mouseleave", layerId, () => {
              map.getCanvas().style.cursor = ""
            })
          }

          // update tampilan layer saat route aktif berganti
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, "line-width", isSelected ? 7 : 4)
            map.setPaintProperty(layerId, "line-opacity", 1)
          }
        }

        // render marker safe points
        if (showSafePoints && safePoints.length > 0) {
          safePoints.forEach((point) => {
            const el = document.createElement("div")
            el.className =
              "w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform"
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

        // render marker zona risiko
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

        // render marker titik awal & tujuan
        if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length >= 2) {
          const startCoords = activeRoute.coordinates[0]
          const endCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1]

          // marker titik awal
          const startEl = document.createElement("div")
          startEl.className = "w-8 h-10 flex items-center justify-center cursor-pointer drop-shadow-xl"
          startEl.innerHTML = `<svg viewBox="0 0 38 48" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C8.5 0 0 8.5 0 19C0 32.5 19 48 19 48C19 48 38 32.5 38 19C38 8.5 29.5 0 19 0Z" fill="#ffa2cf" stroke="#ffffff" stroke-width="2.4"/><path d="M19 29V14.2M19 14.2L13.4 19.8M19 14.2L24.6 19.8" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

          const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "bottom" })
            .setLngLat(startCoords)
            .setPopup(new mapboxgl.Popup({ offset: 10 }).setText("Titik Awal (Origin)"))
            .addTo(map)

          // marker tujuan
          const endEl = document.createElement("div")
          endEl.className =
            "w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white font-semibold text-sm"
          endEl.innerText = "B"

          const endMarker = new mapboxgl.Marker({ element: endEl })
            .setLngLat(endCoords)
            .setPopup(new mapboxgl.Popup({ offset: 10 }).setText("Titik Tujuan (Destination)"))
            .addTo(map)

          markersRef.current.push(startMarker, endMarker)

          // fit bounds rute aktif
          const bounds = new mapboxgl.LngLatBounds()
          activeRoute.coordinates.forEach((coord) => bounds.extend(coord))
          map.fitBounds(bounds, { padding: 50, duration: 1000 })
        }
      }

      if (map.isStyleLoaded()) {
        renderLayers()
      } else {
        map.once("load", renderLayers)
      }
    })
  }, [routes, selectedRouteId, safePoints, riskZones, showSafePoints, showRiskZones, onSelectRoute])

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-input shadow-xs bg-slate-100 dark:bg-slate-900">
      {/* kontainer peta mapbox */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* kontrol toggle layer */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          type="button"
          onClick={() => setShowSafePoints(!showSafePoints)}
          className={`px-2.5 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all select-none ${
            showSafePoints
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-background/90 text-muted-foreground hover:bg-background border-input"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Safe Points ({safePoints.length})
        </button>

        <button
          type="button"
          onClick={() => setShowRiskZones(!showRiskZones)}
          className={`px-2.5 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all select-none ${
            showRiskZones
              ? "bg-rose-600 text-white border-rose-700"
              : "bg-background/90 text-muted-foreground hover:bg-background border-input"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Zona Rawan ({riskZones.length})
        </button>
      </div>

      {/* legenda peta */}
      <div className="absolute bottom-3 left-3 right-3 md:right-auto bg-background/90 backdrop-blur-md border border-input rounded-lg p-2 text-xs flex flex-wrap items-center gap-3 shadow-md z-10">
        <div className="flex items-center gap-1">
          <span className="w-3 h-1 bg-emerald-500 rounded-full" />
          <span>Rute Teraman</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-1 bg-amber-500 rounded-full" />
          <span>Rute Alternatif</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Safe Point 24 Jam</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Zona Rawan</span>
        </div>
      </div>
    </div>
  )
}
