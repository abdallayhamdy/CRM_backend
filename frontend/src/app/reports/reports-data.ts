// src/app/reports/reports-data.ts

// ==================== SALES ====================

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
}

export const pipelineOverviewData: PipelineStage[] = [
  { stage: "Lead", count: 24, value: 48000 },
  { stage: "Qualified", count: 18, value: 72000 },
  { stage: "Proposal", count: 12, value: 96000 },
  { stage: "Negotiation", count: 8, value: 64000 },
  { stage: "Closed Won", count: 14, value: 182000 },
  { stage: "Closed Lost", count: 6, value: 36000 },
];

export interface WinLoss {
  name: string;
  value: number;
}

export const winLossData: WinLoss[] = [
  { name: "Won", value: 62 },
  { name: "Lost", value: 38 },
];

export interface SalesRep {
  name: string;
  deals: number;
  revenue: number;
}

export const salesByRepData: SalesRep[] = [
  { name: "Sarah Chen", deals: 12, revenue: 156000 },
  { name: "Marcus Johnson", deals: 9, revenue: 124000 },
  { name: "Priya Patel", deals: 8, revenue: 98000 },
  { name: "David Kim", deals: 7, revenue: 87000 },
  { name: "Emma Wilson", deals: 6, revenue: 72000 },
];

export interface MonthlyRevenue {
  month: string;
  actual: number | null;
  forecast: number | null;
}

export const revenueForecastData: MonthlyRevenue[] = [
  { month: "Jan", actual: 32000, forecast: null },
  { month: "Feb", actual: 41000, forecast: null },
  { month: "Mar", actual: 38000, forecast: null },
  { month: "Apr", actual: 52000, forecast: null },
  { month: "May", actual: 48000, forecast: null },
  { month: "Jun", actual: 61000, forecast: null },
  { month: "Jul", actual: null, forecast: 58000 },
  { month: "Aug", actual: null, forecast: 65000 },
  { month: "Sep", actual: null, forecast: 72000 },
];

export interface TrendPoint {
  period: string;
  current: number;
  previous: number;
}

export const salesTrendsMonthlyData: TrendPoint[] = [
  { period: "Jan", current: 32000, previous: 28000 },
  { period: "Feb", current: 41000, previous: 35000 },
  { period: "Mar", current: 38000, previous: 31000 },
  { period: "Apr", current: 52000, previous: 42000 },
  { period: "May", current: 48000, previous: 39000 },
  { period: "Jun", current: 61000, previous: 47000 },
];

export const salesTrendsQuarterlyData: TrendPoint[] = [
  { period: "Q1", current: 111000, previous: 94000 },
  { period: "Q2", current: 161000, previous: 128000 },
];

// ==================== CUSTOMERS ====================

export interface NewCustomer {
  month: string;
  count: number;
}

export const newCustomersData: NewCustomer[] = [
  { month: "Jul", count: 18 },
  { month: "Aug", count: 22 },
  { month: "Sep", count: 15 },
  { month: "Oct", count: 28 },
  { month: "Nov", count: 20 },
  { month: "Dec", count: 25 },
  { month: "Jan", count: 19 },
  { month: "Feb", count: 31 },
  { month: "Mar", count: 24 },
  { month: "Apr", count: 27 },
  { month: "May", count: 23 },
  { month: "Jun", count: 29 },
];

export interface LeadSource {
  name: string;
  value: number;
}

export const leadSourceData: LeadSource[] = [
  { name: "Website", value: 35 },
  { name: "Referral", value: 25 },
  { name: "Social", value: 20 },
  { name: "Outbound", value: 15 },
  { name: "Other", value: 5 },
];

export interface TopAccount {
  name: string;
  revenue: number;
  deals: number;
}

export const topAccountsData: TopAccount[] = [
  { name: "Acme Corporation", revenue: 84000, deals: 4 },
  { name: "TechVista Solutions", revenue: 62000, deals: 3 },
  { name: "GlobalSync Inc.", revenue: 51000, deals: 5 },
  { name: "NexGen Labs", revenue: 38000, deals: 2 },
  { name: "Pinnacle Group", revenue: 29000, deals: 3 },
  { name: "Vertex Industries", revenue: 22000, deals: 2 },
  { name: "Quantum Dynamics", revenue: 18000, deals: 1 },
];

