"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  Clock,
  Navigation,
  Sun,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"

export function RouteCard({ route, isSelected, onSelect }) {
  const isBlank = route.isBlankSpot

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative select-none ${
        isSelected
          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
          : "border-input bg-card hover:bg-muted/30 text-card-foreground"
      }`}
    >
      {/* header rute & badge */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: route.color || "#ffa2cf" }}
              />
              {route.title}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{route.tag}</p>
        </div>

        {/* badge skor risiko / data terbatas */}
        <div>
          {isBlank ? (
            <Badge variant="yellow" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              Data Terbatas
            </Badge>
          ) : route.safetyScore >= 80 ? (
            <Badge variant="pink" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              Skor: {route.safetyScore}/100 ({route.riskLevel})
            </Badge>
          ) : (
            <Badge variant="orange" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              Skor: {route.safetyScore}/100 ({route.riskLevel})
            </Badge>
          )}
        </div>
      </div>

      {/* grid metrik waktu & safe points */}
      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/40 rounded-lg text-sm">
        {/* estimasi waktu */}
        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Waktu
          </span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{route.duration}</p>
        </div>

        {/* jarak tempuh */}
        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Navigation className="w-3 h-3" /> Jarak
          </span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{route.distance}</p>
        </div>

        {/* jumlah safe points */}
        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Safe Points
          </span>
          <p className="font-semibold text-primary">
            {isBlank ? "0 Titik" : `${route.safePointsCount} Titik 24 Jam`}
          </p>
        </div>
      </div>

      {/* informasi pencahayaan & insiden jika ada */}
      {!isBlank && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            Pencahayaan: <strong className="text-foreground">{route.lightingScore}%</strong>
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Kepadatan: <strong className="text-foreground">{route.crowdDensityScore}%</strong>
          </span>
        </div>
      )}

      {/* banner disclaimer blank spot */}
      {isBlank && route.disclaimer && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Data Keamanan Terbatas di Area Ini</span>
          </div>
          <p className="text-xs leading-relaxed">{route.disclaimer}</p>
        </div>
      )}

      {/* poin keunggulan / highlights rute */}
      {route.highlights && route.highlights.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/50">
          {route.highlights.map((point, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-sm text-muted-foreground leading-tight">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      )}

      {/* penanda rute terpilih */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span
          className={`font-medium ${
            isSelected ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {isSelected ? "● Rute Aktif di Peta" : "Klik untuk memilih rute ini"}
        </span>
        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
      </div>
    </div>
  )
}
