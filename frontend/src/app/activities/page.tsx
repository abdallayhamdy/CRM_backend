"use client"

import * as React from "react"
import { columns } from "./columns"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/crm/BulkActionToolbar"

import { activitiesService } from "@/services/activities"
import type { Activity } from "@/lib/types/crm"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { TableSettings, loadTableSettings, saveTableSettings as persistTableSettings } from "@/components/crm/TableSettingsDialog"

const ACTIVITY_TYPE_TABS = [
  { id: "all", label: "All activities", closable: false },
  { id: "task", label: "Tasks", closable: true },
  { id: "call", label: "Calls", closable: true },
  { id: "email", label: "Emails", closable: true },
  { id: "meeting", label: "Meetings", closable: true },
  { id: "note", label: "Notes", closable: true },
]

const DEFAULT_COLUMNS = ["select", "type", "title", "status", "contact", "created_at"]

export default function ActivitiesPage() {
  const router = useRouter()
  const { workspaceId } = useAuth()
  const { canDeleteActivity } = usePermissions()

  const [activities, setActivities] = React.useState<Activity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("all")
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)
  const [totalCount, setTotalCount] = React.useState(0)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<string>("created_at")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [perPage] = React.useState(25)
  const [tableSettings, setTableSettings] = React.useState<TableSettings>(loadTableSettings)

  const handleTableSettingsChange = React.useCallback((s: TableSettings) => {
    setTableSettings(s)
    persistTableSettings(s)
  }, [])

  const {
    filters,
    activeFilterCount,
    updateSearch,
    toggleProperty,
    updateDateRange,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
  } = useCrmFilters()

  const activityStats: SummaryStat<Activity>[] = React.useMemo(() => [
    { key: "all", label: "activities", filterFn: () => true },
    { key: "tasks", label: "tasks", filterFn: (a: Activity) => a.type === "task" },
    { key: "calls", label: "calls", filterFn: (a: Activity) => a.type === "call" },
    { key: "emails", label: "emails", filterFn: (a: Activity) => a.type === "email" },
    { key: "meetings", label: "meetings", filterFn: (a: Activity) => a.type === "meeting" },
  ], [])

  const fetchActivities = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const { data, error, meta } = await activitiesService.getAll({
        workspace_id: workspaceId,
        search: filters.search || undefined,
        type: activeTab !== "all" ? activeTab : undefined,
        sort_by: sortBy || undefined,
        sort_dir: sortDir,
        limit: perPage,
        page: currentPage,
      })
      if (error) throw new Error(typeof error === "string" ? error : error.message)
      setActivities(data || [])
      setTotalCount(meta?.total || 0)
    } catch {
      toast.error("Failed to load activities")
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, filters.search, activeTab, sortBy, sortDir, perPage, currentPage])

  React.useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const summaryFilteredData = React.useMemo(() => {
    const stat = activityStats.find(s => s.key === summaryFilter)
    if (!stat) return activities
    return activities.filter(stat.filterFn)
  }, [activities, summaryFilter, activityStats])

  const {
    selectedIds, selectedItems, toggleOne,
    clearSelection, count
  } = useBulkSelection(summaryFilteredData)

  const handleBulkDelete = async () => {
    if (!canDeleteActivity) return
    try {
      await Promise.all(selectedItems.map(a => activitiesService.delete(a.id, workspaceId!)))
      toast.success(`Deleted ${count} activities`)
      clearSelection()
      fetchActivities()
    } catch {
      toast.error("Failed to delete activities")
    }
  }

  const from = (currentPage - 1) * perPage
  const to = from + perPage - 1

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = scope === "selected" && selectedItems.length > 0 ? selectedItems : summaryFilteredData
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const exportData = source.map(a => ({
      "Type": a.type,
      "Title": a.title || "",
      "Status": a.completed ? "Completed" : "Pending",
      "Contact": a.contact ? `${a.contact.first_name} ${a.contact.last_name || ""}`.trim() : "",
      "Created": a.created_at || "",
    }))
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `activities_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Activity',
        subcategory: 'Activities Exported',
        source: 'web',
      })
    }
    toast.success(`Exported ${exportData.length} activities`)
  }

  const exportColumns: ExportColumn[] = [
    { id: "type", label: "Type", visible: true },
    { id: "title", label: "Title", visible: true },
    { id: "status", label: "Status", visible: true },
    { id: "contact", label: "Contact", visible: true },
    { id: "created_at", label: "Created", visible: true },
  ]

  const tabsConfig = ACTIVITY_TYPE_TABS.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? totalCount : undefined,
  }))

  const sidebarConfig: SidebarFilterConfig[] = [
    { id: "type", label: "Activity Type", type: "property", options: ["task", "call", "email", "meeting", "note"] },
    { id: "status", label: "Status", type: "property", options: ["completed", "pending"] },
  ]

  const activeFilters: GenericActiveFilter[] = []

  return (
    <CrmPageLayout>
      <CrmPageHeader
        title="Activities"
        icon={<Zap className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[13px] gap-1.5"
              onClick={() => setExportOpen(true)}
            >
              Export
            </Button>
          </div>
        }
      />
      <CrmPageContent>
        <div className="flex flex-col h-full">
          <SummaryStatsBar
            data={summaryFilteredData}
            stats={activityStats}
            activeFilter={summaryFilter}
            onFilterChange={setSummaryFilter}
          />

          <CrmTabs
            items={tabsConfig}
            activeTab={activeTab}
            onTabChange={(id: string) => { setActiveTab(id); setCurrentPage(1) }}
            onTabClose={() => {}}
            onReorder={() => {}}
            onRenameTab={() => {}}
            onColorChangeTab={() => {}}
          />

          <CrmFilterBar
            searchValue={filters.search}
            onSearchChange={updateSearch}
            activeFilters={activeFilters}
            onClearAll={clearAll}
            onAdvancedFilterClick={() => setSidebarOpen(true)}
            activeFilterCount={activeFilterCount}
          />

          {count > 0 && canDeleteActivity && (
            <BulkActionToolbar
              count={count}
              entityName="activities"
              onClear={clearSelection}
              onDelete={handleBulkDelete}
            />
          )}

          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <CrmTableSkeleton />
            ) : summaryFilteredData.length === 0 ? (
              <CrmEmptyState
                icon={Zap}
                title="No activities found"
                description="Activities will appear here as they're created."
              />
            ) : (
              <>
                <CrmDataTable
                  columns={columns}
                  data={summaryFilteredData}
                  isLoading={isLoading}
                  entityName="activity"
                  selectedIds={selectedIds}
                  onToggleOne={toggleOne}
                  onRowClick={(activity: Activity) => {}}
                  tableSettings={tableSettings}
                />

                {totalCount > perPage && (
                  <div className="flex items-center justify-between gap-4 py-4 border-t border-border px-4">
                    <span className="text-[13px] text-muted-foreground">
                      {totalCount === 0 ? 0 : from + 1}–{Math.min(to + 1, totalCount)} of {totalCount} activities
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={to + 1 >= totalCount}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CrmPageContent>

      <CrmFilterSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        filters={filters}
        config={sidebarConfig}
        onToggleProperty={toggleProperty}
        onUpdateNumber={() => {}}
        onClearAll={clearAll}
        onAddAdvancedFilter={addAdvancedFilter}
        onRemoveAdvancedFilter={removeAdvancedFilter}
        activeFilterCount={activeFilterCount}
      />

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="activities"
        columns={exportColumns}
        totalCount={totalCount}
        filteredCount={summaryFilteredData.length}
        selectedCount={count}
        hasActiveFilter={summaryFilter !== null || activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />
    </CrmPageLayout>
  )
}
