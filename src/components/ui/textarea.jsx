import * as React from "react"
import { cn } from "@/lib/utils"

// input textarea multiline
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
        "flex min-h-24 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm text-slate-800 dark:text-slate-200 transition-colors outline-none placeholder:text-slate-450 placeholder:font-light focus:outline-none focus:border-black focus:ring-1 focus:ring-black dark:focus:border-white dark:focus:ring-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50/50 dark:disabled:bg-slate-900/50 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus:border-black aria-invalid:focus:ring-black dark:aria-invalid:focus:border-white dark:aria-invalid:focus:ring-white resize-none overflow-hidden",
        className
      )}
      {...props} />
  );
}

export { Textarea }
