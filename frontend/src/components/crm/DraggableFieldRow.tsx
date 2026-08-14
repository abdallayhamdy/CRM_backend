"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Star, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FormFieldInput } from "./FormFieldInput"
import { TypeBadge } from "./TypeBadge"

interface DraggableFieldRowProps {
  prop: { id: string; label: string; required?: boolean; type?: string }
  index: number
  toggleRequired: (id: string) => void
  toggleProperty: (id: string) => void
}

export function DraggableFieldRow({ prop, index, toggleRequired, toggleProperty }: DraggableFieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-all duration-200",
        isDragging && "z-50 opacity-50"
      )}
    >
      <div className="space-y-2.5 transition-all duration-200">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute -left-8 top-10 p-1.5 hover:bg-muted rounded-sm cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">
              {prop.label}
              {prop.required && <span className="text-primary ml-1">*</span>}
            </label>
            <TypeBadge type={prop.type} />
          </div>
        </div>
        <div className="space-y-1.5">
          <FormFieldInput type={prop.type} />
        </div>
      </div>

      {/* Field Actions Overlay */}
      <div className="absolute right-0 -top-5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center bg-background border border-border rounded-xs shadow-[var(--shadow-drag)] overflow-hidden z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleRequired(prop.id)}
          title={prop.required ? "Required" : "Mark as required"}
          className={prop.required ? "text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-accent"}
        >
          {prop.required ? <Star className="h-3 w-3 fill-current" /> : <Star className="h-3 w-3" />}
        </Button>
        <div className="w-[1px] h-4 bg-border" />
        <Button
          variant="ghost"
          size="icon"
          title="Field logic"
          className="text-muted-foreground/60 hover:text-foreground hover:bg-accent"
        >
          <GitBranch className="h-3 w-3" />
        </Button>
        {!prop.required && (
          <>
            <div className="w-[1px] h-4 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              title="Remove from form"
              onClick={() => toggleProperty(prop.id)}
              className="text-muted-foreground/60 hover:text-primary hover:bg-accent"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
