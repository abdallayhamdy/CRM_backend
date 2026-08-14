"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Timer, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ReportsKpiCard } from "../reports-kpi-card";
import { ReportsChartCard } from "../reports-chart-card";
import { useReportsFilters } from "../reports-filters";
import { ReportsFilterBar } from "../reports-filter-bar";
import { reportsService } from "@/services/reports";

const taskConfig = {
  rate: {
    label: "Completion Rate %",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const activityConfig = {
  calls: {
    label: "Calls",
    color: "var(--color-chart-1)",
  },
  emails: {
    label: "Emails",
    color: "var(--color-chart-2)",
  },
  tasks: {
    label: "Tasks",
    color: "var(--color-chart-3)",
  },
  notes: {
    label: "Notes",
    color: "var(--color-chart-4)",
  },
} satisfies ChartConfig;

export function ProductivitySection() {
  const { filters } = useReportsFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.getProductivity({
      from: filters.productivity.dateRange?.from,
      to: filters.productivity.dateRange?.to,
      employees: filters.productivity.employees,
    }).then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, [filters.productivity]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading productivity data...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <ReportsFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.kpis.map((kpi: any, i: number) => {
          const iconMap: Record<string, React.ElementType> = { CheckSquare, Timer, Zap };
          const Icon = iconMap[kpi.icon] || CheckSquare;
          return (
            <ReportsKpiCard
              key={i}
              title={kpi.title}
              value={kpi.value}
              trend={kpi.trend ?? ""}
              trendUp={kpi.trendUp}
              icon={Icon}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReportsChartCard title="Task Completion by Employee">
            <div className="h-[300px]">
              <ChartContainer config={taskConfig} className="h-full w-full">
                  <BarChart data={data.taskByUser} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rate" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} name="Completion Rate %" />
                </BarChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>

        <div className="lg:col-span-1">
          <ReportsChartCard title="Daily Team Activity">
            <div className="h-[300px]">
              <ChartContainer config={activityConfig} className="h-full w-full">
                <AreaChart data={data.teamActivity} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="calls" stackId="1" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.6} name="Calls" />
                  <Area type="monotone" dataKey="emails" stackId="1" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.6} name="Emails" />
                  <Area type="monotone" dataKey="tasks" stackId="1" stroke="var(--color-chart-3)" fill="var(--color-chart-3)" fillOpacity={0.6} name="Tasks" />
                  <Area type="monotone" dataKey="notes" stackId="1" stroke="var(--color-chart-4)" fill="var(--color-chart-4)" fillOpacity={0.6} name="Notes" />
                </AreaChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>
      </div>
    </div>
  );
}
