"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Info, Sun, Moon, AlertCircle, Sparkles } from "lucide-react"

export function RiskTimeline({
  timeAnalysis,
  selectedTime,
  onSelectTime,
}) {
  if (!timeAnalysis) return null

  const isLimited = timeAnalysis.isTimeDataLimited
  const timeline = timeAnalysis.hourlyTimeline || []

  // helper warna bar risiko
  const getBarColor = (risk) => {
    if (risk < 25) return "bg-emerald-500"
    if (risk < 50) return "bg-amber-500"
    if (risk < 70) return "bg-orange-500"
    return "bg-rose-500"
  }

  return (
    <Card className="p-4 md:p-5 space-y-4">
      {/* header card */}
      <CardHeader className="p-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Prediksi Risiko Berdasarkan Waktu
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {selectedTime ? `Jam ${selectedTime}` : "Waktu Nyata"}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          Prediksi tingkat keamanan rute berdasarkan jam keberangkatan & sinyal kontekstual.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        {/* fallback jika data waktu minim */}
        {isLimited ? (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1.5 text-sm">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Data Time-Based Terbatas</span>
            </div>
            <p className="text-xs leading-relaxed">
              {timeAnalysis.notice ||
                "Data historis per jam belum memadai untuk area ini. Sistem menampilkan estimasi risiko umum tanpa rincian per jam."}
            </p>
          </div>
        ) : (
          <>
            {/* saran kontekstual waktu */}
            {timeAnalysis.contextualAdvice && (
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-primary">
                    Status Risiko: {timeAnalysis.currentHourRiskLevel}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {timeAnalysis.contextualAdvice}
                  </p>
                </div>
              </div>
            )}

            {/* grafik timeline per jam */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-500" /> Siang (Aman)
                </span>
                <span className="flex items-center gap-1">
                  <Moon className="w-3 h-3 text-indigo-400" /> Malam (Waspada)
                </span>
              </div>

              {/* bar horizontal per jam */}
              <div className="grid grid-cols-9 gap-1 items-end h-20 pt-2 pb-1 border-b border-border/50">
                {timeline.map((item) => {
                  const isCurrent = item.isSelected
                  const barHeight = `${Math.max(15, item.adjustedRisk)}%`
                  const barBg = getBarColor(item.adjustedRisk)

                  return (
                    <button
                      key={item.hour}
                      type="button"
                      onClick={() => onSelectTime && onSelectTime(item.hour)}
                      title={`${item.label}: Risiko ${item.adjustedRisk}% - ${item.note}`}
                      className="group flex flex-col items-center justify-end h-full gap-1 select-none"
                    >
                      <div className="w-full flex items-end justify-center h-full">
                        <div
                          style={{ height: barHeight }}
                          className={`w-full max-w-[18px] rounded-t-sm transition-all group-hover:opacity-80 ${barBg} ${
                            isCurrent ? "ring-2 ring-primary ring-offset-1" : "opacity-70"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-mono ${
                          isCurrent
                            ? "font-semibold text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {item.hour.slice(0, 2)}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Klik jam di atas untuk simulasi waktu</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Risiko Tinggi
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" /> Risiko Rendah
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
