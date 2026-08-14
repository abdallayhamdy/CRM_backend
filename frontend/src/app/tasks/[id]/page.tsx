"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getBadgeClasses } from "@/lib/badge-colors"
import { DatePicker } from "@/components/ui/date-picker"
import { tasksService } from "@/services/tasks"
import { authService } from "@/services/auth"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { sanitizeRichText } from "@/components/ui/tiptap-editor"
import { TiptapEditorSkeleton } from "@/components/ui/TiptapEditorSkeleton"
import { CrmPageLayout, CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { format } from "date-fns"
import type { Task } from "@/lib/types/crm"
import dynamic from "next/dynamic"

const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <TiptapEditorSkeleton /> }
)

const taskFormSchema = z.object({
  title: z.string().min(1, "Task title is required"),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

const SMART_DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "next_week", label: "Next week" },
  { value: "in_3_days", label: "In 3 business days" },
  { value: "next_month", label: "Next month" },
]

function resolveSmartDate(value: string): string {
  const now = new Date()
  switch (value) {
    case "today":
      return now.toISOString().split("T")[0]
    case "tomorrow": {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return d.toISOString().split("T")[0]
    }
    case "next_week": {
      const d = new Date(now)
      d.setDate(d.getDate() + 7)
      return d.toISOString().split("T")[0]
    }
    case "in_3_days": {
      const d = new Date(now)
      let count = 0
      while (count < 3) {
        d.setDate(d.getDate() + 1)
        if (d.getDay() !== 0 && d.getDay() !== 6) count++
      }
      return d.toISOString().split("T")[0]
    }
    case "next_month": {
      const d = new Date(now)
      d.setMonth(d.getMonth() + 1)
      return d.toISOString().split("T")[0]
    }
    default:
      return value
  }
}

const UNASSIGNED = "unassigned"

