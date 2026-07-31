"use client"

import React from "react"
import dynamic from "next/dynamic"

const InteractiveMap = dynamic(() => import("@/components/interactive-map"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center">
      <p className="text-slate-400 text-sm">Memuat peta...</p>
    </div>
  )
})

export default function MapShowcase() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950 relative">
      <InteractiveMap />
    </main>
  )
}
