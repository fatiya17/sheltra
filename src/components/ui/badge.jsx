import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-full border border-transparent py-0 px-2 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 hover:bg-destructive/20",
        outline:
          "border-border text-foreground hover:bg-muted hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        blue: "bg-[#C4DDFB] text-[#00458C] hover:bg-[#A9CEFA] dark:bg-[#00458C]/20 dark:text-[#C4DDFB]",
        cyan: "bg-[#A3E0EF] text-[#00505F] hover:bg-[#8CD5E8] dark:bg-[#00505F]/20 dark:text-[#A3E0EF]",
        green: "bg-[#C5E5C0] text-[#0C5700] hover:bg-[#B3DCAB] dark:bg-[#0C5700]/20 dark:text-[#C5E5C0]",
        pink: "bg-[#FCCADC] text-[#83004B] hover:bg-[#F9AFC8] dark:bg-[#83004B]/20 dark:text-[#FCCADC]",
        purple: "bg-[#ECCEF3] text-[#700084] hover:bg-[#E2B7EC] dark:bg-[#700084]/20 dark:text-[#ECCEF3]",
        teal: "bg-[#A5E3D6] text-[#005348] hover:bg-[#8DDAD0] dark:bg-[#005348]/20 dark:text-[#A5E3D6]",
        orange: "bg-[#FAD0B5] text-[#6E3500] hover:bg-[#FCD1B3] dark:bg-[#6E3500]/20 dark:text-[#FAD0B5]",
        red: "bg-[#FACECB] text-[#89001A] hover:bg-[#F8BCBC] dark:bg-[#89001A]/20 dark:text-[#FACECB]",
        yellow: "bg-[#F8DA9D] text-[#584400] hover:bg-[#EEDF9D] dark:bg-[#584400]/20 dark:text-[#F8DA9D]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// label penunjuk status kecil berbentuk kapsul (seperti label 'aktif', 'menunggu', atau 'selesai')
const Badge = React.forwardRef(({
  className,
  variant = "default",
  asChild = false,
  label,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      ref={ref}
      {...props}>
      {children ?? label}
    </Comp>
  );
})
Badge.displayName = "Badge"

export { Badge, badgeVariants }
