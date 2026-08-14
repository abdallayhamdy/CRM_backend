"use client";

import React, { useState } from "react";
import { CrmFilterChipRow } from "@/components/crm/CrmFilterChipRow";
import { useReportsFilters } from "./reports-filters";
import { useReportsActiveFilters } from "./use-reports-active-filters";

const PER_TAB_PINNED: Record<string, string[]> = {
  executive: ["period"],
  sales: ["stages", "reps", "dateRange_sales"],
  customers: ["sources", "dateRange_customers"],
  orders: ["products", "dateRange_orders"],
  support: ["priorities", "types", "dateRange_support"],
  productivity: ["employees", "dateRange_productivity"],
  "calls-log": ["reps", "types", "results", "dateRange_calls-log"],
};

export function ReportsFilterBar() {
  const {
    activeTab,
    activeFilterCount,
    filters,
    resetFilters,
  } = useReportsFilters();
  const activeFilters = useReportsActiveFilters();
  const [pinnedFilterIds, setPinnedFilterIds] = useState<string[]>(
    PER_TAB_PINNED["executive"]
  );

  const [prevTab, setPrevTab] = useState(activeTab);
  if (activeTab !== prevTab) {
    setPinnedFilterIds(PER_TAB_PINNED[activeTab] || []);
    setPrevTab(activeTab);
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm px-4 py-2.5">
      <CrmFilterChipRow
        activeFilters={activeFilters}
        pinnedFilterIds={pinnedFilterIds}
        onAddPinnedFilter={(id) =>
          setPinnedFilterIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
        }
        onRemovePinnedFilter={(id) =>
          setPinnedFilterIds((prev) => prev.filter((p) => p !== id))
        }
        onClearAll={() => resetFilters(activeTab as keyof typeof filters)}
        activeFilterCount={activeFilterCount}
        showMoreButton={false}
      />
    </div>
  );
}
