"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ReportForm } from "@/features/report/components/report-form"
import { MobileHeader } from "@/components/ui/mobile-header"
import { OfflineIcon } from "@/components/ui/offline-icon"
import { Button } from "@/components/ui/button"
import { offlineReportService } from "@/features/report/services/offline-report.service"

export default function EditDraftPage() {
  const router = useRouter()
  const params = useParams()
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState("form") // "form" | "success" | "offline"

  useEffect(() => {
    async function loadDraft() {
      if (!params?.id) return
      const reports = await offlineReportService.getPendingReports()
      const found = reports.find(r => r.id === params.id)
      if (found) {
        setDraft(found)
      }
      setLoading(false)
    }
    loadDraft()
  }, [params?.id])

  const handleSubmitSuccess = async (report) => {
    // Jika laporan berhasil terkirim secara online, hapus drafnya
    await offlineReportService.removePendingReport(report.id)
    setStep("success")
  }

  const handleOfflineSaved = () => {
    setStep("offline")
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center">Memuat draft...</div>
  }

  if (!draft) {
    return (
      <div className="w-full flex flex-col min-h-screen bg-slate-50">
        <MobileHeader title="Edit Laporan" onBack={() => router.back()} className="bg-white" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
          Draft tidak ditemukan.
          <Button variant="secondary" onClick={() => router.back()} className="mt-4">Kembali</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-white md:max-w-2xl md:mx-auto pb-20 md:pb-8">
      {step === "form" && (
        <>
          <MobileHeader 
            title="Edit Laporan" 
            onBack={() => router.back()} 
          />
          <div className="flex-1 px-4 py-6 md:px-8">
            <ReportForm
              draftData={draft}
              onSubmitSuccess={handleSubmitSuccess}
              onOfflineSaved={handleOfflineSaved}
            />
          </div>
        </>
      )}

      {step === "success" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <img src="/success.svg" alt="Success" className="w-40 h-40 object-contain mb-4" />
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
              Laporan Terkirim
            </h2>
            <p className="text-slate-600 text-base px-2 leading-relaxed max-w-sm mx-auto">
              Terima kasih telah melaporkan, semoga kamu sudah aman ya.
            </p>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="primary"
            className="w-full mt-8 max-w-sm h-12 text-base rounded-xl"
          >
            Selesai
          </Button>
        </div>
      )}

      {step === "offline" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <OfflineIcon className="w-[120px] h-[120px] object-contain mb-4" />
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
              Tidak dapat mengirim laporan
            </h2>
            <p className="text-slate-600 text-base px-2 leading-relaxed max-w-sm mx-auto">
              Koneksi internet tidak stabil laporan anda akan disimpan sementara di Draft Laporan
            </p>
          </div>
          <div className="flex items-center gap-3 w-full mt-8 max-w-sm">
            <Button
              onClick={() => router.push("/anonymous-report/drafts")}
              variant="outline"
              className="flex-1 h-12 text-base rounded-xl"
            >
              Lihat Draft
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="primary"
              className="flex-1 h-12 text-base rounded-xl"
            >
              Selesai
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
