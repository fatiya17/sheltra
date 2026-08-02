"use client"

import React from "react"
import SafeCommute from "@/features/safe-route/components/safe-commute"

export default function SafeRoutePage() {
  return (
    <main className="h-screen w-full bg-background flex flex-col">
      {/* konten fitur safe route */}
      <div className="w-full flex-1 flex flex-col">
        <SafeCommute />
      </div>
    </main>
  )
}
