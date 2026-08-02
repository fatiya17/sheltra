"use client"

import React, { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// daftar jam 00 sampai 23
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))

// daftar menit 00 sampai 59
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

export function TimePicker({
  value = "",
  onChange,
  className,
  placeholder = "Pilih Waktu",
  disabled = false,
  id,
  showSuffix = true,
  triggerClassName,
  align = "start",
}) {
  const [open, setOpen] = useState(false)

  // parse jam dan menit dari nilai value
  const [hour, minute] = React.useMemo(() => {
    if (!value || !value.includes(":")) {
      return ["12", "00"]
    }
    const [h, m] = value.split(":")
    return [h.padStart(2, "0"), m.padStart(2, "0")]
  }, [value])

  const hourContainerRef = useRef(null)
  const minuteContainerRef = useRef(null)
  const activeHourRef = useRef(null)
  const activeMinuteRef = useRef(null)

  // auto scroll ke item aktif saat popover terbuka
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (activeHourRef.current) {
          activeHourRef.current.scrollIntoView({ block: "center", behavior: "smooth" })
        }
        if (activeMinuteRef.current) {
          activeMinuteRef.current.scrollIntoView({ block: "center", behavior: "smooth" })
        }
      }, 50)
    }
  }, [open, hour, minute])

  // handler pilih jam
  const handleHourSelect = (newHour) => {
    const newTime = `${newHour}:${minute}`
    if (onChange) onChange(newTime)
  }

  // handler pilih menit
  const handleMinuteSelect = (newMinute) => {
    const newTime = `${hour}:${newMinute}`
    if (onChange) onChange(newTime)
  }

  const displayTime = value
    ? `${hour}:${minute}${showSuffix ? " WIB" : ""}`
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-9 px-3 focus:border-primary focus:ring-primary aria-invalid:focus:border-primary aria-invalid:focus:ring-primary gap-2",
              !value && "text-muted-foreground",
              triggerClassName || className
            )}
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-semibold text-xs">{displayTime}</span>
          </Button>
        }
      />
      <PopoverContent
        className="w-auto p-2 bg-card border shadow-lg rounded-xl z-50"
        align={align}
      >
        <div className="flex items-center gap-1">
          {/* kolom jam tanpa scrollbar */}
          <div
            ref={hourContainerRef}
            className="h-56 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-1.5 p-1 w-11"
          >
            {HOURS.map((h) => {
              const isSelected = h === hour
              return (
                <button
                  key={h}
                  ref={isSelected ? activeHourRef : null}
                  type="button"
                  onClick={() => handleHourSelect(h)}
                  className={cn(
                    "size-9 rounded-md text-sm transition-colors flex items-center justify-center shrink-0 select-none",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs ring-1 ring-primary/50"
                      : "text-foreground hover:bg-muted font-normal"
                  )}
                >
                  {h}
                </button>
              )
            })}
          </div>

          {/* kolom menit tanpa scrollbar */}
          <div
            ref={minuteContainerRef}
            className="h-56 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-1.5 p-1 w-11"
          >
            {MINUTES.map((m) => {
              const isSelected = m === minute
              return (
                <button
                  key={m}
                  ref={isSelected ? activeMinuteRef : null}
                  type="button"
                  onClick={() => handleMinuteSelect(m)}
                  className={cn(
                    "size-9 rounded-md text-sm transition-colors flex items-center justify-center shrink-0 select-none",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs ring-1 ring-primary/50"
                      : "text-foreground hover:bg-muted font-normal"
                  )}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