// ==================== ORDERS & PRODUCTS ====================

export interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

export const topProductsData: TopProduct[] = [
  { name: "Enterprise Plan", units: 45, revenue: 135000 },
  { name: "Professional Plan", units: 62, revenue: 93000 },
  { name: "Starter Kit", units: 38, revenue: 19000 },
  { name: "Add-on: Analytics", units: 28, revenue: 14000 },
  { name: "Add-on: API Access", units: 15, revenue: 22500 },
  { name: "Custom Integration", units: 8, revenue: 32000 },
];

export interface OrderTrend {
  period: string;
  orders: number;
}

export const orderTrendsData: OrderTrend[] = [
  { period: "Week 1", orders: 12 },
  { period: "Week 2", orders: 18 },
  { period: "Week 3", orders: 15 },
  { period: "Week 4", orders: 22 },
  { period: "Week 5", orders: 19 },
  { period: "Week 6", orders: 25 },
  { period: "Week 7", orders: 21 },
  { period: "Week 8", orders: 28 },
];

export const aovSparklineData: number[] = [
  3800, 4100, 3950, 4300, 4150, 4500, 4200, 4250,
];

// ==================== SUPPORT ====================

export interface TicketVolume {
  month: string;
  opened: number;
  resolved: number;
}

export const ticketVolumeData: TicketVolume[] = [
  { month: "Jan", opened: 42, resolved: 38 },
  { month: "Feb", opened: 35, resolved: 40 },
  { month: "Mar", opened: 48, resolved: 44 },
  { month: "Apr", opened: 39, resolved: 42 },
  { month: "May", opened: 44, resolved: 46 },
  { month: "Jun", opened: 37, resolved: 41 },
];

export interface TicketByType {
  type: string;
  count: number;
}

export const ticketsByTypeData: TicketByType[] = [
  { type: "Bug", count: 30 },
  { type: "Question", count: 25 },
  { type: "Billing", count: 20 },
  { type: "Feature Request", count: 15 },
  { type: "Other", count: 10 },
];

