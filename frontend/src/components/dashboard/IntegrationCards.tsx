"use client"

import * as React from "react"
import { Calendar, CheckSquare, Plus, Trash2, Loader2 } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { tasksService } from "@/services/tasks"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { Task } from "@/lib/types/crm"

export function IntegrationCards() {
  const { workspaceId, user } = useAuth()
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [newTaskDue, setNewTaskDue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const fetchTasks = React.useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await tasksService.getAll({
        workspace_id: workspaceId,
        limit: 50,
      })
      if (fetchError) throw new Error(fetchError.message)
      setTasks(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  React.useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const openTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      const { error: updateError } = await tasksService.update(task.id, { status: newStatus })
      if (updateError) throw new Error(updateError.message)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t))
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task reopened')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      const { error: deleteError } = await tasksService.delete(taskId)
      if (deleteError) throw new Error(deleteError.message)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      toast.success('Task deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  const handleCreate = async () => {
    if (!newTaskTitle.trim()) return
    if (!workspaceId) return
    setIsCreating(true)
    try {
      const { data, error: createError } = await tasksService.create({
        title: newTaskTitle.trim(),
        due_date: newTaskDue || null,
        assigned_to: user?.id || null,
      })
      if (createError) throw new Error(createError.message)
      if (data) setTasks(prev => [...prev, data])
      toast.success('Task created')
      setNewTaskTitle("")
      setNewTaskDue("")
      setCreateOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsCreating(false)
    }
  }

  const renderTaskList = (items: Task[], emptyTitle: string, emptyDesc?: string) => {
    if (items.length === 0) {
      return (
        <EmptyState title={emptyTitle} description={emptyDesc} />
      )
    }
    return (
      <div className="divide-y divide-border">
        {items.map(task => (
          <div key={task.id} className="flex items-start gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={() => handleToggleComplete(task)}
              className="mt-0.5 data-[state=checked]:bg-primary"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.due_date && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                  </span>
                )}
                {task.created_at && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Tasks Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-[16px] w-[16px] text-muted-foreground" />
            <h2 className="text-[16px] font-bold text-foreground">Tasks</h2>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Add task">
                <Plus className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
                <DialogDescription>Create a new task for yourself or your team.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input
                    id="task-title"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due">Due date (optional)</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !newTaskTitle.trim()}>
                  {isCreating ? 'Creating...' : 'Create Task'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-[13px]">Loading tasks...</span>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="py-8 text-center">
                <p className="text-[13px] text-destructive mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchTasks}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="open">
            <TabsList className="mb-3 h-8 bg-background border border-border p-0.5">
              <TabsTrigger
                value="open"
                className="text-[12px] font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Open ({openTasks.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="text-[12px] font-medium data-[state=inactive]:text-muted-foreground"
              >
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              <Card className="border-border">
                <CardContent className="p-0">
                  {renderTaskList(openTasks, "You have no open tasks")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card className="border-border">
                <CardContent className="p-0">
                  {renderTaskList(completedTasks, "No completed tasks", "Completed tasks will appear here.")}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
}