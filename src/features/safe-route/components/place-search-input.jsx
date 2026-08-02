"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  MapPin,
  Train,
  Bus,
  Building,
  ShoppingBag,
  X,
  Loader2,
  LocateFixed,
} from "lucide-react"
import { placesService } from "../services/places.service"

// helper icon kategori tempat
function getCategoryIcon(cat) {
  const c = String(cat || "").toLowerCase()
  if (c.includes("train") || c.includes("stasiun") || c.includes("station")) {
    return <Train className="w-3.5 h-3.5 text-primary" />
  }
  if (c.includes("bus") || c.includes("halte") || c.includes("transit")) {
    return <Bus className="w-3.5 h-3.5 text-primary" />
  }
  if (c.includes("mall") || c.includes("shop") || c.includes("supermarket")) {
    return <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
  }
  if (c.includes("building") || c.includes("apart") || c.includes("gedung")) {
    return <Building className="w-3.5 h-3.5 text-sky-500" />
  }
  return <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
}

export function PlaceSearchInput({
  value = "",
  onChange,
  onSelectPlace,
  placeholder = "Cari lokasi...",
  icon,
  showGpsButton = false,
  onGpsClick,
  isDetectingGps = false,
  className = "",
  inputClassName = "",
  disabled = false,
}) {
  // state untuk dropdown & pencarian
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // handler klik di luar komponen
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // debounce query pencarian tempat
  useEffect(() => {
    if (!isOpen) return

    if (!value || value.trim().length < 2) {
      // tampilkan tempat populer jika kosong
      setSuggestions(placesService.getPopularPlaces())
      setIsLoading(false)
      return
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    setIsLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await placesService.searchPlaces(value)
        setSuggestions(res)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [value, isOpen])

  // handler pilih tempat dari list
  const handleSelect = (place) => {
    if (!place) return
    onChange(place.fullAddress || place.name)
    if (onSelectPlace) {
      onSelectPlace(place)
    }
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // handler navigasi keyboard
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true)
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex])
      } else {
        setIsOpen(false)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="flex items-center gap-2.5 w-full">
        {/* icon leading */}
        {icon && <div className="shrink-0">{icon}</div>}

        {/* input text */}
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const nextValue = e.target.value
              onChange(nextValue)

              if (nextValue.trim().length >= 2) {
                setIsOpen(true)
              } else {
                setIsOpen(false)
                setSuggestions([])
                setSelectedIndex(-1)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full bg-transparent text-sm font-medium outline-none text-foreground placeholder:text-muted-foreground placeholder:font-normal py-1 pr-12 transition-all ${inputClassName}`}
          />

          {/* tombol loading & clear */}
          <div className="absolute right-0 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
            )}

            {value && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  inputRef.current?.focus()
                }}
                className="w-5 h-5 rounded-full hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Hapus input"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {showGpsButton && onGpsClick && (
              <button
                type="button"
                onClick={onGpsClick}
                disabled={isDetectingGps}
                title="Gunakan Lokasi Saat Ini"
                className="w-5 h-5 rounded-full hover:bg-primary/10 flex items-center justify-center text-primary transition-colors disabled:opacity-50"
              >
                {isDetectingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* dropdown list hasil pencarian */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-popover text-popover-foreground border border-input rounded-2xl shadow-2xl z-50 overflow-visible animate-in fade-in-50 zoom-in-95 duration-150">
          {/* list item suggestions */}
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mencari lokasi...
                </span>
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="mt-0.5 w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-xs font-semibold truncate text-foreground">
                          {item.name}
                        </p>
                        {item.categoryLabel && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium shrink-0">
                            {item.categoryLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.address}
                      </p>
                    </div>
                  </button>
                )
              })
            ) : (
              !isLoading && value.trim().length >= 2 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground space-y-1">
                  <p className="font-semibold">Lokasi tidak ditemukan</p>
                  <p className="text-xs">
                    Coba kata kunci lain atau gunakan nama jalan / landmark terdekat.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
