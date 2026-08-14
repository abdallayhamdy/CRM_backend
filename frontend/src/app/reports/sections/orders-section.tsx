"use client";

import React, { useEffect, useState } from "react";
import { ShoppingCart, Receipt, Package } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ReportsKpiCard } from "../reports-kpi-card";
import { ReportsChartCard } from "../reports-chart-card";
import { useReportsFilters } from "../reports-filters";
import { ReportsFilterBar } from "../reports-filter-bar";
import { reportsService } from "@/services/reports";

const productsConfig = {
  units: {
    label: "Units Sold",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const ordersConfig = {
  orders: {
    label: "Orders",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

export function OrdersSection() {
  const { filters } = useReportsFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.getOrders({
      from: filters.orders.dateRange?.from,
      to: filters.orders.dateRange?.to,
      products: filters.orders.products,
    }).then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, [filters.orders]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading orders data...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <ReportsFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.kpis.map((kpi: any, i: number) => {
          const iconMap: Record<string, React.ElementType> = { ShoppingCart, Receipt, Package };
          const Icon = iconMap[kpi.icon] || ShoppingCart;
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
        <div className="lg:col-span-1">
          <ReportsChartCard title="Top Selling Products">
            <div className="h-[300px]">
              <ChartContainer config={productsConfig} className="h-full w-full">
                <BarChart data={data.topProducts} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    width={130}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="units" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} name="Units Sold" />
                </BarChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>

        <div className="lg:col-span-2">
          <ReportsChartCard
            title="Order Trends"
          >
            <div className="h-[300px]">
              <ChartContainer config={ordersConfig} className="h-full w-full">
                <AreaChart data={data.orderTrends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    fill="url(#ordersGrad)"
                    dot={{ fill: "var(--color-chart-1)", r: 4 }}
                    name="Orders"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>
      </div>

      <ReportsChartCard title="Average Order Value Trend">
        <div className="h-[150px]">
          <ChartContainer config={ordersConfig} className="h-full w-full">
            <AreaChart data={data.aovSparkline.map((v: number, i: number) => ({ idx: i, value: v }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aovGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="idx" hide />
              <YAxis hide />
              <Tooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                fill="url(#aovGrad)"
                dot={false}
                name="AOV"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </ReportsChartCard>
    </div>
  );
}
