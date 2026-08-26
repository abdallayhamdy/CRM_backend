"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { getCompanyColumns } from "./columns"
import { ChevronDown, Search, LayoutGrid, Building2, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { exportToCSV } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { logAudit } from "@/lib/audit"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { CrmPageHeader, CrmPageLayout } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { CrmColumnEditor, ColumnItem } from "@/components/crm/CrmColumnEditor"
import dynamic from "next/dynamic"
const CompaniesBoardView = dynamic(
  () => import("./CompaniesBoardView").then(mod => ({ default: mod.CompaniesBoardView })),
  { ssr: false }
)
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { COMPANY_MORE_FILTERS } from "@/lib/filter-data"
import { buildPropertySidebarFilters } from "@/lib/filter-data"
import { DateRangeFilter } from "@/hooks/use-crm-filters"
import { propertiesToGroups, propertiesToColumnDefs } from "@/lib/crm-properties"
import { useProperties } from "@/hooks/use-properties"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { BulkActionToolbar } from "@/components/crm/BulkActionToolbar"
import type { BulkEditField } from "@/components/crm/BulkEditSheet"
const BulkEditSheet = dynamic(
  () => import("@/components/crm/BulkEditSheet").then(mod => ({ default: mod.BulkEditSheet })),
  { ssr: false }
)
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
const TaskEditorSheet = dynamic(
  () => import("@/components/activities/TaskEditorSheet").then(mod => ({ default: mod.TaskEditorSheet })),
  { ssr: false }
)

import { companiesService } from "@/services/companies"
import { authService } from "@/services/auth"
import { laravelApi } from "@/lib/laravel-api"
import { PropertyHistoryPanel } from "@/components/crm/PropertyHistoryPanel"

import { useObjectConfig } from "@/hooks/use-object-config"
import { Company, Profile } from "@/lib/types/crm"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermissions } from "@/hooks/use-permissions"
import { CreateCompanySheet } from "./create-company-sheet"
import { CompanyPreviewSheet } from "./preview-sheet"

const SAVED_VIEWS = [
  {
    category: "SalesHub Provided",
    views: [
      { id: "all", name: "All companies", creator: "SalesHub", type: "Standard" },
      { id: "my", name: "My companies", creator: "SalesHub", type: "Standard" },
      { id: "new-today", name: "New today", creator: "SalesHub", type: "Standard" },
    ]
  }
]

