"use client"

import React from "react"
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Users,
  Eye,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { RISK_LEVELS } from "../constants/heatmap.constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function IncidentDetailDrawer({ incident, isOpen, onClose, onOpenReport }) {
  if (!isOpen || !incident) return null

  const riskMeta = RISK_LEVELS[incident.riskLevel.toUpperCase()] || RISK_LEVELS.LOW

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* card dialog detail insiden */}
      <div
        className="w-full sm:max-w-lg bg-card sm:rounded-3xl rounded-t-3xl border border-input shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header modal */}
        <div className="p-4 flex items-center justify-between border-b border-border/60 bg-background/95 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0 animate-pulse shadow-xs"
              style={{ backgroundColor: riskMeta.color }}
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold font-heading text-foreground truncate">
                {incident.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">{incident.areaName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* konten detail */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* status dan badge risiko */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${riskMeta.badgeBg} ${riskMeta.textColor} ${riskMeta.badgeBorder}`}
            >
              Tingkat Risiko: {riskMeta.label}
            </span>

            <Badge variant="outline" className="text-xs font-semibold py-1">
              {incident.category}
            </Badge>

            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {incident.moderationStatus}
            </span>
          </div>

          {/* info lokasi & waktu */}
          <div className="bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-foreground">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="font-medium">{incident.location}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Waktu Kejadian: <strong className="text-foreground">{incident.timeOfDay}</strong>
              </span>
            </div>

            {incident.incidentCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  Akumulasi Riwayat: <strong className="text-foreground">{incident.incidentCount} laporan</strong> di area sekitar
                </span>
              </div>
            )}
          </div>

          {/* deskripsi kronologi */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-foreground">Rincian Laporan:</h4>
            <p className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-xl border border-input/60">
              {incident.description}
            </p>
          </div>

          {/* lampiran bukti jika ada */}
          {incident.evidenceImage && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-foreground">Lampiran Bukti Foto:</h4>
              <div className="relative rounded-2xl overflow-hidden border border-input aspect-video bg-muted group">
                <img
                  src={incident.evidenceImage}
                  alt="Bukti Kejadian"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] text-white/90 font-medium">
                    Terverifikasi oleh Tim Moderasi
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* konfirmasi komunitas */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span>
                Dikonfirmasi oleh <strong className="text-primary">{incident.verifiedCount || 12}</strong> warga sekitar
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        </div>

        {/* footer modal */}
        <div className="p-4 border-t border-border/60 bg-background/95 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-xs rounded-xl"
            onClick={onClose}
          >
            Tutup
          </Button>

          <Button
            variant="pill"
            className="flex-1 text-xs"
            onClick={() => {
              onClose()
              if (onOpenReport) onOpenReport()
            }}
          >
            Laporkan Update
          </Button>
        </div>
      </div>
    </div>
  )
}
