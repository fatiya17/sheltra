import * as React from "react"
import { cn } from "@/lib/utils"

const variantClasses = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
  ghost:
    "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
  destructive:
    "bg-destructive/10 text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
  link: "text-primary underline-offset-4 hover:underline",
}

const sizeClasses = {
  default:
    "gap-2 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
  xs: "gap-1.5 rounded-[min(var(--radius-md),10px)] text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
  sm: "gap-1.5 rounded-[min(var(--radius-md),12px)] text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
  lg: "gap-2 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
  icon: "size-11 p-0 [&_svg:not([class*='size-'])]:size-5",
  "icon-xs":
    "size-8 p-0 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
  "icon-sm":
    "size-9.5 p-0 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-4.5",
  "icon-lg": "size-14 p-0 [&_svg:not([class*='size-'])]:size-6.5",
}

const fontSizeClasses = {
  default: "text-sm",
  xs: "text-xs gap-1.5",
  sm: "text-sm gap-1.5",
  base: "text-base gap-2",
  lg: "text-lg gap-2",
  xl: "text-xl gap-2.5",
  "2xl": "text-2xl gap-3",
}

const buttonVariants = ({ variant = "default", size = "default", fontSize = "default", className } = {}) => {
  return cn(
    "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding py-2 px-3 font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.default,
    fontSizeClasses[fontSize] || fontSizeClasses.default,
    className
  )
}

// tombol klik aksi (seperti kirim formulir, klik batal, atau tombol ikon kembali)
const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  fontSize = "default",
  asChild = false,
  children,
  ...props
}, ref) => {
  const mergedClassName = buttonVariants({ variant, size, fontSize, className })

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      ...props,
      ...children.props,
      className: cn(mergedClassName, children.props.className),
    })
  }

  return (
    <button
      data-slot="button"
      className={mergedClassName}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
