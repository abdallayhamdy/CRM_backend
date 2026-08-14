"use client";

import React, { useEffect, useState } from "react";
import { UserPlus, Calculator, Building } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ReportsKpiCard } from "../reports-kpi-card";
import { ReportsChartCard } from "../reports-chart-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReportsFilters } from "../reports-filters";
import { ReportsFilterBar } from "../reports-filter-bar";
import { reportsService } from "@/services/reports";

const customersConfig = {
  count: {
    label: "New Customers",
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

const formatCurrency = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}K`
    : `$${v}`;

export function CustomersSection() {
  const { filters } = useReportsFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.getCustomers({
      from: filters.customers.dateRange?.from,
      to: filters.customers.dateRange?.to,
      sources: filters.customers.sources,
    }).then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, [filters.customers]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading customer data...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <ReportsFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.kpis.map((kpi: any, i: number) => {
          const iconMap: Record<string, React.ElementType> = { UserPlus, Calculator, Building };
          const Icon = iconMap[kpi.icon] || UserPlus;
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
          <ReportsChartCard
            title="New Customers Over Time"
          >
            <div className="h-[300px]">
              <ChartContainer config={customersConfig} className="h-full w-full">
                <BarChart data={data.newCustomers} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                  <Bar dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="New Customers" />
                </BarChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>

        <div className="lg:col-span-1">
          <ReportsChartCard title="Activity Source Distribution">
            <div className="h-[300px] flex flex-col items-center justify-center">
              <ChartContainer config={{}} className="h-[180px] w-full">
                <PieChart>
                  <Pie
                    data={data.leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.leadSources.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
                {data.leadSources.map((d: any, i: number) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          </ReportsChartCard>
        </div>
      </div>

      <ReportsChartCard title="Top Accounts by Revenue">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Deals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topAccounts.map((account: any, i: number) => (
              <TableRow key={account.name}>
                <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                      {account.name.charAt(0)}
                    </div>
                    <span className="font-medium">{account.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(account.revenue)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{account.deals}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportsChartCard>
    </div>
  );
}
