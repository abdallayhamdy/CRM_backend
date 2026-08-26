"use client"

import * as React from "react"
import { columns } from "./columns"
import { Phone, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Generic CRM Components
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { SortField } from "@/components/crm/SortPopover"
import { CrmColumnEditor, ColumnItem } from "@/components/crm/CrmColumnEditor"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

// Service and Types
import { activitiesService } from "@/services/activities"
import { Activity } from "@/lib/types/crm"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { useTableSettings } from "@/hooks/use-table-settings"
import { useSortState } from "@/hooks/use-sort-state"

// Sheets
import { CallPreviewSheet } from "./preview-sheet"
import { CallEditorSheet } from "@/components/activities/CallEditorSheet"

export default function CallsPage() {
  const [calls, setCalls] = React.useState<Activity[]>([])
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const callStats: SummaryStat<Activity>[] = React.useMemo(() => [
    { key: "all", label: "calls", filterFn: () => true },
    { key: "outgoing", label: "outgoing", filterFn: (c) => c.call_direction === 'Outbound' },
    { key: "unassigned", label: "unassigned", color: "text-badge-warning-text", filterFn: (c) => !c.owner_id },
    { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (c) => {
      const title = c.title?.toLowerCase().trim()
      if (!title) return false
      const count = calls.filter(x => x.title?.toLowerCase().trim() === title).length
      return count > 1
    }},
  ], [calls])

  const handleRowClick = React.useCallback((call: Activity) => {
    setSelectedCall(call)
    setPreviewOpen(true)
  }, [])

  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const { workspaceId, user, loading: authLoading } = useAuth()
  const { canCreateActivity } = usePermissions()
  const { tableSettings, handleTableSettingsChange } = useTableSettings()

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  // Tabs
  const [activeTab, setActiveTab] = React.useState("all")
  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All calls", closable: false },
        { id: "recorded", label: "Recorded", closable: true },
        { id: "mine", label: "My calls", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_call_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All calls", closable: false },
        { id: "recorded", label: "Recorded", closable: true },
        { id: "mine", label: "My calls", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All calls", closable: false },
        { id: "recorded", label: "Recorded", closable: true },
        { id: "mine", label: "My calls", closable: true },
      ]
    }
  })

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [perPage, setPerPage] = React.useState(25)

  const totalPages = Math.ceil(totalCount / perPage)
  const from = (currentPage - 1) * perPage
  const to = from + perPage - 1

  // Sheet states
  const [selectedCall, setSelectedCall] = React.useState<Activity | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [callEditorOpen, setCallEditorOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const { sortBy, sortDir, handleSortChange } = useSortState({ storageKey: "crm_calls_sort" })
  const [visibleColumns, setVisibleColumns] = React.useState<ColumnItem[]>([
    { id: "contact_name", label: "Contact", visible: true },
    { id: "type", label: "Type", visible: true },
    { id: "duration", label: "Duration", visible: true },
    { id: "status", label: "Status", visible: true },
    { id: "outcome", label: "Outcome", visible: true },
    { id: "created_at", label: "Created", visible: true },
  ])

  const callSortFields: SortField[] = [
    { value: "title", label: "Title" },
    { value: "contact_name", label: "Contact" },
    { value: "call_duration", label: "Duration" },
    { value: "call_direction", label: "Direction" },
    { value: "call_outcome", label: "Outcome" },
    { value: "created_at", label: "Created" },
  ]

  const handleColumnSave = React.useCallback((cols: ColumnItem[]) => {
    setVisibleColumns(cols)
  }, [])

  // Filters
  const {
    filters,
    activeFilterCount,
    sidebarOpen,
    setSidebarOpen,
    updateSearch,
    toggleProperty,
    updateDateRange,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
  } = useCrmFilters()

  const fetchCalls = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const { data, error, meta } = await activitiesService.getAll({
        type: 'call',
        workspace_id: workspaceId,
        limit: perPage,
        page: currentPage,
      })
      if (error) throw error
      setCalls(data || [])
      setTotalCount(meta?.total ?? 0)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch calls")
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, currentPage, perPage])

  React.useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  const filteredData = React.useMemo(() => {
    return calls.filter((call) => {
      if (activeTab === "recorded" && !call.call_recording_url) return false
      if (activeTab === "mine" && call.owner_id !== user?.id) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !call.title?.toLowerCase().includes(q) &&
          !call.description?.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [calls, activeTab, filters, user])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return filteredData
    const stat = callStats.find(s => s.key === summaryFilter)
    if (!stat) return filteredData
    return filteredData.filter(stat.filterFn)
  }, [filteredData, summaryFilter, callStats])

  const exportColumns = React.useMemo<ExportColumn[]>(() => [
    { id: "contact_name", label: "Contact", visible: true },
    { id: "type", label: "Type", visible: true },
    { id: "duration", label: "Duration", visible: true },
    { id: "status", label: "Status", visible: true },
    { id: "outcome", label: "Outcome", visible: true },
    { id: "created_at", label: "Created", visible: true },
  ], [])

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = filteredData
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const labelOf = (id: string) => exportColumns.find(c => c.id === id)?.label || id
    const fieldMap: Record<string, (c: Activity) => unknown> = {
      contact_name: (c) => c.contact ? `${c.contact.first_name ?? ""} ${c.contact.last_name ?? ""}`.trim() : "",
      type: (c) => c.type,
      duration: (c) => c.call_duration,
      status: (c) => c.call_direction,
      outcome: (c) => c.call_outcome,
      created_at: (c) => c.created_at,
    }
    const exportData = source.map((c) => {
      const row: Record<string, unknown> = {}
      for (const id of columnIds) {
        const accessor = fieldMap[id]
        row[labelOf(id)] = accessor ? accessor(c) : ""
      }
      return row
    })
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `calls_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Call',
        subcategory: 'Calls Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} calls`)
  }

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? filteredData.length : undefined
  }))

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_call_tabs", JSON.stringify(newTabs))
    if (activeTab === id) setActiveTab("all")
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_call_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_call_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_call_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_call_tabs", JSON.stringify(newTabs))
  }

  const activeFilters: GenericActiveFilter[] = [
    {
      id: "createDate",
      label: "Activity date",
      type: "date",
      value: filters.dateRanges["createDate"] || "all",
      onChange: (val) => updateDateRange("createDate", val as any),
    },
  ]

  const sidebarConfig: SidebarFilterConfig[] = [
    { id: "title", label: "Call title", type: "text" },
    { id: "createDate", label: "Activity date", type: "date" },
  ]

  return (
    <CrmPageLayout>
      <CrmPageHeader
        title="Calls"
        icon={<Phone className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreateActivity && (
              <Button
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
                onClick={() => setCallEditorOpen(true)}
              >
                Log call
              </Button>
            )}
          </div>
        }
      >
        <CrmTabs
          items={tabItems}
          activeTab={activeTab}
          onTabChange={(id) => { setActiveTab(id); setCurrentPage(1) }}
          onTabClose={handleTabClose}
          onReorder={handleTabReorder}
          onAddTab={handleAddTab}
          onRenameTab={handleTabRename}
          onColorChangeTab={handleTabColorChange}
          className="ml-0"
        />
      </CrmPageHeader>

      <div className="flex flex-col flex-1 min-h-0 border border-border rounded-xl overflow-hidden mx-2 mt-2">
        <CrmFilterBar
          placeholder="Search calls..."
          searchValue={filters.search}
          onSearchChange={updateSearch}
          activeFilters={activeFilters}
          onClearAll={clearAll}
          activeFilterCount={activeFilterCount}
          onAdvancedFilterClick={() => setSidebarOpen(true)}
          onExportClick={() => setExportOpen(true)}
          onEditColumnsClick={() => setColumnEditorOpen(true)}
          sortFields={callSortFields}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSortChange}
        tableSettings={tableSettings}
        onTableSettingsChange={handleTableSettingsChange}
      />

        <CrmPageContent>
          <div className="p-2 flex-1 min-h-0 flex flex-col">
            <div className="bg-background rounded-xl border border-border/60 overflow-hidden flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <CrmTableSkeleton columnCount={7} rowCount={10} />
              ) : calls.length === 0 ? (
                <div className="p-6">
                  <CrmEmptyState
                    title="No calls found"
                    description="Log calls from contacts or companies to see them here."
                    icon={Phone}
                    actionLabel={canCreateActivity ? "Log call" : undefined}
                    onAction={canCreateActivity ? () => setCallEditorOpen(true) : undefined}
                  />
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-6">
                  <CrmEmptyState
                    title="No calls found"
                    description="We couldn't find any calls matching your criteria. Try adjusting your filters or search query."
                    icon={Phone}
                    actionLabel="Clear Filters"
                    onAction={clearAll}
                  />
                </div>
              ) : (
                <>
                  <SummaryStatsBar
                    data={filteredData}
                    stats={callStats}
                    activeFilter={summaryFilter}
                    onFilterChange={setSummaryFilter}
                  />
                  <div className="flex-1 overflow-auto">
                    <CrmDataTable
                      columns={columns}
                      data={summaryFilteredData}
                      onRowClick={handleRowClick}
                      entityName="call"
                      hideFullPageAction
                      tableSettings={tableSettings}
                    />
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between gap-4 py-4 border-t border-border px-4">
                    <span className="text-[13px] text-muted-foreground">
                      {totalCount === 0 ? 0 : from + 1}–{Math.min(to + 1, totalCount)} of {totalCount} calls
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>
                      <span className="text-[13px] text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    <Select
                      value={String(perPage)}
                      onValueChange={(val) => {
                        setPerPage(Number(val))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="h-8 w-[110px] text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
        </CrmPageContent>
      </div>

      <CrmFilterSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        filters={filters}
        config={sidebarConfig}
        onToggleProperty={toggleProperty}
        onUpdateNumber={updateNumber}
        onClearAll={clearAll}
        onAddAdvancedFilter={addAdvancedFilter}
        onRemoveAdvancedFilter={removeAdvancedFilter}
        activeFilterCount={activeFilterCount}
      />

      <CallPreviewSheet
        call={selectedCall}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onSuccess={fetchCalls}
      />

      <CallEditorSheet
        open={callEditorOpen}
        onClose={() => setCallEditorOpen(false)}
        onSaved={fetchCalls}
        workspaceId={workspaceId}
      />

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Calls"
        columns={exportColumns}
        totalCount={totalCount}
        filteredCount={filteredData.length}
        selectedCount={0}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      <CrmColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={visibleColumns}
        onSave={handleColumnSave}
        title="Edit call columns"
        description="Choose which columns to show in your table and their order."
      />
    </CrmPageLayout>
  )
}
