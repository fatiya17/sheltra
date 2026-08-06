"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/features/landing/components/navbar"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

export default function ProtectedTripFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // parameter dari url query
  const originParam = searchParams.get("origin") || "Stasiun Sudirman"
  const destinationParam = searchParams.get("destination") || "Jl. Sudirman"

  // stage flow: active | confirmation | completed | rating | success
  const [stage, setStage] = useState("active")

  // timer countdown mencapai tujuan (diatur 5 detik sesuai permintaan)
  const [secondsLeft, setSecondsLeft] = useState(5)

  // timer sisa waktu konfirmasi (dalam detik, default 10 menit = 600 detik)
  const [confirmSecondsLeft, setConfirmSecondsLeft] = useState(600)

  // state rating
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState("")
  const [feedbackType, setFeedbackType] = useState("submitted") // submitted | skipped

  // format waktu mm.ss atau mm:ss
  const formatTimerDot = (totalSeconds) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60)
    const secs = Math.max(0, totalSeconds) % 60
    return `${mins.toString().padStart(2, "0")}.${secs.toString().padStart(2, "0")}`
  }

  // format waktu jam:menit sekarang
  const [completedTimeStr, setCompletedTimeStr] = useState("18.47")
  const [overdueTimeStr, setOverdueTimeStr] = useState("18.02")

  useEffect(() => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const mins = now.getMinutes().toString().padStart(2, "0")
    setCompletedTimeStr(`${hours}.${mins}`)
    setOverdueTimeStr(`${hours}.${mins}`)
  }, [])

  // countdown timer tahap active
  useEffect(() => {
    if (stage !== "active") return

    if (secondsLeft <= 0) {
      // otomatis pindah ke konfirmasi saat timer habis
      setStage("confirmation")
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setStage("confirmation")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [stage, secondsLeft])

  // countdown timer tahap confirmation
  useEffect(() => {
    if (stage !== "confirmation") return

    if (confirmSecondsLeft <= 0) return

    const interval = setInterval(() => {
      setConfirmSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [stage, confirmSecondsLeft])

  // perpanjang timer 5 menit
  const handleExtend5Minutes = () => {
    setSecondsLeft(300)
    setStage("active")
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between select-none">
      {/* header navbar */}
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-5 py-6 flex flex-col justify-between">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STAGE 1: ACTIVE PROTECTED TRIP */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {stage === "active" && (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-6">
              {/* circular countdown timer */}
              <div className="flex justify-center pt-2">
                <div className="relative w-64 h-64 rounded-full border-[10px] border-primary flex flex-col items-center justify-center shadow-lg shadow-pink-100 bg-white">
                  <span className="text-5xl font-bold text-primary tracking-tight">
                    {formatTimerDot(secondsLeft)}
                  </span>
                  <span className="text-xs font-medium text-foreground/80 mt-2">
                    Sisa waktu mencapai tujuan
                  </span>
                </div>
              </div>

              {/* info cards */}
              <div className="space-y-3.5 pt-2">
                {/* card 1: status rute aman */}
                <div className="bg-white border border-[#EEE2E7] rounded-2xl p-4 shadow-2xs">
                  <h2 className="text-base font-semibold text-[#C00D53]">Anda di rute aman</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Dipantau otomatis oleh sistem</p>
                </div>

                {/* card 2: kontak memantau */}
                <div className="bg-white border border-[#EEE2E7] rounded-2xl p-4 shadow-2xs space-y-2.5">
                  <h2 className="text-base font-semibold text-[#C00D53]">2 Kontak Memantau</h2>
                  <p className="text-xs text-muted-foreground">
                    Aktivitas trip ini terlihat oleh mereka secara real-time
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                      IB
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                      RA
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* tombol aksi bawah */}
            <div className="pt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/sos")}
                className="w-full h-12 rounded-xl border-primary text-primary hover:bg-primary hover:text-white font-semibold text-base transition-all"
              >
                Ke Halaman SOS
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STAGE 2: KONFIRMASI TIBA DENGAN AMAN */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {stage === "confirmation" && (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-4 text-center">
              {/* icon warning tanpa background, ukuran 25 (100px) */}
              <div className="flex justify-center pt-2">
                <img
                  src="/warning.svg"
                  alt="Warning"
                  className="w-[110px] h-[110px] object-contain"
                />
              </div>

              {/* teks konfirmasi */}
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-primary leading-snug px-2">
                  Apakah anda sudah sampai dengan aman?
                </h1>
                <p className="text-sm font-medium text-foreground">
                  Sisa waktu konfirmasi{" "}
                  <span className="font-semibold text-primary">
                    {formatTimerDot(confirmSecondsLeft)}
                  </span>
                </p>
              </div>

              {/* detail card dengan mt-10 */}
              <div className="mt-10 bg-[#FFF5F8] border border-pink-200/80 rounded-2xl p-4.5 space-y-3.5 text-left shadow-2xs">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Terlewat pukul</span>
                  <span className="font-bold text-foreground">{overdueTimeStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed border-pink-200/80">
                  <span className="text-muted-foreground">Lokasi Terakhir</span>
                  <span className="font-bold text-foreground truncate max-w-[200px]">
                    {destinationParam}
                  </span>
                </div>
              </div>
            </div>

            {/* tombol aksi */}
            <div className="space-y-3 pt-4">
              <Button
                type="button"
                variant="primary"
                onClick={() => setStage("completed")}
                className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-primary/20"
              >
                Ya, Saya sudah sampai
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExtend5Minutes}
                className="w-full h-12 rounded-xl border-primary text-primary hover:bg-pink-50 text-base font-semibold"
              >
                Perpanjang 5 Menit
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STAGE 3: TRIP SELESAI */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {stage === "completed" && (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-4 text-center">
              {/* icon success tanpa background, ukuran 25 (100px) */}
              <div className="flex justify-center pt-2">
                <img
                  src="/success.svg"
                  alt="Trip Selesai"
                  className="w-40 h-40 object-contain"
                />
              </div>

              {/* judul trip selesai */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold text-primary tracking-tight">
                  Trip selesai pukul {completedTimeStr}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Kontak yang memantau sudah diberi tahu
                </p>
              </div>

              {/* summary detail card dengan mt-10 */}
              <div className="mt-10 bg-[#FFF5F8] border border-pink-200/80 rounded-2xl p-4.5 space-y-3 text-left shadow-2xs">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Durasi</span>
                  <span className="font-bold text-foreground">23 Menit</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed border-pink-200/80">
                  <span className="text-muted-foreground">Jarak</span>
                  <span className="font-bold text-foreground">3.2 km</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed border-pink-200/80">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold text-[#38A169]">Aman</span>
                </div>
              </div>
            </div>

            {/* tombol lanjut ke rating */}
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStage("rating")}
                className="w-full h-12 rounded-xl border-primary text-primary hover:bg-primary hover:text-white text-base font-semibold transition-all"
              >
                Lanjut ke Rating
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STAGE 4: BERI RATING ROUTE */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {stage === "rating" && (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-4 text-center">
              {/* icon star tanpa background, ukuran 25 (100px) */}
              <div className="flex justify-center pt-2">
                <img
                  src="/star.svg"
                  alt="Star"
                  className="w-[113px] h-[113px] object-contain"
                />
              </div>

              {/* judul rating */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold text-primary tracking-tight">
                  Beri Rating Route
                </h1>
                <p className="text-sm text-muted-foreground">
                  Seberapa aman rute yang baru dilalui?
                </p>
              </div>

              {/* star rating picker & notes card dengan mt-10 */}
              <div className="mt-10 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const isFilled = starNum <= rating
                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        className="p-1 transition-transform active:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            isFilled
                              ? "text-primary fill-primary"
                              : "text-pink-200 fill-pink-100/40"
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* input catatan opsional */}
                <div className="border border-dashed border-pink-300/90 bg-[#FFF5F8] rounded-2xl p-4 text-left shadow-2xs">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan (Opsional)"
                    rows={4}
                    className="w-full bg-transparent resize-none border-none outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* tombol submit & lewati */}
            <div className="space-y-3 pt-4">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setFeedbackType("submitted")
                  setStage("success")
                }}
                className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-primary/20"
              >
                Kirim Rating
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFeedbackType("skipped")
                  setStage("success")
                }}
                className="w-full h-12 rounded-xl border-primary text-primary hover:bg-pink-50 text-base font-semibold"
              >
                Lewati
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STAGE 5: RATING SUKSES */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {stage === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-6">
            {/* icon star tanpa background, ukuran 25 (100px) */}
            <div className="flex justify-center">
              <img
                src="/star.svg"
                alt="Rating Success"
                className="w-[113px] h-[113px] object-contain"
              />
            </div>

            {/* teks sukses dengan mt-10 */}
            <div className="mt-10 space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
                {feedbackType === "submitted"
                  ? "Terima kasih sudah memberi rating"
                  : "Rating berhasil dikirim"}
              </h2>
              <p className="text-slate-600 text-base px-2 leading-relaxed max-w-sm mx-auto">
                Ulasan kamu sangat membantu pengguna lain untuk menemukan rute perjalanan yang lebih aman.
              </p>
            </div>

            <Button
              asChild
              variant="primary"
              className="w-full mt-6 max-w-sm h-12 text-base rounded-xl font-semibold shadow-md shadow-primary/20"
            >
              <Link href="/safe-route">Selesai</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
