"use client"

import * as React from "react"
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface SortField {
  value: string
  label: string
}

interface SortPopoverProps {
  fields: SortField[]
  sortBy: string
  sortDir: "asc" | "desc"
  onSortChange: (field: string, dir: "asc" | "desc") => void
  children?: React.ReactNode
}

export function SortPopover({
  fields,
  sortBy,
  sortDir,
  onSortChange,
  children,
}: SortPopoverProps) {
  const [open, setOpen] = React.useState(false)

  const currentLabel = fields.find(f => f.value === sortBy)?.label || "None"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="h-[34px] px-3 font-medium text-[13px] border-border gap-1.5"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[260px] p-0 shadow-xl border-border">
        <div className="p-3 border-b border-border">
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Sort by</p>
        </div>
        <div className="p-1 max-h-[300px] overflow-y-auto">
          {fields.map(field => (
            <button
              key={field.value}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-sm transition-colors text-left",
                sortBy === field.value
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground hover:bg-muted/50"
              )}
              onClick={() => {
                if (sortBy === field.value) {
                  onSortChange(field.value, sortDir === "asc" ? "desc" : "asc")
                } else {
                  onSortChange(field.value, "asc")
                }
              }}
            >
              <span>{field.label}</span>
              {sortBy === field.value && (
                <span className="text-primary">
                  {sortDir === "asc" ? (
                    <ArrowUp className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
