"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { RISK_LEVELS } from "../constants/heatmap.constants"

export function HeatmapLegend({ className = "" }) {
  const riskKeys = ["HIGH", "MEDIUM", "LOW", "SAFE"]
  const variantMap = {
    HIGH: "red",
    MEDIUM: "orange",
    LOW: "yellow",
    SAFE: "green",
  }

  return (
    <div
      className={`p-3.5 rounded-2xl border border-input bg-white/95 text-card-foreground backdrop-blur-md shadow-xs ${className}`}
    >
      {/* header judul legenda tanpa icon */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-foreground tracking-tight">
          Legenda Tingkat Risiko
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">Indikator Peta</span>
      </div>

      {/* daftar pill risiko */}
      <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {riskKeys.map((key) => {
          const item = RISK_LEVELS[key]
          return (
            <Badge
              key={item.id}
              variant={variantMap[key] || "default"}
              className="py-1 px-2.5 h-auto text-xs font-medium justify-center sm:justify-start gap-1.5 shadow-2xs shrink-0 whitespace-nowrap"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
