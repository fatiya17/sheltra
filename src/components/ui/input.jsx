import * as React from "react"
import { cn } from "@/lib/utils"

// input text field
const Input = React.forwardRef(({
  className,
  type,
  spellCheck = false,
  ...props
}, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      spellCheck={spellCheck}
      className={cn(
        "flex w-full min-w-0 rounded-xl border border-[#DFE5EE] dark:border-slate-800 bg-[#FDFDFE] dark:bg-transparent px-4 py-3 text-sm text-slate-800 dark:text-slate-200 transition-colors outline-none placeholder:text-[#9CA2AC] placeholder:font-light focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-primary dark:focus:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50/50 dark:disabled:bg-slate-900/50 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-500",
        className
      )}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
