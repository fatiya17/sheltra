"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReportForm } from "./report-form"
import { ReportFeed } from "./report-feed"
import { useOfflineReports } from "../hooks/use-offline-reports"
import { INITIAL_REPORTS } from "../constants/report.constants"

export default function AnonymousReport() {
  const [reports, setReports] = useState(INITIAL_REPORTS)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // sync laporan offline ke feed
  const handleReportSynced = (syncedReport) => {
    setReports((prev) => [syncedReport, ...prev])
  }

  const { refreshQueue } = useOfflineReports(handleReportSynced)

  // handler submit berhasil
  const handleSubmitSuccess = (newReport) => {
    setReports([newReport, ...reports])
    setShowSuccessDialog(true)
  }

  return (
    <div className="w-full p-4 md:px-8 md:py-6 space-y-6 md:space-y-8 relative">
      {/* judul halaman */}
      <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">
        Anonymous Report
      </h1>

      {/* grid layout halaman */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* kolom form pelaporan */}
        <div className="lg:col-span-5">
          <ReportForm
            onSubmitSuccess={handleSubmitSuccess}
            onOfflineSaved={refreshQueue}
          />
        </div>

        {/* kolom feed laporan */}
        <div className="lg:col-span-7 space-y-6">
          <ReportFeed reports={reports} />
        </div>
      </div>

      {/* dialog sukses submit */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[380px] bg-card p-6 md:p-8 text-center flex flex-col items-center justify-center gap-4 rounded-2xl border-none">
          <img src="/success.svg" alt="Success" className="w-32 h-32 object-contain" />
          <div className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">
              Laporan Terkirim
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm px-2 leading-relaxed">
              Terima kasih telah melaporkan, semoga kamu sudah aman ya.
            </DialogDescription>
          </div>

          <Button
            onClick={() => setShowSuccessDialog(false)}
            variant="pill"
            size="pill"
            className="w-full"
          >
            Selesai
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
