"use client"

import React, { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { tasksService } from "@/services/tasks"
import { DataTable } from "@/components/shared/DataTable"
import type { Task } from "@/lib/types/crm"
import type { ColumnDef, CellContext } from "@tanstack/react-table"

/* ── Helpers ──────────────────────────────────────────────── */

const TASK_TYPE_KEYS = ["to_do", "follow_up", "follow_up_after_meeting", "call"] as const

const SUBTYPE_LABELS: Record<string, string> = {
  to_do: "To Do",
  follow_up: "Follow Up",
  follow_up_after_meeting: "Follow Up After Meeting",
  call: "Call",
}

function subtypeKey(raw?: string | null): string {
  if (!raw) return "other"
  return raw.toLowerCase().replace(/\s+/g, "_")
}

function subtypeLabel(raw?: string | null): string {
  if (!raw) return "Other"
  const key = subtypeKey(raw)
  return SUBTYPE_LABELS[key] || raw
}

/* ── Skeleton ─────────────────────────────────────────────── */

export function OverdueCardSkeleton() {
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

/* ── Component ────────────────────────────────────────────── */

export function OverdueCard() {
  const { workspaceId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      if (!workspaceId) {
        setLoading(false)
        return
      }

      try {
        const { data: tasks } = await tasksService.getAll({
          workspace_id: workspaceId!,
          limit: 1000,
        })

        if (controller.signal.aborted || !tasks) return

        const now = new Date()
        const overdue = tasks.filter(
          (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < now
        )

        setOverdueTasks(overdue)
      } catch {
        // Expected in standalone mode
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [workspaceId])

  /* ── Group by task_subtype ──────────────────────────────── */

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of overdueTasks) {
      const key = subtypeKey(task.task_subtype)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [overdueTasks])

  /* ── Tab config ─────────────────────────────────────────── */

  const tabs = useMemo(() => {
    return TASK_TYPE_KEYS.map((key) => ({
      key,
      label: SUBTYPE_LABELS[key],
      count: groups.get(key)?.length ?? 0,
    }))
  }, [groups])

  /* ── Table columns ──────────────────────────────────────── */

  const columns = useMemo<ColumnDef<Task, any>[]>(() => [
    {
      accessorKey: "contact",
      header: "Lead Name",
      cell: ({ row }: CellContext<Task, any>) => {
        const c = row.original.contact
        if (!c) return <span className="text-muted-foreground">—</span>
        return (
          <Link
            href={`/contacts/${c.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {c.first_name} {c.last_name}
          </Link>
        )
      },
    },
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }: CellContext<Task, any>) => (
        <span className="text-foreground font-medium truncate max-w-[180px] block">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }: CellContext<Task, any>) => {
        const d = row.original.due_date
        if (!d) return "—"
        return (
          <span className="text-destructive font-medium">
            {new Date(d).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        )
      },
    },
    {
      accessorKey: "taskType",
      header: "Task Type",
      cell: ({ row }: CellContext<Task, any>) => (
        <span className="text-muted-foreground text-[13px]">
          {subtypeLabel(row.original.task_subtype)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: CellContext<Task, any>) => (
        <span className="text-muted-foreground text-[13px] capitalize">
          {row.original.status || "pending"}
        </span>
      ),
    },
    {
      id: "preview",
      header: "",
      cell: ({ row }: CellContext<Task, any>) => {
        const t = row.original
        const href = t.contact?.id
          ? `/contacts/${t.contact.id}`
          : t.taskable_type === "App\\Models\\Contact" && t.taskable_id
            ? `/contacts/${t.taskable_id}`
            : `/tasks`
        return (
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
            <Link href={href}>View</Link>
          </Button>
        )
      },
    },
  ], [])

  /* ── Render ─────────────────────────────────────────────── */

  if (loading) {
    return <OverdueCardSkeleton />
  }

  const totalCount = overdueTasks.length

  return (
    <Card className="border border-border shadow-sm flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-[16px] font-bold text-foreground flex items-center gap-2">
          Overdue
          {totalCount > 0 && (
            <Badge variant="destructive" className="text-[11px] px-1.5 py-0">
              {totalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Tabs defaultValue={tabs[0]?.key} className="flex flex-col min-h-0">
          <TabsList className="mb-3 h-auto min-h-8 bg-transparent p-0 flex-wrap gap-1">
            {/* Total tab */}
            <TabsTrigger
              value="__total__"
              className="group text-[12px] font-bold rounded-full px-3 h-7 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-sm transition-colors"
            >
              Total{" "}
              <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 text-muted-foreground border-border group-data-[state=active]:!text-primary-foreground group-data-[state=active]:!border-primary-foreground/30">
                {totalCount}
              </Badge>
            </TabsTrigger>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="group text-[12px] font-medium rounded-full px-3 h-7 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-sm transition-colors"
              >
                {tab.label}{" "}
                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 text-muted-foreground border-border group-data-[state=active]:!text-primary-foreground group-data-[state=active]:!border-primary-foreground/30">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Total tab content */}
          <TabsContent value="__total__" className="flex-1 min-h-0 overflow-y-auto max-h-[350px]">
            <DataTable
              columns={columns}
              data={overdueTasks}
              pagination={false}
              emptyTitle="No overdue tasks"
              emptyDescription="All tasks are on schedule."
            />
          </TabsContent>

          {/* Per-type tab content */}
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="flex-1 min-h-0 overflow-y-auto max-h-[350px]">
              <DataTable
                columns={columns}
                data={groups.get(tab.key) || []}
                pagination={false}
                emptyTitle="No overdue tasks"
                emptyDescription={`No overdue ${tab.label.toLowerCase()} tasks.`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
