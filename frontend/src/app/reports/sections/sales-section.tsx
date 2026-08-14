"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Target,
  TrendingUp,
  Handshake,
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReportsFilters } from "../reports-filters";
import { ReportsFilterBar } from "../reports-filter-bar";
import { reportsService } from "@/services/reports";

const pipelineConfig = {
  count: {
    label: "Deal Count",
    color: "var(--color-chart-1)",
  },
  value: {
    label: "Total Value",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

const winLossConfig = {
  value: {
    label: "Win Rate",
  },
  Won: {
    label: "Won",
    color: "var(--color-chart-1)",
  },
  Lost: {
    label: "Lost",
    color: "var(--color-chart-4)",
  },
} satisfies ChartConfig;

const repConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const forecastConfig = {
  actual: {
    label: "Actual",
    color: "var(--color-chart-1)",
  },
  forecast: {
    label: "Forecast",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

const trendsConfig = {
  current: {
    label: "Current Period",
    color: "var(--color-chart-1)",
  },
  previous: {
    label: "Previous Period",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

const formatCurrency = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}K`
    : `$${v}`;

export function SalesSection() {
  const [trendsView, setTrendsView] = useState<"monthly" | "quarterly">("monthly");
  const { filters } = useReportsFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.getSales({
      from: filters.sales.dateRange?.from,
      to: filters.sales.dateRange?.to,
      stages: filters.sales.stages,
      reps: filters.sales.reps,
    }).then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, [filters.sales]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading sales data...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <ReportsFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi: any, i: number) => {
          const iconMap: Record<string, React.ElementType> = { DollarSign, Target, TrendingUp, Handshake };
          const Icon = iconMap[kpi.icon] || DollarSign;
          return (
            <ReportsKpiCard
              key={i}
              title={kpi.title}
              value={typeof kpi.value === 'number' ? formatCurrency(kpi.value) : kpi.value}
              trend={kpi.trend ?? ""}
              trendUp={kpi.trendUp}
              icon={Icon}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReportsChartCard title="Pipeline Overview">
            <div className="h-[300px]">
              <ChartContainer config={pipelineConfig} className="h-full w-full">
                  <BarChart data={data.pipelineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickFormatter={(v) => String(v)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Bar yAxisId="left" dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Deal Count" />
                  <Bar yAxisId="right" dataKey="value" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="Total Value" />
                </BarChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>

        <div className="lg:col-span-1">
          <ReportsChartCard title="Win/Loss Rate">
            <div className="h-[300px] flex flex-col items-center justify-center">
              <div className="relative">
                <ChartContainer config={winLossConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <Pie
                      data={data.winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.winLossData.map((entry: any) => (
                        <Cell key={entry.name} fill={`var(--color-${entry.name.toLowerCase() === "won" ? "chart-1" : "chart-4"})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[22px] font-bold text-foreground">{data.winRate}%</div>
                    <div className="text-[11px] text-muted-foreground">win rate</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                {data.winLossData.map((d: any) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: d.name === "Won" ? "var(--color-chart-1)" : "var(--color-chart-4)" }}
                    />
                    {d.name} ({d.value}%)
                  </div>
                ))}
              </div>
            </div>
          </ReportsChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReportsChartCard title="Sales by Rep">
            <div className="h-[300px]">
              <ChartContainer config={repConfig} className="h-full w-full">
                <BarChart data={data.salesByRep} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
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
                  <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} name="Revenue" />
                </BarChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>

        <div className="lg:col-span-1">
          <ReportsChartCard title="Revenue Forecast">
            <div className="h-[300px]">
              <ChartContainer config={forecastConfig} className="h-full w-full">
                  <BarChart data={data.actualMonths} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="actual" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Actual" />
                  <Bar dataKey="forecast" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} name="Forecast" opacity={0.6} />
                </BarChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>
      </div>

      <ReportsChartCard
        title="Sales Trends"
        action={
          <Select value={trendsView} onValueChange={(v) => setTrendsView(v as "monthly" | "quarterly")}>
            <SelectTrigger className="h-8 w-[130px] text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <div className="h-[300px]">
          <ChartContainer config={trendsConfig} className="h-full w-full">
            <BarChart
              data={trendsView === "monthly" ? data.salesTrendsMonthly : data.salesTrendsQuarterly}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="current" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Current Period" />
              <Bar dataKey="previous" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} name="Previous Period" />
            </BarChart>
          </ChartContainer>
        </div>
      </ReportsChartCard>
    </div>
  );
}
