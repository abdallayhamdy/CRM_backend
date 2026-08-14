"use client";

import React, { useEffect, useState } from "react";
import { Clock, CheckCircle, Star, TicketCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

const volumeConfig = {
  opened: {
    label: "Opened",
    color: "var(--color-chart-4)",
  },
  resolved: {
    label: "Resolved",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const priorityConfig = {
  low: { label: "Low", color: "var(--color-chart-5)" },
  medium: { label: "Medium", color: "var(--color-chart-2)" },
  high: { label: "High", color: "var(--color-chart-4)" },
  urgent: { label: "Urgent", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export function SupportSection() {
  const { filters } = useReportsFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.getTickets({
      from: filters.support.dateRange?.from,
      to: filters.support.dateRange?.to,
      priorities: filters.support.priorities,
      types: filters.support.types,
    }).then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, [filters.support]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading support data...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <ReportsFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.kpis.map((kpi: any, i: number) => {
          const iconMap: Record<string, React.ElementType> = { Clock, CheckCircle, Star, TicketCheck };
          const Icon = iconMap[kpi.icon] || Clock;
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
        {data.csatData ? (
          <ReportsKpiCard
            title="Customer Satisfaction (CSAT)"
            value={`${data.csatData.score}/5`}
            trend={`${data.csatData.score > data.csatData.previousScore ? "+" : ""}${((data.csatData.score - data.csatData.previousScore) / data.csatData.previousScore * 100).toFixed(0)}% vs previous period`}
            trendUp={data.csatData.score >= data.csatData.previousScore}
            icon={Star}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
            <Star className="h-5 w-5 text-muted-foreground/40 mb-2" />
            <p className="text-[13px] font-medium text-muted-foreground">No CSAT data yet</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Connect a survey integration</p>
          </div>
        )}
      </div>

      {data.csatData && (
        <ReportsChartCard title="Satisfaction Breakdown">
          <div className="space-y-3">
            {data.csatData.breakdown.map((item: any) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-[12px] text-muted-foreground w-28 shrink-0">{item.label}</span>
                <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      background:
                        item.label === "Very Satisfied"
                          ? "var(--color-chart-1)"
                          : item.label === "Satisfied"
                          ? "var(--color-chart-2)"
                          : item.label === "Neutral"
                          ? "var(--color-chart-3)"
                          : "var(--color-chart-4)",
                    }}
                  />
                </div>
                <span className="text-[12px] font-bold text-foreground w-10 text-right">{item.percentage}%</span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground/70 pt-1">
              Based on {data.csatData.totalResponses} responses
            </p>
          </div>
        </ReportsChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReportsChartCard title="Ticket Volume">
            <div className="h-[300px]">
              <ChartContainer config={volumeConfig} className="h-full w-full">
                <BarChart data={data.ticketVolume} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
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
                  <Bar dataKey="opened" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} name="Opened" />
                  <Bar dataKey="resolved" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Resolved" />
                </BarChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>

        <div className="lg:col-span-1">
          <ReportsChartCard title="Tickets by Status">
            <div className="h-[300px] flex flex-col items-center justify-center">
              <ChartContainer config={{}} className="h-[180px] w-full">
                <PieChart>
                  <Pie
                    data={data.ticketsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {data.ticketsByType.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
                {data.ticketsByType.map((d: any, i: number) => (
                  <div key={d.type} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {d.type} ({d.count})
                  </div>
                ))}
              </div>
            </div>
          </ReportsChartCard>
        </div>
      </div>

      <ReportsChartCard title="Tickets by Priority">
        <div className="h-[300px]">
          <ChartContainer config={priorityConfig} className="h-full w-full">
            <BarChart data={data.ticketsByPriority} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="month"
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
              <Bar dataKey="low" stackId="priority" fill="var(--color-chart-5)" radius={[0, 0, 0, 0]} name="Low" />
              <Bar dataKey="medium" stackId="priority" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} name="Medium" />
              <Bar dataKey="high" stackId="priority" fill="var(--color-chart-4)" radius={[0, 0, 0, 0]} name="High" />
              <Bar dataKey="urgent" stackId="priority" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} name="Urgent" />
            </BarChart>
          </ChartContainer>
        </div>
      </ReportsChartCard>
    </div>
  );
}
