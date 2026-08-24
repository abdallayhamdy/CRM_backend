"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable } from "@/components/shared/DataTable"
import { TaskEditorSheet } from "@/components/activities/TaskEditorSheet"
import { useAuth } from "@/hooks/use-auth"
import { tasksService } from "@/services/tasks"
import { getBadgeClasses } from "@/lib/badge-colors"
import { toast } from "sonner"
import type { Task } from "@/lib/types/crm"
import type { ColumnDef, CellContext } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

type TaskRow = Pick<Task, "id" | "title" | "task_subtype" | "due_date" | "task_priority" | "status">

const SUBTYPE_LABELS: Record<string, string> = {
  to_do: "To Do",
  call: "Call",
  email: "Email",
  follow_up: "Follow Up",
  follow_up_after_meeting: "Follow Up After Meeting",
}

export function TasksCardSkeleton() {
  return (
    <Card className="border border-border shadow-sm flex flex-col h-full">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-64 w-full rounded-lg border border-border" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TasksCard() {
  const { workspaceId } = useAuth()
  const pathname = usePathname()
  const [taskOpen, setTaskOpen] = React.useState(false)
  const [tasks, setTasks] = React.useState<TaskRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const refreshKeyRef = React.useRef(0)
  const [, setRefreshTick] = React.useState(0)

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshKeyRef.current += 1
        setRefreshTick((k) => k + 1)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  const fetchTasks = React.useCallback(() => {
    if (!workspaceId) return
    const controller = new AbortController()
    tasksService.getAll({ workspace_id: workspaceId, limit: 1000 }).then(({ data }) => {
      if (!controller.signal.aborted && data) {
        setTasks(data.map(t => ({
          id: t.id,
          title: t.title,
          task_subtype: t.task_subtype,
          due_date: t.due_date,
          task_priority: t.task_priority,
          status: t.status as "pending" | "completed" | "in_progress",
        })))
      }
    }).catch(() => {
      if (!controller.signal.aborted) toast.error("Failed to load tasks")
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [workspaceId])

  React.useEffect(() => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    const cleanup = fetchTasks()
    return () => { cleanup?.() }
  }, [workspaceId, pathname, refreshKeyRef.current, fetchTasks])

  const columns: ColumnDef<TaskRow, any>[] = React.useMemo(() => [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <span className="text-foreground text-[13px] font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "task_subtype",
      header: "Type",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <Badge variant="outline" className="text-[11px] px-1.5 py-0">{SUBTYPE_LABELS[row.original.task_subtype || ""] || "To Do"}</Badge>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }: CellContext<TaskRow, any>) => {
        const due = row.original.due_date
        if (!due) return <span className="text-muted-foreground text-[13px]">--</span>
        const isOverdue = new Date(due) < new Date() && row.original.status === "pending"
        return (
          <span className={`text-[13px] ${isOverdue ? "text-status-danger" : "text-muted-foreground"}`}>
            {new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )
      },
    },
    {
      accessorKey: "task_priority",
      header: "Priority",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <Badge variant="outline" className={`text-[11px] px-1.5 py-0 capitalize ${getBadgeClasses('task_priority', row.original.task_priority || 'medium', 'bordered')}`}>
          {row.original.task_priority || "medium"}
        </Badge>
      ),
    },
    {
      id: "action",
      header: "",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
          <Link href={`/tasks/${row.original.id}`}>View</Link>
        </Button>
      ),
    },
  ], [])

  if (loading) {
    return <TasksCardSkeleton />
  }

  const openTasks = tasks.filter(t => t.status !== "completed")
  const completedTasks = tasks.filter(t => t.status === "completed")

  return (
    <>
      <TaskEditorSheet
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onSaved={() => {
          setTaskOpen(false)
          refreshKeyRef.current += 1
          setRefreshTick((k) => k + 1)
        }}
        workspaceId={workspaceId}
      />

      <Card className="border border-border shadow-sm flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-[16px] font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-[16px] w-[16px] text-muted-foreground" />
            Tasks
            <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-muted-foreground border-border">
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Tabs defaultValue="open" className="flex flex-col min-h-0">
            <TabsList className="mb-3 h-auto min-h-8 bg-transparent p-0 flex-wrap gap-1">
              <TabsTrigger
                value="open"
                className="group text-[12px] font-bold rounded-full px-3 h-7 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-sm transition-colors"
              >
                Open <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 text-muted-foreground border-border group-data-[state=active]:!text-primary-foreground group-data-[state=active]:!border-primary-foreground/30">{openTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="group text-[12px] font-medium rounded-full px-3 h-7 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-sm transition-colors"
              >
                Completed <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 text-muted-foreground border-border group-data-[state=active]:!text-primary-foreground group-data-[state=active]:!border-primary-foreground/30">{completedTasks.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="flex-1 min-h-0 overflow-y-auto max-h-[350px]">
              <DataTable
                columns={columns}
                data={openTasks}
                pagination={false}
                emptyTitle="No open tasks"
                emptyDescription="All tasks are completed."
              />
            </TabsContent>

            <TabsContent value="completed" className="flex-1 min-h-0 overflow-y-auto max-h-[350px]">
              <DataTable
                columns={columns}
                data={completedTasks}
                pagination={false}
                emptyTitle="No completed tasks"
                emptyDescription="Completed tasks will appear here."
              />
            </TabsContent>
          </Tabs>

          <div className="mt-3">
            <button
              onClick={() => setTaskOpen(true)}
              className="flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary border border-border px-3 py-1.5 rounded transition-colors"
            >
              + New Task
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
