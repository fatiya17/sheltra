import React from "react"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function MobileHeader({ title, rightElement, className, onBack }) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className={cn("flex items-center justify-between w-full p-4 bg-white sticky top-0 z-50", className)}>
      <button
        onClick={handleBack}
        className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Kembali"
      >
        <ChevronLeft className="w-6 h-6 text-slate-800" strokeWidth={2.5} />
      </button>
      
      <h1 className="text-lg font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">
        {title}
      </h1>
      
      <div className="w-10 flex justify-end">
        {rightElement}
      </div>
    </div>
  )
}
