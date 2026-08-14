import * as React from "react"
import { FileQuestion } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon = <FileQuestion className="h-10 w-10 text-muted-foreground" />,
  action
}: EmptyStateProps) {
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
