"use client"

import React, { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/features/auth/context/auth-context"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Memeriksa status akun...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Akses Terbatas</h2>
          <p className="text-sm text-slate-500 max-w-xs">
            Fitur ini hanya dapat diakses setelah Anda masuk ke akun Sheltra.
          </p>
        </div>
        <Button asChild variant="primary" className="rounded-xl px-6">
          <Link href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}>
            Masuk Sekarang
          </Link>
        </Button>
      </div>
    )
  }

  return children
}
