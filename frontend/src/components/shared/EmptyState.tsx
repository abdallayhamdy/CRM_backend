import * as React from "react"
import { FileQuestion, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateBaseProps {
  title: string
  description?: string
  className?: string
}

interface EmptyStateSimpleProps extends EmptyStateBaseProps {
  variant?: "simple"
  icon?: React.ReactNode
  action?: React.ReactNode
}

interface EmptyStateFancyProps extends EmptyStateBaseProps {
  variant: "fancy"
  icon: LucideIcon
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

type EmptyStateProps = EmptyStateSimpleProps | EmptyStateFancyProps

export function EmptyState(props: EmptyStateProps) {
  if (props.variant === "fancy") {
    return <EmptyStateFancy {...props} />
  }
  return <EmptyStateSimple {...props} />
}

function EmptyStateSimple({
  title,
  description,
  icon = <FileQuestion className="h-10 w-10 text-muted-foreground" />,
  action
}: Omit<EmptyStateSimpleProps, "variant">) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
      <div className="mb-4 bg-muted p-4 rounded-full">
        {icon}
      </div>
      <h3 className="text-[16px] font-bold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-[14px] text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}

function EmptyStateFancy({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className
}: Omit<EmptyStateFancyProps, "variant">) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center bg-background border border-border rounded-lg shadow-sm w-full min-h-[400px] animate-in fade-in zoom-in-95 duration-500",
      className
    )}>
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl transform scale-150 animate-pulse" />
        <div className="relative w-24 h-24 bg-background border border-border rounded-2xl shadow-xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
          <Icon className="w-10 h-10 text-primary" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-lg shadow-lg flex items-center justify-center">
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">{title}</h3>
      <p className="text-[15px] text-muted-foreground max-w-md mb-10 leading-relaxed font-medium">
        {description}
      </p>

      <div className="flex items-center gap-4">
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-[4px] shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {actionLabel}
          </Button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            className="h-10 px-6 border-border text-foreground font-bold rounded-[4px] hover:bg-muted/50 transition-all"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
