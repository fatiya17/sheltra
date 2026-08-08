"use client"

import React, { Suspense } from "react"
import { ProtectedTripFlow } from "@/features/guardian"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function GuardianProtectedTripPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        }
      >
        <ProtectedTripFlow />
      </Suspense>
    </AuthGuard>
  )
}

