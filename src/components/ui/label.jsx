"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// label input form
function Label({
  className,
  ...props
}) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-semibold leading-none text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

export { Label }
