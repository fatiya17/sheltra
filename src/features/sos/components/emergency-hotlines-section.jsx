"use client"

import React from "react"
import { PhoneCall, MapPin, CircleUserRound, SmartphoneNfc } from "lucide-react"

// aksi cepat darurat sesuai referensi gambar
const QUICK_ACTIONS = [
  {
    id: "call",
    label: "Telepon\nDarurat",
    icon: PhoneCall,
    href: "tel:112",
  },
  {
    id: "share",
    label: "Bagikan\nLokasi",
    icon: MapPin,
    href: null,
  },
  {
    id: "contact",
    label: "Hubungi\nKontak",
    icon: CircleUserRound,
    href: null,
  },
  {
    id: "silent",
    label: "Kirim\nSOS Silent",
    icon: SmartphoneNfc,
    href: null,
  },
]

export function EmergencyHotlinesSection({ onShareLocation, onContactFirst, onSilentSos }) {
  const handleAction = (action) => {
    if (action.href) {
      window.location.href = action.href
      return
    }
    if (action.id === "share" && onShareLocation) onShareLocation()
    if (action.id === "contact" && onContactFirst) onContactFirst()
    if (action.id === "silent" && onSilentSos) onSilentSos()
  }

  return (
    <div className="bg-white border border-border/60 rounded-3xl px-5 py-5 space-y-5">
      {/* judul & subjudul */}
      <div className="text-center">
        <h2 className="text-base font-bold text-foreground">Butuh bantuan cepat?</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tekan <span className="font-semibold text-[#e62058]">DARURAT</span> untuk akses penuh.
        </p>
      </div>

      {/* 4 icon action button sesuai referensi */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              className="flex flex-col items-center gap-2.5 group"
            >
              {/* lingkaran pink muda dengan icon filled primary */}
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center transition-transform duration-100 group-active:scale-95">
                <Icon className="w-6 h-6 text-[#e62058]" strokeWidth={2} />
              </div>
              {/* label */}
              <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight whitespace-pre-line">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
