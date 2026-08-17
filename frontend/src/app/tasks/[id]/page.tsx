"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle2, ChevronDown, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBadgeClasses } from "@/lib/badge-colors"
import { tasksService } from "@/services/tasks"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { Task } from "@/lib/types/crm"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { EditRecordSheet, type EditFieldConfig } from "@/components/properties/EditRecordSheet"
import { DeleteConfirmDialog } from "@/components/crm/detail/DeleteConfirmDialog"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  const { workspaceId } = useAuth()
  const { canEditTask, canDeleteTask } = usePermissions()

  const [task, setTask] = React.useState<Task | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [aboutEditOpen, setAboutEditOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const taskAboutFields: EditFieldConfig[] = [
    { name: "title", label: "Title", type: "text" },
    { name: "status", label: "Status", type: "text" },
    { name: "type", label: "Type", type: "text" },
    { name: "task_priority", label: "Priority", type: "text" },
    { name: "due_date", label: "Due Date", type: "date" },
  ]

  React.useEffect(() => {
    if (!taskId) return
    tasksService.getById(taskId).then(({ data, error }) => {
      if (error || !data) {
        toast.error("Failed to load task")
        router.push("/tasks")
        return
      }
      setTask(data)
      setLoading(false)
    })
  }, [taskId, router])

  const handleUpdateTask = React.useCallback(async (data: Partial<Task>) => {
    if (!task) return
    try {
      const { error } = await tasksService.update(task.id, data as any)
      if (error) throw error
      setTask(prev => prev ? { ...prev, ...data } : null)
      toast.success("Task updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update task")
    }
  }, [task])

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
    try {
      const { error } = await tasksService.delete(task.id)
      if (error) throw error
      toast.success("Task deleted")
      router.push("/tasks")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task")
    }
  }

  if (loading) {
    return (
      <CrmDetailLayout backLine="Tasks" backHref="/tasks">
        <CrmDetailLeftPanel><div /></CrmDetailLeftPanel>
        <CrmDetailCenterPanel><div /></CrmDetailCenterPanel>
        <CrmDetailRightPanel><div /></CrmDetailRightPanel>
      </CrmDetailLayout>
    )
  }

  if (!task) return null

  const statusLabel = task.status === "completed" ? "Completed" : task.status === "in_progress" ? "In Progress" : "Pending"
  const badgeClasses = getBadgeClasses("task_status", task.status || "pending")

  const relatedEntityType = task.taskable_type
  const relatedEntityId = task.taskable_id
  const relatedEntityName = relatedEntityType === "contact"
    ? task.contact ? `${task.contact.first_name} ${task.contact.last_name}`.trim() : null
    : relatedEntityType === "company"
      ? task.company?.name ?? null
      : relatedEntityType === "deal"
        ? task.deal?.name ?? null
        : null
  const relatedEntityRoute = relatedEntityType && relatedEntityId
    ? `/${relatedEntityType}s/${relatedEntityId}`
    : null

  return (
    <CrmDetailLayout backLine="Tasks" backHref="/tasks">
      <CrmDetailLeftPanel>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={cn("capitalize text-[11px]", badgeClasses)}>
              {statusLabel}
            </Badge>
          </div>

          <h1 className="text-lg font-bold text-foreground mb-4">{task.title}</h1>

          <div className="flex items-center gap-2 mb-6">
            {canEditTask && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[13px] gap-1.5"
                onClick={handleToggleComplete}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {task.status === "completed" ? "Reopen" : "Complete"}
              </Button>
            )}
            {canDeleteTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[13px] gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>

          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[16px] text-foreground">About this task</h3>
              </div>
              {canEditTask && (
                <button
                  onClick={() => setAboutEditOpen(true)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-[color:var(--color-slate-50)] text-muted-foreground"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Title</label>
                <div className="text-[14px] text-foreground">{task.title || "--"}</div>
              </div>
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Status</label>
                <div className="text-[14px] text-foreground capitalize">{statusLabel}</div>
              </div>
              {task.type && (
                <div className="group relative">
                  <label className="text-[13px] text-muted-foreground block mb-1">Type</label>
                  <div className="text-[14px] text-foreground">{task.type}</div>
                </div>
              )}
              {task.task_priority && (
                <div className="group relative">
                  <label className="text-[13px] text-muted-foreground block mb-1">Priority</label>
                  <div className="text-[14px] text-foreground capitalize">{task.task_priority}</div>
                </div>
              )}
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Assigned To</label>
                <div className="text-[14px] text-foreground">{task.assigned_to?.name || "Unassigned"}</div>
              </div>
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Due Date</label>
                <div className="text-[14px] text-foreground">
                  {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}
                </div>
              </div>
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Created</label>
                <div className="text-[14px] text-foreground">
                  {task.created_at ? format(new Date(task.created_at), "MMM d, yyyy") : "--"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CrmDetailLeftPanel>

      <CrmDetailCenterPanel>
        {task.description && (
          <div className="p-5">
            <div className="bg-background border border-border rounded-md shadow-sm">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-[16px] text-foreground">Description</h3>
              </div>
              <div className="p-5">
                <div
                  className="text-[14px] text-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              </div>
            </div>
          </div>
        )}
        {!task.description && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No description
          </div>
        )}
      </CrmDetailCenterPanel>

      <CrmDetailRightPanel>
        {relatedEntityType && relatedEntityName && relatedEntityRoute && (
          <div className="p-5">
            <div className="bg-background border border-border rounded-md shadow-sm">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-[16px] text-foreground capitalize">{relatedEntityType}</h3>
              </div>
              <div className="p-4">
                <a
                  href={relatedEntityRoute}
                  className="text-[14px] text-primary hover:underline font-medium"
                >
                  {relatedEntityName}
                </a>
              </div>
            </div>
          </div>
        )}
      </CrmDetailRightPanel>

      <EditRecordSheet
        open={aboutEditOpen}
        onOpenChange={setAboutEditOpen}
        objectType="contact"
        title="Task"
        fields={taskAboutFields}
        initialValues={task || {}}
        onSave={handleUpdateTask}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="task"
        entityDisplayName={task.title}
        onConfirm={handleDelete}
      />
    </CrmDetailLayout>
  )
}
