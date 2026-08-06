import React, { Suspense } from "react"
import { ProtectedTripFlow } from "@/features/guardian"

export const metadata = {
  title: "Protected Trip - Sheltra Guardian",
  description: "Perjalanan Terlindungi secara real-time dengan kontak darurat",
}

export default function GuardianProtectedTripPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProtectedTripFlow />
    </Suspense>
  )
}
