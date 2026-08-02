"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, MapPin, Clock, Play } from "lucide-react"

import LightGallery from "lightgallery/react"
import "lightgallery/css/lightgallery.css"
import "lightgallery/css/lg-zoom.css"
import "lightgallery/css/lg-video.css"
import lgZoom from "lightgallery/plugins/zoom"
import lgVideo from "lightgallery/plugins/video"

export function ReportFeed({ reports }) {
  return (
    <Card className="p-4 md:p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold font-heading">
          Feed Laporan Insiden Komunitas ({reports.length})
        </CardTitle>
        <CardDescription>
          Daftar laporan anonim terkini dari pengguna lain di sekitar Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Belum ada laporan.</div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-lg border bg-card text-card-foreground shadow-xs space-y-2"
            >
              {/* header kategori & waktu */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary" className="font-medium">
                  {report.category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {report.createdAt}
                </span>
              </div>

              {/* teks lokasi kejadian */}
              <div className="text-sm font-semibold flex items-center gap-1.5 pt-1">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span className="break-words">{report.location}</span>
              </div>

              {/* deskripsi & thumbnail bukti */}
              <div className="flex gap-4 items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {report.description}
                  </p>
                </div>

                {report.evidence?.url && (
                  <div className="w-[20%] min-w-[70px] max-w-[90px] shrink-0 pt-0.5">
                    <LightGallery speed={500} plugins={[lgZoom, lgVideo]}>
                      {report.evidence.type === "image" ? (
                        <a
                          href={report.evidence.url}
                          className="block aspect-square rounded-lg overflow-hidden border border-border bg-slate-50 dark:bg-slate-900 cursor-zoom-in hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={report.evidence.url}
                            alt="Bukti Kejadian"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </a>
                      ) : (
                        <a
                          href={report.evidence.url}
                          data-video={`{"source": [{"src":"${report.evidence.url}", "type":"video/mp4"}], "attributes": {"preload": false, "controls": true}}`}
                          className="block aspect-square rounded-lg overflow-hidden border border-border bg-slate-50 dark:bg-slate-900 relative hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <video
                            src={report.evidence.url}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                        </a>
                      )}
                    </LightGallery>
                  </div>
                )}
              </div>

              {/* status laporan */}
              <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                <span
                  className={`flex items-center gap-1 font-medium ${
                    report.status.includes("Baru")
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> {report.status}
                </span>
                <span>Waktu: {report.time.replace("T", " ")}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
