"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function DatePicker({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsedDate = React.useMemo(() => {
    if (!value) return undefined
    const d = new Date(value + "T00:00:00")
    return isNaN(d.getTime()) ? undefined : d
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const iso = format(date, "yyyy-MM-dd")
      onChange?.(iso)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            readOnly
            value={parsedDate ? format(parsedDate, "MM/dd/yyyy") : ""}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "border-border focus-visible:ring-primary text-[13px] pr-9 cursor-pointer",
              !parsedDate && "text-muted-foreground",
              className
            )}
            onClick={() => setOpen(true)}
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
