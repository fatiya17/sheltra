"use client"

import React from "react"
import {
  Search,
  Bookmark,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MapPin,
} from "lucide-react"
import {
  SAVED_BOOKMARKS,
  RECENT_DESTINATIONS,
} from "../constants/safe-route.constants"
import { Button } from "@/components/ui/button"

export function SafeCommuteHome({
  onOpenSearch,
  onSelectPreset,
  onSelectDestination,
}) {
  return (
    <div className="w-full flex flex-col bg-background pb-12">
      {/* header hijau gojek style */}
      <div className="bg-gradient-to-b from-[#00880f] via-[#00aa13] to-[#00aa13] text-white pt-8 pb-14 px-5 relative overflow-hidden rounded-b-[32px] shadow-md">
        {/* dekorasi visual latar */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto space-y-4">
          {/* ucapan sambutan */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold font-heading tracking-tight leading-tight">
              Siap menghadapi hari, Fatiya?
            </h1>
            <p className="text-sm text-emerald-100 font-medium leading-relaxed">
              Semangat kembali ke rutinitas harian dengan rute perjalanan teraman.
            </p>
          </div>

          {/* banner promo / safety tip */}
          <div
            onClick={onOpenSearch}
            className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/20 transition-all select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-[#00880f] flex items-center justify-center font-semibold shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  Safe Commute Siaga
                  <span className="text-[11px] bg-amber-400 text-slate-950 font-semibold px-1.5 py-0.2 rounded-full">
                    24 JAM
                  </span>
                </p>
                <p className="text-xs text-emerald-100 font-normal">
                  Tap untuk cek rute bebas titik rawan & safe points!
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
          </div>
        </div>
      </div>

      {/* konten utama bertumpuk */}
      <div className="max-w-lg w-full mx-auto px-4 -mt-8 relative z-20 space-y-4">
        {/* card search bar & bookmark */}
        <div className="bg-white border border-input rounded-3xl p-4 shadow-xl space-y-3.5">
          {/* mini peta ilustrasi */}
          <div
            onClick={onOpenSearch}
            className="h-28 w-full rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-850 border border-border/60 relative overflow-hidden flex items-center justify-center cursor-pointer group"
          >
            {/* garis rute simulasi pada mini map */}
            <svg
              className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
              viewBox="0 0 300 120"
              fill="none"
            >
              <path
                d="M 20 80 Q 90 20, 160 60 T 280 40"
                stroke="#00aa13"
                strokeWidth="4"
                strokeDasharray="6 4"
              />
              <circle cx="20" cy="80" r="6" fill="#00880f" />
              <circle cx="280" cy="40" r="7" fill="#ff6b00" />
            </svg>

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-3">
              <div className="flex items-center gap-1.5 text-white text-sm font-semibold drop-shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Peta Interaktif Rekomendasi Rute Aman</span>
              </div>
            </div>
          </div>

          {/* input bar pencarian tujuan */}
          <div
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/70 border border-input rounded-2xl cursor-pointer transition-all shadow-xs group"
          >
            <div className="w-4 h-4 rounded-full bg-orange-600/20 border-2 border-orange-600 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground flex-1 group-hover:text-foreground">
              Cari lokasi tujuan perjalanan...
            </span>
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </div>

          {/* pills bookmark tersimpan */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SAVED_BOOKMARKS.map((bm) => (
              <button
                key={bm.id}
                type="button"
                onClick={() => onSelectDestination(bm.address)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-input bg-background hover:bg-muted text-sm font-semibold text-foreground whitespace-nowrap shadow-2xs transition-all"
              >
                <Bookmark className="w-3 h-3 text-muted-foreground fill-muted-foreground/30" />
                <span>{bm.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* section riwayat tujuan */}
        <div className="bg-white border border-input rounded-3xl p-4 shadow-sm space-y-3">

          {/* onetap highlight card */}
          <div
            onClick={() => onSelectPreset("preset-sudirman-senopati")}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#00aa13] text-white text-[11px] font-semibold tracking-wide">
                  OneTap
                </span>
                <span className="text-sm font-semibold text-foreground">SafeRoute CEPAAAT & AMAN</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shrink-0">
                ↑
              </div>
              <span className="truncate">Stasiun Sudirman ➔ Jl. Senopati No. 45</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold pl-6">
              ✓ Melewati 5 Safe Points 24 Jam • Skor 94 (Sangat Aman)
            </p>
          </div>

          {/* daftar riwayat biasa */}
          <div className="divide-y divide-border/60">
            {RECENT_DESTINATIONS.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelectDestination(rec.name)}
                className="py-3.5 px-1 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/20 transition-all group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 fill-muted-foreground/20" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {rec.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{rec.detail}</p>
                  </div>
                </div>

                <Bookmark className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
