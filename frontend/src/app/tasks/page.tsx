"use client"

import * as React from "react"
import { columns } from "./columns"
import { CheckCircle2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Generic CRM Components
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { BulkActionToolbar } from "@/components/crm/BulkActionToolbar"
import type { BulkEditField } from "@/components/crm/BulkEditSheet"
const BulkEditSheet = dynamic(
  () => import("@/components/crm/BulkEditSheet").then(mod => ({ default: mod.BulkEditSheet })),
  { ssr: false }
)
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"

// Service and Types
import { tasksService } from "@/services/tasks"
import { Task, Profile } from "@/lib/types/crm"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { authService } from "@/services/auth"
import { TableSettings, loadTableSettings, saveTableSettings as persistTableSettings } from "@/components/crm/TableSettingsDialog"

// Sheets
import { CreateTaskSheet } from "./create-task-sheet"
import { TaskPreviewSheet } from "./preview-sheet"
import { TaskEditSidebar } from "@/components/tasks/TaskEditSidebar"
import { PropertyHistoryPanel } from "@/components/crm/PropertyHistoryPanel"

const TASK_TYPES = ["to_do", "call", "email", "follow_up", "follow_up_after_meeting"]
const TASK_TYPE_LABELS: Record<string, string> = {
  to_do: "To Do",
  call: "Call",
  email: "Email",
  follow_up: "Follow Up",
  follow_up_after_meeting: "Follow Up After Meeting",
}
const TASK_QUEUES = ["General", "Support", "Sales"]

export default function TasksPage() {
  const [activeTab, setActiveTab] = React.useState("all")
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const [historyTask, setHistoryTask] = React.useState<Task | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const taskStats: SummaryStat<Task>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of tasks) {
      const key = item.title?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "tasks", filterFn: () => true },
      { key: "overdue", label: "overdue", color: "text-destructive", filterFn: (t) => !!(t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed') },
      { key: "unassigned", label: "unassigned", color: "text-hs-warning", filterFn: (t) => !t.assigned_to },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (t) => {
        const title = t.title?.toLowerCase().trim()
        if (!title) return false
        return duplicateKeys.has(title)
      } },
    ]
  }, [tasks])
  const [currentUser, setCurrentUser] = React.useState<{ id: string } | null>(null)

  // Sheet states
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [owners, setOwners] = React.useState<Profile[]>([])
  const [editSidebarOpen, setEditSidebarOpen] = React.useState(false)
  const [taskForEdit, setTaskForEdit] = React.useState<Task | null>(null)
  const router = useRouter()
  const { user, workspaceId, loading: authLoading } = useAuth()
  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions()
  const [tableSettings, setTableSettings] = React.useState<TableSettings>(loadTableSettings)
  const handleTableSettingsChange = React.useCallback((s: TableSettings) => {
    setTableSettings(s)
    persistTableSettings(s)
  }, [])

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  const exportColumns = React.useMemo<ExportColumn[]>(() => [
    { id: "title", label: "Title", visible: true },
    { id: "type", label: "Type", visible: true },
    { id: "status", label: "Status", visible: true },
    { id: "priority", label: "Priority", visible: true },
    { id: "assigned_to", label: "Assigned To", visible: true },
    { id: "due_date", label: "Due Date", visible: true },
    { id: "completed", label: "Completed", visible: true },
    { id: "created_at", label: "Created", visible: true },
  ], [])

  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All tasks", closable: false },
        { id: "my", label: "My tasks", closable: true },
        { id: "overdue", label: "Overdue", closable: true },
        { id: "upcoming", label: "Upcoming", closable: true },
        { id: "completed", label: "Completed", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_task_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All tasks", closable: false },
        { id: "my", label: "My tasks", closable: true },
        { id: "overdue", label: "Overdue", closable: true },
        { id: "upcoming", label: "Upcoming", closable: true },
        { id: "completed", label: "Completed", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All tasks", closable: false },
        { id: "my", label: "My tasks", closable: true },
        { id: "overdue", label: "Overdue", closable: true },
        { id: "upcoming", label: "Upcoming", closable: true },
        { id: "completed", label: "Completed", closable: true },
      ]
    }
  })

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

  const fetchTasks = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const { data, error } = await tasksService.getAll({ workspace_id: workspaceId, limit: 100 })
      if (error) throw error
      setTasks(data || [])
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch tasks")
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  React.useEffect(() => {
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing initial-load fetch pattern
    fetchTasks()

    // Get current user for task creation
    if (user?.profileId) {
      setCurrentUser({ id: user.profileId })
    }
    return () => controller.abort()
  }, [fetchTasks, user])

  React.useEffect(() => {
    const controller = new AbortController()
    async function loadOwners() {
      if (!workspaceId) return
      try {
        const { data } = await authService.listProfiles(workspaceId)
        if (!controller.signal.aborted && data) setOwners(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          // Expected in standalone mode
        }
      }
    }
    loadOwners()
    return () => controller.abort()
  }, [workspaceId])

  const ownerOptions = React.useMemo(() => {
    const names = owners.map(o => `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim()).filter(Boolean)
    return names.length > 0 ? [...names, "Unassigned"] : ["Unassigned"]
  }, [owners])

  const handleComplete = React.useCallback(async (id: string) => {
    if (!canEditTask) {
      toast.error("You don't have permission to edit tasks")
      return
    }
    try {
      const task = tasks.find(t => t.id === id)
      if (!task) return

      const { error } = await tasksService.update(id, { status: task.status === 'completed' ? 'pending' : 'completed' })
      if (error) throw error

      toast.success(task.status === 'completed' ? "Task marked as pending" : "Task completed")
      fetchTasks()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update task")
    }
  }, [tasks, workspaceId, fetchTasks, canEditTask])

  const taskColumns = React.useMemo(() => columns(handleComplete), [handleComplete])

  const filteredData = React.useMemo(() => {
    let data = [...tasks]

    // Tab Filtering
    if (activeTab === "my" && currentUser) {
      data = data.filter(t => t.assigned_to?.id === currentUser.id)
    } else if (activeTab === "overdue") {
      const now = new Date()
      data = data.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now)
    } else if (activeTab === "upcoming") {
      const now = new Date()
      data = data.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) >= now)
    } else if (activeTab === "completed") {
      data = data.filter(t => t.status === 'completed')
    }

    // Filter Bar & Search
    return data.filter((task) => {
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description?.toLowerCase().includes(q)
        ) {
          return false
        }
      }

      // Properties
      const selectedAssignees = filters.properties["assignedTo"] || []
      if (selectedAssignees.length > 0) {
        const ownerName = task.assigned_to ? task.assigned_to.name : "Unassigned"
        if (!selectedAssignees.includes(ownerName)) return false
      }

      const selectedTypes = filters.properties["type"] || []
      if (selectedTypes.length > 0 && (!task.task_subtype || !selectedTypes.includes(task.task_subtype))) return false

      const selectedQueues = filters.properties["queue"] || []
      if (selectedQueues.length > 0 && !selectedQueues.includes("General")) return false

      return true
    })
  }, [tasks, filters, activeTab, currentUser])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return filteredData
    const stat = taskStats.find(s => s.key === summaryFilter)
    if (!stat) return filteredData
    return filteredData.filter(stat.filterFn)
  }, [filteredData, summaryFilter, taskStats])

  const {
    selectedIds, selectedItems, toggleOne, toggleAll,
    clearSelection, isAllSelected, isPartialSelected, count
  } = useBulkSelection(filteredData)

  const handleBulkDelete = async () => {
    if (!canDeleteTask) {
      toast.error("You don't have permission to delete tasks")
      return
    }
    try {
      const results = await Promise.allSettled(selectedItems.map(t => tasksService.delete(t.id)))
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error("[tasks] Some deletions failed:", failed)
        toast.error(`Failed to delete ${failed.length} task${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} task${succeeded > 1 ? 's' : ''}`)
      clearSelection()
      fetchTasks()
    } catch (err) {
      console.error("[tasks] Bulk delete failed:", err)
      toast.error("Failed to delete tasks")
    }
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
    const fieldMap: Record<string, (t: Task) => unknown> = {
      title: (t) => t.title,
      type: (t) => TASK_TYPE_LABELS[t.task_subtype || ""] || "To Do",
      status: (t) => t.status,
      priority: (t) => "Medium",
      assigned_to: (t) => t.assigned_to ? t.assigned_to.name : "",
      due_date: (t) => t.due_date,
      completed: (t) => (t.status === "completed" ? "Yes" : "No"),
      created_at: (t) => t.created_at,
    }
    const exportData = source.map((t) => {
      const row: Record<string, unknown> = {}
      for (const id of columnIds) {
        const accessor = fieldMap[id]
        row[labelOf(id)] = accessor ? accessor(t) : ""
      }
      return row
    })
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `tasks_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Task',
        subcategory: 'Tasks Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} tasks`)
  }

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      id: "completed",
      label: "Status",
      type: "select",
      options: [
        { value: "true", label: "Completed" },
        { value: "false", label: "Pending" },
      ],
    },
    {
      id: "type",
      label: "Type",
      type: "select",
      options: [
        { value: "to_do", label: "To Do" },
        { value: "email", label: "Email" },
        { value: "call", label: "Call" },
        { value: "meeting", label: "Meeting" },
      ],
    },
    {
      id: "owner_id",
      label: "Assignee",
      type: "select",
      options: owners.map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name} ${o.last_name}`.trim() })),
    },
  ], [owners])

  const handleBulkEditUpdate = async (updates: Record<string, any>) => {
    if (!canEditTask) {
      toast.error("You don't have permission to edit tasks")
      return { success: 0, failed: selectedItems.length }
    }
    try {
      const parsed: any = {}
      if (updates.completed === "true") parsed.status = "completed"
      if (updates.completed === "false") parsed.status = "pending"
      if (updates.owner_id) parsed.assigned_to = updates.owner_id
      const results = await Promise.allSettled(
        selectedItems.map(t => tasksService.update(t.id, parsed))
      )
      const failed = results.filter(r => r.status === 'rejected')
      const succeeded = results.length - failed.length
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} task${failed.length > 1 ? 's' : ''}`)
      }
      if (succeeded > 0) {
        toast.success(`Updated ${succeeded} task${succeeded > 1 ? 's' : ''}`)
      }
      return { success: succeeded, failed: failed.length }
    } catch (err) {
      toast.error('Failed to update tasks')
      console.error('[handleBulkEditUpdate]', err)
      return { success: 0, failed: selectedItems.length }
    }
  }

  const handleBulkAssign = async (ownerId: string, ownerName: string) => {
    try {
      const results = await Promise.allSettled(
        selectedItems.map(t => tasksService.update(t.id, { assigned_to: ownerId }))
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        toast.error(`Failed to assign ${failed.length} task${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) {
        toast.success(`Assigned ${succeeded} task${succeeded > 1 ? 's' : ''} to ${ownerName}`)
      }
      clearSelection()
      fetchTasks()
    } catch (err) {
      toast.error('Failed to assign tasks')
      console.error('[handleBulkAssign]', err)
      clearSelection()
    }
  }

  const handleUpdateCell = async (task: Task, columnId: string, value: string | number | boolean | null) => {
    if (!canEditTask) {
      toast.error("You don't have permission to edit tasks")
      return
    }
    if (!workspaceId) return
    try {
      const updates: Record<string, unknown> = {}
      if (columnId === 'title') updates.title = value
      if (columnId === 'due_date') updates.due_date = value
      if (columnId === 'completed') updates.status = value ? 'completed' : 'pending'

      const { error } = await tasksService.update(task.id, updates)
      if (error) throw error
      toast.success("Task updated")
      fetchTasks()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update task"
      toast.error(message)
    }
  }

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? tasks.length : undefined,
  }))

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_task_tabs", JSON.stringify(newTabs))
    if (activeTab === id) setActiveTab("all")
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_task_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_task_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_task_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_task_tabs", JSON.stringify(newTabs))
    setActiveTab(id)
  }

  const activeFilters: GenericActiveFilter[] = [
    {
      id: "assignedTo",
      label: "Assigned to",
      type: "searchable-property",
      options: ownerOptions,
      value: filters.properties["assignedTo"] || [],
      onChange: (val) => toggleProperty("assignedTo", val),
    },
    {
      id: "type",
      label: "Task type",
      type: "simple-property",
      options: TASK_TYPES,
      value: filters.properties["type"] || [],
      onChange: (val) => toggleProperty("type", val),
    },
    {
      id: "dueDate",
      label: "Due date",
      type: "date",
      value: filters.dateRanges["dueDate"] || "all",
      onChange: (val) => updateDateRange("dueDate", val as any),
    },
    {
      id: "queue",
      label: "Queue",
      type: "searchable-property",
      options: TASK_QUEUES,
      value: filters.properties["queue"] || [],
      onChange: (val) => toggleProperty("queue", val),
    },
  ]

  const sidebarConfig: SidebarFilterConfig[] = [
    { id: "title", label: "Task title", type: "text" },
    { id: "assignedTo", label: "Assigned to", type: "property", options: ownerOptions },
    { id: "type", label: "Task type", type: "property", options: TASK_TYPES },
    { id: "dueDate", label: "Due date", type: "date" },
    { id: "queue", label: "Queue", type: "property", options: TASK_QUEUES },
  ]

  return (
    <CrmPageLayout>
      <CrmPageHeader 
        title="Tasks" 
        icon={<CheckCircle2 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreateTask && (
              <Button 
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create task
              </Button>
            )}
          </div>
        }
      >
        <CrmTabs 
          items={tabItems} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
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
        placeholder="Search tasks..." 
        searchValue={filters.search}
        onSearchChange={updateSearch}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        onExportClick={() => setExportOpen(true)}
        tableSettings={tableSettings}
        onTableSettingsChange={handleTableSettingsChange}
      />

      <CrmPageContent
        inlinePanel={editSidebarOpen ? (
          <TaskEditSidebar
            task={taskForEdit}
            open={editSidebarOpen}
            onOpenChange={setEditSidebarOpen}
            onSaved={fetchTasks}
          />
        ) : undefined}
      >
        <div className="p-2 flex-1 min-h-0 flex flex-col">
          <div className="bg-background rounded-xl border border-border/60 overflow-hidden flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <CrmTableSkeleton columnCount={5} rowCount={10} />
            ) : tasks.length === 0 ? (
              <div className="p-6">
                <CrmEmptyState
                  title="No tasks yet"
                  description="Create your first task to get started. Tasks can be associated with contacts, companies, or deals."
                  icon={CheckCircle2}
                  actionLabel={canCreateTask ? "Create task" : undefined}
                  onAction={canCreateTask ? () => setCreateOpen(true) : undefined}
                />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-6">
                <CrmEmptyState
                  title="No tasks found"
                  description="We couldn't find any tasks matching your criteria. Try adjusting your filters or search query."
                  icon={CheckCircle2}
                  actionLabel="Clear Filters"
                  onAction={clearAll}
                />
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <SummaryStatsBar
                  data={filteredData}
                  stats={taskStats}
                  activeFilter={summaryFilter}
                  onFilterChange={setSummaryFilter}
                />
                <CrmDataTable 
                  columns={taskColumns} 
                  data={summaryFilteredData} 
                  onRowClick={(task) => {
                    setSelectedTask(task)
                    setPreviewOpen(true)
                  }}
                  onEditRow={canEditTask ? (task) => {
                    setTaskForEdit(task)
                    setEditSidebarOpen(true)
                  } : undefined}
                  onUpdateCell={handleUpdateCell}
                  onHistoryClick={(task) => {
                    setHistoryTask(task)
                    setHistoryOpen(true)
                  }}
                  entityName="task"
                  selectedIds={selectedIds}
                  onToggleOne={toggleOne}
                  tableSettings={tableSettings}
                />
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
        onToggleProperty={toggleProperty}
        onUpdateNumber={updateNumber}
        onClearAll={clearAll}
        onAddAdvancedFilter={addAdvancedFilter}
        onRemoveAdvancedFilter={removeAdvancedFilter}
        activeFilterCount={activeFilterCount}
      />

      <CreateTaskSheet 
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchTasks}
      />

      <TaskPreviewSheet
        task={selectedTask}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onSuccess={fetchTasks}
      />

      {count > 0 && canDeleteTask && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionToolbar
            count={count}
            entityName="task"
            onDelete={handleBulkDelete}
            onAssignOwner={canEditTask ? handleBulkAssign : undefined}
            onExport={() => setExportOpen(true)}
            onEdit={canEditTask ? () => setBulkEditOpen(true) : undefined}
            onClear={clearSelection}
            members={owners.map(o => ({ id: o.clerk_user_id || o.id, name: `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim() }))}
          />
        </div>
      )}

      <BulkEditSheet
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onSaved={() => { clearSelection(); fetchTasks() }}
        entityName="task"
        count={count}
        fields={bulkEditFields}
        onBulkUpdate={handleBulkEditUpdate}
      />

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Tasks"
        columns={exportColumns}
        totalCount={filteredData.length}
        filteredCount={filteredData.length}
        selectedCount={count}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      <PropertyHistoryPanel
        entityType="task"
        entityId={historyTask?.id ?? null}
        entityTitle={historyTask?.title || undefined}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </CrmPageLayout>
  )
}
