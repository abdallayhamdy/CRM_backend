"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  hsvToRgb,
  rgbToHsv,
  hsvToHex,
  hexToHsv,
  type HSV,
} from "@/lib/tiptap/color-utils"

interface ColorPickerPopoverProps {
  currentColor: string
  onSelect: (hexColor: string) => void
  onReset: () => void
  children: React.ReactNode
}

const SIMPLE_PALETTE: string[][] = [
  // Row 0: greyscale (8 shades)
  ["#ffffff", "#e8e8e8", "#c8c8c8", "#a0a0a0", "#808080", "#606060", "#383838", "#000000"],
]

const HUE_COLORS: { name: string; hue: number }[] = [
  { name: "Red", hue: 0 },
  { name: "Orange", hue: 30 },
  { name: "Yellow", hue: 55 },
  { name: "Green", hue: 120 },
  { name: "Cyan", hue: 180 },
  { name: "Blue", hue: 220 },
  { name: "Purple", hue: 270 },
  { name: "Magenta", hue: 320 },
]

const SATURATION_STEPS = [90, 80, 70, 60, 50, 40, 30, 15]
const VALUE_STEPS = [95, 85, 75, 65, 55, 45, 35, 25]

function generateColorRows(): string[][] {
  const rows: string[][] = []
  for (const sat of SATURATION_STEPS) {
    const row: string[] = []
    for (const hueColor of HUE_COLORS) {
      const v = VALUE_STEPS[SATURATION_STEPS.indexOf(sat)]
      row.push(hsvToHex({ h: hueColor.hue, s: sat, v }))
    }
    rows.push(row)
  }
  return rows
}

const COLOR_ROWS = generateColorRows()

function isValidHex(hex: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
}

