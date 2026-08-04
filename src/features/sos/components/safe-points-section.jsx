"use client"

import React from "react"
import { Navigation, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function SafePointsSection({ safePoints = [], userCoords = null }) {
  // buka google maps rute
  const handleOpenDirections = (coords) => {
    if (!coords) return
    const [lng, lat] = coords
    const originParam = userCoords ? `&origin=${userCoords[1]},${userCoords[0]}` : ""
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${originParam}&travelmode=walking`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Card className="rounded-3xl border border-border/60 bg-card lg:h-[calc(100vh-7.5rem)] lg:flex lg:flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
        <div>
          <CardTitle className="text-sm sm:text-base font-bold text-foreground">
            Titik Aman Terdekat
          </CardTitle>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Lokasi evakuasi dalam radius 500 meter
          </p>
        </div>

        <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5 rounded-full">
          {safePoints.length} Titik
        </Badge>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 pb-4 pt-1 lg:flex-1 lg:min-h-0">
        <div className="overflow-y-auto max-h-[48vh] lg:max-h-none lg:h-full pr-2 hide-scrollbar">
        {safePoints.length === 0 ? (
          <div className="p-3 rounded-xl bg-muted/40 text-center">
            <p className="text-xs text-muted-foreground">
              Tidak ada pos resmi dalam 500m. Menampilkan minimarket terdekat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {safePoints.map((sp) => (
              <div
                key={sp.id}
                className="p-3 rounded-xl border border-border/60 bg-background/60 flex flex-col justify-between gap-2.5 group hover:border-primary/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-foreground leading-tight">
                      {sp.name}
                    </h3>
                    <span className="text-[10px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-md shrink-0">
                      {sp.distanceMeters}m
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground">{sp.address}</p>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                      ~{sp.walkingTimeMinutes} mnt jalan
                    </span>
                    {sp.is24Hours && (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        24 Jam
                      </span>
                    )}
                  </div>
                </div>

                {/* tombol rute navigasi */}
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleOpenDirections(sp.coordinates)}
                  className="w-full text-xs font-semibold h-7 rounded-lg border-border hover:bg-primary/20 hover:text-foreground transition-colors"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Arahkan Rute
                  <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-50" />
                </Button>
              </div>
            ))}
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}
