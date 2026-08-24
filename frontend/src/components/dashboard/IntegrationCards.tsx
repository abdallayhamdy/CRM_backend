"use client"

import * as React from "react"
import Link from "next/link"
import { CheckSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable } from "@/components/shared/DataTable"
import { TaskEditorSheet } from "@/components/activities/TaskEditorSheet"
import { useAuth } from "@/hooks/use-auth"
import { getBadgeClasses } from "@/lib/badge-colors"
import type { ColumnDef, CellContext } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"

type TaskRow = {
  id: string
  title: string
  type: string
  dueDate: string
  priority: string
  status: "open" | "completed"
  contact?: string
}

const MOCK_TASKS: TaskRow[] = [
  { id: "1", title: "Follow up with Bayan Al-Otaibi", type: "Follow Up", dueDate: "2024-07-25", priority: "high", status: "open", contact: "Bayan Al-Otaibi" },
  { id: "2", title: "Send proposal to Marwa Al-Othmani", type: "To Do", dueDate: "2024-07-22", priority: "medium", status: "open", contact: "Marwa Al-Othmani" },
  { id: "3", title: "Schedule demo with Khalid Hassan", type: "Follow Up After Meeting", dueDate: "2024-07-28", priority: "low", status: "open", contact: "Khalid Hassan" },
  { id: "4", title: "Review pricing for Tech Solutions", type: "To Do", dueDate: "2024-07-20", priority: "medium", status: "open", contact: "Tech Solutions" },
  { id: "5", title: "Call with Tech Solutions team", type: "Call", dueDate: "2024-07-19", priority: "high", status: "completed", contact: "Tech Solutions" },
  { id: "6", title: "Review contract for Sarah Ahmed", type: "To Do", dueDate: "2024-07-18", priority: "medium", status: "completed", contact: "Sarah Ahmed" },
]

export function IntegrationCards() {
  const { workspaceId } = useAuth()
  const [taskOpen, setTaskOpen] = React.useState(false)

  const columns: ColumnDef<TaskRow, any>[] = React.useMemo(() => [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <span className="text-foreground text-[13px] font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <span className="text-muted-foreground text-[13px]">{row.original.contact || "—"}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <Badge variant="outline" className="text-[11px] px-1.5 py-0">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }: CellContext<TaskRow, any>) => {
        const isOverdue = new Date(row.original.dueDate) < new Date() && row.original.status === "open"
        return (
          <span className={`text-[13px] ${isOverdue ? "text-status-danger" : "text-muted-foreground"}`}>
            {new Date(row.original.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <Badge variant="outline" className={`text-[11px] px-1.5 py-0 capitalize ${getBadgeClasses('task_priority', row.original.priority, 'bordered')}`}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      id: "action",
      header: "",
      cell: ({ row }: CellContext<TaskRow, any>) => (
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
          <Link href="/tasks">View</Link>
        </Button>
      ),
    },
  ], [])

  const openTasks = MOCK_TASKS.filter(t => t.status === "open")
  const completedTasks = MOCK_TASKS.filter(t => t.status === "completed")

  return (
    <>
      <TaskEditorSheet
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onSaved={() => setTaskOpen(false)}
        entityType="company"
        entityId=""
        workspaceId={workspaceId}
      />

      <Card className="border border-border shadow-sm flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-[16px] font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-[16px] w-[16px] text-muted-foreground" />
            Tasks
            <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-muted-foreground border-border">
              {MOCK_TASKS.length}
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