export function ColorPickerPopover({
  currentColor,
  onSelect,
  onReset,
  children,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[340px] p-0 shadow-md"
        align="start"
        sideOffset={4}
      >
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="simple" className="flex-1 rounded-none">
              Simple
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1 rounded-none">
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="p-3 space-y-3">
            <SimpleColorGrid
              onSelect={(hex) => {
                onSelect(hex)
                setOpen(false)
              }}
            />
            <button
              type="button"
              onClick={() => {
                onReset()
                setOpen(false)
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Reset to default
            </button>
          </TabsContent>

          <TabsContent value="advanced" className="p-3 space-y-3">
            <AdvancedColorPicker
              initialColor={currentColor}
              onSelect={(hex) => {
                onSelect(hex)
                setOpen(false)
              }}
              onReset={() => {
                onReset()
                setOpen(false)
              }}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

function SimpleColorGrid({
  onSelect,
}: {
  onSelect: (hex: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-8 gap-1">
        {SIMPLE_PALETTE[0].map((color) => (
          <ColorSwatch key={color} color={color} onClick={() => onSelect(color)} />
        ))}
      </div>
      {COLOR_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-8 gap-1">
          {row.map((color) => (
            <ColorSwatch key={color} color={color} onClick={() => onSelect(color)} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ColorSwatch({
  color,
  onClick,
  size = 28,
}: {
  color: string
  onClick: () => void
  size?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[4px] border border-black/10 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      title={color}
    />
  )
}

function AdvancedColorPicker({
  initialColor,
  onSelect,
  onReset,
}: {
  initialColor: string
  onSelect: (hex: string) => void
  onReset: () => void
}) {
  const initialHsv = React.useMemo(() => {
    return hexToHsv(initialColor) || { h: 0, s: 100, v: 100 }
  }, [initialColor])

  const [hsv, setHsv] = React.useState<HSV>(initialHsv)
  const [hexInput, setHexInput] = React.useState(initialColor)
  const [isDraggingSV, setIsDraggingSV] = React.useState(false)
  const [isDraggingHue, setIsDraggingHue] = React.useState(false)
  const isTypingRef = React.useRef(false)

  const svRef = React.useRef<HTMLDivElement>(null)
  const hueRef = React.useRef<HTMLDivElement>(null)

  const rgb = React.useMemo(() => hsvToRgb(hsv), [hsv])
  const hex = React.useMemo(() => hsvToHex(hsv), [hsv])

  React.useEffect(() => {
    if (!isTypingRef.current) {
      setHexInput(hex)
    }
  }, [hex])

  const updateFromHsv = React.useCallback((newHsv: HSV) => {
    setHsv(newHsv)
  }, [])

  const handleSVInteraction = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!svRef.current) return
      const rect = svRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      updateFromHsv({ ...hsv, s: Math.round(x * 100), v: Math.round((1 - y) * 100) })
    },
    [hsv, updateFromHsv]
  )

  const handleHueInteraction = React.useCallback(
    (clientX: number) => {
      if (!hueRef.current) return
      const rect = hueRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      updateFromHsv({ ...hsv, h: Math.round(x * 360) })
    },
    [hsv, updateFromHsv]
  )

  React.useEffect(() => {
    if (!isDraggingSV && !isDraggingHue) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSV) handleSVInteraction(e.clientX, e.clientY)
      if (isDraggingHue) handleHueInteraction(e.clientX)
    }
    const handleMouseUp = () => {
      setIsDraggingSV(false)
      setIsDraggingHue(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingSV, isDraggingHue, handleSVInteraction, handleHueInteraction])

  const handleTouchStartSV = (e: React.TouchEvent) => {
    setIsDraggingSV(true)
    const touch = e.touches[0]
    handleSVInteraction(touch.clientX, touch.clientY)
  }

  const handleTouchStartHue = (e: React.TouchEvent) => {
    setIsDraggingHue(true)
    const touch = e.touches[0]
    handleHueInteraction(touch.clientX)
  }

  const handleHexInputChange = (value: string) => {
    isTypingRef.current = true
    const prefixed = value.startsWith("#") ? value : `#${value}`
    setHexInput(prefixed)
    if (isValidHex(prefixed)) {
      const newHsv = hexToHsv(prefixed)
      if (newHsv) setHsv(newHsv)
    }
    // Allow external HSV changes to update input after a brief delay
    setTimeout(() => {
      isTypingRef.current = false
    }, 500)
  }

  const handleRgbChange = (channel: "r" | "g" | "b", value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0 || num > 255) return
    const newRgb = { ...rgb, [channel]: num }
    setHsv(rgbToHsv(newRgb))
  }

  const svBackground = React.useMemo(() => {
    const pure = hsvToHex({ h: hsv.h, s: 100, v: 100 })
    return pure
  }, [hsv.h])

  const svX = hsv.s / 100
  const svY = 1 - hsv.v / 100
  const hueX = hsv.h / 360

  return (
    <div className="space-y-3">
      {/* Saturation/Value area */}
      <div
        ref={svRef}
        className="relative w-full h-[180px] rounded-md cursor-crosshair overflow-hidden select-none"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${svBackground})`,
        }}
        onMouseDown={(e) => {
          setIsDraggingSV(true)
          handleSVInteraction(e.clientX, e.clientY)
        }}
        onTouchStart={handleTouchStartSV}
      >
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${svX * 100}%`,
            top: `${svY * 100}%`,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative w-full h-3 rounded-full cursor-pointer select-none"
        style={{
          background:
            "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
        }}
        onMouseDown={(e) => {
          setIsDraggingHue(true)
          handleHueInteraction(e.clientX)
        }}
        onTouchStart={handleTouchStartHue}
      >
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${hueX * 100}%`,
            top: "50%",
            backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          }}
        />
      </div>

      {/* Preview + Hex input */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-black/10 shrink-0"
          style={{ backgroundColor: hex }}
        />
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            #
          </span>
          <Input
            value={hexInput.replace("#", "")}
            onChange={(e) => handleHexInputChange(e.target.value)}
            className="h-8 pl-5 text-xs font-mono"
            maxLength={6}
          />
        </div>
      </div>

      {/* RGB inputs */}
      <div className="grid grid-cols-3 gap-2">
        {(["r", "g", "b"] as const).map((channel) => (
          <div key={channel} className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase font-medium">
              {channel}
            </label>
            <Input
              type="number"
              min={0}
              max={255}
              value={rgb[channel]}
              onChange={(e) => handleRgbChange(channel, e.target.value)}
              className="h-8 text-xs font-mono px-2"
            />
          </div>
        ))}
      </div>

      {/* Apply + Reset */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSelect(hex)}
          className="flex-1 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors py-1.5 rounded-md"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
        >
          Reset to default
        </button>
      </div>
    </div>
  )
}
