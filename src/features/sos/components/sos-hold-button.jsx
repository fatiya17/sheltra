"use client"

import React from "react"
import { SOS_HOLD_DURATION_MS } from "../constants/sos.constants"

export function SosHoldButton({
  onStartHold,
  onEndHold,
  holdProgress = 0,
  isHolding = false,
  disabled = false,
}) {
  // dimensi lingkaran luar & dalam yang lebih kompak
  const size = 210
  const strokeWidth = 13
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  // hitung offset garis progres aktif
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, holdProgress)) / 100) * circumference

  // sisa waktu detik hitung mundur
  const remainingSeconds = Math.max(
    0,
    (SOS_HOLD_DURATION_MS * (1 - holdProgress / 100)) / 1000
  ).toFixed(1)

  return (
    <div className="flex flex-col items-center justify-center select-none py-4 space-y-5 w-full max-w-sm mx-auto">
      {/* judul instruksi di atas tombol sesuai referensi */}
      <div className="text-center">
        <h2 className="text-lg md:text-xl font-bold text-[#e62058] tracking-tight leading-snug font-heading">
          Tahan tombol untuk
          <br />
          mengaktifkan SOS
        </h2>
      </div>

      {/* pembungkus tombol utama bulat presisi */}
      <div className="relative flex items-center justify-center">
        {/* cincin svg progress luar */}
        <svg
          className="transform -rotate-90 pointer-events-none"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* latar belakang track lingkaran pink pastel */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#fbcfe8"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* garis progres aktif warna sama persis dengan tombol yang berjalan memutar */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e62058"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              opacity: isHolding && holdProgress > 0 ? 1 : 0,
              transition: isHolding ? "none" : "stroke-dashoffset 200ms ease-out, opacity 200ms ease-out",
            }}
          />
        </svg>

        {/* tombol inti bulat warna pink kemerahan solid */}
        <button
          type="button"
          disabled={disabled}
          onMouseDown={onStartHold}
          onMouseUp={onEndHold}
          onMouseLeave={onEndHold}
          onTouchStart={(e) => {
            e.preventDefault()
            onStartHold()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            onEndHold()
          }}
          onTouchCancel={(e) => {
            e.preventDefault()
            onEndHold()
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute w-[156px] h-[156px] rounded-full flex flex-col items-center justify-center shadow-[0_10px_28px_rgba(230,32,88,0.35)] focus:outline-none bg-[#e62058] text-white cursor-pointer touch-none select-none ${
            isHolding ? "scale-95" : "scale-100"
          } transition-transform duration-100`}
        >
          {/* teks angka countdown atau teks sos di tengah */}
          <span className="text-3xl font-bold tracking-tight font-heading leading-none text-white drop-shadow-xs">
            {isHolding ? `${remainingSeconds}s` : "SOS"}
          </span>
        </button>
      </div>

      {/* teks petunjuk di bawah tombol */}
      <div className="h-5 flex items-center justify-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-normal text-center">
          Lepas untuk membatalkan
        </p>
      </div>
    </div>
  )
}
