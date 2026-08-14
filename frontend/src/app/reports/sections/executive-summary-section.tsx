"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Handshake,
  TicketCheck,
  CheckSquare,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

const performanceConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-chart-1)",
  },
  dealsClosed: {
    label: "Deals Closed",
    color: "var(--color-chart-2)",
  },
  ticketsResolved: {
    label: "Tickets Resolved",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  Handshake,
  TicketCheck,
  CheckSquare,
};

const formatCurrency = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}K`
    : `$${v}`;

export function ExecutiveSummarySection() {
  const { filters } = useReportsFilters();
  const period = filters.executive.period || "this_month";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.getExecutive(period).then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, [period]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading executive summary...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-foreground">Company Overview</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Key metrics at a glance
          </p>
        </div>
      </div>

      <ReportsFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi: any) => {
          const Icon = iconMap[kpi.icon] || DollarSign;
          return (
            <ReportsKpiCard
              key={kpi.title}
              title={kpi.title}
              value={kpi.formatted ?? kpi.value}
              trend={kpi.trend ?? ""}
              trendUp={kpi.trendUp}
              icon={Icon}
            />
          );
        })}
      </div>

      <ReportsChartCard title="Performance Comparison">
        <div className="h-[350px]">
          <ChartContainer config={performanceConfig} className="h-full w-full">
            <AreaChart
              data={data.performanceTrend}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dealsGradExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ticketsGradExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                yAxisId="revenue"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                fill="url(#revenueGradExec)"
                dot={{ fill: "var(--color-chart-1)", r: 3 }}
                name="Revenue"
              />
              <Area
                yAxisId="count"
                type="monotone"
                dataKey="dealsClosed"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                fill="url(#dealsGradExec)"
                dot={{ fill: "var(--color-chart-2)", r: 3 }}
                name="Deals Closed"
              />
              <Area
                yAxisId="count"
                type="monotone"
                dataKey="ticketsResolved"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                fill="url(#ticketsGradExec)"
                dot={{ fill: "var(--color-chart-3)", r: 3 }}
                name="Tickets Resolved"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </ReportsChartCard>

      {data.periodComparison && data.periodComparison.length > 0 && (
        <ReportsChartCard title="Period Comparison">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Metric</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Current</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Previous</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.periodComparison.map((row: any) => (
                  <tr key={row.metric} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 font-medium">{row.metric}</td>
                    <td className="py-3 px-4 text-right">{row.current}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{row.previous}</td>
                    <td className={`py-3 px-4 text-right font-medium ${row.deltaUp ? "text-green-600" : "text-red-600"}`}>
                      {row.deltaUp ? "+" : ""}{row.delta}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportsChartCard>
      )}
    </div>
  );
}
