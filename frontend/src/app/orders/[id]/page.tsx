"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { ordersService, OrderWithLineItems } from "@/lib/services/orders-service"
import { activitiesService } from "@/services/activities"
import { notesService } from "@/services/notes"
import { logAudit } from "@/lib/audit"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { ShoppingCart, ChevronLeft, ChevronDown, Settings, Search, Users, Pencil } from "lucide-react"
import { getBadgeClasses } from "@/lib/badge-colors"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/auth"
import { Profile } from "@/lib/types/crm"
import { useRealtime } from "@/hooks/use-realtime"
import { ActivityFeedCenterPanel } from "@/components/crm/ActivityFeedCenterPanel"
import { ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"
import { PropertyHistoryDialog } from "@/components/crm/detail/PropertyHistoryDialog"
import { DeleteConfirmDialog } from "@/components/crm/detail/DeleteConfirmDialog"
import { CustomCardsRenderer } from "@/components/crm/detail/CustomCardsRenderer"
import { CustomFieldsDisplay } from "@/components/properties/CustomFieldsDisplay"
import { EditRecordSheet, type EditFieldConfig } from "@/components/properties/EditRecordSheet"
import dynamic from "next/dynamic"
const NoteEditorSheet = dynamic(() => import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet })), { ssr: false })
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspaceId, loading: authLoading } = useAuth()
  const { isEnabled, customLeftCards, customRightCards, leftAddedIds, ready } = usePanelCards('orders')

  const [order, setOrder] = React.useState<OrderWithLineItems | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [activities, setActivities] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(ALL_ACTIVITY_TYPES)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'email' | 'task' | 'call' | 'meeting' | 'ticket' | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [timeFilter, setTimeFilter] = React.useState('all')
  const [assignedToFilter, setAssignedToFilter] = React.useState('all')
  const [isCollapsedAll, setIsCollapsedAll] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [propertyHistoryOpen, setPropertyHistoryOpen] = React.useState(false)
  const [isNoteSheetOpen, setIsNoteSheetOpen] = React.useState(false)

  const [aboutEditOpen, setAboutEditOpen] = React.useState(false)
  const orderAboutFields: EditFieldConfig[] = [
    { name: "order_number", label: "Order number", type: "text" },
    { name: "status", label: "Status", type: "text" },
  ]

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  const fetchData = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const orderData = await ordersService.get(id, workspaceId)
      setOrder(orderData)

      const [userRes, profilesRes] = await Promise.all([
        authService.getCurrentUser(),
        authService.listProfiles(workspaceId),
      ])
      setCurrentUser(userRes.data)
      setProfiles(profilesRes.data || [])

      if (orderData.contact_id) {
        const [activitiesRes, notesRes] = await Promise.all([
          activitiesService.getAll({ workspace_id: workspaceId, contact_id: orderData.contact_id }),
          notesService.getAll({ workspace_id: workspaceId, contact_id: orderData.contact_id }),
        ])
        setActivities(activitiesRes.data || [])
        setNotes(notesRes.data || [])
      }
    } catch {
      toast.error("Failed to load order details")
    } finally {
      setIsLoading(false)
    }
  }, [id, workspaceId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtime(React.useCallback((_payload: any) => {
    const silentRefresh = async () => {
      if (!workspaceId) return
      try {
        const data = await ordersService.get(id, workspaceId)
        setOrder(data)
      } catch (err) {
        console.error("Silent refresh failed:", err)
      }
    }
    silentRefresh()
  }, [id, workspaceId]))

  const handleDeleteOrder = React.useCallback(() => {
    if (!order) return
    setDeleteDialogOpen(true)
  }, [order])

  const handleUpdateOrder = React.useCallback(async (data: Partial<typeof order>) => {
    if (!order || !workspaceId) return
    try {
      await ordersService.update(order.id, data as any, workspaceId)
      setOrder(prev => prev ? { ...prev, ...data } : null)
      toast.success("Order updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update order")
    }
  }, [order, workspaceId])

  const execDeleteOrder = React.useCallback(async () => {
    if (!order || !workspaceId) return
    try {
      await ordersService.delete(order.id, workspaceId)
      if (workspaceId) {
        await logAudit({ workspace_id: workspaceId, action: 'Delete', category: 'Order', subcategory: 'Order Deleted', source: 'web', modifiedBy: currentUser, recordId: order.id, recordType: 'Order' })
      }
      toast.success("Order deleted")
      router.push("/orders")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order")
    }
  }, [order, router, workspaceId, currentUser])

  const loadPropertyHistory = React.useCallback(() => {
    setPropertyHistoryOpen(true)
  }, [])

  const combinedFeed = React.useMemo(() => {
    if (!order) return []
    const notesItems = notes.map(n => ({ ...n, feedType: 'note' as const }))
    const activitiesItems = activities.map(a => ({ ...a, feedType: 'activity' as const }))

    let all = [...notesItems, ...activitiesItems].sort((a, b) => {
      const dateA = new Date(a.created_at || (a as any).due_date).getTime()
      const dateB = new Date(b.created_at || (b as any).due_date).getTime()
      return dateB - dateA
    })

    if (activeTab !== 'all') {
      all = all.filter(item => {
        if (activeTab === 'notes') return item.feedType === 'note'
        if (activeTab === 'tasks') return item.feedType === 'activity' && item.type === 'task'
        if (activeTab === 'emails') return item.feedType === 'activity' && item.type === 'email'
        if (activeTab === 'calls') return item.feedType === 'activity' && item.type === 'call'
        if (activeTab === 'meetings') return item.feedType === 'activity' && item.type === 'meeting'
        return true
      })
    }

    all = all.filter(item => {
      if (item.feedType === 'note') {
        return selectedFilters.includes("Notes")
      }
      const typeMap: Record<string, string> = {
        'call': 'Calls',
        'email': 'Emails',
        'meeting': 'Meetings',
        'task': 'Tasks',
      }
      const label = typeMap[item.type]
      if (label) return selectedFilters.includes(label)
      return false
    })

    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      all = all.filter(item => {
        const content = ('content' in item ? item.content : '') || ''
        const title = ('title' in item ? item.title : '') || ''
        const description = ('description' in item ? item.description : '') || ''
        return content.toLowerCase().includes(lower) ||
          title.toLowerCase().includes(lower) ||
          description.toLowerCase().includes(lower)
      })
    }

    if (timeFilter !== 'all') {
      const now = new Date()
      all = all.filter(item => {
        const itemDate = new Date(item.created_at || (item as any).due_date)
        if (timeFilter === 'today') return itemDate.toDateString() === now.toDateString()
        if (timeFilter === 'yesterday') {
          const y = new Date(now); y.setDate(now.getDate() - 1)
          return itemDate.toDateString() === y.toDateString()
        }
        if (timeFilter === 'this-week') {
          const w = new Date(now); w.setDate(now.getDate() - 7)
          return itemDate >= w
        }
        if (timeFilter === 'this-month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    if (assignedToFilter !== 'all') {
      all = all.filter(item => {
        const ownerId = ('owner_id' in item ? item.owner_id : null)
        const createdBy = ('created_by' in item ? item.created_by : null)
        return ownerId === assignedToFilter || createdBy === assignedToFilter
      })
    }

    return all
  }, [order, selectedFilters, searchTerm, timeFilter, assignedToFilter, activeTab, notes, activities])

  const feedCounts = React.useMemo(() => {
    if (!order) return { all: 0, notes: 0, tasks: 0, tickets: 0, calls: 0 }
    const notesItems = notes.map(n => ({ ...n, feedType: 'note' as const }))
    const activitiesItems = activities.map(a => ({ ...a, feedType: 'activity' as const }))
    const all = [...notesItems, ...activitiesItems]
    const notesCount = all.filter(i => i.feedType === 'note').length
    const tasksCount = all.filter(i => i.feedType === 'activity' && i.type === 'task').length
    const ticketsCount = all.filter(i => i.feedType === 'activity' && i.type === 'ticket').length
    const callsCount = all.filter(i => i.feedType === 'activity' && i.type === 'call').length
    return {
      all: notesCount + tasksCount + ticketsCount + callsCount,
      notes: notesCount,
      tasks: tasksCount,
      tickets: ticketsCount,
      calls: callsCount,
    }
  }, [order, notes, activities])

  const upcomingTasks = combinedFeed.filter(item =>
    item.feedType === 'activity' && item.type === 'task' && !item.completed
  )

  const historyItems = combinedFeed.filter(item =>
    !(item.feedType === 'activity' && item.type === 'task' && !item.completed)
  )

  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, any[]> = {}
    historyItems.forEach(item => {
      const date = new Date(item.created_at || (item as any).due_date)
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[monthYear]) groups[monthYear] = []
      groups[monthYear].push(item)
    })
    return groups
  }, [historyItems])

  const getAssociations = React.useCallback(() => {
    if (!order) return []
    const assocs: { name: string; type: string }[] = []
    assocs.push({ name: order.order_number || order.title || `Order #${order.id.slice(0, 8)}`, type: 'Order' })
    if (order.contact) {
      assocs.push({ name: `${order.contact.first_name} ${order.contact.last_name || ''}`.trim(), type: 'Contact' })
    }
    if (order.company) {
      assocs.push({ name: order.company.name, type: 'Company' })
    }
    return assocs
  }, [order])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!order) {
    return (
      <CrmDetailLayout backLine="Orders" backHref="/orders">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Order not found</h2>
          <p>The order you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  const formatCurrency = (amount: number | null, currency?: string | null) => {
    if (amount === null || amount === undefined) return "—"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const orderTitle = order?.order_number || order?.title || `Order #${(order?.id || '').slice(0, 8)}`

  return (
    <CrmDetailLayout backLine="Orders" backHref="/orders">

      {/* LEFT PANEL: Properties */}
      <CrmDetailLeftPanel>

        {/* Profile Card Summary */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/orders" className="flex items-center text-foreground text-[14px] font-bold">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Orders
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[14px] font-bold text-foreground flex items-center gap-1 outline-none">
                  Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] p-1 shadow-lg border-border z-[200]">
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={loadPropertyHistory}
                >
                  View property history
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-destructive hover:bg-destructive/10" onClick={handleDeleteOrder}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex flex-col mt-1 min-w-0 flex-1">
                <div className="flex items-center gap-1 group min-w-0 w-full">
                  <h1 className="text-[20px] font-bold text-foreground leading-tight truncate">
                    {orderTitle}
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn(
                    "inline-flex items-center px-[10px] py-[3px] rounded-full text-[12px] font-bold uppercase tracking-wider",
                    getBadgeClasses('order_status', order.status ?? 'pending')
                  )}>
                    {order.status ?? 'pending'}
                  </span>
                </div>
                <p className="text-[14px] text-foreground mt-1.5">
                  {formatCurrency(order.total ?? order.amount, order.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About this order Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[16px] text-foreground">About this order</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAboutEditOpen(true)}
                className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Order number</label>
              <div className="text-[14px] text-foreground">
                {order.order_number || "—"}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Status</label>
              <div className="text-[14px] text-foreground capitalize">
                {order.status || "Pending"}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Amount</label>
              <div className="text-[14px] text-foreground">
                {formatCurrency(order.amount ?? order.total, order.currency)}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Contact</label>
              <div className="text-[14px] text-foreground">
                {order.contact ? `${order.contact.first_name} ${order.contact.last_name || ""}` : "—"}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Company</label>
              <div className="text-[14px] text-foreground">
                {order.company?.name || "—"}
              </div>
            </div>
            {order.closed_at && (
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Closed at</label>
                <div className="text-[14px] text-foreground">
                  {new Date(order.closed_at).toLocaleDateString()}
                </div>
              </div>
            )}
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Created</label>
              <div className="text-[14px] text-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>

            <CustomFieldsDisplay objectType="order" values={order.custom_fields || {}} />
          </div>
        </div>

        <CustomCardsRenderer cards={customLeftCards} addedIds={leftAddedIds} basePath={`/orders/${id}/settings`} ready={ready} side="left" />

      </CrmDetailLeftPanel>

      {/* CENTER PANEL: Activity & Feed */}
      <CrmDetailCenterPanel>
        <ActivityFeedCenterPanel
          entityType="order"
          entityId={id}
          workspaceId={order?.workspace_id ?? undefined}
          profiles={profiles}
          currentUser={currentUser}
          showTabs={['notes', 'tasks', 'tickets']}
          showFilterTabs={['all', 'notes', 'tasks', 'tickets', 'calls']}
          feedItems={combinedFeed}
          feedCounts={feedCounts}
          upcomingTasks={upcomingTasks}
          groupedHistory={groupedHistory}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          isCollapsedAll={isCollapsedAll}
          setIsCollapsedAll={setIsCollapsedAll}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          onRefresh={fetchData}
          getAssociations={getAssociations}
        />
      </CrmDetailCenterPanel>

      {/* RIGHT PANEL: Associated Objects */}
      <CrmDetailRightPanel>
        {isEnabled("contacts") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Contacts ({order.contact ? 1 : 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/orders/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {order.contact ? (
              <div className="p-4">
                <div className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                  <span
                    className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                    onClick={() => router.push(`/contacts/${order.contact?.id}`)}
                  >
                    {order.contact.first_name} {order.contact.last_name || ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 relative">
                  <Search className="w-8 h-8 text-border" />
                  <div className="absolute top-0 right-0 w-6 h-6 bg-background border border-border rounded flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px]">
                  No contacts associated.
                </p>
              </div>
            )}
          </div>
        )}

        {isEnabled("companies") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Companies ({order.company ? 1 : 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/orders/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {order.company ? (
              <div className="p-4">
                <div className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                  <span
                    className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                    onClick={() => router.push(`/companies/${order.company?.id}`)}
                  >
                    {order.company.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center text-center">
                <p className="text-[13px] text-muted-foreground">No companies associated.</p>
              </div>
            )}
          </div>
        )}

        {/* Line Items Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[14px] text-foreground">Line Items ({order.line_items?.length || 0})</h3>
            </div>
          </div>

          {order.line_items && order.line_items.length > 0 ? (
            <div className="p-4 space-y-2">
              {order.line_items.map(item => (
                <div key={item.id} className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-foreground">{item.name || "Item"}</span>
                    <span className="text-[14px] font-bold text-foreground">{formatCurrency(item.total, order.currency)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-muted-foreground">Qty: {item.quantity || 1}</span>
                    <span className="text-[12px] text-muted-foreground">@ {formatCurrency(item.unit_price, order.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center text-center">
              <p className="text-[13px] text-muted-foreground">No line items.</p>
            </div>
          )}
        </div>

        <CustomCardsRenderer cards={customRightCards} addedIds={[]} basePath={`/orders/${id}/settings`} ready={ready} side="right" />
      </CrmDetailRightPanel>

      {/* Activity Editor Sheets */}
      <NoteEditorSheet
        open={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        onSaved={fetchData}
        entityType="order"
        entityId={id as string}
        workspaceId={workspaceId}
      />

      <EditRecordSheet
        open={aboutEditOpen}
        onOpenChange={setAboutEditOpen}
        objectType="order"
        title="Order"
        fields={orderAboutFields}
        initialValues={order || {}}
        onSave={handleUpdateOrder}
      />

      <PropertyHistoryDialog
        open={propertyHistoryOpen}
        onOpenChange={setPropertyHistoryOpen}
        entityType="order"
        entityId={id}
        entityLabel="order"
        entityTitle={orderTitle}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="order"
        entityDisplayName={orderTitle}
        onConfirm={execDeleteOrder}
      />
    </CrmDetailLayout>
  )
}
