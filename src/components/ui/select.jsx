"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

const SelectContext = React.createContext(null)

// helper hitung posisi dropdown
function getDropdownPlacement(containerElement) {
  if (!containerElement || typeof window === "undefined") {
    return { top: "100%", marginTop: "4px", maxHeight: "300px" }
  }

  const rect = containerElement.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - 16
  const spaceAbove = rect.top - 16

  if (spaceBelow >= 200 || spaceBelow > spaceAbove) {
    return {
      top: "100%",
      marginTop: "4px",
      maxHeight: `${Math.max(100, Math.min(spaceBelow, 300))}px`,
    }
  }

  return {
    bottom: "100%",
    marginBottom: "4px",
    maxHeight: `${Math.max(100, Math.min(spaceAbove, 300))}px`,
  }
}

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
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [])

  const contextValue = React.useMemo(
    () => ({ value, onValueChange, isOpen, setIsOpen, containerRef }),
    [value, onValueChange, isOpen]
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// group opsi select
function SelectGroup({ className, ...props }) {
  return <div data-slot="select-group" className={cn("p-1", className)} {...props} />
}

// value terpilih select
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

// tombol trigger select
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
        "flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent py-3 px-4 text-sm text-slate-800 dark:text-slate-200 transition-colors outline-none select-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black dark:focus:border-white dark:focus:ring-white disabled:cursor-not-allowed disabled:opacity-50 text-left aria-invalid:border-red-500 aria-invalid:focus:border-black aria-invalid:focus:ring-black dark:aria-invalid:focus:border-white dark:aria-invalid:focus:ring-white",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className={cn(
          "pointer-events-none size-4 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
}

// popover dropdown select
function SelectContent({ className, children, ...props }) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  const { isOpen, containerRef } = context

  const [positionStyle, setPositionStyle] = React.useState({
    top: "100%",
    marginTop: "4px",
    maxHeight: "50vh",
  })

  React.useEffect(() => {
    if (isOpen && containerRef?.current) {
      setPositionStyle(getDropdownPlacement(containerRef.current))
    }
  }, [isOpen, containerRef])

  if (!isOpen) return null

  return (
    <div
      data-slot="select-content"
      style={positionStyle}
      className={cn(
        "absolute z-50 left-0 min-w-full w-max rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-lg duration-100 overflow-y-auto",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

// label group select
function SelectLabel({ className, ...props }) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

// item opsi dropdown
function SelectItem({ className, children, value, hideCheck = false, ...props }) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  const { value: selectedValue, onValueChange, setIsOpen } = context

  const isSelected = selectedValue === value

  const handleSelect = () => {
    onValueChange(value)
    setIsOpen(false)
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-lg py-2.5 px-4 text-sm outline-hidden select-none hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 text-left transition-colors",
        isSelected && "bg-muted text-foreground",
        className
      )}
      {...props}
    >
      <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">{children}</span>
      {isSelected && !hideCheck && (
        <span className="flex size-4 items-center justify-center">
          <CheckIcon className="size-3.5 text-primary" />
        </span>
      )}
    </button>
  )
}

// divider pemisah select
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
