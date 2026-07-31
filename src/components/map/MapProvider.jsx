"use client"

import React, { createContext, useContext, useState } from "react"

const MapContext = createContext(null)

export function MapProvider({ children }) {
  const [mapInstance, setMapInstance] = useState(null)

  return (
    <MapContext.Provider value={{ mapInstance, setMapInstance }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
