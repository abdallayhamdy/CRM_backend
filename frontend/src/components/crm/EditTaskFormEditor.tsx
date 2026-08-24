"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useFormLayout } from "@/hooks/use-form-layout"
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { TASK_DEFAULT_FIELDS, TASK_PROPERTY_GROUPS } from "./edit-task-form-editor-constants"
import { DraggableFieldRow } from "./DraggableFieldRow"
import { EditorHeader } from "./EditorHeader"
import { PropertySelectionSidebar } from "./PropertySelectionSidebar"
import type { Property } from "./edit-contact-form-editor-constants"

interface PropertyGroup {
  id: string
  label: string
  properties: Property[]
}

interface EditTaskFormEditorProps {
  onClose: () => void
}

export function EditTaskFormEditor({ onClose }: EditTaskFormEditorProps) {
  const { formFields, loading, saving, hasChanges, save, reset: resetLayout, updateFormField } = useFormLayout('task', TASK_DEFAULT_FIELDS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(["TASK DETAILS", "ASSIGNMENT & QUEUE"])
  const [showResetConfirm, setShowResetConfirm] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleReorder = (newFields: typeof formFields) => {
    updateFormField(() => newFields)
  }

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const groups = React.useMemo<PropertyGroup[]>(() => {
    return TASK_PROPERTY_GROUPS.map(group => ({
      id: group.title,
      label: group.title.charAt(0) + group.title.slice(1).toLowerCase().replace(/_/g, ' '),
      properties: group.items.map(item => ({
        id: item.id,
        label: item.label,
        type: item.type,
        selected: formFields.some(f => f.id === item.id),
        required: formFields.find(f => f.id === item.id)?.required || false
      }))
    }))
  }, [formFields])

  const handleSave = async (shouldClose = false) => {
    const success = await save()
    if (success) {
      toast.success("Task form layout saved")
      if (shouldClose) onClose()
    } else {
      toast.error("Failed to save form layout")
    }
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const executeReset = async () => {
    await resetLayout()
    toast.success("Form reset to default")
    setShowResetConfirm(false)
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const toggleProperty = (propertyId: string) => {
    updateFormField(prev => {
      const field = prev.find(f => f.id === propertyId)
      if (field) {
        if (field.required) {
          toast.error("Required fields cannot be removed")
          return prev
        }
        return prev.filter(f => f.id !== propertyId)
      } else {
        const allItems = TASK_PROPERTY_GROUPS.flatMap(g => g.items) as Array<{ id: string; label: string; type: string }>
        const prop = allItems.find(p => p.id === propertyId)
        if (prop) {
          return [...prev, { id: prop.id, label: prop.label, selected: true, type: prop.type }]
        }
        return prev
      }
    })
  }

  const toggleRequired = (propertyId: string) => {
    updateFormField(prev => {
      const coreRequired = ["title"]
      if (coreRequired.includes(propertyId)) {
        const field = prev.find(f => f.id === propertyId)
        if (field?.required) {
          toast.error(`${field.label} must be required`)
          return prev
        }
      }

      return prev.map(f => {
        if (f.id !== propertyId) return f
        return { ...f, required: !f.required }
      })
    })
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col font-sans">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <>
      <EditorHeader onClose={onClose} onSave={handleSave} onReset={handleReset} saving={saving} hasChanges={hasChanges} title="Edit Task form" />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Property Selection */}
        <PropertySelectionSidebar
          groups={groups}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          onToggleProperty={toggleProperty}
          docsNote="Task Title"
          docsNoteSuffix="must be required."
          entityLabel="task"
        />

        {/* Right Canvas - Form Preview */}
        <div className="flex-1 flex flex-col bg-muted/30 overflow-y-auto crm-scrollbar relative">
          <div className="w-full max-w-[720px] mx-auto py-10 px-8">
            <div className="bg-background border border-border rounded-lg shadow-sm flex flex-col">
              {/* Form Header */}
              <div className="px-8 py-7 border-b border-border">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Create task</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Configure the fields your team will use to add a new task record. Changes are saved automatically.
                </p>
              </div>

              {/* Draggable Properties */}
              <div className="p-8 space-y-6">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event
                  if (!over || active.id === over.id) return
                  const oldIndex = formFields.findIndex(f => f.id === active.id)
                  const newIndex = formFields.findIndex(f => f.id === over.id)
                  if (oldIndex === -1 || newIndex === -1) return
                  handleReorder(arrayMove(formFields, oldIndex, newIndex))
                }}>
                  <SortableContext items={formFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {formFields.map((prop, index) => (
                      <DraggableFieldRow
                        key={prop.id}
                        prop={prop}
                        index={index}
                        toggleRequired={toggleRequired}
                        toggleProperty={toggleProperty}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={(open) => setShowResetConfirm(open)}
        onConfirm={executeReset}
        title="Reset form configuration?"
        description="Are you sure you want to reset the form to default properties? All custom selections and order will be lost."
        confirmText="Reset form"
      />
      </>
      )}
    </div>
  )
}
