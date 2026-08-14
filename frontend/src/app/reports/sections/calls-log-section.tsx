"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Zap,
  ArrowUpDown,
  User,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
import { ReportsChartCard } from "../reports-chart-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useReportsFilters } from "../reports-filters";
import { ReportsFilterBar } from "../reports-filter-bar";
import { reportsService } from "@/services/reports";

const callsOvertimeConfig = {
  calls: {
    label: "Calls",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const DONUT_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

type SortDirection = "asc" | "desc";

interface CallLogEntry {
  id: number;
  leadName: string;
  mobile: string;
  salesName: string;
  type: string;
  result: string;
  duration: string;
  startIn: string;
}

const COLUMN_KEYS: (keyof CallLogEntry)[] = [
  "leadName",
  "mobile",
  "salesName",
  "type",
  "result",
  "duration",
  "startIn",
];

const COLUMN_LABELS: Record<string, string> = {
  leadName: "Lead Name",
  mobile: "Mobile",
  salesName: "Sales Name",
  type: "Type",
  result: "Result",
  duration: "Duration",
  startIn: "Start In",
};

function DonutCenterLabel({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground">Total</p>
        <p className="text-[18px] font-bold text-foreground">
          {total.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

interface DonutCardProps {
  title: string;
  subtitle: string;
  data: { name: string; value: number; color: string }[];
  total: number;
}

function DonutCard({ title, subtitle, data, total }: DonutCardProps) {
  return (
    <ReportsChartCard title={title}>
      <div className="h-[300px] flex flex-col items-center justify-center">
        <div className="relative w-full h-[180px]">
          <ChartContainer config={{}} className="h-full w-full">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <DonutCenterLabel total={total} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-3">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              {d.name}
            </div>
          ))}
        </div>
      </div>
    </ReportsChartCard>
  );
}

export function CallsLogSection() {
  const [sortColumn, setSortColumn] = useState<number>(0);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { filters } = useReportsFilters();

  useEffect(() => {
    setLoading(true);
    reportsService.getCalls({
      from: filters["calls-log"].dateRange?.from,
      to: filters["calls-log"].dateRange?.to,
      reps: filters["calls-log"].reps,
      types: filters["calls-log"].types,
      results: filters["calls-log"].results,
    }).then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, [filters["calls-log"]]);

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnIndex);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    if (!data?.callLogData) return [];
    const key = COLUMN_KEYS[sortColumn];
    return [...data.callLogData].sort((a: any, b: any) => {
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [sortColumn, sortDirection, data]);

  const totalPages = Math.ceil(sortedData.length / entriesPerPage);
  const startIdx = (currentPage - 1) * entriesPerPage;
  const pageData = sortedData.slice(startIdx, startIdx + entriesPerPage);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading call log data...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-bold text-foreground">Call logs</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Call logs report and charts.
        </p>
      </div>

      <ReportsFilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReportsChartCard
            title="Calls overtime"
          >
            <p className="text-[12px] text-muted-foreground mb-4">
              Call activity over time from Activity records.
            </p>
            <div className="h-[300px]">
              <ChartContainer config={callsOvertimeConfig} className="h-full w-full">
                <AreaChart
                  data={data.callsOvertime}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
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
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    label={{
                      value: "Leads",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: { fill: "var(--color-muted-foreground)", fontSize: 12 },
                    }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    fill="url(#callsGrad)"
                    dot={{ fill: "var(--color-chart-1)", r: 3 }}
                    name="Calls"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </ReportsChartCard>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border shadow-sm p-5 h-full flex flex-col justify-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] font-bold text-foreground">
              Total Of Calls
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Total call activities recorded
            </p>
            <p className="text-[32px] font-bold text-foreground mt-4">
              {data.callsOvertime.reduce((sum: number, m: any) => sum + m.calls, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {data.callTypeData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.callTypeData.length > 0 && (
            <DonutCard
              title="Call type"
              subtitle="Track and manage team phone call activity."
              data={data.callTypeData}
              total={data.callTypeData.reduce((sum: number, d: any) => sum + d.value, 0)}
            />
          )}
          {data.dialTypeData.length > 0 && (
            <DonutCard
              title="Dial type"
              subtitle="Call outcome distribution."
              data={data.dialTypeData}
              total={data.dialTypeData.reduce((sum: number, d: any) => sum + d.value, 0)}
            />
          )}
        </div>
      )}

      <ReportsChartCard title="Call Log">
        <p className="text-[12px] text-muted-foreground mb-4">
          Recent call activity log.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMN_KEYS.map((key, i) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer select-none"
                    onClick={() => handleSort(i)}
                  >
                    <div className="flex items-center gap-1">
                      {COLUMN_LABELS[key]}
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((entry: CallLogEntry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-[13px] font-medium">
                    {entry.leadName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[13px]">
                    {entry.mobile}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {entry.salesName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-medium">
                        {entry.salesName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">{entry.type}</TableCell>
                  <TableCell className="text-[13px]">{entry.result}</TableCell>
                  <TableCell className="text-[13px] font-mono">
                    {entry.duration}
                  </TableCell>
                  <TableCell className="text-[13px]">{entry.startIn}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Select
              value={String(entriesPerPage)}
              onValueChange={(v) => {
                setEntriesPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[12px] text-muted-foreground">
              Showing {startIdx + 1} to{" "}
              {Math.min(startIdx + entriesPerPage, sortedData.length)} of{" "}
              {sortedData.length} entries
            </span>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text="Previous"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  text="Next"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </ReportsChartCard>
    </div>
  );
}
