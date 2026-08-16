"use client"

import * as React from "react"
import { getCoreColumns, createDynamicColumn } from "./columns"
import { CONTACT_FIELD_MAPPING, STANDARD_CONTACT_FIELDS } from "./contact-field-mapping"
import { ContactsPageHeader } from "./ContactsPageHeader"
import { ContactsTableView } from "./ContactsTableView"
const ContactsBoardView = dynamic(
  () => import("./ContactsBoardView").then(mod => ({ default: mod.ContactsBoardView })),
  { ssr: false }
)
import { MORE_FILTERS } from "@/lib/filter-data"
import { CreateContactSheet } from "./create-contact-sheet"
import dynamic from "next/dynamic"
const RecordPreviewPanel = dynamic(
  () => import("@/components/crm/RecordPreviewPanel").then(mod => ({ default: mod.RecordPreviewPanel })),
  { ssr: false }
)
import { UserPlus, UserRound, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToCSV } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

// Generic CRM Components
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmFilterSidebar } from "@/components/crm/CrmFilterSidebar"
import type { SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { PropertyHistoryPanel } from "@/components/crm/PropertyHistoryPanel"
import { CrmColumnEditor, ColumnItem } from "@/components/crm/CrmColumnEditor"


import { useCrmFilters, DateRangeFilter } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
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
import { usePanelCards } from "@/hooks/use-panel-cards"

import { contactsService, getColumn } from "@/services/contacts"
import { companiesService } from "@/services/companies"
import { Contact, Profile, Company } from "@/lib/types/crm"
import { useAuth } from "@/hooks/use-auth"
import { logAudit } from "@/lib/audit"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { toast } from "sonner"
import { useActiveFilters } from "@/hooks/use-active-filters"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermissions } from "@/hooks/use-permissions"
import { propertiesToGroups } from "@/lib/crm-properties"
import { useProperties } from "@/hooks/use-properties"
import { authService } from "@/services/auth"
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"
import { useObjectConfig } from "@/hooks/use-object-config"