export default function EditTaskPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  const { workspaceId } = useAuth()
  const { canEditTask, canDeleteTask } = usePermissions()

  const [task, setTask] = React.useState<Task | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notes, setNotes] = React.useState("")
  const [smartDate, setSmartDate] = React.useState("custom")
  const [dueDate, setDueDate] = React.useState("")
  const [assignedTo, setAssignedTo] = React.useState("")
  const [assigneeOptions, setAssigneeOptions] = React.useState<{ label: string; value: string }[]>([])
  const [isDeleting, setIsDeleting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: "" },
  })

  React.useEffect(() => {
    if (!taskId) return
    tasksService.getById(taskId).then(({ data, error }) => {
      if (error || !data) {
        toast.error("Failed to load task")
        router.push("/tasks")
        return
      }
      setTask(data)
      reset({ title: data.title || "" })
      setNotes(data.description || "")
      setAssignedTo(data.assigned_to?.id || "")
      setDueDate(data.due_date ? data.due_date.slice(0, 10) : "")
      setLoading(false)
    })
  }, [taskId, reset, router])

  React.useEffect(() => {
    if (!workspaceId) return
    authService.listProfiles(workspaceId).then(({ data }) => {
      if (data) {
        setAssigneeOptions(
          data.map((p) => ({
            label: (p.name ?? `${p.first_name} ${p.last_name}`.trim()).trim(),
            value: p.id,
          }))
        )
      }
    }).catch(() => {})
  }, [workspaceId])

  const handleSave = async (values: TaskFormValues) => {
    if (!task) return
    try {
      const htmlNotes = sanitizeRichText(notes)
      const hasNotes = htmlNotes !== "<p></p>" && htmlNotes.replace(/<[^>]*>/g, "").trim() !== ""

      const updateData: Record<string, unknown> = {
        title: values.title,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        description: hasNotes ? htmlNotes : null,
      }

      const { error } = await tasksService.update(task.id, updateData as any)
      if (error) throw error

      toast.success("Task updated successfully")
      router.push("/tasks")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update task")
    }
  }

  const handleToggleComplete = async () => {
    if (!task || !canEditTask) return
    try {
      const nextStatus = task.status === "completed" ? "pending" : "completed"
      const { error } = await tasksService.update(task.id, { status: nextStatus })
      if (error) throw error
      setTask({ ...task, status: nextStatus })
      toast.success(nextStatus === "completed" ? "Task completed" : "Task marked as pending")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update task")
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!window.confirm("Are you sure you want to delete this task?")) return
    setIsDeleting(true)
    try {
      const { error } = await tasksService.delete(task.id)
      if (error) throw error
      toast.success("Task deleted")
      router.push("/tasks")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task")
      setIsDeleting(false)
    }
  }

  const backButton = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 text-[13px] gap-1.5"
      onClick={() => router.push("/tasks")}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tasks
    </Button>
  )

  const statusLabel = task?.status === "completed"
    ? "Completed"
    : task?.status === "in_progress"
      ? "In Progress"
      : "Pending"

  if (loading) {
    return (
      <CrmPageLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CrmPageLayout>
    )
  }

  if (!task) return null

  if (!canEditTask) {
    return (
      <CrmPageLayout>
        <CrmPageHeader
          title="Task details"
          icon={<CheckCircle2 className="h-5 w-5" />}
          actions={backButton}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="space-y-3">
              <Badge className={cn("capitalize", getBadgeClasses("task_status", task.status || "pending"))}>
                {statusLabel}
              </Badge>
              <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-foreground">Assigned to</Label>
                <div className="text-sm text-muted-foreground">{task.assigned_to?.name || "Unassigned"}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-foreground">Due date</Label>
                <div className="text-sm text-muted-foreground">
                  {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Notes</Label>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border min-h-[80px] whitespace-pre-wrap">
                {task.description || "No notes provided."}
              </div>
            </div>

            <div className="pt-4 border-t border-border text-[12px] text-muted-foreground">
              <span className="font-medium">Created:</span>{" "}
              <span>{task.created_at ? format(new Date(task.created_at), "MMM d, yyyy") : "--"}</span>
            </div>
          </div>
        </div>
      </CrmPageLayout>
    )
  }

  return (
    <CrmPageLayout>
      <CrmPageHeader
        title="Edit task"
        icon={<CheckCircle2 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {backButton}
            {canDeleteTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[13px] gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            {/* Task Title */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Task Title *</Label>
              <Input
                {...register("title")}
                placeholder="Enter task title"
                className={cn(
                  "h-10",
                  errors.title && "border-[var(--color-hs-red)]"
                )}
              />
              {errors.title && (
                <p className="text-[12px] text-[var(--color-hs-red)] font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Completed Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <Checkbox
                checked={task.status === "completed"}
                onCheckedChange={handleToggleComplete}
                className="h-5 w-5"
              />
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-foreground">
                  {task.status === "completed" ? "Completed" : "Mark as completed"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {task.status === "completed" ? "This task is marked as done" : "Toggle to mark this task as done"}
                </span>
              </div>
            </div>

            {/* Assigned to */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Assigned to</Label>
              <Select
                value={assignedTo || UNASSIGNED}
                onValueChange={(v) => setAssignedTo(v === UNASSIGNED ? "" : v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {assigneeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Due date</Label>
              <DatePicker
                value={dueDate}
                onChange={(v) => {
                  setSmartDate("custom")
                  setDueDate(v)
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {SMART_DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSmartDate(opt.value)
                      setDueDate(resolveSmartDate(opt.value))
                    }}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors",
                      smartDate === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Notes</Label>
              <TiptapEditor
                content={notes}
                onChange={setNotes}
                placeholder="Add notes about this task..."
                toolbarVariant="task"
                minHeight="120px"
              />
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="font-medium">Created:</span>
                <span>{task.created_at ? format(new Date(task.created_at), "MMM d, yyyy") : "--"}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t border-border flex items-center gap-2">
              <Button
                type="submit"
                className="h-9 text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 text-[13px] font-semibold border-border text-foreground hover:bg-muted/50"
                onClick={() => router.push("/tasks")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </CrmPageLayout>
  )
}
