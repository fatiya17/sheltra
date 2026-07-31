"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const DialogContext = React.createContext(null)

// pembungkus modal pop-up melayang layar penuh
function Dialog({ open, onOpenChange, children }) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {open ? children : null}
    </DialogContext.Provider>
  )
}

// pemicu (seperti tombol) untuk menampilkan modal popup
function DialogTrigger({ asChild, children, ...props }) {
  const context = React.useContext(DialogContext)
  if (!context) return null
  const { onOpenChange } = context

  const handleClick = (e) => {
    if (children && children.props && children.props.onClick) {
      children.props.onClick(e)
    }
    onOpenChange(true)
  }

  if (asChild && children) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ...props
    })
  }

  return (
    <button type="button" onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  )
}

// pemindah render html agar melayang di tingkat teratas halaman
function DialogPortal({ children }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {children}
    </div>,
    document.body
  )
}

// pemicu (seperti tombol silang) untuk menyembunyikan modal popup
function DialogClose({ asChild, children, ...props }) {
  const context = React.useContext(DialogContext)
  if (!context) return null
  const { onOpenChange } = context

  const handleClick = (e) => {
    if (children && children.props && children.props.onClick) {
      children.props.onClick(e)
    }
    onOpenChange(false)
  }

  if (asChild && children) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ...props
    })
  }

  return (
    <button type="button" onClick={() => onOpenChange(false)} {...props}>
      {children || "Close"}
    </button>
  )
}

// efek bayangan gelap transparan di luar area kotak modal
function DialogOverlay({ className, ...props }) {
  const context = React.useContext(DialogContext)
  if (!context) return null
  const { onOpenChange } = context

  return (
    <div
      onClick={() => onOpenChange(false)}
      className={cn(
        "fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in",
        className
      )}
      {...props}
    />
  )
}

// wadah utama penampung isi dialog modal (kotak pop-up putih di tengah layar)
function DialogContent({ className, children, showCloseButton = true, ...props }) {
  const context = React.useContext(DialogContext)
  if (!context) return null
  const { onOpenChange } = context

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 shadow-lg outline-none sm:max-w-sm transition-all duration-300 animate-in fade-in zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Button
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </DialogPortal>
  )
}

// bagian atas modal untuk menempatkan judul
function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

// bagian bawah modal untuk menempatkan tombol konfirmasi atau batal
function DialogFooter({ className, showCloseButton = false, children, ...props }) {
  const context = React.useContext(DialogContext)
  if (!context) return null
  const { onOpenChange } = context

  return (
    <div
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      )}
    </div>
  )
}

// teks judul utama pop-up
function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

// teks penjelasan tambahan di bawah judul
function DialogDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
