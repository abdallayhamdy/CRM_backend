import * as React from "react"
import { Plus, ChevronDown, Pencil, Palette, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  hsvToRgb,
  rgbToHsv,
  hsvToHex,
  hexToHsv,
  type HSV,
} from "@/lib/tiptap/color-utils"

const DEFAULT_TAB_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

interface CrmTabsProps {
  items: { 
    id: string; 
    label: string; 
    icon?: React.ReactNode; 
    count?: number;
    closable?: boolean;
    color?: string;
  }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabClose?: (id: string) => void;
  onAddTab?: () => void;
  onReorder?: (newItems: CrmTabsProps["items"]) => void;
  onRenameTab?: (id: string, newName: string) => void;
  onColorChangeTab?: (id: string, color: string) => void;
  className?: string;
  maxItems?: number;
}

const SIMPLE_PALETTE: string[][] = [
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

function SimpleColorGrid({ onSelect }: { onSelect: (hex: string) => void }) {
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
    return hsvToHex({ h: hsv.h, s: 100, v: 100 })
  }, [hsv.h])

  const svX = hsv.s / 100
  const svY = 1 - hsv.v / 100
  const hueX = hsv.h / 360

  return (
    <div className="space-y-3">
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

function ColorPickerContent({
  currentColor,
  onSelect,
  onReset,
}: {
  currentColor: string
  onSelect: (hex: string) => void
  onReset: () => void
}) {
  return (
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
          }}
        />
        <button
          type="button"
          onClick={onReset}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Reset to default
        </button>
      </TabsContent>

      <TabsContent value="advanced" className="p-3 space-y-3">
        <AdvancedColorPicker
          initialColor={currentColor}
          onSelect={onSelect}
          onReset={onReset}
        />
      </TabsContent>
    </Tabs>
  )
}

function SortableTab({
  item,
  isActive,
  onTabChange,
  onTabClose,
  onRenameTab,
  onColorChangeTab,
}: {
  item: CrmTabsProps["items"][number]
  isActive: boolean
  onTabChange: (id: string) => void
  onTabClose?: (id: string) => void
  onRenameTab?: (id: string, newName: string) => void
  onColorChangeTab?: (id: string, color: string) => void
}) {
  const isDraggable = item.closable !== false

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    disabled: !isDraggable
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center group/sortable",
        isDragging && "z-50 opacity-50"
      )}
    >
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center -ml-1 mr-0.5"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <Tab
        item={item}
        isActive={isActive}
        onTabChange={onTabChange}
        onTabClose={onTabClose}
        onRenameTab={onRenameTab}
        onColorChangeTab={onColorChangeTab}
      />
    </div>
  )
}

