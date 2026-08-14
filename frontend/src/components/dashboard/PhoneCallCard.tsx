"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PieChart, Pie, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { activitiesService } from "@/services/activities"
import type { Activity } from "@/lib/types/crm"

const ANSWERS_COLOR = "var(--color-chart-1)"
const NO_ANSWERS_COLOR = "var(--color-chart-2)"

export function PhoneCallCardSkeleton() {
  return (
    <Card className="border border-border shadow-sm h-full">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4 w-28" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PhoneCallCard() {
  const { workspaceId, user } = useAuth()
  const [calls, setCalls] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const profileId = user?.profileId

  useEffect(() => {
    const controller = new AbortController()

    async function loadCalls() {
      if (!workspaceId || !profileId) {
        setLoading(false)
        return
      }
      try {
        const { data } = await activitiesService.getAll({
          workspace_id: workspaceId!,
          type: "call",
          owner_id: profileId!,
          limit: 1000,
        })
        if (!controller.signal.aborted && data) setCalls(data)
      } catch {
        // Expected in standalone mode
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadCalls()
    return () => controller.abort()
  }, [workspaceId, profileId])

  const { total, donutData } = useMemo(() => {
    const a = calls.filter(
      (c) => c.call_outcome?.toLowerCase() === "connected"
    )
    const na = calls.length - a.length
    return {
      total: calls.length,
      donutData: [
        { name: "Answers", value: a.length, color: ANSWERS_COLOR },
        { name: "No answers", value: na, color: NO_ANSWERS_COLOR },
      ],
    }
  }, [calls])

  if (loading) {
    return <PhoneCallCardSkeleton />
  }

  return (
    <Card className="border border-border shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-[16px] font-bold text-foreground">
          Phone Call
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-[13px] text-muted-foreground">
            No calls yet
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-full h-[180px]">
              <ChartContainer config={{}} className="h-full w-full">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltipContent />
                </PieChart>
              </ChartContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">Total</p>
                  <p className="text-[18px] font-bold text-foreground">
                    {total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-3">
              {donutData.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: d.color }}
                  />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
