import * as React from "react"
import { cn } from "@/lib/utils"

// kolom ketik teks panjang beberapa baris (seperti pesan, catatan, atau detail laporan)
function Textarea({
  className,
  spellCheck = false,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      spellCheck={spellCheck}
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-xs md:text-sm text-slate-800 dark:text-slate-200 transition-colors outline-none placeholder:text-slate-450 placeholder:font-light focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-50/50 dark:disabled:bg-slate-900/50 disabled:opacity-50 aria-invalid:border-[1.5px] aria-invalid:border-destructive aria-invalid:focus-visible:border-slate-350 dark:aria-invalid:focus-visible:border-slate-700 aria-invalid:focus-visible:ring-0 resize-none overflow-hidden",
        className
      )}
      {...props} />
  );
}

export { Textarea }
