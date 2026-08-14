"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: string
  onChange?: (dateTime: string) => void
  placeholder?: string
  className?: string
}

const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM",
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
]

function parseTime(time: string): { h: number; m: number; ap: "AM" | "PM" } {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return { h: 8, m: 0, ap: "AM" }
  return { h: parseInt(match[1]), m: parseInt(match[2]), ap: match[3].toUpperCase() as "AM" | "PM" }
}

function buildTime(h: number, m: number, ap: "AM" | "PM"): string {
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ap}`
}

function clampHour(h: number): number {
  if (h < 1) return 12
  if (h > 12) return 1
  return h
}

function clampMinute(m: number): number {
  if (m < 0) return 59
  if (m > 59) return 0
  return m
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  className,
}: DateTimePickerProps) {
  const [prevValue, setPrevValue] = React.useState<string | undefined>(undefined)
  const [date, setDate] = React.useState<Date>()
  const [time, setTime] = React.useState("08:00 AM")
  const [activeField, setActiveField] = React.useState<"h" | "m" | "ap">("h")
  const [timeOpen, setTimeOpen] = React.useState(false)
  const [dateOpen, setDateOpen] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { h, m, ap } = parseTime(time)

  if (value !== prevValue) {
    setPrevValue(value)
    if (value) {
      const parts = value.split(" ")
      if (parts.length >= 2) {
        const dateStr = parts[0]
        const timeStr = parts.slice(1).join(" ")
        const d = new Date(dateStr + "T00:00:00")
        if (!isNaN(d.getTime())) setDate(d)
        if (TIME_OPTIONS.includes(timeStr)) setTime(timeStr)
      } else if (value.includes("-")) {
        const d = new Date(value + "T00:00:00")
        if (!isNaN(d.getTime())) setDate(d)
      }
    }
  }

  React.useEffect(() => {
    if (date && onChange) {
      onChange(format(date, "yyyy-MM-dd") + " " + time)
    }
  }, [date, time, onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key
    if (key >= "0" && key <= "9") {
      e.preventDefault()
      const d = parseInt(key)
      setTime((prev) => {
        const p = parseTime(prev)
        if (activeField === "h") {
          return buildTime(clampHour((p.h % 10) * 10 + d), p.m, p.ap)
        } else {
          return buildTime(p.h, clampMinute((p.m % 10) * 10 + d), p.ap)
        }
      })
    } else if (key === "Backspace") {
      e.preventDefault()
      setTime((prev) => {
        const p = parseTime(prev)
        if (activeField === "h") {
          return buildTime(Math.floor(p.h / 10) || 1, p.m, p.ap)
        } else {
          return buildTime(p.h, Math.floor(p.m / 10), p.ap)
        }
      })
    } else if (key === "ArrowUp") {
      e.preventDefault()
      if (activeField === "ap") {
        setTime((prev) => { const p = parseTime(prev); return buildTime(p.h, p.m, p.ap === "AM" ? "PM" : "AM") })
      } else {
        setTime((prev) => {
          const p = parseTime(prev)
          if (activeField === "h") return buildTime(clampHour(p.h + 1), p.m, p.ap)
          return buildTime(p.h, clampMinute(p.m + 1), p.ap)
        })
      }
    } else if (key === "ArrowDown") {
      e.preventDefault()
      if (activeField === "ap") {
        setTime((prev) => { const p = parseTime(prev); return buildTime(p.h, p.m, p.ap === "AM" ? "PM" : "AM") })
      } else {
        setTime((prev) => {
          const p = parseTime(prev)
          if (activeField === "h") return buildTime(clampHour(p.h - 1), p.m, p.ap)
          return buildTime(p.h, clampMinute(p.m - 1), p.ap)
        })
      }
    } else if (key === "ArrowLeft") {
      e.preventDefault()
      setActiveField((prev) => prev === "ap" ? "m" : prev === "m" ? "h" : "h")
    } else if (key === "ArrowRight") {
      e.preventDefault()
      setActiveField((prev) => prev === "h" ? "m" : "ap")
    } else if (key === "a" || key === "A") {
      e.preventDefault()
      setTime((prev) => { const p = parseTime(prev); return buildTime(p.h, p.m, "AM") })
    } else if (key === "p" || key === "P") {
      e.preventDefault()
      setTime((prev) => { const p = parseTime(prev); return buildTime(p.h, p.m, "PM") })
    } else if (key === "Tab") {
      e.preventDefault()
      setActiveField((prev) => prev === "h" ? "m" : prev === "m" ? "ap" : "h")
    } else if (key === " ") {
      e.preventDefault()
      setTime((prev) => { const p = parseTime(prev); return buildTime(p.h, p.m, p.ap === "AM" ? "PM" : "AM") })
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <div className="h-10 w-full pl-9 pr-3 flex items-center text-[13px] border border-input rounded-md bg-background cursor-pointer hover:bg-accent/50 transition-colors">
                {date ? format(date, "MM/dd/yyyy") : <span className="text-muted-foreground">{placeholder}</span>}
              </div>
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { setDate(d); setDateOpen(false) }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className={cn(
            "h-10 w-[140px] flex items-center justify-center text-[13px] font-mono border rounded-md bg-background cursor-text select-none transition-colors",
            focused ? "ring-2 ring-ring ring-offset-background border-transparent" : "border-input"
          )}
          tabIndex={0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            const target = e.target as HTMLElement
            const field = target.dataset.field as "h" | "m" | undefined
            if (field) setActiveField(field)
          }}
        >
          <span
            data-field="h"
            className={cn(
              "px-1.5 py-0.5 rounded cursor-text transition-colors",
              focused && activeField === "h"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >{h.toString().padStart(2, "0")}</span>
          <span className="text-muted-foreground mx-px">:</span>
          <span
            data-field="m"
            className={cn(
              "px-1.5 py-0.5 rounded cursor-text transition-colors",
              focused && activeField === "m"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >{m.toString().padStart(2, "0")}</span>
          <span className={cn(
            "ml-1.5 px-1 py-0.5 rounded cursor-text transition-colors text-[12px]",
            focused && activeField === "ap"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          )} data-field="ap">{ap}</span>
        </div>

        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
              tabIndex={-1}
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[140px] p-1 max-h-[300px] overflow-y-auto" align="end" sideOffset={4}>
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTime(t); setTimeOpen(false) }}
                className={cn(
                  "w-full px-3 py-1.5 text-[13px] text-left rounded-md transition-colors",
                  time === t ? "bg-muted font-medium text-foreground" : "hover:bg-muted/50 text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