export interface TicketByPriority {
  month: string;
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

export const ticketsByPriorityData: TicketByPriority[] = [
  { month: "Jan", low: 15, medium: 18, high: 7, urgent: 2 },
  { month: "Feb", low: 12, medium: 15, high: 6, urgent: 2 },
  { month: "Mar", low: 18, medium: 20, high: 8, urgent: 2 },
  { month: "Apr", low: 14, medium: 16, high: 7, urgent: 2 },
  { month: "May", low: 16, medium: 18, high: 8, urgent: 2 },
  { month: "Jun", low: 13, medium: 15, high: 7, urgent: 2 },
];

// ==================== CSAT ====================

export interface CsatData {
  score: number;
  previousScore: number;
  totalResponses: number;
  breakdown: { label: string; percentage: number }[];
}

export const csatData: CsatData | null = {
  score: 4.6,
  previousScore: 4.3,
  totalResponses: 284,
  breakdown: [
    { label: "Very Satisfied", percentage: 58 },
    { label: "Satisfied", percentage: 28 },
    { label: "Neutral", percentage: 10 },
    { label: "Unsatisfied", percentage: 4 },
  ],
};

// Set to null to show empty state:
// export const csatData: CsatData | null = null;

// ==================== EXECUTIVE SUMMARY ====================

export interface ExecutiveKpi {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
}

export const executiveKpiData: ExecutiveKpi[] = [
  { title: "Total Revenue", value: "$284.5K", trend: "+12% vs last month", trendUp: true, icon: "DollarSign" },
  { title: "Total Deals", value: "82", trend: "+8% vs last month", trendUp: true, icon: "Handshake" },
  { title: "Open Tickets", value: "37", trend: "-5% vs last month", trendUp: true, icon: "TicketCheck" },
  { title: "Tasks Completed", value: "89%", trend: "+4% vs last month", trendUp: true, icon: "CheckSquare" },
];

export interface PerformanceTrend {
  month: string;
  revenue: number;
  dealsClosed: number;
  ticketsResolved: number;
}

export const performanceTrendData: PerformanceTrend[] = [
  { month: "Jan", revenue: 32000, dealsClosed: 8, ticketsResolved: 38 },
  { month: "Feb", revenue: 41000, dealsClosed: 10, ticketsResolved: 40 },
  { month: "Mar", revenue: 38000, dealsClosed: 9, ticketsResolved: 44 },
  { month: "Apr", revenue: 52000, dealsClosed: 14, ticketsResolved: 42 },
  { month: "May", revenue: 48000, dealsClosed: 12, ticketsResolved: 46 },
  { month: "Jun", revenue: 61000, dealsClosed: 16, ticketsResolved: 41 },
];

export interface PeriodComparison {
  metric: string;
  current: string;
  previous: string;
  delta: number;
  deltaUp: boolean;
}

export const periodComparisonData: PeriodComparison[] = [
  { metric: "Revenue", current: "$61K", previous: "$48K", delta: 27, deltaUp: true },
  { metric: "Deals Closed", current: "16", previous: "12", delta: 33, deltaUp: true },
  { metric: "Tickets Resolved", current: "41", previous: "46", delta: -11, deltaUp: false },
  { metric: "Tasks Completed", current: "89%", previous: "85%", delta: 4, deltaUp: true },
];

// ==================== PRODUCTIVITY ====================

export interface TaskCompletion {
  name: string;
  completed: number;
  total: number;
  rate: number;
}

export const taskCompletionData: TaskCompletion[] = [
  { name: "Sarah Chen", completed: 42, total: 45, rate: 93 },
  { name: "Marcus Johnson", completed: 38, total: 42, rate: 90 },
  { name: "Priya Patel", completed: 35, total: 40, rate: 88 },
  { name: "David Kim", completed: 30, total: 36, rate: 83 },
  { name: "Emma Wilson", completed: 28, total: 34, rate: 82 },
];

export interface TeamActivity {
  day: string;
  calls: number;
  emails: number;
  tasks: number;
  notes: number;
}

export const teamActivityData: TeamActivity[] = [
  { day: "Mon", calls: 12, emails: 24, tasks: 18, notes: 8 },
  { day: "Tue", calls: 15, emails: 28, tasks: 22, notes: 10 },
  { day: "Wed", calls: 18, emails: 32, tasks: 20, notes: 12 },
  { day: "Thu", calls: 14, emails: 26, tasks: 19, notes: 9 },
  { day: "Fri", calls: 10, emails: 20, tasks: 15, notes: 7 },
];

// ==================== CALLS LOG ====================

export interface CallLogEntry {
  id: number;
  leadName: string;
  mobile: string;
  salesName: string;
  type: "Incoming" | "Outgoing";
  result: "Answer" | "No Answer";
  duration: string;
  startIn: string;
}

export interface CallsOvertime {
  month: string;
  calls: number;
}

export interface DonutDataEntry {
  name: string;
  value: number;
  color: string;
}

export const callsOvertimeData: CallsOvertime[] = [
  { month: "Jan 2022", calls: 45 },
  { month: "Apr 2022", calls: 52 },
  { month: "Jul 2022", calls: 61 },
  { month: "Oct 2022", calls: 58 },
  { month: "Jan 2023", calls: 67 },
  { month: "Apr 2023", calls: 74 },
  { month: "Jul 2023", calls: 82 },
  { month: "Oct 2023", calls: 79 },
  { month: "Jan 2024", calls: 88 },
  { month: "Apr 2024", calls: 95 },
  { month: "Jul 2024", calls: 103 },
  { month: "Oct 2024", calls: 98 },
  { month: "Jan 2025", calls: 112 },
  { month: "Apr 2025", calls: 118 },
  { month: "Jul 2025", calls: 125 },
  { month: "Oct 2025", calls: 121 },
  { month: "Jan 2026", calls: 132 },
  { month: "Apr 2026", calls: 140 },
  { month: "Jul 2026", calls: 148 },
];

export const callTypeData: DonutDataEntry[] = [
  { name: "Incoming", value: 382, color: "var(--color-chart-1)" },
  { name: "Outgoing", value: 518, color: "var(--color-chart-2)" },
];

export const dialTypeData: DonutDataEntry[] = [
  { name: "Answer", value: 648, color: "var(--color-chart-1)" },
  { name: "No Answer", value: 182, color: "var(--color-chart-4)" },
  { name: "Closed", value: 70, color: "var(--color-chart-3)" },
];

export const totalCallsByHour: number = 1247;

export const SALES_REPS = [
  "Sarah Chen",
  "Marcus Johnson",
  "Priya Patel",
  "David Kim",
  "Emma Wilson",
];

const LEAD_NAMES = [
  "Acme Corporation",
  "TechVista Solutions",
  "GlobalSync Inc.",
  "NexGen Labs",
  "Pinnacle Group",
  "Vertex Industries",
  "Quantum Dynamics",
  "Sterling Corp",
  "Horizon Media",
  "Atlas Ventures",
  "Pioneer Tech",
  "Summit Solutions",
  "Vanguard Industries",
  "Catalyst Group",
  "Meridian Labs",
];

const MOBILE_PREFIXES = ["+1", "+44", "+91", "+61", "+49", "+33", "+81"];

function generateCallLogData(): CallLogEntry[] {
  const entries: CallLogEntry[] = [];
  for (let i = 1; i <= 75; i++) {
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    const year = 2022 + Math.floor(Math.random() * 5);
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.floor(Math.random() * 60);
    const ampm = Math.random() > 0.5 ? "AM" : "PM";
    const pad = (n: number) => String(n).padStart(2, "0");
    const durationMins = Math.floor(Math.random() * 45);
    const durationSecs = Math.floor(Math.random() * 60);
    const prefix = MOBILE_PREFIXES[Math.floor(Math.random() * MOBILE_PREFIXES.length)];
    const mobileNum = Math.floor(1000000000 + Math.random() * 9000000000);

    entries.push({
      id: i,
      leadName: LEAD_NAMES[Math.floor(Math.random() * LEAD_NAMES.length)],
      mobile: `${prefix} ${mobileNum}`,
      salesName: SALES_REPS[Math.floor(Math.random() * SALES_REPS.length)],
      type: Math.random() > 0.45 ? "Outgoing" : "Incoming",
      result: Math.random() > 0.25 ? "Answer" : "No Answer",
      duration: `${pad(durationMins)}:${pad(durationSecs)}`,
      startIn: `${pad(day)}-${pad(month)}-${year} ${pad(hour)}:${pad(minute)} ${ampm}`,
    });
  }
  return entries;
}

export const callLogData: CallLogEntry[] = generateCallLogData();

// ==================== FILTER FUNCTIONS ====================

import type { DateRange } from "./reports-filters";

function matchesDateRange(dateStr: string, range?: DateRange): boolean {
  if (!range?.from && !range?.to) return true;
  // Parse "MMM YYYY" format (e.g., "Jan 2022")
  const parseMonth = (s: string): Date | null => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  // Parse "DD-MM-YYYY hh:mm AM/PM" format
  const parseFullDate = (s: string): Date | null => {
    const parts = s.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})\s+(AM|PM)/);
    if (!parts) return null;
    const [, day, month, year, hour, min, ampm] = parts;
    let h = parseInt(hour);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(min));
  };

  const date = parseFullDate(dateStr) || parseMonth(dateStr);
  if (!date) return true;

  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

