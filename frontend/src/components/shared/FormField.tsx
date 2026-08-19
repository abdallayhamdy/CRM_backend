"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
  description?: string
}

function FormField({
  label,
  required,
  error,
  htmlFor,
  className,
  children,
  description,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-[13px] font-semibold text-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-[12px] text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-[12px] text-destructive font-medium">{error}</p>
      )}
    </div>
  )
}

export { FormField }
export type { FormFieldProps }
