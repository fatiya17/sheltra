"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ShieldCheck, MapPin, AlertTriangle, Clock, Send, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const INITIAL_REPORTS = [
  {
    id: "rep-1",
    category: "Catcalling / Pelecehan Verbal",
    location: "Jembatan Penyeberangan Stasiun Pondok Cina",
    time: "2026-07-26T21:30",
    description: "Ada sekelompok orang nongkrong bersiul dan memanggil-manggil dengan kata-kata tidak sopan saat lewat jam 9 malam.",
    status: "Telah Terverifikasi Komunitas",
    createdAt: "30 menit yang lalu"
  },
  {
    id: "rep-2",
    category: "Penerangan Minim / Area Gelap",
    location: "Jl. Akses UI Dekat Gang Melati",
    time: "2026-07-26T20:15",
    description: "Lampu jalan mati total sekitar 200 meter, sangat gelap dan minim kendaraan lewat.",
    status: "Laporan Baru",
    createdAt: "2 jam yang lalu"
  },
  {
    id: "rep-3",
    category: "Dikuntit / Suspicious Following",
    location: "Trotoar Margonda Raya KM 4",
    time: "2026-07-25T22:00",
    description: "Merasa diikuti motor tanpa plat nomor dari depan halte sampai ke gang masuk perumahan.",
    status: "Telah Terverifikasi Komunitas",
    createdAt: "Kemarin"
  }
]

export default function AnonymousReport() {
  const [reports, setReports] = useState(INITIAL_REPORTS)
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [time, setTime] = useState("")
  const [description, setDescription] = useState("")
  
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleUseGPS = () => {
    setLocation("Lokasi Terdeteksi (Jl. Margonda Raya No. 12, Depok)")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSubmitSuccess(false)

    if (!category) {
      setErrorMessage("Silakan pilih kategori insiden.")
      return
    }

    if (!location.trim()) {
      setErrorMessage("Silakan isi lokasi kejadian.")
      return
    }

    const newReport = {
      id: `rep-${Date.now()}`,
      category: category,
      location: location,
      time: time || new Date().toISOString().slice(0, 16),
      description: description || "Tidak ada rincian tambahan.",
      status: "Laporan Baru (Anonim)",
      createdAt: "Baru saja"
    }

    setReports([newReport, ...reports])
    setSubmitSuccess(true)
    setShowSuccessDialog(true)

    // Reset form
    setCategory("")
    setLocation("")
    setTime("")
    setDescription("")
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">
        Anonymous Report
      </h1>

      {/* Grid Layout: Side-by-side on desktop, stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Pelaporan */}
        <div className="lg:col-span-5">
          <Card className="p-4 md:p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold font-heading">
                Form Pelaporan Insiden Anonim
              </CardTitle>
              <CardDescription>
                Laporkan pengalaman atau potensi bahaya di ruang publik untuk membantu menjaga keamanan sesama pengguna.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Success alert removed to display success dialog instead */}

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Kesalahan Input</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Kategori Insiden */}
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori Insiden <span className="text-red-500">*</span></Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Pilih Kategori Insiden" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Catcalling / Pelecehan Verbal">Catcalling / Pelecehan Verbal</SelectItem>
                      <SelectItem value="Dikuntit / Suspicious Following">Dikuntit / Suspicious Following</SelectItem>
                      <SelectItem value="Pelecehan Fisik / Physical Harassment">Pelecehan Fisik / Physical Harassment</SelectItem>
                      <SelectItem value="Begal / Kriminalitas Jalanan">Begal / Kriminalitas Jalanan</SelectItem>
                      <SelectItem value="Penerangan Minim / Area Gelap">Penerangan Minim / Area Gelap</SelectItem>
                      <SelectItem value="Tempat Sepi / Rawan Insiden">Tempat Sepi / Rawan Insiden</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lokasi */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location">Lokasi Kejadian <span className="text-red-500">*</span></Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUseGPS}
                      className="text-xs flex items-center gap-1 h-7"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600" /> Deteksi GPS
                    </Button>
                  </div>
                  <Input 
                    id="location"
                    placeholder="Contoh: Jl. Margonda Raya dekat Halte Stasiun UI" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Waktu Kejadian */}
                <div className="space-y-2">
                  <Label htmlFor="time">Waktu Kejadian</Label>
                  <Input 
                    id="time" 
                    type="datetime-local" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                {/* Rincian Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor="description">Rincian Laporan (Opsional)</Label>
                  <Textarea 
                    id="description"
                    rows={4}
                    placeholder="Jelaskan kronologi singkat atau ciri-ciri kondisi area secara jelas..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline">Enkripsi End-to-End & Terlindungi</span>
                  </div>
                  <Button type="submit" className="flex items-center gap-2">
                    <Send className="w-4 h-4" /> Kirim Laporan Anonim
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Feed Laporan Komunitas */}
        <div className="lg:col-span-7">
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
                  <div key={report.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-medium">
                        {report.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {report.createdAt}
                      </span>
                    </div>

                    <div className="text-sm font-semibold flex items-center gap-1.5 pt-1">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{report.location}</span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> {report.status}
                      </span>
                      <span>Waktu: {report.time.replace("T", " ")}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog Popup */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="w-full max-w-[380px] bg-card p-6 md:p-8 text-center flex flex-col items-center justify-center gap-4 rounded-2xl border-none">
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
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-3 rounded-xl mt-2 border-none shadow-xs text-base"
          >
            Oke, Mengerti!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