function matchesMonthRange(monthStr: string, range?: DateRange): boolean {
  if (!range?.from && !range?.to) return true;
  const date = new Date(monthStr);
  if (isNaN(date.getTime())) return true;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

export function filterSalesPipeline(
  data: PipelineStage[],
  filters: { stages?: string[] }
): PipelineStage[] {
  if (!filters.stages?.length) return data;
  return data.filter((d) => filters.stages!.includes(d.stage));
}

export function filterSalesByRep(
  data: SalesRep[],
  filters: { reps?: string[] }
): SalesRep[] {
  if (!filters.reps?.length) return data;
  return data.filter((d) => filters.reps!.includes(d.name));
}

export function filterRevenueForecast(
  data: MonthlyRevenue[],
  filters: { dateRange?: DateRange }
): MonthlyRevenue[] {
  if (!filters.dateRange?.from && !filters.dateRange?.to) return data;
  return data.filter((d) => matchesMonthRange(d.month, filters.dateRange));
}

export function filterSalesTrends(
  data: TrendPoint[],
  filters: { dateRange?: DateRange }
): TrendPoint[] {
  if (!filters.dateRange?.from && !filters.dateRange?.to) return data;
  return data.filter((d) => matchesMonthRange(d.period, filters.dateRange));
}

export function filterNewCustomers(
  data: NewCustomer[],
  filters: { dateRange?: DateRange }
): NewCustomer[] {
  if (!filters.dateRange?.from && !filters.dateRange?.to) return data;
  return data.filter((d) => matchesMonthRange(d.month, filters.dateRange));
}

export function filterLeadSource(
  data: LeadSource[],
  filters: { sources?: string[] }
): LeadSource[] {
  if (!filters.sources?.length) return data;
  return data.filter((d) => filters.sources!.includes(d.name));
}

export function filterTopProducts(
  data: TopProduct[],
  filters: { products?: string[] }
): TopProduct[] {
  if (!filters.products?.length) return data;
  return data.filter((d) => filters.products!.includes(d.name));
}

export function filterOrderTrends(
  data: OrderTrend[],
  filters: { dateRange?: DateRange }
): OrderTrend[] {
  if (!filters.dateRange?.from && !filters.dateRange?.to) return data;
  return data.filter((d) => matchesMonthRange(d.period, filters.dateRange));
}

export function filterTicketVolume(
  data: TicketVolume[],
  filters: { dateRange?: DateRange }
): TicketVolume[] {
  if (!filters.dateRange?.from && !filters.dateRange?.to) return data;
  return data.filter((d) => matchesMonthRange(d.month, filters.dateRange));
}

export function filterTicketsByType(
  data: TicketByType[],
  filters: { types?: string[] }
): TicketByType[] {
  if (!filters.types?.length) return data;
  return data.filter((d) => filters.types!.includes(d.type));
}

export function filterTicketsByPriority(
  data: TicketByPriority[],
  filters: { dateRange?: DateRange; priorities?: string[] }
): TicketByPriority[] {
  let result = data;
  if (filters.dateRange?.from || filters.dateRange?.to) {
    result = result.filter((d) => matchesMonthRange(d.month, filters.dateRange));
  }
  return result;
}

export function filterTaskCompletion(
  data: TaskCompletion[],
  filters: { employees?: string[] }
): TaskCompletion[] {
  if (!filters.employees?.length) return data;
  return data.filter((d) => filters.employees!.includes(d.name));
}

export function filterCallsOvertime(
  data: CallsOvertime[],
  filters: { dateRange?: DateRange }
): CallsOvertime[] {
  if (!filters.dateRange?.from && !filters.dateRange?.to) return data;
  return data.filter((d) => matchesMonthRange(d.month, filters.dateRange));
}

export function filterCallType(
  data: DonutDataEntry[],
  filters: { types?: string[] }
): DonutDataEntry[] {
  if (!filters.types?.length) return data;
  return data.filter((d) => filters.types!.includes(d.name));
}

export function filterDialType(
  data: DonutDataEntry[],
  filters: { results?: string[] }
): DonutDataEntry[] {
  if (!filters.results?.length) return data;
  return data.filter((d) => filters.results!.includes(d.name));
}

export function filterCallLogData(
  data: CallLogEntry[],
  filters: { reps?: string[]; types?: string[]; results?: string[]; dateRange?: DateRange }
): CallLogEntry[] {
  let result = data;
  if (filters.reps?.length) {
    result = result.filter((d) => filters.reps!.includes(d.salesName));
  }
  if (filters.types?.length) {
    result = result.filter((d) => filters.types!.includes(d.type));
  }
  if (filters.results?.length) {
    result = result.filter((d) => filters.results!.includes(d.result));
  }
  if (filters.dateRange?.from || filters.dateRange?.to) {
    result = result.filter((d) => matchesDateRange(d.startIn, filters.dateRange));
  }
  return result;
}
