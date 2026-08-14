import * as React from "react"
import { cn } from "@/lib/utils"
import { GripVertical, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type PropertyItem = {
  id: string
  label: string
  value?: string
  isBadge?: boolean
  isTag?: boolean
}

export function PropertyRow({
  prop,
  idx,
  draggingIdx,
  dragOverIdx,
  propertiesLength,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  prop: PropertyItem
  idx: number
  draggingIdx: number | null
  dragOverIdx: number | null
  propertiesLength: number
  onDragStart: (e: React.DragEvent, idx: number) => void
  onDragOver: (e: React.DragEvent, idx: number) => void
  onDrop: (e: React.DragEvent, idx: number) => void
  onDragEnd: () => void
  onMoveUp: (idx: number) => void
  onMoveDown: (idx: number) => void
  onRemove: (idx: number) => void
}) {
  return (
    <div
      key={prop.id}
      draggable
      onDragStart={(e) => onDragStart(e, idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-2 bg-background border rounded p-1.5 transition-all",
        draggingIdx === idx ? "opacity-50 border-dashed border-muted-foreground" : "border-border",
        dragOverIdx === idx && dragOverIdx !== draggingIdx ? "border-t-2 border-t-primary" : ""
      )}
    >
      <div className="cursor-grab active:cursor-grabbing px-1 text-border hover:text-muted-foreground">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 flex items-center justify-between border border-border rounded px-2 py-1.5 bg-background cursor-pointer hover:border-border">
        <span className="text-[13px] text-foreground truncate">{prop.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-1 shrink-0 px-1 text-muted-foreground">
        <button onClick={() => onMoveDown(idx)} disabled={idx === propertiesLength - 1} aria-label="Move field down" className="p-1 hover:bg-accent rounded disabled:opacity-30">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
        <button onClick={() => onMoveUp(idx)} disabled={idx === 0} aria-label="Move field up" className="p-1 hover:bg-accent rounded disabled:opacity-30">
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Field options" className="p-1 hover:bg-accent rounded ml-1 transition-colors outline-none focus:ring-1 focus:ring-primary">
              <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem className="text-[13px] text-foreground cursor-pointer" onSelect={() => {}}>
              Set conditional logic <span className="ml-auto">›</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] text-foreground cursor-pointer" onSelect={() => onRemove(idx)}>
              Remove card
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
