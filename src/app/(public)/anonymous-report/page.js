"use client"

import React from "react"
import AnonymousReport from "@/features/report/components/anonymous-report"

export default function AnonymousReportPage() {
  return (
    <main className="min-h-screen w-full bg-background flex flex-col items-center justify-start">
      <div className="w-full flex-1 flex flex-col">
        <AnonymousReport />
      </div>
    </main>
  )
}
