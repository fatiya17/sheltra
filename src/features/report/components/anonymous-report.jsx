"use client"

import React, { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ReportForm } from "./report-form"
import { MobileHeader } from "@/components/ui/mobile-header"
import { OfflineIcon } from "@/components/ui/offline-icon"
import { ChevronRight, Check } from "lucide-react"
import Link from "next/link"
import { offlineReportService } from "../services/offline-report.service"

const MAIN_CATEGORIES = [
  { id: "Catcalling / Pelecehan Verbal", label: "Catcalling" },
  { id: "Pelecehan Fisik / Physical Harassment", label: "Kontak fisik" },
  { id: "Dikuntit / Suspicious Following", label: "Dikuntit" },
  { id: "Lainnya", label: "Lainnya" },
]

export default function AnonymousReport() {
  const [step, setStep] = useState("category") // "category" | "form"
  const [selectedCategory, setSelectedCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [showDraftPopup, setShowDraftPopup] = useState(false)

  // flag hydration localstorage
  const isHydratedRef = React.useRef(false)

  // load saved state saat mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("sheltra_anonymous_report_step")
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.step && saved.step !== "success" && saved.step !== "offline") setStep(saved.step)
        if (saved.selectedCategory) setSelectedCategory(saved.selectedCategory)
        if (saved.customCategory) setCustomCategory(saved.customCategory)
      }
    } catch (e) {
      console.warn("Gagal membaca report step state:", e)
    } finally {
      isHydratedRef.current = true
    }
  }, [])

  // simpan state ke localstorage saat berubah
  useEffect(() => {
    if (typeof window === "undefined" || !isHydratedRef.current) return
    try {
      if (step === "success" || step === "offline") {
        localStorage.removeItem("sheltra_anonymous_report_step")
      } else {
        localStorage.setItem(
          "sheltra_anonymous_report_step",
          JSON.stringify({ step, selectedCategory, customCategory })
        )
      }
    } catch (e) {
      console.warn("Gagal menyimpan report step state:", e)
    }
  }, [step, selectedCategory, customCategory])

  useEffect(() => {
    const checkDrafts = async () => {
      if (offlineReportService.isOnline()) {
        const drafts = await offlineReportService.getPendingReports()
        if (drafts.length > 0) {
          setShowDraftPopup(true)
        }
      }
    }
    checkDrafts()
    
    const handleOnline = () => {
      checkDrafts()
    }
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])
  // handler submit berhasil
  const handleSubmitSuccess = () => {
    localStorage.removeItem("sheltra_anonymous_report_step")
    localStorage.removeItem("sheltra_report_draft")
    setStep("success")
  }

  const handleOfflineSaved = () => {
    localStorage.removeItem("sheltra_anonymous_report_step")
    localStorage.removeItem("sheltra_report_draft")
    setStep("offline")
  }

  const handleNext = () => {
    if (selectedCategory) {
      setStep("form")
    }
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-white md:max-w-2xl md:mx-auto pb-20 md:pb-8">
      {step === "category" && (
        <>
          <MobileHeader 
            title="Lapor Insiden" 
            onBack={() => window.history.back()} 
          />
          <div className="flex-1 flex flex-col px-6 py-6">
            <div className="w-full flex justify-center mb-6">
              <img src="/assets/anon%20loading.png" alt="Map Illustration" className="w-full max-w-[260px] h-auto object-contain" />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-[20px] font-semibold text-slate-900 leading-tight mb-3">
                Laporkan Kejadian<br />dengan Aman
              </h2>
              <p className="text-base text-black px-4 leading-relaxed">
                Setiap laporan membantu membuat lingkungan yang lebih aman untuk semua
              </p>
            </div>

            <div className="w-full flex-1 mb-8">
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                Pilih Kategori Insiden
              </h3>
              <div className="space-y-3">
                {MAIN_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id
                  return (
                    <div key={cat.id} className="space-y-2">
                      <label 
                        className={`flex items-center gap-3 p-4 rounded-xl border ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-200'} cursor-pointer transition-colors`}
                      >
                        <div className={`w-5 h-5 rounded-[4px] flex items-center justify-center border transition-colors ${isSelected ? 'border-primary bg-primary/15' : 'border-[#F1F1F2] bg-[#F1F1F2]'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />}
                        </div>
                        <input 
                          type="radio" 
                          name="category"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedCategory(cat.id)
                            if (cat.id !== "Lainnya") {
                              setCustomCategory("")
                            }
                          }}
                        />
                        <span className="text-[15px] text-slate-800">{cat.label}</span>
                      </label>
                      {cat.id === "Lainnya" && isSelected && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <Input
                            placeholder="Ketik kategori kejadian..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="h-[56px] rounded-xl border-primary bg-primary/5 px-4 text-[15px] text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary focus-visible:border-primary shadow-none"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-auto">
              <Button 
                onClick={handleNext} 
                disabled={!selectedCategory || (selectedCategory === "Lainnya" && !customCategory.trim())}
                variant="primary" 
                className="w-full h-12 text-base rounded-xl"
              >
                Lanjutkan
              </Button>
            </div>
          </div>
        </>
      )}
      
      {step === "form" && (
        <>
          <MobileHeader 
            title="Lapor Insiden" 
            onBack={() => setStep("category")} 
          />
          <div className="w-full flex justify-end px-6 pt-2">
            <Link href="/anonymous-report/drafts" className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline">
              Draft Laporan <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 px-4 py-4 md:px-8">
            <ReportForm
              defaultCategory={selectedCategory === "Lainnya" ? customCategory : selectedCategory}
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
            asChild
            variant="primary"
            className="w-full mt-8 max-w-sm h-12 text-base rounded-xl"
          >
            <Link href="/">Selesai</Link>
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
              asChild
              variant="outline"
              className="flex-1 h-12 text-base rounded-xl"
            >
              <Link href="/anonymous-report/drafts">Lihat Draft</Link>
            </Button>
            <Button
              asChild
              variant="primary"
              className="flex-1 h-12 text-base rounded-xl"
            >
              <Link href="/">Selesai</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Draft Popup */}
      <Dialog open={showDraftPopup} onOpenChange={setShowDraftPopup}>
        <DialogContent className="w-[90%] max-w-sm p-6 rounded-3xl bg-white border-none flex flex-col items-center text-center">
          <img src="/draft.svg" alt="Draft" className="w-20 h-20 object-contain mb-2" />
          <h2 className="text-[20px] font-bold text-slate-900 mb-2">Ada Laporan Tertunda</h2>
          <p className="text-[14px] text-slate-600 mb-6 leading-relaxed">Kamu memiliki draf laporan yang belum terkirim. Ingin mengirimnya sekarang?</p>
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowDraftPopup(false)}>
              Nanti Saja
            </Button>
            <Button variant="primary" className="flex-1 rounded-xl h-11" asChild>
              <Link href="/anonymous-report/drafts">Lihat Draf</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
