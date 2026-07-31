"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

const SelectContext = React.createContext(null)

// wadah utama dropdown pilihan menu (select box)
function Select({ children, value, onValueChange }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// pengelompok opsi dalam menu pilihan
function SelectGroup({ className, ...props }) {
  return <div data-slot="select-group" className={cn("p-1", className)} {...props} />
}

// area untuk memunculkan teks opsi yang sedang dipilih
function SelectValue({ placeholder, className, ...props }) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  return (
    <span 
      data-slot="select-value" 
      className={cn("flex flex-1 text-left truncate text-slate-850 dark:text-slate-150", className)} 
      {...props}
    >
      {context.value || placeholder}
    </span>
  )
}

// tombol utama yang ditekan untuk membuka daftar menu pilihan
function SelectTrigger({ className, children, id, ...props }) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  const { isOpen, setIsOpen } = context

  return (
    <button
      type="button"
      id={id}
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent py-3 px-4 text-xs md:text-sm text-slate-800 dark:text-slate-200 transition-colors outline-none select-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 text-left",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className={cn("pointer-events-none size-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
    </button>
  )
}

// wadah kotak daftar opsi pilihan yang melayang di bawah tombol
function SelectContent({ className, children, ...props }) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  const { isOpen } = context

  if (!isOpen) return null

  return (
    <div
      data-slot="select-content"
      className={cn(
        "absolute z-50 mt-1 max-h-60 min-w-full w-max overflow-x-hidden overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-lg duration-100",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

// judul teks label dalam daftar opsi pilihan
function SelectLabel({ className, ...props }) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

// satu baris item pilihan dalam daftar menu dropdown
function SelectItem({ className, children, value, ...props }) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  const { value: selectedValue, onValueChange, setIsOpen } = context

  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      onClick={() => {
        onValueChange(value)
        setIsOpen(false)
      }}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-lg py-2.5 px-4 text-xs md:text-sm outline-hidden select-none hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white disabled:pointer-events-none disabled:opacity-50 text-left",
        isSelected && "bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white",
        className
      )}
      {...props}
    >
      <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </span>
      {isSelected && (
        <span className="flex size-4 items-center justify-center">
          <CheckIcon className="size-3.5 text-primary" />
        </span>
      )}
    </button>
  )
}

// garis batas tipis pemisah antar kelompok pilihan
function SelectSeparator({ className, ...props }) {
  return (
    <div
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton() {
  return null
}

function SelectScrollDownButton() {
  return null
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
