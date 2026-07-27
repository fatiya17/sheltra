"use client"

import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ShieldCheck, MapPin, AlertTriangle, Clock, Send, Lock, Loader2, Upload, FileVideo, Image as ImageIcon, X, Play } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import LightGallery from "lightgallery/react"
import "lightgallery/css/lightgallery.css"
import "lightgallery/css/lg-zoom.css"
import "lightgallery/css/lg-video.css"
import lgZoom from "lightgallery/plugins/zoom"
import lgVideo from "lightgallery/plugins/video"

const INITIAL_REPORTS = [
  {
    id: "rep-1",
    refCode: "ANON-P3K9R1",
    category: "Catcalling / Pelecehan Verbal",
    location: "Jembatan Penyeberangan Stasiun Pondok Cina",
    time: "2026-07-26T21:30",
    description: "Ada sekelompok orang nongkrong bersiul dan memanggil-manggil dengan kata-kata tidak sopan saat lewat jam 9 malam.",
    status: "Telah Terverifikasi Komunitas",
    createdAt: "30 menit yang lalu",
    evidence: null
  },
  {
    id: "rep-2",
    refCode: "ANON-W2J5D8",
    category: "Penerangan Minim / Area Gelap",
    location: "Jl. Akses UI Dekat Gang Melati",
    time: "2026-07-26T20:15",
    description: "Lampu jalan mati total sekitar 200 meter, sangat gelap dan minim kendaraan lewat.",
    status: "Laporan Baru",
    createdAt: "2 jam yang lalu",
    evidence: null
  },
  {
    id: "rep-3",
    refCode: "ANON-T7M3Y4",
    category: "Dikuntit / Suspicious Following",
    location: "Trotoar Margonda Raya KM 4",
    time: "2026-07-25T22:00",
    description: "Merasa diikuti motor tanpa plat nomor dari depan halte sampai ke gang masuk perumahan.",
    status: "Telah Terverifikasi Komunitas",
    createdAt: "Kemarin",
    evidence: null
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

  // Evidence upload state
  const [evidence, setEvidence] = useState(null) // { url, type, name }
  
  // GPS loading state
  const [isDetectingGPS, setIsDetectingGPS] = useState(false)
  



  const handleUseGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur deteksi GPS.")
      return
    }

    setIsDetectingGPS(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`
          )
          const data = await response.json()
          if (data && data.address) {
            const addr = data.address
            const parts = []
            const addPart = (val) => {
              if (val && typeof val === "string" && !parts.some(p => p.toLowerCase().trim() === val.toLowerCase().trim())) {
                parts.push(val.trim())
              }
            }

            // 1. Gedung / Tempat Terdekat
            addPart(addr.amenity || addr.shop || addr.office || addr.tourism || addr.building)
            
            // 2. Nama Jalan & Nomor Rumah
            let street = addr.road || addr.pedestrian || addr.path || addr.street
            if (street && addr.house_number) {
              street += ` No. ${addr.house_number}`
            }
            addPart(street)
            
            // 3. Gang / Blok / Kompleks / Perumahan / Kelurahan / Kecamatan
            addPart(addr.neighbourhood)
            addPart(addr.residential)
            addPart(addr.village)
            addPart(addr.suburb)
            addPart(addr.subdistrict || addr.district || addr.city_district)
            
            // 4. Kabupaten / Kota
            addPart(addr.city || addr.town || addr.municipality)
            addPart(addr.county)
            
            // 5. Provinsi
            addPart(addr.state)
            
            const formattedAddress = parts.join(", ")
            setLocation(formattedAddress || data.display_name)
          } else if (data && data.display_name) {
            setLocation(data.display_name)
          } else {
            setLocation(`Koordinat GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error)
          setLocation(`Koordinat GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        } finally {
          setIsDetectingGPS(false)
        }
      },
      (error) => {
        console.error("GPS error:", error)
        setIsDetectingGPS(false)
        let errMsg = "Gagal mendeteksi lokasi."
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = "Izin akses lokasi ditolak oleh pengguna."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = "Informasi lokasi tidak tersedia."
        } else if (error.code === error.TIMEOUT) {
          errMsg = "Waktu permintaan lokasi habis."
        }
        alert(errMsg)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran berkas maksimal adalah 10MB.")
      return
    }

    const fileUrl = URL.createObjectURL(file)
    const isVideo = file.type.startsWith("video/")
    const isImage = file.type.startsWith("image/")

    if (!isImage && !isVideo) {
      alert("Hanya berkas gambar atau video yang diperbolehkan.")
      return
    }

    setEvidence({
      url: fileUrl,
      type: isVideo ? "video" : "image",
      name: file.name
    })
  }

  const handleRemoveEvidence = () => {
    if (evidence?.url) {
      URL.revokeObjectURL(evidence.url)
    }
    setEvidence(null)
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
      createdAt: "Baru saja",
      evidence: evidence ? { ...evidence } : null
    }

    setReports([newReport, ...reports])
    setSubmitSuccess(true)
    setShowSuccessDialog(true)

    // Reset form
    setCategory("")
    setLocation("")
    setTime("")
    setDescription("")
    setEvidence(null)
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
                      disabled={isDetectingGPS}
                      className="text-xs flex items-center gap-1.5 h-7 disabled:opacity-75"
                    >
                      {isDetectingGPS ? (
                        <>
                          <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
                          Mendeteksi...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3 text-emerald-600" /> Deteksi GPS
                        </>
                      )}
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

                {/* Unggah Bukti */}
                <div className="space-y-2">
                  <Label>Unggah Bukti Foto / Video (Opsional)</Label>
                  {!evidence ? (
                    <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-input rounded-lg cursor-pointer bg-transparent hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <Upload className="w-5 h-5 text-muted-foreground mb-1.5" />
                        <p className="text-xs text-muted-foreground text-center">
                          <span className="font-semibold text-primary">Klik untuk unggah</span> atau seret foto/video
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">PNG, JPG, MP4 hingga 10MB</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </label>
                  ) : (
                    <div className="relative border border-input rounded-lg p-2 bg-muted/20 flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                        {evidence.type === "image" ? (
                          <img 
                            src={evidence.url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video 
                            src={evidence.url} 
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          {evidence.type === "image" ? (
                            <ImageIcon className="w-5 h-5 text-white" />
                          ) : (
                            <FileVideo className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{evidence.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{evidence.type} bukti</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={handleRemoveEvidence}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
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
        <div className="lg:col-span-7 space-y-6">


          {/* Feed Laporan Komunitas */}
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
                      <span className="break-words">{report.location}</span>
                    </div>

                    <div className="flex gap-4 items-center justify-between">
                      {/* Kiri: Deskripsi Laporan */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                          {report.description}
                        </p>
                      </div>

                      {/* Kanan: Bukti Foto / Video (20%) */}
                      {report.evidence && (
                        <div className="w-[20%] min-w-[70px] max-w-[90px] shrink-0 pt-0.5">
                          <LightGallery
                            speed={500}
                            plugins={[lgZoom, lgVideo]}
                          >
                            {report.evidence.type === "image" ? (
                              <a 
                                href={report.evidence.url}
                                className="block aspect-square rounded-lg overflow-hidden border border-border bg-slate-50 dark:bg-slate-900 cursor-zoom-in hover:opacity-90 transition-opacity"
                              >
                                <img 
                                  src={report.evidence.url} 
                                  alt="Bukti Kejadian" 
                                  className="w-full h-full object-cover"
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

                    <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                      <span className={`flex items-center gap-1 font-medium ${
                        report.status.includes("Baru")
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
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
