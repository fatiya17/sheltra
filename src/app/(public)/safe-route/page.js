"use client"

import React from "react"
import SafeCommute from "@/features/safe-route/components/safe-commute"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function SafeRoutePage() {
  return (
    <AuthGuard>
      <main className="h-screen w-full overflow-hidden bg-background">
        <SafeCommute />
      </main>
    </AuthGuard>
  )
}

