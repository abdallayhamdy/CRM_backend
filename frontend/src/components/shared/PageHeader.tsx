import * as React from "react"

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        {subtitle && typeof subtitle === 'string' ? (
          <p className="text-[14px] text-muted-foreground font-medium mb-1">
            {subtitle}
          </p>
        ) : subtitle}
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 mt-1">
          {actions}
        </div>
      )}
    </div>
  )
}
