"use client"

import * as React from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EditableField } from "@/components/crm/EditableField"
import { TASK_FIELD_CONFIG } from "@/lib/field-configs/tasks"
import { tasksService } from "@/services/tasks"
import { authService } from "@/services/auth"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { sanitizeRichText } from "@/components/ui/tiptap-editor"
import dynamic from "next/dynamic"
import { TiptapEditorSkeleton } from "@/components/ui/TiptapEditorSkeleton"
import type { Task } from "@/lib/types/crm"
import type { FieldOption } from "@/components/crm/EditableField"

const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then((m) => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <TiptapEditorSkeleton className="min-h-[100px]" /> }
)

interface TaskEditSidebarProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function TaskEditSidebar({ task, open, onOpenChange, onSaved }: TaskEditSidebarProps) {
  const { workspaceId } = useAuth()
  const [ownerOptions, setOwnerOptions] = React.useState<FieldOption[]>([])
  const [saving, setSaving] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && workspaceId) {
      authService.listProfiles(workspaceId).then(({ data }) => {
        if (data) {
          setOwnerOptions([
            { label: "Unassigned", value: "" },
            ...data.map((p) => ({
              label: (p.name ?? `${p.first_name} ${p.last_name}`.trim()).trim(),
              value: p.clerk_user_id || p.id,
            })),
          ])
        }
      }).catch(() => {})
    }
  }, [open, workspaceId])

  const handleSave = React.useCallback(
    async (fieldKey: string, newValue: string | number | null) => {
      if (!task) return
      setSaving(fieldKey)
      try {
        const val = newValue === "" ? null : newValue
        const updates: Record<string, unknown> = {}
        if (fieldKey === "completed") {
          updates.status = val === 1 || val === "true" ? "completed" : "pending"
        } else if (fieldKey === "owner_id") {
          updates.assigned_to = val
        } else if (fieldKey === "type") {
          updates.task_subtype = val
        } else {
          updates[fieldKey] = val
        }
        const { error } = await tasksService.update(task.id, updates as any)
        if (error) throw error
        toast.success("Field updated")
        onSaved?.()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update")
        throw err
      } finally {
        setSaving(null)
      }
    },
    [task, onSaved]
  )

  const handleNoteSave = React.useCallback(
    async (html: string) => {
      if (!task) return
      const { error } = await tasksService.update(task.id, { description: html } as any)
      if (error) throw error
      toast.success("Notes updated")
      onSaved?.()
    },
    [task, onSaved]
  )

  const getFieldOptions = (fieldKey: string): FieldOption[] | undefined => {
    if (fieldKey === "owner_id") return ownerOptions
    const config = TASK_FIELD_CONFIG.find((f) => f.key === fieldKey)
    return config?.options
  }

  const getFieldValue = (fieldKey: string): string | number | null => {
    if (!task) return null
    if (fieldKey === "completed") return task.status === "completed" ? 1 : 0
    if (fieldKey === "owner_id") return task.assigned_to?.id || null
    if (fieldKey === "type") return (task as any).task_subtype || null
    if (fieldKey === "task_priority") return (task as any).task_priority || (task as any).priority || null
    if (fieldKey === "task_queue") return (task as any).task_queue || (task as any).queue || null
    if (fieldKey === "set_repeat") return (task as any).set_repeat ? 1 : 0
    if (fieldKey === "reminder") return (task as any).reminder || "none"
    if (fieldKey === "description") return null
    if (fieldKey === "due_date") return task.due_date ? String(task.due_date).slice(0, 10) : null
    return (task as any)[fieldKey] ?? null
  }

  if (!open) return null

  const fieldsToShow = TASK_FIELD_CONFIG.filter((f) => f.key !== "description" && f.key !== "created_at")

  return (
    <div
      className={cn(
        "h-full border-l border-border bg-background flex flex-col overflow-hidden shrink-0",
        "transition-all duration-300 ease-in-out"
      )}
      style={{ width: open ? 380 : 0 }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Edit task</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {task && (
          <div className="mt-2 text-[13px] text-muted-foreground truncate">{task.title}</div>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {task ? (
          <div className="flex flex-col gap-4">
            {fieldsToShow.map((field) => {
              const value = getFieldValue(field.key)
              const options = getFieldOptions(field.key)
              const fieldType = field.type as any
              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {field.label}
                  </label>
                  {saving === field.key && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </div>
                  )}
                  <EditableField
                    value={value}
                    type={fieldType}
                    options={options}
                    editable={field.editable}
                    layout="stacked"
                    onSave={(v) => handleSave(field.key, v)}
                  />
                </div>
              )
            })}

            {/* Notes / Description (richtext) */}
            <TaskNotesEditor
              key={task.id}
              description={task.description || ""}
              onSave={handleNoteSave}
            />

            {/* Created (readonly) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold">
                Created
              </label>
              <div className="text-[13px] text-foreground font-medium">
                {task.created_at ? new Date(task.created_at).toLocaleDateString() : "--"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No task selected
          </div>
        )}
      </div>
    </div>
  )
}

function TaskNotesEditor({
  description,
  onSave,
}: {
  description: string
  onSave: (html: string) => Promise<void>
}) {
  const [noteContent, setNoteContent] = React.useState(description)
  const [noteExpanded, setNoteExpanded] = React.useState(false)
  const [noteSaving, setNoteSaving] = React.useState(false)

  const handleSave = async () => {
    setNoteSaving(true)
    try {
      await onSave(sanitizeRichText(noteContent))
      setNoteExpanded(false)
    } catch {
      setNoteExpanded(false)
    } finally {
      setNoteSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold">
        Notes
      </label>
      {noteExpanded ? (
        <div className="flex flex-col gap-2">
          <TiptapEditor
            content={noteContent}
            onChange={setNoteContent}
            placeholder="Add notes about this task..."
            toolbarVariant="task"
            minHeight="100px"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-[12px]"
              onClick={handleSave}
              disabled={noteSaving}
            >
              {noteSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[12px]"
              onClick={() => {
                setNoteContent(description)
                setNoteExpanded(false)
              }}
              disabled={noteSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNoteContent(description)
            setNoteExpanded(true)
          }}
          className="text-[13px] text-foreground font-medium text-left w-full hover:bg-muted/50 rounded px-2 -mx-2 py-1 min-h-[30px] transition-colors cursor-text outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="line-clamp-3">{description || "--"}</span>
        </button>
      )}
    </div>
  )
}
