"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { tasksService } from "@/services/tasks"
import { DataTable } from "@/components/shared/DataTable"
import { toast } from "sonner"
import type { Task } from "@/lib/types/crm"
import type { ColumnDef, CellContext } from "@tanstack/react-table"

interface OverdueRow {
  task: Task
  contact: { id: string; first_name: string; last_name: string | null; phone?: string | null } | null
}

const TASK_TYPE_KEYS = ["to_do", "follow_up", "follow_up_after_meeting", "call", "email"] as const

const SUBTYPE_LABELS: Record<string, string> = {
  to_do: "To Do",
  follow_up: "Follow Up",
  follow_up_after_meeting: "Follow Up After Meeting",
  call: "Call",
  email: "Email",
}

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

export function OverdueCard() {
  const { workspaceId, user, userRole } = useAuth()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [overdueTasks, setOverdueTasks] = useState<OverdueRow[]>([])
  const refreshKeyRef = useRef(0)
  const [, setRefreshTick] = useState(0)

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshKeyRef.current += 1
        setRefreshTick((k) => k + 1)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  useEffect(() => {
    if (!workspaceId || !user?.profileId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadData() {
      if (!workspaceId || !user?.profileId) return

      try {
        const isAdminOrOwner = userRole === "admin" || userRole === "owner"
        const { data: tasks } = await tasksService.getAll({
          workspace_id: workspaceId!,
          ...(isAdminOrOwner ? {} : { assigned_to: user!.profileId! }),
          limit: 1000,
        })

        if (controller.signal.aborted || !tasks) return

        const now = new Date()
        const rows: OverdueRow[] = tasks
          .filter(
            (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < now
          )
          .map((task) => ({
            task,
            contact: task.contact
              ? { id: task.contact.id, first_name: task.contact.first_name, last_name: task.contact.last_name ?? null, phone: task.contact.phone }
              : null,
          }))

        setOverdueTasks(rows)
      } catch {
        toast.error("Failed to load overdue tasks")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [workspaceId, user?.profileId, userRole, pathname, refreshKeyRef.current])

  const tabs = useMemo(() => {
    return TASK_TYPE_KEYS.map((key) => ({
      key,
      label: SUBTYPE_LABELS[key],
      count: overdueTasks.filter((row) => {
        const subtype = row.task.task_subtype?.toLowerCase().replace(/\s+/g, "_") ?? "other"
        return subtype === key
      }).length,
    }))
  }, [overdueTasks])

  const columns = useMemo<ColumnDef<OverdueRow, any>[]>(() => [
    {
      accessorKey: "contact",
      header: "LEAD NAME",
      cell: ({ row }: CellContext<OverdueRow, any>) => {
        const c = row.original.contact
        if (!c) return <span className="text-muted-foreground">--</span>
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ")
        return (
          <Link
            href={`/contacts/${c.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {name}
          </Link>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "MOBILE",
      cell: ({ row }: CellContext<OverdueRow, any>) => {
        const c = row.original.contact
        return (
          <span className="text-muted-foreground">
            {c?.phone || "--"}
          </span>
        )
      },
    },
    {
      accessorKey: "due_date",
      header: "STAGE DATE",
      cell: ({ row }: CellContext<OverdueRow, any>) => {
        const d = row.original.task.due_date
        if (!d) return "--"
        return (
          <span className="text-red-500 font-medium">
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
      header: "TASK TYPE",
      cell: ({ row }: CellContext<OverdueRow, any>) => (
        <span className="text-muted-foreground text-[13px]">
          {SUBTYPE_LABELS[row.original.task.task_subtype || ""] || "To Do"}
        </span>
      ),
    },
    {
      accessorKey: "lastComment",
      header: "LAST COMMENT",
      cell: () => (
        <span className="text-muted-foreground text-[13px]">
          --
        </span>
      ),
    },
    {
      id: "preview",
      header: "",
      cell: ({ row }: CellContext<OverdueRow, any>) => {
        const t = row.original.task
        return (
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
            <Link href={t.contact?.id ? `/contacts/${t.contact.id}` : `/tasks/${t.id}`}>View</Link>
          </Button>
        )
      },
    },
  ], [])

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
        <Tabs defaultValue="__total__" className="flex flex-col min-h-0">
          <TabsList className="mb-3 h-auto min-h-8 bg-transparent p-0 flex-wrap gap-1">
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

          <TabsContent value="__total__" className="flex-1 min-h-0 overflow-y-auto max-h-[350px]">
            <DataTable
              columns={columns}
              data={overdueTasks}
              pagination={false}
              emptyTitle="No overdue tasks"
              emptyDescription="All tasks are on schedule."
            />
          </TabsContent>

          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="flex-1 min-h-0 overflow-y-auto max-h-[350px]">
              <DataTable
                columns={columns}
                data={overdueTasks.filter((row) => {
                  const subtype = row.task.task_subtype?.toLowerCase().replace(/\s+/g, "_") ?? "other"
                  return subtype === tab.key
                })}
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
