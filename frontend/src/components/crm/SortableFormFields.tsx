"use client"

import * as React from "react"
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

interface SortableFormFieldsProps<T extends { id: string }> {
  fields: T[]
  onReorder: (newFields: T[]) => void
  children: (field: T, index: number, dragHandle: React.ReactNode) => React.ReactNode
}

function SortableField({ id, children }: { id: string; children: (dragHandle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const dragHandle = (
    <div
      {...attributes}
      {...listeners}
      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 p-1 hover:bg-muted rounded-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/60" />
    </div>
  )

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? 'z-50 opacity-50' : ''}`}>
      {children(dragHandle)}
    </div>
  )
}

export function SortableFormFields<T extends { id: string }>({ fields, onReorder, children }: SortableFormFieldsProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex(f => f.id === active.id)
    const newIndex = fields.findIndex(f => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(fields, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        {fields.map((field, index) => (
          <SortableField key={field.id} id={field.id}>
            {(dragHandle) => children(field, index, dragHandle)}
          </SortableField>
        ))}
      </SortableContext>
    </DndContext>
  )
}