function ImportDialog({ open, onOpenChange, workspaceId, user, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string | null
  user: any
  onSuccess?: () => void
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [importing, setImporting] = React.useState(false)
  const [polling, setPolling] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setImporting(false)
      setPolling(false)
      setStatus(null)
    }
  }, [open])

  const handleImport = async () => {
    if (!file || !workspaceId) return

    setImporting(true)
    setStatus("Uploading...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const { data, error } = await laravelApi.upload<{
        status: string
        data: { import_id: string; status: string }
      }>("/companies/import", formData)

      if (error) {
        toast.error(error)
        setImporting(false)
        return
      }

      const importId = data?.data?.import_id
      if (!importId) {
        toast.error("Import started but no ID returned")
        setImporting(false)
        return
      }

      setPolling(true)
      setStatus("Processing...")

      const pollInterval = setInterval(async () => {
        const { data: statusData, error: statusError } = await laravelApi.get<{
          status: string
          data: {
            id: string
            status: string
            total_rows: number
            processed_rows: number
            failed_rows: number
            errors: string[] | null
            file_name: string
          }
        }>(`/companies/import/${importId}`)

        if (statusError) {
          clearInterval(pollInterval)
          setImporting(false)
          setPolling(false)
          toast.error("Failed to check import status")
          return
        }

        const importStatus = statusData?.data
        if (!importStatus) return

        if (["completed", "completed_with_errors", "failed"].includes(importStatus.status)) {
          clearInterval(pollInterval)
          setImporting(false)
          setPolling(false)

          if (importStatus.status === "completed") {
            const count = importStatus.processed_rows || importStatus.total_rows || 0
            toast.success(`Successfully imported ${count} companies`)
            if (workspaceId) {
              logAudit({
                workspace_id: workspaceId,
                action: "Import",
                category: "Company",
                subcategory: "Companies Imported",
                source: "web",
                modifiedBy: user,
              })
            }
            onOpenChange(false)
            onSuccess?.()
          } else if (importStatus.status === "completed_with_errors") {
            const processed = importStatus.processed_rows || 0
            const failed = importStatus.failed_rows || 0
            toast.warning(`Imported ${processed} companies, ${failed} failed`)
            onOpenChange(false)
            onSuccess?.()
          } else {
            toast.error(`Import failed: ${importStatus.errors?.join(", ") || "Unknown error"}`)
          }
          setStatus(null)
        } else {
          const processed = importStatus.processed_rows || 0
          const total = importStatus.total_rows || 0
          setStatus(total > 0 ? `Processing... ${processed}/${total}` : "Processing...")
        }
      }, 2000)
    } catch (err) {
      toast.error("Failed to import companies")
      setImporting(false)
      setPolling(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => !importing && onOpenChange(false)}
    >
      <div
        className="bg-background rounded-xl border border-border shadow-xl p-6 w-[480px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Import Companies</h3>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Click to select a CSV file"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setFile(f)
              }}
            />
          </div>

          {status && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {status}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CompaniesPage() {
  const [data, setData] = React.useState<Company[]>([])
  const [owners, setOwners] = React.useState<Profile[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalReady, setTotalReady] = React.useState(0)
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const [historyCompany, setHistoryCompany] = React.useState<Company | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const companyStats: SummaryStat<Company>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of data) {
      const key = item.name?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "companies", filterFn: () => true },
      { key: "no_industry", label: "no industry", filterFn: (c) => !c.industry },
      { key: "unassigned", label: "unassigned", color: "text-badge-warning-text", filterFn: (c) => !c.owner },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (c) => {
        const name = c.name?.toLowerCase().trim()
        if (!name) return false
        return duplicateKeys.has(name)
      }},
    ]
  }, [data])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return data
    const stat = companyStats.find(s => s.key === summaryFilter)
    if (!stat) return data
    return data.filter(stat.filterFn)
  }, [data, summaryFilter, companyStats])

  const { workspaceId, user } = useAuth()
  const { canCreateCompany, canEditCompany, canDeleteCompany, canCreateTask } = usePermissions()
  const { properties } = useProperties("company")
  const { tableSettings, saveTableSettings } = usePanelCards("companies")
  const { stages: lifecycleStages } = useObjectConfig("company")

  const boardColumns = React.useMemo(() => {
    return [
      ...lifecycleStages.filter(s => s.is_active).map(s => ({
        id: s.id,
        label: s.name,
        color: s.color,
      })),
      { id: "null", label: "Unassigned", color: "#94A3B8" }
    ]
  }, [lifecycleStages])

  const {
    selectedIds, selectedItems, toggleOne,
    clearSelection, count
  } = useBulkSelection(data)

  const [activeTab, setActiveTab] = React.useState("all")

  // Use generic CRM filters
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
    ["owner", "createDate", "lastActivity", "lifecycle_stage"],
    "companies-pinned-filters",
    activeTab
  )
  const debouncedSearch = useDebounce(filters.search, 300)

  const [addViewSearch, setAddViewSearch] = React.useState("")
  const [isAddViewOpen, setIsAddViewOpen] = React.useState(false)
  const [selectedAddViewId, setSelectedAddViewId] = React.useState("all")
  const [openTabIds, setOpenTabIds] = React.useState(["all", "my", "new-today"])
  const [tabLabels, setTabLabels] = React.useState<Record<string, string>>({})
  const [tabColors, setTabColors] = React.useState<Record<string, string>>({})
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false)
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const router = useRouter()
  const [viewMode, setViewMode] = React.useState<"table" | "board">("table")
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [columnVersion, setColumnVersion] = React.useState(0)
  const [importOpen, setImportOpen] = React.useState(false)

  const [sortBy, setSortBy] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_companies_sort_by')
      if (saved === 'created_at') {
        localStorage.setItem('crm_companies_sort_by', 'createDate')
        return 'createDate'
      }
      return saved || ''
    }
    return ''
  })
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('crm_companies_sort_dir') as "asc" | "desc") || 'desc'
    return 'desc'
  })

  const DEFAULT_COMPANY_COLUMNS = [
    "select", "name", "industry", "size", "owner", "phone", "lifecycle_stage", "createDate"
  ]

  const [visibleColumnIds, setVisibleColumnIds] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_company_visible_columns')
      if (saved) {
        try {
          const parsed: string[] = JSON.parse(saved)
          return [...new Set(parsed)]
        } catch { return DEFAULT_COMPANY_COLUMNS }
      }
    }
    return DEFAULT_COMPANY_COLUMNS
  })

  const [frozenCount, setFrozenCount] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_company_frozen_columns')
      return saved ? parseInt(saved) : 0
    }
    return 0
  })

  const loadOwners = React.useCallback(async () => {
    if (!workspaceId) return
    const { data: profileList } = await authService.listProfiles(workspaceId)
    if (profileList) setOwners(profileList)
  }, [workspaceId])

  React.useEffect(() => {
    loadOwners()
  }, [loadOwners])

  // Memoized column logic
  const baseTableColumns = React.useMemo(() => {
    return getCompanyColumns(lifecycleStages)
  }, [lifecycleStages])

  const propertyGroups = React.useMemo(
    () => propertiesToGroups(properties),
    [properties]
  )

  const allPossibleColumns = React.useMemo(() => {
    const map = new Map<string, ColumnDef<Company>>()

    baseTableColumns.forEach(col => {
      const id = col.id || (col as { accessorKey?: string }).accessorKey
      if (id) map.set(id, col)
    })

    propertiesToColumnDefs<Company>(properties).forEach(col => {
      if (col.id && !map.has(col.id)) map.set(col.id, col as ColumnDef<Company>)
    })

    return map
  }, [baseTableColumns, properties])

  const tableColumns = React.useMemo(() => {
    return visibleColumnIds
      .map(id => allPossibleColumns.get(id))
      .filter((col): col is ColumnDef<Company> => !!col)
  }, [allPossibleColumns, visibleColumnIds])

  const allColumnOptions = React.useMemo(() => {
    const seen = new Set<string>()
    const allPotential: ColumnItem[] = []

    baseTableColumns.forEach(col => {
      if (col.id === 'select') return
      const colId = col.id || (col as { accessorKey?: string }).accessorKey
      if (!colId || seen.has(colId)) return
      seen.add(colId)
      allPotential.push({
        id: colId,
        label: (col.header as string) || colId,
        visible: visibleColumnIds.includes(colId)
      })
    })

    propertyGroups.forEach(group => {
      group.items.forEach(prop => {
        if (!seen.has(prop.id)) {
          seen.add(prop.id)
          allPotential.push({
            id: prop.id,
            label: prop.label,
            visible: visibleColumnIds.includes(prop.id)
          })
        }
      })
    })

    const visibleColumns = visibleColumnIds
      .filter(id => id !== 'select')
      .map(id => allPotential.find(c => c.id === id))
      .filter((c): c is ColumnItem => !!c)

    const hiddenColumns = allPotential.filter(c => !visibleColumnIds.includes(c.id))

    return [...visibleColumns, ...hiddenColumns]
  }, [visibleColumnIds, baseTableColumns, propertyGroups])

  const handleColumnSave = (updatedColumns: ColumnItem[], newFrozenCount: number) => {
    const newVisibleIds = [
      "select",
      ...updatedColumns.filter(c => c.visible).map(c => c.id)
    ]
    const uniqueIds = [...new Set(newVisibleIds)]
    setVisibleColumnIds(uniqueIds)
    setFrozenCount(newFrozenCount)
    setColumnVersion(v => v + 1)
    localStorage.setItem('crm_company_visible_columns', JSON.stringify(uniqueIds))
    localStorage.setItem('crm_company_frozen_columns', newFrozenCount.toString())
    toast.success("Columns updated successfully")
  }

  const loadCompanies = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
        const { data: fetchResult, error, meta } = await companiesService.getAll({
          search: debouncedSearch,
          filters: {
            properties: filters.properties,
            dateRanges: filters.dateRanges,
            numbers: filters.numbers as any,
          } as any,
          workspace_id: workspaceId,
          limit: 100,
          sortBy,
          sortDir,
          view: activeTab,
          currentUserId: user?.id,
        })

      if (error) throw error
      setData(fetchResult as Company[])
      setTotalReady(meta?.total || 0)
    } catch (err) {
      toast.error("Failed to load companies")
      // Expected in standalone mode
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, filters, workspaceId, refreshKey, sortBy, sortDir, activeTab, user?.id])

  React.useEffect(() => {
    const controller = new AbortController()
    loadCompanies()
    return () => controller.abort()
  }, [loadCompanies])

  const allOwners = owners.map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name || ''} ${o.last_name || ''}`.trim() || 'Unassigned' }))

  const tabItems = openTabIds.map(id => {
    const standardTab = [
      { id: "all", label: "All companies", closable: false },
      { id: "my", label: "My companies", closable: true },
      { id: "new-today", label: "New today", closable: true },
    ].find(t => t.id === id);

    if (standardTab) {
      return {
        ...standardTab,
        label: tabLabels[id] || standardTab.label,
        color: tabColors[id],
        count: totalReady
      };
    }

    // Handle custom views if we had them
    const savedView = SAVED_VIEWS.flatMap(c => c.views).find(v => v.id === id);
    return {
      id,
      label: tabLabels[id] || savedView?.name || id,
      color: tabColors[id],
      count: totalReady,
      closable: true
    };
  })

  const handleAddTab = (id: string) => {
    if (!openTabIds.includes(id)) {
      setOpenTabIds([...openTabIds, id]);
    }
    setActiveTab(id);
    setIsAddViewOpen(false);
  }

  const handleCloseTab = (id: string) => {
    const newOpenTabs = openTabIds.filter(tid => tid !== id);
    setOpenTabIds(newOpenTabs);
    if (activeTab === id) {
      setActiveTab(newOpenTabs[0] || "all");
    }
  }

  const handleTabRename = (id: string, newName: string) => {
    setTabLabels(prev => ({ ...prev, [id]: newName }))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    setTabColors(prev => ({ ...prev, [id]: color }))
    toast.success("Color updated")
  }

  const getFilterConfig = (id: string) => {
    for (const category of COMPANY_MORE_FILTERS) {
      const item = category.items.find(i => i.id === id);
      if (item) return item;
    }
    return null;
  }

  const activeFilters: GenericActiveFilter[] = pinnedFilterIds.map(id => {
    if (id === "owner" || id === "company-owner") {
      return {
        id: "owner",
        label: "Company owner",
        type: "searchable-property",
        options: allOwners,
        value: filters.properties["owner"] || [],
        onChange: (val: string[]) => setProperty("owner", val as string[])
      }
    }
    if (id === "createDate" || id === "create-date") {
      return { id: "createDate", label: "Create date", type: "date", value: filters.dateRanges["createDate"] || "all", onChange: (val: string) => updateDateRange("createDate", val as DateRangeFilter) }
    }
    if (id === "lastActivity" || id === "lastActivityDate" || id === "last-activity-date") {
      return { id: "lastActivity", label: "Last activity date", type: "date", value: filters.dateRanges["lastActivity"] || "all", onChange: (val: string) => updateDateRange("lastActivity", val as DateRangeFilter) }
    }
    if (id === "lifecycle_stage" || id === "lifecycle-stage") {
      return {
        id: "lifecycle_stage",
        label: "Lifecycle stage",
        type: "simple-property",
        options: lifecycleStages.filter(s => s.is_active).map(s => ({
          value: s.id,
          label: s.name,
          color: s.color,
        })),
        value: filters.properties["lifecycle_stage"] || [],
        onChange: (val: string | string[]) => toggleProperty("lifecycle_stage", Array.isArray(val) ? val[0] || '' : val),
      }
    }

    const config = getFilterConfig(id);
    if (!config) return null;

    let type: GenericActiveFilter["type"] = "generic";
    if (config.type === "text" || config.type === "link") type = "text";
    else if (config.type === "date") type = "date";
    else if (config.type === "number") type = "number";
    else if (config.type === "check" || config.type === "property") type = "simple-property";

    return {
      id,
      label: config.name,
      type,
      options: (config as { options?: string[] }).options || (config.type === "check" ? ["Yes", "No"] : []),
      value: type === "date" ? filters.dateRanges[id] || "all"
           : type === "number" ? (filters.properties[id] ? JSON.parse(filters.properties[id][0] || "null") : null)
           : type === "text" ? (filters.properties[id]?.[0] || "")
           : filters.properties[id] || [],
      onChange: (val: string | string[]) => {
          if (type === "date") updateDateRange(id, val as DateRangeFilter);
          else if (type === "number") setProperty(id, [JSON.stringify(val)]);
          else if (type === "text") setProperty(id, val ? [val as string] : []);
          else toggleProperty(id, Array.isArray(val) ? val[0] || '' : val);
      }
    }
  }).filter(Boolean) as GenericActiveFilter[];

  const sidebarConfig: SidebarFilterConfig[] = React.useMemo(() => {
    const flattened = COMPANY_MORE_FILTERS.flatMap(cat =>
      cat.items.map(item => ({
        id: item.id,
        label: item.name,
        type: (item.type === 'check' || item.type === 'property') ? 'property' as const
             : (item.type === 'text' || item.type === 'link') ? 'text' as const
             : item.type as 'text' | 'property' | 'number' | 'date',
        options: (item as { options?: string[] }).options || (item.type === 'check' ? ['Yes', 'No'] : [])
      }))
    )

    // Add owner manually as it's often missing or differently named in static data
    const ownerFilter = { id: "owner", label: "Company owner", type: "property" as const, options: allOwners.map(o => o.value) }
    const propertyFilters = buildPropertySidebarFilters(properties)

    return [
      { id: "company-name", label: "Company name", type: "text" as const },
      ownerFilter,
      { id: "createDate", label: "Create date", type: "date" as const },
      ...flattened.filter(f => !["company-name", "owner", "createDate"].includes(f.id)),
      ...propertyFilters
    ]
  }, [allOwners, properties])

  const handleToggleProperty = React.useCallback((propId: string, value: string) => {
    if (propId === "owner" || propId === "company-owner") {
      toggleProperty("owner", value);
    } else {
      toggleProperty(propId, value);
    }
  }, [toggleProperty]);

  const handleUpdateCell = async (company: Company, columnId: string, value: string | number | boolean | null) => {
    if (!canEditCompany) {
      toast.error("You don't have permission to edit companies")
      return
    }
    if (!workspaceId) return

    try {
      const standardFields = ['name', 'industry', 'size', 'phone', 'lifecycle_stage']

      const updates: Partial<Company> = {}
      if (standardFields.includes(columnId)) {
        (updates as Record<string, unknown>)[columnId] = value
      } else {
        updates.custom_fields = {
          ...(company.custom_fields as Record<string, unknown> || {}),
          [columnId]: value
        }
      }

      const { error } = await companiesService.update(company.id, updates, workspaceId)
      if (error) throw error

      toast.success("Company updated")
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update company"
      console.error("Failed to update company:", { message: (err as Error)?.message })
      toast.error(message)
    }
  }

  const handleDragEnd = async (result: { active: string; over: string | null; overColumn?: string }) => {
    if (!canEditCompany) {
      toast.error("You don't have permission to edit companies")
      return
    }
    if (!workspaceId) return

    const { active, over, overColumn } = result
    if (!over) return
    if (active === over) return

    const company = data.find(c => c.id === active)
    if (!company) return

    const targetStage = (overColumn || over) === "null" ? null : (overColumn || over)
    if (company.lifecycle_stage === targetStage) return

    setRefreshKey(k => k + 1)

    try {
      const { error } = await companiesService.update(active, {
        lifecycle_stage: targetStage
      }, workspaceId)
      if (error) throw error

      toast.success(`Moved ${company.name} to ${targetStage === "null" ? "Unassigned" : targetStage}`)
    } catch (err) {
      setRefreshKey(k => k + 1)
      toast.error("Failed to move company")
    }
  }

  const handleBulkDelete = async () => {
    if (!workspaceId) return
    if (!canDeleteCompany) {
      toast.error("You don't have permission to delete companies")
      return
    }
    try {
      const results = await Promise.allSettled(selectedItems.map(c => companiesService.delete(c.id, workspaceId)))
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error("[companies] Some deletions failed:", failed)
        toast.error(`Failed to delete ${failed.length} company${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} company${succeeded > 1 ? 's' : ''}`)
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error("[companies] Bulk delete failed:", err)
      toast.error("Failed to delete companies")
    }
  }

  const handleBulkExport = () => {
    const exportData = selectedItems.map(c => ({
      "Name": c.name,
      "Domain": c.domain,
      "Industry": c.industry,
      "Phone": c.phone || "",
      "Owner": c.owner ? `${c.owner.first_name || ''} ${c.owner.last_name || ''}`.trim() : "Unassigned",
      "Lifecycle Stage": c.lifecycle_stage,
      "Size": c.size || "",
      "Created At": c.created_at || "",
      "Updated At": c.updated_at || "",
    }))
    exportToCSV(exportData, `companies-export-${Date.now()}`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Company',
        subcategory: 'Companies Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${count} companies`)
  }

  const handleExport = () => {
    const exportData = data.map(c => ({
      "Name": c.name,
      "Domain": c.domain,
      "Industry": c.industry,
      "Phone": c.phone || "",
      "Owner": c.owner ? `${c.owner.first_name || ''} ${c.owner.last_name || ''}`.trim() : "Unassigned",
      "Lifecycle Stage": c.lifecycle_stage,
      "Size": c.size || "",
      "Created At": c.created_at || "",
      "Updated At": c.updated_at || "",
    }))
    exportToCSV(exportData, "companies")
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Company',
        subcategory: 'Companies Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success("Companies exported successfully")
  }

  const exportColumns = React.useMemo<ExportColumn[]>(() => {
    const labels: Record<string, string> = {
      select: "Select", name: "Company Name", industry: "Industry",
      size: "Size", owner: "Owner", phone: "Phone",
      lifecycle_stage: "Lifecycle Stage", createDate: "Created"
    }
    const standard = DEFAULT_COMPANY_COLUMNS.filter(id => id !== "select").map(id => ({
      id,
      label: labels[id] || id,
      visible: visibleColumnIds.includes(id),
    }))
    const custom = properties
      .filter(p => !p.is_archived)
      .map(p => ({ id: `cf_${p.name}`, label: p.label || p.name, visible: false }))
    return [...standard, ...custom]
  }, [visibleColumnIds, properties])

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = scope === "selected" && selectedItems.length > 0 ? selectedItems : data
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const labelOf = (id: string) => exportColumns.find(c => c.id === id)?.label || id
    const fieldMap: Record<string, (c: Company) => unknown> = {
      name: (c) => c.name,
      industry: (c) => c.industry,
      size: (c) => c.size,
      owner: (c) => c.owner ? `${c.owner.first_name ?? ""} ${c.owner.last_name ?? ""}`.trim() : "",
      phone: (c) => c.phone,
      lifecycle_stage: (c) => c.lifecycle_stage,
      createDate: (c) => c.created_at,
      ...Object.fromEntries(
        properties.filter(p => !p.is_archived).map(p => [
          `cf_${p.name}`,
          (c: Company) => c.custom_fields?.[p.name] ?? ""
        ])
      ),
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
    exportToCSV(exportData, `companies_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Company',
        subcategory: 'Companies Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} companies`)
  }

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      id: "lifecycle_stage",
      label: "Lifecycle Stage",
      type: "select",
      options: lifecycleStages.filter(s => s.is_active).map(s => ({ value: s.id, label: s.name })),
    },
    {
      id: "owner_id",
      label: "Company Owner",
      type: "select",
      options: owners.map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name || ''} ${o.last_name || ''}`.trim() || 'Unassigned' })),
    },
  ], [lifecycleStages, owners])

  const handleBulkEditUpdate = async (updates: Record<string, any>) => {
    if (!workspaceId) return { success: 0, failed: selectedItems.length }
    try {
      const results = await Promise.allSettled(
        selectedItems.map(c => companiesService.update(c.id, updates as any, workspaceId))
      )
      const failed = results.filter(r => r.status === 'rejected')
      const succeeded = results.length - failed.length
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} compan${failed.length > 1 ? 'ies' : 'y'}`)
      }
      if (succeeded > 0) {
        toast.success(`Updated ${succeeded} compan${succeeded > 1 ? 'ies' : 'y'}`)
      }
      return { success: succeeded, failed: failed.length }
    } catch (err) {
      toast.error('Failed to update companies')
      console.error('[handleBulkEditUpdate]', err)
      return { success: 0, failed: selectedItems.length }
    }
  }

  const handleBulkAssign = async (ownerId: string, ownerName: string) => {
    if (!workspaceId) return
    try {
      const results = await Promise.allSettled(
        selectedItems.map(c => companiesService.update(c.id, { owner_id: ownerId } as any, workspaceId))
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        toast.error(`Failed to assign ${failed.length} company${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) {
        toast.success(`Assigned ${succeeded} company${succeeded > 1 ? 's' : ''} to ${ownerName}`)
      }
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      toast.error('Failed to assign companies')
      console.error('[handleBulkAssign]', err)
      clearSelection()
    }
  }

  return (
    <CrmPageLayout className="h-full bg-muted/50 pb-0">
      <CrmPageHeader
        title="Companies"
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canCreateCompany && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
                  >
                    <span className="hidden sm:inline">Add companies</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg rounded-lg p-1">
                  <DropdownMenuItem
                    className="flex items-center px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-muted/50 cursor-pointer rounded-md transition-colors"
                    onClick={() => {
                      setIsCreateSheetOpen(true);
                    }}
                  >
                    Create new
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-muted/50 cursor-pointer rounded-md transition-colors"
                    onClick={() => setImportOpen(true)}
                  >
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="outline"
              className="h-9 font-bold gap-2"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        }
      >
        <CrmTabs
          items={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTabClose={handleCloseTab}
          onAddTab={() => setIsAddViewOpen(true)}
          onReorder={(items) => setOpenTabIds(items.map(i => i.id))}
          onRenameTab={handleTabRename}
          onColorChangeTab={handleTabColorChange}
          className="ml-0"
        />
      </CrmPageHeader>

      <div className="flex flex-col flex-1 min-h-0 border border-border rounded-xl overflow-hidden mx-2 mt-2 mb-2 shadow-sm">
      <CrmFilterBar
        placeholder="Search companies..."
        searchValue={filters.search}
        onSearchChange={updateSearch}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        pinnedFilterIds={pinnedFilterIds}
        onAddPinnedFilter={addPinnedFilter}
        onRemovePinnedFilter={removePinnedFilter}
        moreFilters={COMPANY_MORE_FILTERS}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEditColumnsClick={() => setColumnEditorOpen(true)}
        onExportClick={() => setExportOpen(true)}
        tableSettings={tableSettings}
        onTableSettingsChange={saveTableSettings}
      />
      {/* Main Table */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-muted/30 relative mt-0.5">
        <div className="p-2 flex-1 min-h-0 flex flex-col">
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <CrmTableSkeleton columnCount={visibleColumnIds.length - 1} rowCount={10} />
            ) : totalReady === 0 ? (
               <div className="p-6">
                  <CrmEmptyState
                    title="No companies yet"
                    description="Add your first company to start organizing your accounts."
                    icon={Building2}
                    actionLabel={canCreateCompany ? "Create company" : undefined}
                    onAction={canCreateCompany ? () => setIsCreateSheetOpen(true) : undefined}
                  />
               </div>
            ) : data.length === 0 ? (
               <div className="p-6">
                  <CrmEmptyState
                    title="No companies found"
                    description="We couldn't find any companies matching your criteria. Try adjusting your filters or search query."
                    icon={Building2}
                    actionLabel="Clear Filters"
                    onAction={clearAll}
                  />
               </div>
            ) : viewMode === "table" ? (
              <div className="flex flex-col flex-1 min-h-0">
                <SummaryStatsBar
                  data={data}
                  stats={companyStats}
                  activeFilter={summaryFilter}
                  onFilterChange={setSummaryFilter}
                />
                <CrmDataTable
                  key={`companies-table-${columnVersion}`}
                  columns={tableColumns}
                  data={summaryFilteredData}
                  onRowClick={(company) => setSelectedCompany(company)}
                  onUpdateCell={handleUpdateCell}
                  onHistoryClick={(company) => {
                    setHistoryCompany(company)
                    setHistoryOpen(true)
                  }}
                  entityName="company"
                  selectedIds={selectedIds}
                  onToggleOne={toggleOne}
                  tableSettings={tableSettings}
                />
              </div>
            ) : (
              <CompaniesBoardView
                data={data}
                boardColumns={boardColumns}
                setSelectedCompany={setSelectedCompany}
                onDragEnd={handleDragEnd}
              />
            )}
          </div>
        </div>
      </div>
      </div>

      <CrmFilterSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        filters={filters}
        config={sidebarConfig}
        onToggleProperty={handleToggleProperty}
        onUpdateNumber={updateNumber}
        onUpdateDateRange={(propId, val) => updateDateRange(propId, val as any)}
        onClearAll={clearAll}
        onAddAdvancedFilter={addAdvancedFilter}
        onRemoveAdvancedFilter={removeAdvancedFilter}
        activeFilterCount={activeFilterCount}
      />

      {/* Add View Popover */}
      <Popover open={isAddViewOpen} onOpenChange={setIsAddViewOpen}>
        <PopoverTrigger className="hidden"><div /></PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="w-[760px] p-0 overflow-hidden border-none shadow-2xl rounded-xl z-50">
          <div className="flex flex-col h-[520px] bg-background">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for a view" className="pl-9 h-10 border-border rounded-lg" value={addViewSearch} onChange={(e) => setAddViewSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-[340px] border-r border-border overflow-y-auto p-4">
                {SAVED_VIEWS.map(cat => (
                  <div key={cat.category} className="mb-6">
                    <h3 className="px-3 mb-2 text-[14px] font-bold text-foreground">{cat.category} ({cat.views.length})</h3>
                    <div className="space-y-0.5">
                      {cat.views.map(view => (
                        <button
                          key={view.id}
                          onClick={() => setSelectedAddViewId(view.id)}
                          className={cn("w-full text-left px-3 py-2 rounded-lg text-[14px] font-medium transition-colors", selectedAddViewId === view.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted")}
                        >
                          {view.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-muted/30 p-8 flex flex-col items-center justify-center text-center">
                <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-[14px] text-muted-foreground font-medium">Select a view to see its details and preview filters.</p>
              </div>
            </div>
            <div className="h-[64px] border-t border-border px-4 flex items-center justify-between bg-background shrink-0">
              <div className="flex items-center gap-3">
                <Button className="bg-foreground text-primary-foreground hover:bg-foreground/90 h-9 px-6 font-bold rounded-lg" onClick={() => handleAddTab(selectedAddViewId)}>Add</Button>
                <Button variant="outline" className="h-9 px-6 font-bold rounded-lg" onClick={() => setIsAddViewOpen(false)}>Cancel</Button>
              </div>
              <button className="text-[14px] font-bold text-primary hover:underline pr-4">All Views</button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <CrmColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={allColumnOptions}
        propertyGroups={propertyGroups}
        onSave={handleColumnSave}
        onCreateProperty={() => router.push("/settings/properties/create?objectType=company")}
        title="Edit columns"
        description="Choose which columns to show in your table and their order."
      />

      <CreateCompanySheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onCompanyCreated={loadCompanies}
      />

      <CompanyPreviewSheet
        company={selectedCompany}
        open={!!selectedCompany}
        onOpenChange={(open) => !open && setSelectedCompany(null)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      {count > 0 && canDeleteCompany && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionToolbar
            count={count}
            entityName="company"
            onDelete={handleBulkDelete}
            onAssignOwner={canEditCompany ? handleBulkAssign : undefined}
            onExport={handleBulkExport}
            onEdit={canEditCompany ? () => setBulkEditOpen(true) : undefined}
            onCreateTask={canCreateTask ? () => setCreateTaskOpen(true) : undefined}
            onClear={clearSelection}
            members={owners.map(o => ({ id: o.clerk_user_id || o.id, name: `${o.first_name || ''} ${o.last_name || ''}`.trim() || 'Unassigned' }))}
          />
        </div>
      )}

      <BulkEditSheet
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
        entityName="company"
        count={count}
        fields={bulkEditFields}
        onBulkUpdate={handleBulkEditUpdate}
      />

      {selectedItems.length > 0 && workspaceId && (
        <TaskEditorSheet
          open={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
          entityType="company"
          entityId={selectedItems[0]?.id || ""}
          workspaceId={workspaceId}
        />
      )}

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Companies"
        columns={exportColumns}
        totalCount={totalReady}
        filteredCount={data.length}
        selectedCount={count}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        workspaceId={workspaceId}
        user={user}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <PropertyHistoryPanel
        entityType="company"
        entityId={historyCompany?.id ?? null}
        entityTitle={historyCompany?.name || undefined}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </CrmPageLayout>
  )
}