function Tab({
  item,
  isActive,
  onTabChange,
  onTabClose,
  onRenameTab,
  onColorChangeTab,
}: {
  item: CrmTabsProps["items"][number]
  isActive: boolean
  onTabChange: (id: string) => void
  onTabClose?: (id: string) => void
  onRenameTab?: (id: string, newName: string) => void
  onColorChangeTab?: (id: string, color: string) => void
}) {
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState(item.label)
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const hasMenu = onRenameTab || onColorChangeTab

  React.useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== item.label) {
      onRenameTab?.(item.id, renameValue.trim())
    }
    setIsRenaming(false)
  }

  const handleColorSelect = (color: string) => {
    onColorChangeTab?.(item.id, color)
    setIsColorPickerOpen(false)
  }

  const tabContent = (
    <div className="flex items-center gap-2">
      {item.icon && <span className="opacity-70">{item.icon}</span>}
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit()
            if (e.key === "Escape") {
              setRenameValue(item.label)
              setIsRenaming(false)
            }
          }}
          className="text-[13px] bg-transparent border-b border-current outline-none w-24 min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span 
            className="inline-flex items-center justify-center min-w-[26px] h-[24px] text-[12px] font-bold px-2 rounded-lg"
            style={{
              backgroundColor: item.color || "hsl(var(--primary))",
              color: "white"
            }}
          >
            {item.count ?? 0}
          </span>
          <span className="text-[13px] font-medium whitespace-nowrap select-none">
            {item.label}
          </span>
        </>
      )}
    </div>
  )

  return (
    <div
      onClick={() => onTabChange(item.id)}
      className={cn(
        "group relative flex items-center h-9 px-3 cursor-pointer transition-all duration-200 outline-none rounded-lg",
        isActive 
          ? "font-semibold bg-muted/50" 
          : "font-medium hover:bg-muted/30"
      )}
      style={{
        color: item.color 
          || (isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))")
      }}
    >
      {hasMenu ? (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            {tabContent}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center p-0.5 rounded hover:bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {onRenameTab && (
                <DropdownMenuItem onClick={(e) => { 
                  e.stopPropagation(); 
                  setRenameValue(item.label)
                  setIsRenaming(true) 
                }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
              {onColorChangeTab && (
                <DropdownMenuItem onClick={(e) => { 
                  e.stopPropagation()
                  setTimeout(() => setIsColorPickerOpen(true), 100)
                }}>
                  <Palette className="h-4 w-4 mr-2" />
                  Change color
                </DropdownMenuItem>
              )}
              {item.closable && onTabClose && (
                <>
                  <div className="h-px bg-border my-1" />
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation()
                      onTabClose(item.id)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        tabContent
      )}
      {/* Rename Dialog */}
      <Dialog open={isRenaming} onOpenChange={(open) => {
        if (!open) {
          setRenameValue(item.label)
          setIsRenaming(false)
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit()
              }}
              placeholder="Enter view name"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setRenameValue(item.label)
              setIsRenaming(false)
            }}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!renameValue.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Picker Dialog */}
      <Dialog open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <DialogContent className="sm:max-w-[380px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Change color</DialogTitle>
          </DialogHeader>
          <ColorPickerContent
            currentColor={item.color || "#3b82f6"}
            onSelect={handleColorSelect}
            onReset={() => handleColorSelect("")}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function CrmTabs({ 
  items, 
  activeTab, 
  onTabChange,
  onTabClose,
  onAddTab,
  onReorder,
  onRenameTab,
  onColorChangeTab,
  className,
  maxItems = 10
}: CrmTabsProps) {
  const isAtLimit = items.length >= maxItems
  const itemsWithColors = React.useMemo(() => {
    const usedColors = new Set<string>()
    const itemsWithDefaultColors = items.map((item, index) => {
      if (item.color) {
        usedColors.add(item.color)
        return item
      }
      const nextColor = DEFAULT_TAB_COLORS.find(c => !usedColors.has(c)) || DEFAULT_TAB_COLORS[index % DEFAULT_TAB_COLORS.length]
      usedColors.add(nextColor)
      return { ...item, color: nextColor }
    })
    return itemsWithDefaultColors
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(item => item.id === active.id)
    const newIndex = items.findIndex(item => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex)
      onReorder?.(newItems)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex shrink min-w-0 items-center h-full overflow-x-auto no-scrollbar", className)}>
        <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex items-center h-full gap-1 shrink-0">
            {itemsWithColors.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <React.Fragment key={item.id}>
                  <SortableTab
                    item={item}
                    isActive={isActive}
                    onTabChange={onTabChange}
                    onTabClose={onTabClose}
                    onRenameTab={onRenameTab}
                    onColorChangeTab={onColorChangeTab}
                  />
                </React.Fragment>
              );
            })}
    
            <button 
              onClick={onAddTab}
              disabled={isAtLimit}
              title={isAtLimit ? `Maximum ${maxItems} tabs allowed` : "Add new tab"}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all shrink-0",
                isAtLimit 
                  ? "text-muted-foreground/30 cursor-not-allowed" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </SortableContext>
      </div>
    </DndContext>
  )
}
