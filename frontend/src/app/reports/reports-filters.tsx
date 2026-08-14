"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type ReportsFilters = {
  executive: { period?: string };
  sales: { stages?: string[]; reps?: string[]; dateRange?: DateRange };
  customers: { sources?: string[]; dateRange?: DateRange };
  orders: { products?: string[]; dateRange?: DateRange };
  support: { priorities?: string[]; types?: string[]; dateRange?: DateRange };
  productivity: { employees?: string[]; dateRange?: DateRange };
  "calls-log": { reps?: string[]; types?: string[]; results?: string[]; dateRange?: DateRange };
};

const initialFilters: ReportsFilters = {
  executive: {},
  sales: {},
  customers: {},
  orders: {},
  support: {},
  productivity: {},
  "calls-log": {},
};

type TabKey = keyof ReportsFilters;

interface ReportsFilterContextValue {
  filters: ReportsFilters;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setFilters: (tab: TabKey, partial: Partial<ReportsFilters[TabKey]>) => void;
  resetFilters: (tab: TabKey) => void;
  activeFilterCount: number;
}

const ReportsFilterContext = createContext<ReportsFilterContextValue | null>(null);

export function useReportsFilters() {
  const ctx = useContext(ReportsFilterContext);
  if (!ctx) throw new Error("useReportsFilters must be used within ReportsFilterProvider");
  return ctx;
}

function countActiveFilters(filters: ReportsFilters, tab: string): number {
  const f = filters[tab as TabKey];
  if (!f) return 0;
  let count = 0;
  for (const [key, value] of Object.entries(f)) {
    if (key === "dateRange") {
      const dr = value as DateRange | undefined;
      if (dr?.from || dr?.to) count++;
    } else if (Array.isArray(value)) {
      if (value.length > 0) count++;
    } else if (typeof value === "string" && value) {
      count++;
    }
  }
  return count;
}

export function ReportsFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<ReportsFilters>(initialFilters);
  const [activeTab, setActiveTab] = useState("executive");

  const setFilters = useCallback(
    (tab: TabKey, partial: Partial<ReportsFilters[TabKey]>) => {
      setFiltersState((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], ...partial },
      }));
    },
    []
  );

  const resetFilters = useCallback((tab: TabKey) => {
    setFiltersState((prev) => ({
      ...prev,
      [tab]: initialFilters[tab],
    }));
  }, []);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters, activeTab),
    [filters, activeTab]
  );

  const value = useMemo(
    () => ({
      filters,
      activeTab,
      setActiveTab,
      setFilters,
      resetFilters,
      activeFilterCount,
    }),
    [filters, activeTab, setFilters, resetFilters, activeFilterCount]
  );

  return (
    <ReportsFilterContext.Provider value={value}>
      {children}
    </ReportsFilterContext.Provider>
  );
}