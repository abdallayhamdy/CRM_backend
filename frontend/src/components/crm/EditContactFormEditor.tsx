"use client"

import * as React from "react"
import {
  Settings2,
  GitBranch,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PROPERTY_GROUPS_CONFIG } from "@/lib/crm-properties"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useFormLayout } from "@/hooks/use-form-layout"
import { Loader2 } from "lucide-react"
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Property, DEFAULT_FIELDS } from "./edit-contact-form-editor-constants"
import { DraggableFieldRow } from "./DraggableFieldRow"
import { EditorHeader } from "./EditorHeader"
import { PropertySelectionSidebar } from "./PropertySelectionSidebar"

interface PropertyGroup {
  id: string
  label: string
  properties: Property[]
}

interface EditContactFormEditorProps {
  onClose: () => void
}

export function EditContactFormEditor({ onClose }: EditContactFormEditorProps) {
  const { formFields, loading, saving, hasChanges, save, reset: resetLayout, updateFormField } = useFormLayout('contact', DEFAULT_FIELDS)
  const [groups, setGroups] = React.useState<PropertyGroup[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(["CONTACT INFORMATION", "SALES PROPERTIES"])
  const [showResetConfirm, setShowResetConfirm] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleReorder = (newFields: typeof formFields) => {
    updateFormField(() => newFields)
  }

  // Warn before leaving with unsaved changes
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

  // Initialize groups from PROPERTY_GROUPS_CONFIG
  React.useEffect(() => {
    const mappedGroups = PROPERTY_GROUPS_CONFIG.map(group => ({
      id: group.title,
      label: group.title.charAt(0) + group.title.slice(1).toLowerCase().replace(/_/g, ' '),
      properties: group.items.map(item => ({
        id: item.id,
        label: item.label,
        type: item.type,
        selected: formFields.some(f => f.id === item.id)
      }))
    }))
    setGroups(mappedGroups)
  }, [])

  // Keep groups in sync with formFields for the left sidebar UI
  React.useEffect(() => {
    setGroups(prev => prev.map(group => ({
      ...group,
      properties: group.properties.map(prop => ({
        ...prop,
        selected: formFields.some(f => f.id === prop.id),
        // Keep the required status from formFields if it exists there
        required: formFields.find(f => f.id === prop.id)?.required || prop.required
      }))
    })))
  }, [formFields])

  const handleSave = async (shouldClose = false) => {
    const success = await save()
    if (success) {
      toast.success("Contact form layout saved")
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
        // Don't allow removing required fields from the sidebar
        if (field.required) {
          toast.error("Required fields cannot be removed")
          return prev
        }
        return prev.filter(f => f.id !== propertyId)
      } else {
        // Find property in master list
        const prop = PROPERTY_GROUPS_CONFIG.flatMap(g => g.items).find(p => p.id === propertyId)
        if (prop) {
          return [...prev, { id: prop.id, label: prop.label, selected: true, type: prop.type }]
        }
        return prev
      }
    })
  }

  const toggleRequired = (propertyId: string) => {
    updateFormField(prev => {
      // Check if it's one of the core required fields that shouldn't be toggled off
      const coreRequired = ["email", "first_name", "last_name"]
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
    <div className="fixed top-0 left-0 w-[125vw] h-[125vh] z-[9999] bg-muted/50 flex flex-col overflow-hidden font-sans" style={{ zoom: 0.8 }}>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <>
      <EditorHeader onClose={onClose} onSave={handleSave} onReset={handleReset} saving={saving} hasChanges={hasChanges} />

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
        />

        {/* Right Canvas - Form Preview */}
        <div className="flex-1 flex flex-col bg-muted/50 overflow-y-auto crm-scrollbar relative">
          <div className="w-full max-w-[640px] mx-auto py-12 px-6">
            <div className="bg-background border border-border rounded-sm shadow-[var(--shadow-card)] flex flex-col min-h-[850px]">
              {/* Form Header */}
              <div className="px-10 py-9 border-b border-border">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Create contact</h2>
                <p className="text-[14px] text-muted-foreground mt-2.5 leading-relaxed">
                  Configure the fields your team will use to add a new contact record. Changes are saved automatically.
                </p>
              </div>

              {/* Draggable Properties */}
              <div className="p-10 space-y-9">
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

        {/* Right Floating Toolbar */}
        <div className="w-[56px] bg-background border-l border-border flex flex-col items-center py-8 gap-6 shadow-[var(--shadow-panel-left)] z-10">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Settings2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <GitBranch className="h-5 w-5" />
          </Button>
          <div className="mt-auto">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-accent transition-colors">
              <ExternalLink className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .crm-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .crm-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted) / 0.5);
        }
        .crm-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 20px;
          border: 2px solid hsl(var(--border));
        }
        .crm-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.1);
        }
      `}</style>

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
