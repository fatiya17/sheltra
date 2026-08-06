"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ChevronRight, Bell } from "lucide-react"

import { MobileHeader } from "@/components/ui/mobile-header"
import { useOfflineReports } from "@/features/report/hooks/use-offline-reports"
import { Badge } from "@/components/ui/badge"
import { offlineReportService } from "@/features/report/services/offline-report.service"

export default function DraftsPage() {
  const router = useRouter()
  
  // Ambil state dan fungsi sync dari hooks
  const { pendingReports, refreshQueue } = useOfflineReports()

  return (
    <div className="w-full flex flex-col min-h-screen bg-white">
      <MobileHeader 
        title="Lapor Insiden" 
        onBack={() => router.back()} 
        className="bg-white"
      />
      
      <div className="flex-1 px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {pendingReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <p>Tidak ada draft laporan tersimpan.</p>
          </div>
        ) : (
          pendingReports.map((report) => (
            <div 
              key={report.id} 
              onClick={() => router.push(`/anonymous-report/drafts/${report.id}`)}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 text-white">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-primary text-base leading-tight mb-1">
                      {report.category}
                    </h3>
                    <p className="text-sm text-black line-clamp-1 mb-0.5">
                      {report.location}
                    </p>
                    <p className="text-sm text-slate-500">
                      {report.time ? format(new Date(report.time), "d MMMM yyyy • HH.mm", { locale: id }) : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 mt-2 shrink-0" />
              </div>
              
              <div className="w-full h-px bg-slate-100 my-3" />
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs px-2 py-0.5 shadow-none border-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                  Draft
                </Badge>
                
                <span className="text-xs text-black flex items-center gap-2">
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  Belum terkirim
                </span>
                
                {report.evidence && (
                  <span className="text-xs text-black flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    1 {report.evidence.type === "video" ? "Video" : "Foto"}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
