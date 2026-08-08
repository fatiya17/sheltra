"use client"

import React from "react"
import SosContainer from "@/features/sos/components/sos-container"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function SosPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="w-full flex items-center justify-center">
          <SosContainer />
        </div>
      </main>
    </AuthGuard>
  )
}

