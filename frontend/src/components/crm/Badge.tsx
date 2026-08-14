import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { getBadgeClasses, type BadgeStyle } from "@/lib/badge-colors"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  value?: string
  /** Status type key from badge-colors.ts (e.g. "ticket_priority", "deal_stage") */
  statusType?: string
  /** Status value (e.g. "High", "closed_won") — case-insensitive */
  statusValue?: string
  /** Badge style variant (default: "tinted") */
  badgeStyle?: BadgeStyle
}

export function Badge({
  className,
  variant,
  value,
  statusType,
  statusValue,
  badgeStyle = "tinted",
  children,
  ...props
}: BadgeProps) {
  // If statusType + statusValue are provided, resolve colors from centralized config
  const resolvedClassName = statusType && statusValue
    ? cn(badgeVariants({ variant }), getBadgeClasses(statusType, statusValue, badgeStyle), className)
    : cn(badgeVariants({ variant }), className)

  return (
    <div className={resolvedClassName} {...props}>
      {children || value}
    </div>
  )
}
