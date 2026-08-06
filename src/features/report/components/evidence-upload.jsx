"use client"

import React, { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Film, Image as ImageIcon, FileVideo, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { EVIDENCE_UPLOAD_CONFIG } from "../constants/report.constants"

// helper validasi file unggahan
function validateEvidenceFile(file) {
  if (!file) return { isValid: false }

  if (file.size > EVIDENCE_UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Ukuran berkas maksimal adalah ${EVIDENCE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB.`,
    }
  }

  const isVideo = file.type.startsWith("video/")
  const isImage = file.type.startsWith("image/")

  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: "Hanya berkas gambar atau video yang diperbolehkan.",
    }
  }

  return { isValid: true, isVideo, isImage }
}

// helper konversi file ke base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

// helper kompresi gambar
function compressImage(file, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedDataUrl)
      }
      img.onerror = () => resolve(e.target.result)
      img.src = e.target.result
    }
    reader.onerror = () => resolve("")
    reader.readAsDataURL(file)
  })
}

export function EvidenceUpload({ evidence, onEvidenceChange }) {
  const toast = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  // handler pilih file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateEvidenceFile(file)
    if (!validation.isValid) {
      toast({ body: validation.error, type: "error" })
      return
    }

    try {
      setIsProcessing(true)
      let dataUrl = ""

      if (validation.isImage) {
        dataUrl = await compressImage(file)
      } else {
        dataUrl = await fileToBase64(file)
      }

      onEvidenceChange({
        url: dataUrl,
        type: validation.isVideo ? "video" : "image",
        name: file.name,
      })
    } catch (err) {
      console.error("Gagal memproses file:", err)
      toast({ body: "Gagal memproses berkas unggahan.", type: "error" })
    } finally {
      setIsProcessing(false)
    }
  }

  // handler hapus bukti
  const handleRemoveEvidence = () => {
    onEvidenceChange(null)
  }

  return (
    <div className="flex flex-col gap-1.5 space-y-2">
      <Label>Unggah Bukti Foto / Video (Opsional)</Label>
      {!evidence ? (
        <label className="flex items-center gap-4 border border-input bg-card rounded-2xl p-3 cursor-pointer hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-center w-[84px] h-[84px] border border-dashed border-secondary bg-secondary/20 rounded-xl shrink-0 relative select-none">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <div className="relative w-[52px] h-[52px]">
                <Film className="absolute top-0 right-1 w-8 h-8 text-primary" strokeWidth={1.5} fill="white" />
                <ImageIcon
                  className="absolute bottom-1 left-0 w-8 h-8 text-primary"
                  strokeWidth={1.5}
                  fill="white"
                />
                <div className="absolute bottom-0 right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-sm select-none pointer-events-none">
                  <span className="text-sm font-bold leading-none -mt-0.5">+</span>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              disabled={isProcessing}
              onChange={handleFileChange}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Klik untuk unggah foto atau video bukti kejadian
            </p>
            <p className="text-[10px] text-muted-foreground">
              Format berkas: PNG, JPG, MP4 (Maks. {EVIDENCE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB)
            </p>
          </div>
        </label>
      ) : (
        <div className="relative border border-input rounded-lg p-2 bg-muted/20 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
            {evidence.type === "image" ? (
              <img src={evidence.url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <video src={evidence.url} className="w-full h-full object-cover" />
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
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
              {evidence.name}
            </p>
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
  )
}
