"use client";

import React from "react";
import { GenericActiveFilter } from "@/components/crm/CrmFilterBar";
import {
  useReportsFilters,
  type DateRange,
} from "./reports-filters";
import { reportsService } from "@/services/reports";

function dateRangeValue(
  dr: DateRange | undefined
): DateRange | undefined {
  return dr;
}

function buildDateRangeFilter(
  label: string,
  value: DateRange | undefined,
  onChange: (dr: DateRange) => void
): GenericActiveFilter {
  return {
    id: `dateRange_${label}`,
    label,
    type: "date",
    value: value || {},
    onChange: (val: unknown) => onChange(val as DateRange),
  };
}

function buildMultiSelectFilter(
  id: string,
  label: string,
  options: string[],
  value: string[] | undefined,
  onChange: (vals: string[]) => void
): GenericActiveFilter {
  return {
    id,
    label,
    type: "simple-property",
    options: options.length > 0 ? options : undefined,
    value: value || [],
    onChange: (val: unknown) => onChange(val as string[]),
  };
}

const PERIOD_OPTIONS = [
  { label: "This Month", value: "this_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
  { label: "Last Month", value: "last_month" },
  { label: "Last Quarter", value: "last_quarter" },
  { label: "Last Year", value: "last_year" },
];

function buildPeriodFilter(
  value: string | undefined,
  onChange: (val: string) => void
): GenericActiveFilter {
  const matched = PERIOD_OPTIONS.find((o) => o.value === value);
  return {
    id: "period",
    label: "Period",
    type: "simple-property",
    options: PERIOD_OPTIONS.map((o) => o.label),
    value: matched ? [matched.label] : [],
    onChange: (val: unknown) => {
      const arr = val as string[];
      if (arr.length > 0) {
        const opt = PERIOD_OPTIONS.find((o) => o.label === arr[0]);
        onChange(opt ? opt.value : arr[0]);
      } else {
        onChange("");
      }
    },
  };
}

export function useReportsActiveFilters(): GenericActiveFilter[] {
  const { filters, activeTab, setFilters } = useReportsFilters();
  const [options, setOptions] = React.useState<{
    salesStages: string[];
    salesReps: string[];
    employees: string[];
    products: string[];
    ticketTypes: string[];
    ticketPriorities: string[];
  }>({
    salesStages: [],
    salesReps: [],
    employees: [],
    products: [],
    ticketTypes: [],
    ticketPriorities: [],
  });

  React.useEffect(() => {
    reportsService.getFilterOptions().then((res) => {
      if (res.data) {
        setOptions({
          salesStages: res.data.salesStages ?? [],
          salesReps: res.data.salesReps ?? [],
          employees: res.data.employees ?? [],
          products: res.data.products ?? [],
          ticketTypes: res.data.ticketTypes ?? [],
          ticketPriorities: res.data.ticketPriorities ?? [],
        });
      }
    });
  }, []);

  return React.useMemo(() => {
    const tab = activeTab as keyof typeof filters;
    const f = filters[tab];

    switch (tab) {
      case "executive":
        return [
          buildPeriodFilter(
            (f as { period?: string }).period,
            (val) => setFilters("executive", { period: val || undefined })
          ),
        ];

      case "sales":
        return [
          buildMultiSelectFilter(
            "stages",
            "Stage",
            options.salesStages,
            (f as { stages?: string[] }).stages,
            (val) => setFilters("sales", { stages: val.length > 0 ? val : undefined })
          ),
          buildMultiSelectFilter(
            "reps",
            "Sales Rep",
            options.salesReps,
            (f as { reps?: string[] }).reps,
            (val) => setFilters("sales", { reps: val.length > 0 ? val : undefined })
          ),
          buildDateRangeFilter(
            "Date Range",
            (f as { dateRange?: DateRange }).dateRange,
            (dr) => setFilters("sales", { dateRange: dr })
          ),
        ];

      case "customers":
        return [
          buildDateRangeFilter(
            "Date Range",
            (f as { dateRange?: DateRange }).dateRange,
            (dr) => setFilters("customers", { dateRange: dr })
          ),
        ];

      case "orders":
        return [
          buildMultiSelectFilter(
            "products",
            "Product",
            options.products,
            (f as { products?: string[] }).products,
            (val) => setFilters("orders", { products: val.length > 0 ? val : undefined })
          ),
          buildDateRangeFilter(
            "Date Range",
            (f as { dateRange?: DateRange }).dateRange,
            (dr) => setFilters("orders", { dateRange: dr })
          ),
        ];

      case "support":
        return [
          buildMultiSelectFilter(
            "priorities",
            "Priority",
            options.ticketPriorities,
            (f as { priorities?: string[] }).priorities,
            (val) => setFilters("support", { priorities: val.length > 0 ? val : undefined })
          ),
          buildMultiSelectFilter(
            "types",
            "Ticket Status",
            options.ticketTypes,
            (f as { types?: string[] }).types,
            (val) => setFilters("support", { types: val.length > 0 ? val : undefined })
          ),
          buildDateRangeFilter(
            "Date Range",
            (f as { dateRange?: DateRange }).dateRange,
            (dr) => setFilters("support", { dateRange: dr })
          ),
        ];

      case "productivity":
        return [
          buildMultiSelectFilter(
            "employees",
            "Employee",
            options.employees,
            (f as { employees?: string[] }).employees,
            (val) => setFilters("productivity", { employees: val.length > 0 ? val : undefined })
          ),
          buildDateRangeFilter(
            "Date Range",
            (f as { dateRange?: DateRange }).dateRange,
            (dr) => setFilters("productivity", { dateRange: dr })
          ),
        ];

      case "calls-log":
        return [
          buildMultiSelectFilter(
            "reps",
            "Sales Rep",
            options.salesReps,
            (f as { reps?: string[] }).reps,
            (val) => setFilters("calls-log", { reps: val.length > 0 ? val : undefined })
          ),
          buildDateRangeFilter(
            "Date Range",
            (f as { dateRange?: DateRange }).dateRange,
            (dr) => setFilters("calls-log", { dateRange: dr })
          ),
        ];

      default:
        return [];
    }
  }, [activeTab, filters, setFilters, options]);
}
