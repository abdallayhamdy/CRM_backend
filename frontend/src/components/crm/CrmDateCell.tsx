"use client"

import * as React from "react"
import { format, formatDistanceToNow, isAfter, subDays } from "date-fns"
import { cn } from "@/lib/utils"

interface CrmDateCellProps {
  date: string | Date | null | undefined
  className?: string
  showTime?: boolean
  useRelative?: boolean
}

/**
 * A premium date cell for the CRM that displays dates dynamically.
 * Shows relative time (e.g., "2 hours ago") for recent dates and 
 * absolute dates for older ones, with a full timestamp on hover.
 */
export function CrmDateCell({ 
  date, 
  className, 
  showTime = false,
  useRelative = true 
}: CrmDateCellProps) {
  if (!date) return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">No date</span>

  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Invalid date</span>

  const now = new Date()
  const isRecent = isAfter(dateObj, subDays(now, 7))
  
  let displayValue = ""
  
  if (useRelative && isRecent) {
    displayValue = formatDistanceToNow(dateObj, { addSuffix: true })
  } else {
    displayValue = format(dateObj, showTime ? "MMM d, yyyy h:mm a" : "MMM d, yyyy")
  }

  return (
    <div 
      className={cn("group relative flex flex-col items-start", className)}
      title={format(dateObj, "EEEE, MMMM d, yyyy 'at' h:mm:ss a")}
    >
      <span className="text-foreground font-medium transition-colors group-hover:text-[var(--color-hs-blue)]">
        {displayValue}
      </span>
      {useRelative && isRecent && (
        <span className="text-[10px] text-muted-foreground font-normal leading-none opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3 bg-background px-1 z-10 border border-border rounded shadow-sm whitespace-nowrap">
          {format(dateObj, "MMM d, yyyy")}
        </span>
      )}
    </div>
  )
}
