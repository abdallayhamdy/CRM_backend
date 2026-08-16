"use client"

import * as React from "react"
import { columns } from "./columns"
import { DEAL_STAGES } from "./data"
import { Handshake, ChevronDown, Package, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Generic CRM Components
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"


import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { DealsPageHeader } from "./DealsPageHeader"
import { DealsTableView } from "./DealsTableView"
import { PropertyHistoryPanel } from "@/components/crm/PropertyHistoryPanel"
const DealsBoardView = dynamic(
  () => import("./DealsBoardView").then(mod => ({ default: mod.DealsBoardView })),
  { ssr: false }
)
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { DEAL_MORE_FILTERS } from "@/lib/filter-data"
import { CreateDealSheet } from "./create-deal-sheet"
import dynamic from "next/dynamic"
const RecordPreviewPanel = dynamic(
  () => import("@/components/crm/RecordPreviewPanel").then(mod => ({ default: mod.RecordPreviewPanel })),
  { ssr: false }
)
import { CrmColumnEditor } from "@/components/crm/CrmColumnEditor"
import { propertiesToGroups, propertiesToColumnDefs } from "@/lib/crm-properties"
import { useProperties } from "@/hooks/use-properties"
import { CrmDateCell } from "@/components/crm/CrmDateCell"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { dealsService } from "@/services/deals"
import { pipelinesService, Pipeline } from "@/services/pipelines"
import { Deal, Profile } from "@/lib/types/crm"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { toast } from "sonner"
import { useDealsActiveFilters } from "@/hooks/use-deals-active-filters"
import { useFilteredDeals } from "@/hooks/use-filtered-deals"
import { useDealsColumnOptions } from "@/hooks/use-deals-column-options"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { authService } from "@/services/auth"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/crm/BulkActionToolbar"
import type { BulkEditField } from "@/components/crm/BulkEditSheet"
const BulkEditSheet = dynamic(
  () => import("@/components/crm/BulkEditSheet").then(mod => ({ default: mod.BulkEditSheet })),
  { ssr: false }
)
const TaskEditorSheet = dynamic(
  () => import("@/components/activities/TaskEditorSheet").then(mod => ({ default: mod.TaskEditorSheet })),
  { ssr: false }
)
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import { usePanelCards } from "@/hooks/use-panel-cards"

const DEFAULT_BOARD_COLUMNS = [
  { id: "new", label: "New", color: "hsl(var(--stage-blue))" },
  { id: "qualified", label: "Qualified", color: "hsl(var(--primary))" },
  { id: "proposal", label: "Proposal", color: "hsl(var(--stage-teal))" },
  { id: "negotiation", label: "Negotiation", color: "hsl(var(--stage-red))" },
  { id: "closed_won", label: "Closed Won", color: "hsl(var(--stage-emerald))" },
  { id: "closed_lost", label: "Closed Lost", color: "hsl(var(--stage-red))" },
]

export default function DealsPage() {
  const [selectedDeal, setSelectedDeal] = React.useState<Deal | null>(null)
  const [dealData, setDealData] = React.useState<Deal[]>([])
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [owners, setOwners] = React.useState<Profile[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalReady, setTotalReady] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState("my")
  const [viewMode, setViewMode] = React.useState<"table" | "board">("board")
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const [historyDeal, setHistoryDeal] = React.useState<Deal | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const dealStats: SummaryStat<Deal>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of dealData) {
      const key = item.title?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "deals", filterFn: () => true },
      { key: "no_close_date", label: "no close date", filterFn: (d) => !d.close_date },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (d) => {
        const title = d.title?.toLowerCase().trim()
        if (!title) return false
        return duplicateKeys.has(title)
      }},
    ]
  }, [dealData])

  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All deals", closable: false },
        { id: "my", label: "My deals", closable: true },
        { id: "won", label: "Closed won", closable: true },
        { id: "lost", label: "Closed lost", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_deal_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All deals", closable: false },
        { id: "my", label: "My deals", closable: true },
        { id: "won", label: "Closed won", closable: true },
        { id: "lost", label: "Closed lost", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All deals", closable: false },
        { id: "my", label: "My deals", closable: true },
        { id: "won", label: "Closed won", closable: true },
        { id: "lost", label: "Closed lost", closable: true },
      ]
    }
  })

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [columnVersion, setColumnVersion] = React.useState(0)
  const [exportOpen, setExportOpen] = React.useState(false)

  const [frozenCount, setFrozenCount] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_deal_frozen_count')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [visibleColumnIds, setVisibleColumnIds] = React.useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_deal_visible_columns")
      if (saved) {
        try {
          const parsed: string[] = JSON.parse(saved)
          return [...new Set(parsed)]
        } catch (e) { /* corrupted localStorage — fall through to defaults */ }
      }
    }
    return ["select", "title", "stage", "amount", "closeDate", "owner", "createDate"]
  })

  const [pipelines, setPipelines] = React.useState<Pipeline[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = React.useState<string>('')

  const exportColumns = React.useMemo<ExportColumn[]>(() => {
    const labels: Record<string, string> = {
      select: "Select", title: "Deal Name", stage: "Stage",
      amount: "Amount", closeDate: "Close Date", owner: "Owner",
      createDate: "Created"
    }
    return visibleColumnIds.filter(id => id !== "select").map(id => ({
      id,
      label: labels[id] || id,
      visible: true,
    }))
  }, [visibleColumnIds])

  const router = useRouter()
  const { workspaceId, user, loading: authLoading } = useAuth()
  const { canCreateDeal, canEditDeal, canExportDeals, canDeleteDeal, canCreateTask } = usePermissions()
  const { properties } = useProperties("deal")
  const { tableSettings, saveTableSettings } = usePanelCards("deals")

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  // Use the generic CRM filters hook with pinned filter support
  const {
    filters,
    activeFilterCount,
    sidebarOpen,
    setSidebarOpen,
    pinnedFilterIds,
    addPinnedFilter,
    removePinnedFilter,
    updateSearch,
    toggleProperty,
    setProperty,
    updateDateRange,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
  } = useCrmFilters(
    ["owner", "stage", "closeDate"], 
    "deals-pinned-filters",
    activeTab
  )

  const debouncedSearch = useDebounce(filters.search, 300)

  React.useEffect(() => {
    const controller = new AbortController()
    async function load() {
      if (!workspaceId) return
      try {
        const { data: profileList } = await authService.listProfiles(workspaceId)
        if (!controller.signal.aborted && profileList) setOwners(profileList)
      } catch (err) {
        if (!controller.signal.aborted) {
          // Expected in standalone mode
        }
      }
    }
    load()
    return () => controller.abort()
  }, [workspaceId])

  const loadDeals = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const { data: fetchResult, error, meta } = await dealsService.getAll({
        ...filters,
        search: debouncedSearch
      }, {
        workspace_id: workspaceId,
        limit: 100 // Load a bit more for the board
      })

      if (error) throw error
      setDealData(fetchResult as any[])
      setTotalReady(meta?.total || 0)
    } catch (err) {
      toast.error("Failed to load deals")
      // Expected in standalone mode
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, filters, workspaceId])

  React.useEffect(() => {
    const controller = new AbortController()
    loadDeals()
    return () => controller.abort()
  }, [loadDeals, refreshKey])

  // Fetch pipelines and build dynamic board columns
  React.useEffect(() => {
    if (!workspaceId) return
    const fetchPipelines = async () => {
      try {
        const { data } = await pipelinesService.getAll(workspaceId)
        if (data && data.length > 0) {
          setPipelines(data)
          const defaultPipeline = data.find(p => p.is_default) || data[0]
          setSelectedPipelineId(defaultPipeline.id)
        }
      } catch (err) {
        console.error('Failed to fetch pipelines:', err)
      }
    }
    fetchPipelines()
  }, [workspaceId])

  // Derive unique owners from the full dataset for the filter dropdowns
  const allOwners = React.useMemo(() => {
    return owners.map(o => `${o.first_name || ''} ${o.last_name || ''}`.trim()).sort()
  }, [owners])

  const ownerIdMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    owners.forEach(o => {
      const name = `${o.first_name || ''} ${o.last_name || ''}`.trim()
      map[name] = o.clerk_user_id || o.id
    })
    return map
  }, [owners])

  // Map a slugified pipeline stage name to its pipeline_stage_id for moveStage
  const stageSlugToId = React.useMemo(() => {
    const map: Record<string, string> = {}
    pipelines.forEach(p => {
      p.stages?.forEach(s => {
        map[s.name.toLowerCase().replace(/\s+/g, '_')] = s.id
      })
    })
    return map
  }, [pipelines])

  // Custom toggleProperty to handle owner name -> id mapping
  const handleToggleProperty = (propertyId: string, value: string) => {
    if (propertyId === "owner" || propertyId === "deal-owner") {
      const ownerId = ownerIdMap[value] || value
      toggleProperty(propertyId, ownerId)
    } else {
      toggleProperty(propertyId, value)
    }
  }

  const handleSetProperty = (propertyId: string, values: string[]) => {
    if (propertyId === "owner" || propertyId === "deal-owner") {
      const mappedValues = values.map(v => ownerIdMap[v] || v)
      setProperty(propertyId, mappedValues)
    } else {
      setProperty(propertyId, values)
    }
  }

  // Column management logic
  const propertyGroups = React.useMemo(
    () => propertiesToGroups(properties),
    [properties]
  )

  const allPossibleColumns = React.useMemo(() => {
    const map = new Map<string, (typeof columns)[0]>()

    columns.forEach(col => {
      const id = col.id || (col as any).accessorKey
      if (id) map.set(id, col)
    })

    propertiesToColumnDefs<Deal>(properties).forEach(col => {
      if (col.id && !map.has(col.id)) map.set(col.id, col as (typeof columns)[0])
    })

    return map
  }, [properties])

  const allColumnOptions = useDealsColumnOptions({ visibleColumnIds, propertyGroups })

  const tableColumns = React.useMemo(() => {
    return visibleColumnIds
      .map(id => allPossibleColumns.get(id))
      .filter((col): col is (typeof columns)[0] => !!col)
  }, [allPossibleColumns, visibleColumnIds])

  const handleColumnSave = (columns: {id: string, visible: boolean}[], newFrozenCount: number) => {
    const newVisibleIds = columns.filter(c => c.visible).map(c => c.id)
    const uniqueIds = [...new Set(newVisibleIds)]
    setVisibleColumnIds(uniqueIds)
    setFrozenCount(newFrozenCount)
    setColumnVersion(v => v + 1)
    localStorage.setItem("crm_deal_visible_columns", JSON.stringify(uniqueIds))
    localStorage.setItem("crm_deal_frozen_count", JSON.stringify(newFrozenCount))
  }

  const filteredData = useFilteredDeals({ dealData, filters })

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return filteredData
    const stat = dealStats.find(s => s.key === summaryFilter)
    if (!stat) return filteredData
    return filteredData.filter(stat.filterFn)
  }, [filteredData, summaryFilter, dealStats])

  const {
    selectedIds, selectedItems, toggleOne, toggleAll,
    clearSelection, isAllSelected, isPartialSelected, count
  } = useBulkSelection(filteredData)

  const activeFilters = useDealsActiveFilters({
    pinnedFilterIds,
    filters,
    owners,
    allOwners,
    toggleProperty,
    updateDateRange,
    handleSetProperty,
    handleToggleProperty,
  })

  // Sidebar Configurations
  const sidebarConfig: SidebarFilterConfig[] = [
    { id: "name", label: "Deal name", type: "text" },
    { id: "owner", label: "Deal owner", type: "property", options: allOwners },
    { id: "stage", label: "Deal stage", type: "property", options: [...DEAL_STAGES] },
    { id: "amount", label: "Amount", type: "number" },
    { id: "closeDate", label: "Close date", type: "date" },
    { id: "createDate", label: "Create date", type: "date" },
    { id: "lastActivityDate", label: "Last activity date", type: "date" },
  ]

  const currentBoardColumns = React.useMemo(() => {
    const currentPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0]
    if (currentPipeline?.stages && currentPipeline.stages.length > 0) {
      const stageColors = [
        '#007AFF', '#6366F1', '#A855F7', '#EC4899',
        '#D93939', '#10B981', '#00A38D', '#F59E0B',
        '#3B82F6', '#8B5CF6', '#06B6D4', '#EF4444',
      ]
      return currentPipeline.stages.map((s, i) => ({
        id: s.name.toLowerCase().replace(/\s+/g, '_'),
        label: s.name,
        color: stageColors[i % stageColors.length],
      }))
    }
    return DEFAULT_BOARD_COLUMNS
  }, [pipelines, selectedPipelineId])

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? totalReady : undefined,
  }))

  const handleDealDragEnd = async (result: { active: string; over: string | null; overColumn?: string }) => {
    if (!canEditDeal) {
      toast.error("You don't have permission to edit deals")
      return
    }
    if (!workspaceId) return
    const { active, over, overColumn } = result
    if (!over) return
    if (active === over) return

    const deal = dealData.find(d => d.id === active)
    if (!deal) return

    const targetStageSlug = overColumn || over
    if (deal.stage === targetStageSlug) return

    const previousStage = deal.stage
    const previousStageId = deal.pipeline_stage_id
    const targetStageId = stageSlugToId[targetStageSlug]
    const targetLabel = currentBoardColumns.find(c => c.id === targetStageSlug)?.label || targetStageSlug

    // Optimistic update
    setDealData(prev => prev.map(d => d.id === active ? { ...d, stage: targetStageSlug, pipeline_stage_id: targetStageId ?? d.pipeline_stage_id } : d))

    try {
      if (!targetStageId) throw new Error("Pipeline stage not found")
      const { error } = await dealsService.moveStage(active, targetStageId, workspaceId)
      if (error) throw error
      toast.success(`Moved ${deal.title} to ${targetLabel}`)
    } catch (err) {
      // Revert on failure
      setDealData(prev => prev.map(d => d.id === active ? { ...d, stage: previousStage, pipeline_stage_id: previousStageId } : d))
      toast.error("Failed to move deal")
    }
  }

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_deal_tabs", JSON.stringify(newTabs))
    if (activeTab === id) setActiveTab("all")
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_deal_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_deal_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_deal_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_deal_tabs", JSON.stringify(newTabs))
    setActiveTab(id)
  }

  const handleUpdateCell = async (deal: Deal, field: string, value: any) => {
    if (!canEditDeal) {
      toast.error("You don't have permission to edit deals")
      return
    }
    if (!workspaceId) return
    try {
      let finalValue = value;
      if (field === 'amount') {
        // Clean currency formatting if user typed it
        const cleanValue = String(value).replace(/[^0-9.]/g, '');
        finalValue = parseFloat(cleanValue);
        if (isNaN(finalValue)) {
          toast.error("Invalid amount format");
          return;
        }
      }

      const { error } = await dealsService.update(deal.id, { [field]: finalValue }, workspaceId);
      if (error) throw error;

      toast.success("Deal updated");
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error("Failed to update deal");
      console.error("Failed to update deal:", { message: (err as Error)?.message });
    }
  };

  const handleBulkDelete = async () => {
    if (!workspaceId) return
    if (!canDeleteDeal) {
      toast.error("You don't have permission to delete deals")
      return
    }
    try {
      const results = await Promise.allSettled(selectedItems.map(d => dealsService.delete(d.id, workspaceId)))
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error("[deals] Some deletions failed:", failed)
        toast.error(`Failed to delete ${failed.length} deal${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} deal${succeeded > 1 ? 's' : ''}`)
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error("[deals] Bulk delete failed:", err)
      toast.error("Failed to delete deals")
    }
  }

  const handleBulkExport = () => {
    const exportData = selectedItems.map(d => ({
      "Deal Name": d.title,
      "Amount": d.amount,
      "Stage": d.stage,
      "Pipeline": d.pipeline,
    }))
    exportToCSV(exportData, `deals-export-${Date.now()}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Deal',
        subcategory: 'Deals Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${count} deals`)
  }

  const handleExportAll = () => {
    const exportData = dealData.map(d => ({
      "Deal Name": d.title,
      "Amount": d.amount,
      "Stage": d.pipeline_stage?.name || d.stage || "",
      "Close Date": d.close_date || "",
      "Owner": d.owner ? `${d.owner.first_name || ''} ${d.owner.last_name || ''}`.trim() : "Unassigned",
      "Pipeline": d.pipeline || "",
      "Created At": d.created_at || "",
      "Updated At": d.updated_at || "",
    }))
    exportToCSV(exportData, "deals")
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Deal',
        subcategory: 'Deals Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success("Deals exported successfully")
  }

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = scope === "selected" && selectedItems.length > 0 ? selectedItems : filteredData
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const labelOf = (id: string) => exportColumns.find(c => c.id === id)?.label || id
    const fieldMap: Record<string, (d: Deal) => unknown> = {
      title: (d) => d.title,
      stage: (d) => d.stage,
      amount: (d) => d.amount,
      closeDate: (d) => d.close_date,
      owner: (d) => d.owner ? `${d.owner.first_name ?? ""} ${d.owner.last_name ?? ""}`.trim() : "",
      createDate: (d) => d.created_at,
    }
    const exportData = source.map((d) => {
      const row: Record<string, unknown> = {}
      for (const id of columnIds) {
        const accessor = fieldMap[id]
        row[labelOf(id)] = accessor ? accessor(d) : ""
      }
      return row
    })
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `deals_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Deal',
        subcategory: 'Deals Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} deals`)
  }

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      id: "stage",
      label: "Stage",
      type: "select",
      options: [
        { value: "new", label: "New" },
        { value: "qualified", label: "Qualified" },
        { value: "proposal", label: "Proposal" },
        { value: "negotiation", label: "Negotiation" },
        { value: "appointment_scheduled", label: "Appointment Scheduled" },
        { value: "closed_won", label: "Closed Won" },
        { value: "closed_lost", label: "Closed Lost" },
      ],
    },
    {
      id: "owner_id",
      label: "Deal Owner",
      type: "select",
      options: owners.map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name} ${o.last_name}`.trim() })),
    },
  ], [owners])

  const handleBulkEditUpdate = async (updates: Record<string, any>) => {
    if (!workspaceId) return { success: 0, failed: selectedItems.length }
    try {
      const results = await Promise.allSettled(
        selectedItems.map(d => dealsService.update(d.id, updates as any, workspaceId))
      )
      const failed = results.filter(r => r.status === 'rejected')
      const succeeded = results.length - failed.length
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} deal${failed.length > 1 ? 's' : ''}`)
      }
      if (succeeded > 0) {
        toast.success(`Updated ${succeeded} deal${succeeded > 1 ? 's' : ''}`)
      }
      return { success: succeeded, failed: failed.length }
    } catch (err) {
      toast.error('Failed to update deals')
      console.error('[handleBulkEditUpdate]', err)
      return { success: 0, failed: selectedItems.length }
    }
  }

  const handleBulkAssign = async (ownerId: string, ownerName: string) => {
    if (!workspaceId) return
    try {
      const results = await Promise.allSettled(
        selectedItems.map(d => dealsService.update(d.id, { owner_id: ownerId } as any, workspaceId))
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        toast.error(`Failed to assign ${failed.length} deal${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) {
        toast.success(`Assigned ${succeeded} deal${succeeded > 1 ? 's' : ''} to ${ownerName}`)
      }
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      toast.error('Failed to assign deals')
      console.error('[handleBulkAssign]', err)
      clearSelection()
    }
  }

  return (
    <CrmPageLayout>
      <DealsPageHeader
        canCreate={canCreateDeal}
        canExport={canExportDeals}
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        onExport={handleExportAll}
        workspaceId={workspaceId}
        user={user}
        onSuccess={() => setRefreshKey(k => k + 1)}
        tabItems={tabItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleTabClose={handleTabClose}
        handleTabReorder={handleTabReorder}
        handleAddTab={handleAddTab}
        onRenameTab={handleTabRename}
        onColorChangeTab={handleTabColorChange}
      />

      <div className="flex flex-col flex-1 min-h-0 border border-border rounded-xl overflow-hidden mx-2 mt-2">
      <CrmFilterBar
        placeholder="Search deals..."
        searchValue={filters.search}
        onSearchChange={(v) => updateSearch(v)}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        pinnedFilterIds={pinnedFilterIds}
        onAddPinnedFilter={addPinnedFilter}
        onRemovePinnedFilter={removePinnedFilter}
        moreFilters={DEAL_MORE_FILTERS}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEditColumnsClick={() => setColumnEditorOpen(true)}
        onExportClick={() => setExportOpen(true)}
        tableSettings={tableSettings}
        onTableSettingsChange={saveTableSettings}
      />

      <CrmPageContent
        inlinePanel={
          <RecordPreviewPanel
            recordType="deal"
            recordId={selectedDeal?.id || null}
            open={!!selectedDeal}
            onOpenChange={(open) => !open && setSelectedDeal(null)}
            onSuccess={() => setRefreshKey(k => k + 1)}
          />
        }
      >
        <div className="p-2 flex-1 min-h-0 flex flex-col">
          <div className="bg-background rounded-xl border border-border/60 overflow-hidden flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <CrmTableSkeleton columnCount={visibleColumnIds.length - 1} rowCount={8} />
            ) : totalReady === 0 ? (
              <div className="p-6">
                <CrmEmptyState
                  title="No deals yet"
                  description="Create your first deal to start tracking your pipeline."
                  icon={Handshake}
                  actionLabel={canCreateDeal ? "Create deal" : undefined}
                  onAction={canCreateDeal ? () => setIsCreateOpen(true) : undefined}
                />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-6">
                <CrmEmptyState
                  title="No deals found"
                  description="We couldn't find any deals matching your criteria. Try adjusting your filters or search query."
                  icon={Handshake}
                  actionLabel="Clear Filters"
                  onAction={clearAll}
                />
              </div>
            ) : (
              <div key={viewMode} className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {viewMode === "table" ? (
                  <>
                    <SummaryStatsBar
                      data={filteredData}
                      stats={dealStats}
                      activeFilter={summaryFilter}
                      onFilterChange={setSummaryFilter}
                    />
                    <DealsTableView
                      filteredData={summaryFilteredData}
                      tableColumns={tableColumns}
                      columnVersion={columnVersion}
                      selectedIds={selectedIds}
                      toggleOne={toggleOne}
                      handleUpdateCell={handleUpdateCell}
                      setSelectedDeal={setSelectedDeal}
                      tableSettings={tableSettings}
                      onHistoryClick={(deal) => {
                        setHistoryDeal(deal)
                        setHistoryOpen(true)
                      }}
                    />
                  </>
                ) : (
                  <DealsBoardView
                    filteredData={filteredData}
                    boardColumns={currentBoardColumns}
                    setSelectedDeal={setSelectedDeal}
                    onDragEnd={handleDealDragEnd}
                  />
                )}
              </div>
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
        onToggleProperty={handleToggleProperty}
        onUpdateNumber={updateNumber}
        onClearAll={clearAll}
        onAddAdvancedFilter={addAdvancedFilter}
        onRemoveAdvancedFilter={removeAdvancedFilter}
        activeFilterCount={activeFilterCount}
      />

      <CrmColumnEditor 
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={allColumnOptions}
        propertyGroups={propertyGroups}
        onSave={handleColumnSave}
        title="Edit columns"
        description="Choose which columns to show in your table and their order."
      />

      <CreateDealSheet 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onDealCreated={loadDeals}
      />

      {count > 0 && canDeleteDeal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionToolbar
            count={count}
            entityName="deal"
            onDelete={handleBulkDelete}
            onAssignOwner={canEditDeal ? handleBulkAssign : undefined}
            onExport={canExportDeals ? handleBulkExport : undefined}
            onEdit={canEditDeal ? () => setBulkEditOpen(true) : undefined}
            onCreateTask={canCreateTask ? () => setCreateTaskOpen(true) : undefined}
            onClear={clearSelection}
            members={owners.map(o => ({ id: o.clerk_user_id || o.id, name: `${o.first_name} ${o.last_name}`.trim() }))}
          />
        </div>
      )}

      <BulkEditSheet
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
        entityName="deal"
        count={count}
        fields={bulkEditFields}
        onBulkUpdate={handleBulkEditUpdate}
      />

      {selectedItems.length > 0 && workspaceId && (
        <TaskEditorSheet
          open={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
          entityType="deal"
          entityId={selectedItems[0]?.id || ""}
          workspaceId={workspaceId}
        />
      )}

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Deals"
        columns={exportColumns}
        totalCount={totalReady}
        filteredCount={filteredData.length}
        selectedCount={count}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      <PropertyHistoryPanel
        entityType="deal"
        entityId={historyDeal?.id ?? null}
        entityTitle={historyDeal?.title || undefined}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </CrmPageLayout>
  )
}
