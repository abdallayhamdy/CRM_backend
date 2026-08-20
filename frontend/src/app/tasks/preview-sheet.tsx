"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useContentReady } from "@/hooks/use-content-ready"
import { PreviewSheetSkeleton } from "@/components/crm/Skeletons"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, VisuallyHidden } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Task } from "@/lib/types/crm"
import { tasksService } from "@/services/tasks"
import { toast } from "sonner"
import { 
  Loader2, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  User, 
  Type, 
  Layers,
  ExternalLink
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/hooks/use-auth"

interface TaskPreviewSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TaskPreviewSheet({
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskPreviewSheetProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const isContentReady = useContentReady(open, !!task)
  const { canEditTask, canDeleteTask } = usePermissions()
  const { workspaceId } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    task_priority: "",
    due_date: "",
  })

  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        task_priority: "Medium",
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
      })
      setEditMode(false)
    }
  }, [task])

  if (!task) return null

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return

    setIsDeleting(true)
    try {
      const { error } = await tasksService.delete(task.id)
      if (error) throw error
      toast.success("Task deleted successfully")
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const { error } = await tasksService.update(task.id, {
        title: formData.title,
        description: formData.description || undefined,
        due_date: formData.due_date || undefined,
      })
      if (error) throw error
      toast.success("Task updated successfully")
      setEditMode(false)
      onSuccess()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update task")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleComplete = async () => {
    if (!canEditTask) {
      toast.error("You don't have permission to edit tasks")
      return
    }
    setIsCompleting(true)
    try {
      const { error } = await tasksService.update(task.id, {
        status: task.status === 'completed' ? 'pending' : 'completed'
      })
      if (error) throw error
      toast.success(task.status === 'completed' ? "Task marked as pending" : "Task completed")
      onSuccess()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] p-0 border-l border-border">
        {!isContentReady ? (
          <PreviewSheetSkeleton />
        ) : (
          <>
            <SheetHeader className="p-6 border-b border-border bg-muted/50">
              <VisuallyHidden>
                <SheetTitle>Task Preview</SheetTitle>
                <SheetDescription>
                  Task details and management.
                </SheetDescription>
              </VisuallyHidden>
              <div className="flex items-center justify-between mb-2">
            <div className={cn(task.status === "completed" ? "bg-status-success text-[var(--color-hs-card-bg)]" : "bg-muted text-foreground", "inline-flex items-center justify-center text-[11px] font-bold rounded-full py-0.5 px-2.5")}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {task.status === "completed" ? "Completed" : "In Progress"}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted/50"
                onClick={() => router.push(`/tasks/${task.id}`)}
                title="Open full details"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {canDeleteTask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <div className="text-xl font-bold text-foreground">
            {editMode ? (
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-xl font-bold bg-background"
              />
            ) : (
              task.title
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Main Info */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Due Date
                </Label>
                {editMode ? (
                  <DatePicker
                    value={formData.due_date}
                    onChange={(v) => setFormData({ ...formData, due_date: v })}
                  />
                ) : (
                  <div className="text-sm font-medium text-foreground">
                    {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Assigned To
                </Label>
                <div className="text-sm font-medium text-foreground">
                  {task.assigned_to ? task.assigned_to.name : "Unassigned"}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Type className="h-3 w-3" /> Task Type
                </Label>
                <div className="text-sm font-medium text-foreground">
                  {task.task_subtype?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "To Do"}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3 w-3" /> Priority
                </Label>
                {editMode ? (
                  <select
                    value={formData.task_priority}
                    onChange={(e) => setFormData({ ...formData, task_priority: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                ) : (
                  <Badge variant="outline" className="font-bold">
                    {task.task_priority || "Medium"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              {editMode ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border min-h-[80px]">
                  {task.description || "No description provided."}
                </div>
              )}
            </div>

            {/* Associations */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wider">Associations</h3>
              
              <div className="space-y-3">
                {task.contact && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-status-info-light text-status-info flex items-center justify-center text-[11px] font-bold">
                        {task.contact.first_name?.[0]}{task.contact.last_name?.[0]}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-foreground">
                          {task.contact.first_name} {task.contact.last_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Contact</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {task.company && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted text-foreground flex items-center justify-center text-[11px] font-bold">
                        {task.company.name?.[0]}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-foreground">
                          {(task.company as any).name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Company</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {task.deal && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-status-success-light text-status-success flex items-center justify-center">
                        $
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-foreground">
                          {(task.deal as any).name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Deal</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-background flex items-center justify-between">
          {canEditTask && (
            <Button
              variant="outline"
              className="font-bold text-foreground h-10 px-4"
              onClick={handleToggleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className={`h-4 w-4 mr-2 ${task.status === "completed" ? 'text-status-success' : 'text-muted-foreground/70'}`} />
              )}
              {task.status === "completed" ? "Mark Pending" : "Complete Task"}
            </Button>
          )}

          <div className="flex items-center gap-2">
            {canEditTask && (
              editMode ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="font-bold text-muted-foreground"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-status-danger hover:bg-status-danger/90 text-[var(--color-hs-card-bg)] font-bold h-10 px-6"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-10 px-6"
                  onClick={() => setEditMode(true)}
                >
                  Edit Task
                </Button>
              )
            )}
          </div>
        </div>
          </>
        )}

      </SheetContent>
    </Sheet>
  )
}
