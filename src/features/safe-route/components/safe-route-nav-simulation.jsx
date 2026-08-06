"use client"

import React from "react"
import { generateNavigationSteps, formatNavDistance } from "../utils/navigation.utils"

export function SafeRouteNavSimulation({ route, safePoints = [] }) {
  const steps = route?.coordinates
    ? generateNavigationSteps(route.coordinates, safePoints)
    : []

  if (steps.length === 0) return null

  return (
    <div>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
        Panduan Arah
      </p>
      <div className="space-y-0">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-stretch gap-2.5 py-1.5">
            <div className="flex flex-col items-center w-5 shrink-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${step.color}`}
              >
                {step.icon}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-px flex-1 min-h-[16px] bg-border/60" />
              )}
            </div>
            <div className="pb-2 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {step.label}
              </p>
              {step.subtitle && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {step.subtitle}
                </p>
              )}
              {step.distance > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatNavDistance(step.distance)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
