"use client"

import React from "react"
import { InteractiveHeatmap } from "@/features/heatmap/components/interactive-heatmap"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function HeatmapPage() {
  return (
    <AuthGuard>
      <main className="h-screen w-full bg-background flex flex-col">
        {/* konten fitur heatmap interaktif */}
        <div className="w-full flex-1 flex flex-col">
          <InteractiveHeatmap />
        </div>
      </main>
    </AuthGuard>
  )
}

