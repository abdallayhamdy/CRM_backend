"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

export interface BoardColumn {
  id: string
  label: string
  color: string
  weight?: number
}

interface CrmBoardViewProps<T> {
  data: T[]
  columns: BoardColumn[]
  groupField: keyof T
  onItemClick?: (item: T) => void
  onDragEnd?: (result: { active: string; over: string | null; overColumn?: string }) => void
  renderCard: (item: T) => React.ReactNode
  renderFooter?: (items: T[], column: BoardColumn) => React.ReactNode
  className?: string
}

function SortableCardInner<T extends { id: string }>({
  item,
  onItemClick,
  renderCard,
  overlay = false,
}: {
  item: T
  onItemClick?: (item: T) => void
  renderCard: (item: T) => React.ReactNode
  overlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        // Skip transition on the actively dragged card — it follows the cursor via DragOverlay,
        // so transitioning it would cause lag. Only the OTHER cards shifting need the animation.
        transition: isDragging ? undefined : transition,
      }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      onClick={() => onItemClick?.(item)}
      className={cn(
        "bg-card border-2 border-transparent hover:border-primary rounded-lg p-4 cursor-pointer group/card relative",
        isDragging && !overlay && "sortable-dragging"
      )}
    >
      {renderCard(item)}

      <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <button aria-label="Card options" className="p-1 hover:bg-muted rounded-sm transition-colors">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
        <button aria-label="Edit card" className="p-1 hover:bg-muted rounded-sm transition-colors">
          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  )
}

const SortableCard = React.memo(SortableCardInner) as typeof SortableCardInner

function ColumnInner<T extends { id: string }>({
  column,
  columnItems,
  onItemClick,
  renderCard,
  renderFooter,
}: {
  column: BoardColumn
  columnItems: T[]
  onItemClick?: (item: T) => void
  renderCard: (item: T) => React.ReactNode
  renderFooter?: (items: T[], column: BoardColumn) => React.ReactNode
}) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex-1 min-w-[280px] flex flex-col group/column">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 px-1 pt-2 border-t-4"
        style={{ borderTopColor: column.color }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold text-[primary-foreground] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: column.color }}
          >
            {column.label}
          </span>
          <span className="text-[12px] font-semibold text-muted-foreground bg-card border border-border rounded-full w-5 h-5 flex items-center justify-center">
            {columnItems.length}
          </span>
        </div>
        <button aria-label="Column options" className="p-1 hover:bg-muted rounded-sm transition-colors opacity-0 group-hover/column:opacity-100">
          <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[270deg]" aria-hidden="true" />
        </button>
      </div>

      {/* Card List */}
      <div
        ref={columnItems.length === 0 ? setDroppableRef : undefined}
        className="flex-1 space-y-3 min-h-[100px] overflow-y-auto no-scrollbar pb-4"
      >
        <SortableContext
          items={columnItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {columnItems.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              onItemClick={onItemClick}
              renderCard={renderCard}
            />
          ))}
        </SortableContext>
      </div>

      {/* Footer */}
      {renderFooter && (
        <div className="mt-auto pt-3 border-t border-border space-y-1 px-1 bg-card">
          {renderFooter(columnItems, column)}
        </div>
      )}
    </div>
  )
}

const Column = React.memo(ColumnInner) as typeof ColumnInner

export function CrmBoardView<T extends { id: string }>({
  data,
  columns,
  groupField,
  onItemClick,
  onDragEnd,
  renderCard,
  renderFooter,
  className
}: CrmBoardViewProps<T>) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [activeItem, setActiveItem] = React.useState<T | undefined>(undefined)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  const groupedData = React.useMemo(() => {
    const map = new Map<string, T[]>()
    for (const col of columns) {
      map.set(col.id, data.filter(item => String(item[groupField]) === col.id))
    }
    return map
  }, [data, columns, groupField])

  React.useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true))
    return () => {
      cancelAnimationFrame(animation)
      setEnabled(false)
    }
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    const found = data.find(item => item.id === active.id)
    setActiveItem(found)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setActiveItem(undefined)
      return
    }

    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    // Find source column
    let sourceColumnId: string | null = null
    for (const [colId, items] of groupedData.entries()) {
      if (items.some(item => item.id === activeIdStr)) {
        sourceColumnId = colId
        break
      }
    }

    // Find target column
    let targetColumnId: string | null = null
    // Check if over matches a column ID (empty column drop)
    if (columns.some(col => col.id === overIdStr)) {
      targetColumnId = overIdStr
    } else {
      // Find which column the over item belongs to
      for (const [colId, items] of groupedData.entries()) {
        if (items.some(item => item.id === overIdStr)) {
          targetColumnId = colId
          break
        }
      }
    }

    if (sourceColumnId && targetColumnId) {
      const newGrouped = new Map(groupedData)

      if (sourceColumnId === targetColumnId) {
        // Same column reorder
        const columnItems = groupedData.get(sourceColumnId) || []
        const oldIndex = columnItems.findIndex(item => item.id === activeIdStr)
        const newIndex = columnItems.findIndex(item => item.id === overIdStr)

        if (oldIndex !== newIndex) {
          newGrouped.set(sourceColumnId, arrayMove(columnItems, oldIndex, newIndex))
        }
      } else {
        // Cross-column move
        const sourceItems = [...(groupedData.get(sourceColumnId) || [])]
        const targetItems = [...(groupedData.get(targetColumnId) || [])]
        const activeIndex = sourceItems.findIndex(item => item.id === activeIdStr)
        const overIndex = targetItems.findIndex(item => item.id === overIdStr)

        if (activeIndex !== -1) {
          const [movedItem] = sourceItems.splice(activeIndex, 1)
          const insertIndex = overIndex !== -1 ? overIndex : targetItems.length
          targetItems.splice(insertIndex, 0, movedItem)
          newGrouped.set(sourceColumnId, sourceItems)
          newGrouped.set(targetColumnId, targetItems)
        }
      }
    }

    onDragEnd?.({ active: activeIdStr, over: overIdStr, overColumn: targetColumnId || undefined })

    setActiveId(null)
    setActiveItem(undefined)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveItem(undefined)
  }

  if (!enabled) {
    return null
  }

  return (
    <div className={cn("flex-1 flex flex-col min-h-0 bg-background", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-x-auto crm-scrollbar"
        >
          <div className="flex flex-1 min-h-0 p-4 gap-4 pb-8">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                columnItems={groupedData.get(column.id) || []}
                onItemClick={onItemClick}
                renderCard={renderCard}
                renderFooter={renderFooter}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="bg-card border-2 border-primary rounded-lg p-4 shadow-lg opacity-90">
              {renderCard(activeItem)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