export default function ContactsPage() {
  const [data, setData] = React.useState<Contact[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalReady, setTotalReady] = React.useState(0)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [viewMode, setViewMode] = React.useState<"table" | "board">("table")
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const [historyContact, setHistoryContact] = React.useState<Contact | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const contactStats: SummaryStat<Contact>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of data) {
      const key = item.email?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "contacts", filterFn: () => true },
      { key: "unassigned", label: "unassigned", color: "text-badge-warning-text", filterFn: (c) => !c.owner },
      { key: "no_lifecycle", label: "no lifecycle stage", filterFn: (c) => !c.lifecycle_stage },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (c) => {
        const email = c.email?.toLowerCase().trim()
        if (!email) return false
        return duplicateKeys.has(email)
      }},
    ]
  }, [data])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return data
    const stat = contactStats.find(s => s.key === summaryFilter)
    if (!stat) return data
    return data.filter(stat.filterFn)
  }, [data, summaryFilter, contactStats])

  const [previewContact, setPreviewContact] = React.useState<Contact | null>(null)
  const [createContactOpen, setCreateContactOpen] = React.useState(false)
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [owners, setOwners] = React.useState<Profile[]>([])
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null)

  const { workspaceId, user } = useAuth()
  const { tableSettings, saveTableSettings } = usePanelCards("contacts")
  const { properties } = useProperties("contact")
  const { canCreateContact, canExportContacts, canEditContact, canDeleteContact, canCreateTask } = usePermissions()
  const { stages: lifecycleStages } = useObjectConfig("contact")

  const [sortBy, setSortBy] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_contacts_sort_by')
      // Migrate stale value
      if (saved === 'created_at') {
        localStorage.setItem('crm_contacts_sort_by', 'createDate')
        return 'createDate'
      }
      return saved || ''
    }
    return ''
  })
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('crm_contacts_sort_dir') as "asc" | "desc") || 'desc'
    return 'desc'
  })

  const boardColumns = React.useMemo(() => {
    return [
      ...lifecycleStages.filter(s => s.is_active).map(s => ({
        id: s.id,
        label: s.name,
        color: s.color,
      })),
      { id: "null", label: "Unassigned", color: "var(--stage-slate-light)" }
    ]
  }, [lifecycleStages])

  const {
    selectedIds, selectedItems, toggleOne, toggleAll,
    clearSelection, isAllSelected, isPartialSelected, count
  } = useBulkSelection(data)

  // Default visible columns (IDs from CORE_COLUMNS)
  const DEFAULT_CONTACT_COLUMNS = [
    "select", "first_name", "last_name", "email", "phone", "company", "lifecycle_stage", "lead_status", "owner", "createDate", "updated_at"
  ]

  const [visibleColumnIds, setVisibleColumnIds] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_contact_visible_columns')
      if (saved) {
        try {
          let cols: string[] = JSON.parse(saved)
          // Migration: replace "name" with "first_name" and "last_name"
          if (cols.includes("name")) {
            cols = cols.filter((id: string) => id !== "name")
            const nameIndex = cols.indexOf("email")
            if (nameIndex !== -1) {
              cols.splice(nameIndex, 0, "first_name", "last_name")
            } else {
              cols.unshift("first_name", "last_name")
            }
          }
          // Migration: replace "created_at" with "createDate"
          if (cols.includes("created_at")) {
            cols = cols.map((id: string) => id === "created_at" ? "createDate" : id)
          }
          return [...new Set(cols)]
        } catch { return DEFAULT_CONTACT_COLUMNS }
      }
    }
    return DEFAULT_CONTACT_COLUMNS
  })

  const [frozenCount, setFrozenCount] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_contact_frozen_columns')
      return saved ? parseInt(saved) : 0
    }
    return 0
  })
  const [columnVersion, setColumnVersion] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState("all")

  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All contacts", closable: false },
        { id: "my", label: "My contacts", closable: true },
        { id: "unassigned", label: "Unassigned", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_contact_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All contacts", closable: false },
        { id: "my", label: "My contacts", closable: true },
        { id: "unassigned", label: "Unassigned", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All contacts", closable: false },
        { id: "my", label: "My contacts", closable: true },
        { id: "unassigned", label: "Unassigned", closable: true },
      ]
    }
  })

  // Load dynamic columns config
  const propertyGroups = React.useMemo(
    () => propertiesToGroups(properties),
    [properties]
  )

  const baseTableColumns = React.useMemo(() => {
    const coreIds = new Set(['full_name', 'first_name', 'last_name', 'email', 'phone', 'company', 'company_name', 'lifecycle_stage', 'lead_status', 'owner', 'created_at', 'updated_at', 'select'])

    const dynamicCols = properties
      .filter(prop => !coreIds.has(prop.name))
      .map(prop => createDynamicColumn({
        id: prop.name,
        label: prop.label,
        type: prop.field_type
      }))

    const ownerOptions = owners.map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name} ${o.last_name}`.trim() }))
    const companyOptions = companies.map(c => ({ value: c.id, label: c.name }))

    return [...getCoreColumns(lifecycleStages, properties, ownerOptions, companyOptions), ...dynamicCols]
  }, [properties, lifecycleStages, owners, companies])

  const {
    filters,
    activeFilterCount,
    sidebarOpen,
    setSidebarOpen,
    pinnedFilterIds,
    updateSearch,
    toggleProperty,
    setProperty,
    updateDateRange,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
    addPinnedFilter,
    removePinnedFilter,
  } = useCrmFilters(
    ["contactOwner", "created_at", "lastActivity", "leadStatus", "lifecycle_stage"],
    "crm_contacts_pinned_filters",
    activeTab
  )

  const debouncedSearch = useDebounce(filters.search, 300)

  React.useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()
    async function loadUserAndOwners() {
      if (!workspaceId) return
      try {
        const [{ data: userRes }, { data: profileList }, { data: companyList }] = await Promise.all([
          authService.getCurrentUser(),
          authService.listProfiles(workspaceId),
          companiesService.getAll({ workspace_id: workspaceId, limit: 500 })
        ])
        if (!controller.signal.aborted) {
          if (userRes) setCurrentUser(userRes)
          if (profileList) setOwners(profileList)
          if (companyList) setCompanies(companyList as unknown as Company[])
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          // Expected in standalone mode
          toast.error("Failed to load user data")
        }
      }
    }
    loadUserAndOwners()
    return () => controller.abort()
  }, [workspaceId])

  // Fetch logic
  React.useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    async function loadContacts() {
      if (!workspaceId) return
      setIsLoading(true)
      try {
        const { data: fetchResult, error, meta } = await contactsService.getAll({
          search: debouncedSearch,
          filters: filters,
          workspace_id: workspaceId,
          limit: 100,
          view: activeTab,
          currentUserId: currentUser?.id,
          sortBy: sortBy,
          sortDir: sortDir,
        })

        if (error) {
          const errorMessage =
            typeof (error as any) === 'string'
              ? (error as any)
              : typeof (error as any)?.message === 'string'
                ? (error as any).message
                : typeof (error as any)?.error === 'string'
                  ? (error as any).error
                  : typeof (error as any)?.message === 'undefined'
                    ? 'Unknown error'
                    : String((error as any)?.message ?? error)

          console.error("Failed to load contacts:", { message: errorMessage, error })
          throw new Error(errorMessage)
        }
        if (!controller.signal.aborted) {
          setData(fetchResult as unknown as Contact[])
          setTotalReady(meta?.total || 0)
        }
      } catch (_err) {
        if (!controller.signal.aborted) {
          // Expected in standalone mode
          const err = _err as any
          const message = typeof err?.message === 'string' ? err.message : "Failed to load contacts"
          toast.error(message)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    loadContacts()
    return () => controller.abort()
  }, [debouncedSearch, filters, refreshKey, activeTab, workspaceId, currentUser, sortBy, sortDir])


  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? totalReady : undefined
  }))

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_contact_tabs", JSON.stringify(newTabs))
    if (activeTab === id) {
      setActiveTab("all")
    }
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_contact_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_contact_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_contact_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_contact_tabs", JSON.stringify(newTabs))
    setActiveTab(id)
  }

  const handleToggleProperty = React.useCallback((propertyId: string, value: string) => {
    toggleProperty(propertyId, value)
  }, [toggleProperty])

  const handleSetProperty = React.useCallback((propertyId: string, values: string[]) => {
    setProperty(propertyId, values)
  }, [setProperty])

  const activeFilters = useActiveFilters({
    pinnedFilterIds,
    filters,
    lifecycleStages,
    owners,
    handleSetProperty,
    handleToggleProperty,
    updateDateRange,
  })

  const tableColumns = React.useMemo(() => {
    // Create a map for quick lookup
    const colMap = new Map(baseTableColumns.map(col => {
      const id = col.id || (col as { accessorKey?: string }).accessorKey
      return [id, col]
    }))

    // Map over visibleColumnIds to maintain the user's defined order
    return visibleColumnIds
      .map(id => colMap.get(id))
      .filter((col): col is typeof baseTableColumns[0] => !!col)
  }, [baseTableColumns, visibleColumnIds])

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
  }, [visibleColumnIds, propertyGroups, baseTableColumns])

  const handleColumnSave = (updatedColumns: ColumnItem[], newFrozenCount: number) => {
    const newVisibleIds = [
      "select",
      ...updatedColumns.filter(c => c.visible).map(c => c.id)
    ]
    const uniqueIds = [...new Set(newVisibleIds)]

    setVisibleColumnIds(uniqueIds)
    setFrozenCount(newFrozenCount)
    setColumnVersion(v => v + 1)
    localStorage.setItem('crm_contact_visible_columns', JSON.stringify(uniqueIds))
    localStorage.setItem('crm_contact_frozen_columns', newFrozenCount.toString())

    toast.success("Columns updated successfully")
    setColumnEditorOpen(false)
  }

  const exportColumns = React.useMemo<ExportColumn[]>(() => {
    const labels: Record<string, string> = {
      select: "Select", first_name: "First Name", last_name: "Last Name",
      email: "Email", phone: "Phone", company: "Company",
      lifecycle_stage: "Lifecycle Stage", lead_status: "Lead Status",
      owner: "Owner", createDate: "Created", updated_at: "Updated"
    }
    return DEFAULT_CONTACT_COLUMNS.filter(id => id !== "select").map(id => ({
      id,
      label: labels[id] || id,
      visible: visibleColumnIds.includes(id),
    }))
  }, [visibleColumnIds])

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (!canExportContacts) {
      toast.error("You don't have permission to export contacts")
      return
    }
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = scope === "selected" && selectedItems.length > 0 ? selectedItems : data
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const labelOf = (id: string) => exportColumns.find(c => c.id === id)?.label || id
    const fieldMap: Record<string, (c: Contact) => unknown> = {
      first_name: (c) => c.first_name,
      last_name: (c) => c.last_name,
      email: (c) => c.email,
      phone: (c) => c.phone,
      company: (c) => c.company?.name,
      lifecycle_stage: (c) => c.lifecycle_stage,
      lead_status: (c) => c.lead_status,
      owner: (c) => c.owner ? `${c.owner.first_name ?? ""} ${c.owner.last_name ?? ""}`.trim() : "",
      createDate: (c) => c.created_at,
      updated_at: (c) => c.updated_at,
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
    exportToCSV(exportData, `contacts_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Contact',
        subcategory: 'Contacts Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} contacts`)
  }

  const sidebarConfig = React.useMemo(() => {
    const ownerOptions = owners
      .map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name || ''} ${o.last_name || ''}`.trim() }))
      .filter(o => o.label)
      .map(o => o.value)

    const leadStatusOptions = LEAD_STATUS_OPTIONS.map(o => o.value)

    return MORE_FILTERS.map(group => ({
      category: group.category,
      items: group.items.map(item => {
        if (item.id === "contactOwner") {
          return { id: item.id, label: item.name, type: "property" as const, options: ownerOptions }
        }
        if (item.id === "leadStatus") {
          return { id: item.id, label: item.name, type: "property" as const, options: leadStatusOptions }
        }
        return {
          id: item.id,
          label: item.name,
          type: item.type as SidebarFilterConfig['type'],
          options: (item as { options?: string[] }).options
        }
      })
    }))
  }, [owners])

  const handleUpdateCell = async (contact: Contact, columnId: string, value: string | number | boolean | null) => {
    if (!canEditContact) {
      toast.error("You don't have permission to edit contacts")
      return
    }
    
    try {
      // Map UI column IDs / display names → actual DB column names
      const dbColumn = CONTACT_FIELD_MAPPING[columnId] ?? getColumn(columnId)
      
      const updates: Record<string, unknown> = {}
      if (STANDARD_CONTACT_FIELDS.has(dbColumn)) {
        updates[dbColumn] = value
      } else {
        updates.custom_fields = {
          ...(contact.custom_fields as Record<string, unknown> || {}),
          [dbColumn]: value
        }
      }

      const { data, error } = await contactsService.update(contact.id, updates as Partial<Contact>, workspaceId!)
        
      if (error) {
        throw new Error((error as any).message || JSON.stringify(error))
      }

      toast.success("Contact updated")
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update contact"
      toast.error(message)
    }
  }

  const handleContactDragEnd = async (result: { active: string; over: string | null; overColumn?: string }) => {
    const { active, over, overColumn } = result
    if (!over) return
    if (active === over) return

    const contact = data.find(c => c.id === active)
    if (!contact) return

    const targetStage = overColumn || over
    if (contact.lifecycle_stage === targetStage) return

    // Optimistic update
    setRefreshKey(k => k + 1)

    try {
      const { error } = await contactsService.update(active, {
        lifecycle_stage: targetStage
      }, workspaceId!)
      if (error) throw error

      toast.success(`Moved ${contact.first_name} to ${targetStage}`)
    } catch (err) {
      setRefreshKey(k => k + 1)
      toast.error("Failed to move contact")
    }
  }

  const handleBulkDelete = async () => {
    if (!canDeleteContact) {
      toast.error("You don't have permission to delete contacts")
      return
    }
    try {
      const results = await Promise.allSettled(selectedItems.map(c => contactsService.delete(c.id, workspaceId!)))
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error("[contacts] Some deletions failed:", failed)
        toast.error(`Failed to delete ${failed.length} contact${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} contact${succeeded > 1 ? 's' : ''}`)
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error("[contacts] Bulk delete failed:", err)
      toast.error("Failed to delete contacts")
    }
  }

  const handleBulkExport = () => {
    if (!canExportContacts) {
      toast.error("You don't have permission to export contacts")
      return
    }
    const exportData = selectedItems.map(c => ({
      "First Name": c.first_name,
      "Last Name": c.last_name,
      "Email": c.email,
      "Phone": c.phone,
      "Lifecycle Stage": c.lifecycle_stage,
    }))
    exportToCSV(exportData, `contacts-export-${Date.now()}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Contact',
        subcategory: 'Contacts Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${count} contacts`)
  }

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      id: "lifecycle_stage",
      label: "Lifecycle Stage",
      type: "select",
      options: lifecycleStages.filter(s => s.is_active).map(s => ({ value: s.id, label: s.name })),
    },
    {
      id: "lead_status",
      label: "Lead Status",
      type: "select",
      options: LEAD_STATUS_OPTIONS,
    },
    {
      id: "owner_id",
      label: "Contact Owner",
      type: "select",
      options: owners.map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name} ${o.last_name}`.trim() })),
    },
  ], [lifecycleStages, owners])

  const handleBulkEditUpdate = async (updates: Record<string, any>) => {
    try {
      const results = await Promise.allSettled(
        selectedItems.map(c => contactsService.update(c.id, updates as any, workspaceId!))
      )
      const failed = results.filter(r => r.status === 'rejected')
      const succeeded = results.length - failed.length
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} contact${failed.length > 1 ? 's' : ''}`)
      }
      if (succeeded > 0) {
        toast.success(`Updated ${succeeded} contact${succeeded > 1 ? 's' : ''}`)
      }
      return { success: succeeded, failed: failed.length }
    } catch (err) {
      toast.error('Failed to update contacts')
      console.error('[handleBulkEditUpdate]', err)
      return { success: 0, failed: selectedItems.length }
    }
  }

  const handleBulkAssign = async (ownerId: string, ownerName: string) => {
    if (!canEditContact) {
      toast.error("You don't have permission to edit contacts")
      return
    }
    try {
      const results = await Promise.allSettled(
        selectedItems.map(c => contactsService.update(c.id, { owner_id: ownerId } as any, workspaceId!))
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        toast.error(`Failed to assign ${failed.length} contact${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) {
        toast.success(`Assigned ${succeeded} contact${succeeded > 1 ? 's' : ''} to ${ownerName}`)
      }
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      toast.error('Failed to assign contacts')
      console.error('[handleBulkAssign]', err)
      clearSelection()
    }
  }


  return (
    <CrmPageLayout>
      <ContactsPageHeader
        canCreate={canCreateContact}
        canExport={canExportContacts}
        data={data}
        workspaceId={workspaceId}
        user={user}
        setCreateContactOpen={setCreateContactOpen}
        tabItems={tabItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleTabClose={handleTabClose}
        handleTabReorder={handleTabReorder}
        handleAddTab={handleAddTab}
        onRenameTab={handleTabRename}
        onColorChangeTab={handleTabColorChange}
        onDataChange={() => setRefreshKey(k => k + 1)}
        selectedCount={selectedIds.size}
        selectedContact={selectedIds.size === 1 ? selectedItems[0] : null}
      />

      <div className="flex flex-col flex-1 min-h-0 border border-border rounded-xl overflow-hidden mx-2 mt-2">
        <CrmFilterBar
          placeholder="Search contacts..."
          searchValue={filters.search}
          onSearchChange={updateSearch}
          activeFilters={activeFilters}
          pinnedFilterIds={pinnedFilterIds}
          onAddPinnedFilter={addPinnedFilter}
          onRemovePinnedFilter={removePinnedFilter}
          onClearAll={clearAll}
          activeFilterCount={activeFilterCount}
          onAdvancedFilterClick={() => setSidebarOpen(true)}
          onEditColumnsClick={() => setColumnEditorOpen(true)}
          onExportClick={() => setExportOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          tableSettings={tableSettings}
          onTableSettingsChange={saveTableSettings}
        />

        <CrmPageContent
          inlinePanel={
            <RecordPreviewPanel
              recordType="contact"
              recordId={previewContact?.id || null}
              open={!!previewContact}
              onOpenChange={(open) => !open && setPreviewContact(null)}
              onSuccess={() => setRefreshKey(k => k + 1)}
            />
          }
        >
        <div className="p-2 flex-1 min-h-0 flex flex-col">
          <div className="bg-background rounded-xl border border-border overflow-hidden flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <CrmTableSkeleton columnCount={visibleColumnIds.length - 1} rowCount={10} />
            ) : totalReady === 0 && activeFilterCount === 0 ? (
              <div className="p-6">
                <CrmEmptyState
                  title="No contacts yet"
                  description="Add your first contact to start building your pipeline."
                  icon={UserRound}
                  actionLabel={canCreateContact ? "Create contact" : undefined}
                  onAction={canCreateContact ? () => setCreateContactOpen(true) : undefined}
                />
              </div>
            ) : data.length === 0 ? (
              <div className="p-6">
                <CrmEmptyState
                  title="No contacts found"
                  description="We couldn't find any contacts matching your criteria. Try adjusting your filters or search query."
                  icon={UserRound}
                  actionLabel="Clear Filters"
                  onAction={clearAll}
                />
              </div>
            ) : (
              <div key={viewMode} className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {viewMode === "table" ? (
                  <>
                    <SummaryStatsBar
                      data={data}
                      stats={contactStats}
                      activeFilter={summaryFilter}
                      onFilterChange={setSummaryFilter}
                    />
                    <ContactsTableView
                      data={summaryFilteredData}
                      tableColumns={tableColumns}
                      columnVersion={columnVersion}
                      selectedIds={selectedIds}
                      toggleOne={toggleOne}
                      tableSettings={tableSettings}
                      handleUpdateCell={handleUpdateCell}
                      setPreviewContact={setPreviewContact}
                      onHistoryClick={(contact) => {
                        setHistoryContact(contact)
                        setHistoryOpen(true)
                      }}
                    />
                  </>
                ) : (
                  <ContactsBoardView
                    data={data}
                    boardColumns={boardColumns}
                    setPreviewContact={setPreviewContact}
                    onDragEnd={handleContactDragEnd}
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
        onUpdateDateRange={(propId, val) => updateDateRange(propId, val as any)}
        onClearAll={clearAll}
        onAddAdvancedFilter={addAdvancedFilter}
        onRemoveAdvancedFilter={removeAdvancedFilter}
        activeFilterCount={activeFilterCount}
      />

      <CreateContactSheet
        open={createContactOpen}
        onOpenChange={setCreateContactOpen}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <CrmColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={allColumnOptions}
        propertyGroups={propertyGroups}
        onSave={handleColumnSave}
      />

      {count > 0 && canDeleteContact && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionToolbar
            count={count}
            entityName="contact"
            onDelete={handleBulkDelete}
            onAssignOwner={canEditContact ? handleBulkAssign : undefined}
            onExport={canExportContacts ? handleBulkExport : undefined}
            onEdit={canEditContact ? () => setBulkEditOpen(true) : undefined}
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
        entityName="contact"
        count={count}
        fields={bulkEditFields}
        onBulkUpdate={handleBulkEditUpdate}
      />

      {selectedItems.length > 0 && workspaceId && (
        <TaskEditorSheet
          open={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
          entityType="contact"
          entityId={selectedItems[0]?.id || ""}
          workspaceId={workspaceId}
        />
      )}

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Contacts"
        columns={exportColumns}
        totalCount={totalReady}
        filteredCount={data.length}
        selectedCount={count}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      <PropertyHistoryPanel
        entityType="contact"
        entityId={historyContact?.id ?? null}
        entityTitle={
          historyContact
            ? `${historyContact.first_name || ""} ${historyContact.last_name || ""}`.trim() || undefined
            : undefined
        }
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </CrmPageLayout>
  )
}
