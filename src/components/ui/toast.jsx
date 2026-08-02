"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { X, WifiOff, CheckCircle2, AlertCircle, Info } from "lucide-react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toastData, setToastData] = useState(null)

  const toast = useCallback((options) => {
    if (typeof options === "string") {
      setToastData({ 
        body: options, 
        type: "error", 
        bg: "#AA071E", 
        textColor: "#FFFFFF",
        duration: 4000 
      })
    } else {
      const type = options.type || "error"
      let bg = options.bg
      let textColor = options.textColor

      if (!bg) {
        if (type === "success") {
          bg = "#A5E3D6"
          textColor = textColor || "#000000"
        } else if (type === "offline") {
          bg = "#0A1317"
          textColor = textColor || "#FFFFFF"
        } else if (type === "info") {
          bg = "#0A1317"
          textColor = textColor || "#FFFFFF"
        } else {
          bg = "#AA071E"
          textColor = textColor || "#FFFFFF"
        }
      }

      if (!textColor) {
        textColor = (bg === "#A5E3D6" || type === "success") ? "#000000" : "#FFFFFF"
      }

      setToastData({
        body: options.body || "",
        title: options.title || (type === "offline" ? "You are offline" : null),
        type,
        bg,
        textColor,
        duration: options.duration || 4500,
      })
    }
  }, [])

  const onClose = useCallback(() => {
    setToastData(null)
  }, [])

  useEffect(() => {
    if (!toastData) return
    const timer = setTimeout(() => {
      onClose()
    }, toastData.duration || 4000)
    return () => clearTimeout(timer)
  }, [toastData, onClose])

  const renderIcon = () => {
    if (!toastData) return null
    const isDarkText = toastData.textColor === "#000000" || toastData.textColor === "#005348"

    if (toastData.type === "offline") {
      return <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
    }
    if (toastData.type === "success") {
      return <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDarkText ? "text-black" : "text-white"}`} />
    }
    if (toastData.type === "info") {
      return <Info className="w-5 h-5 text-sky-400 shrink-0" />
    }
    return <AlertCircle className="w-5 h-5 text-white shrink-0" />
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toastData && (
        <div 
          style={{ 
            backgroundColor: toastData.bg,
            color: toastData.textColor,
          }}
          className="fixed top-4 left-4 right-4 mx-auto md:mx-0 md:left-auto md:right-6 md:top-auto md:bottom-6 z-[100] w-auto md:w-[450px] max-w-[450px] flex items-center justify-between gap-3 p-4 rounded-2xl shadow-xl border border-black/5 animate-in fade-in slide-in-from-bottom-6 duration-300 ease-out text-left"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="shrink-0">
              {renderIcon()}
            </div>
            <div className="flex flex-col justify-center gap-0.5 flex-1 min-w-0 text-left">
              {toastData.title && (
                <span 
                  style={{ color: toastData.textColor }}
                  className="font-semibold text-sm tracking-tight text-left block"
                >
                  {toastData.title}
                </span>
              )}
              <span 
                style={{ color: toastData.textColor }}
                className="font-normal text-xs md:text-sm leading-snug text-left block"
              >
                {toastData.body}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ color: toastData.textColor }}
            className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/5 shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
