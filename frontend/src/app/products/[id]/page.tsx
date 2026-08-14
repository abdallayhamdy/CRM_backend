"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { productsService } from "@/services/products"
import { Product } from "@/lib/types/crm"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Package, Mail, Phone, Calendar, AlignLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBadgeClasses } from "@/lib/badge-colors"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import dynamic from "next/dynamic"
const NoteEditorSheet = dynamic(() => import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet })), { ssr: false })
const CallEditorSheet = dynamic(() => import("@/components/activities/CallEditorSheet").then(m => ({ default: m.CallEditorSheet })), { ssr: false })
const EmailEditorSheet = dynamic(() => import("@/components/activities/EmailEditorSheet").then(m => ({ default: m.EmailEditorSheet })), { ssr: false })
const TaskEditorSheet = dynamic(() => import("@/components/activities/TaskEditorSheet").then(m => ({ default: m.TaskEditorSheet })), { ssr: false })
const MeetingEditorSheet = dynamic(() => import("@/components/activities/MeetingEditorSheet").then(m => ({ default: m.MeetingEditorSheet })), { ssr: false })

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspaceId } = useAuth()
  const [product, setProduct] = React.useState<Product | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'call' | 'email' | 'task' | 'meeting' | null>(null)

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const { data, error } = await productsService.getById(id)
        if (error) throw error
        setProduct(data)
      } catch (err) {
        toast.error("Failed to load product details")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!product) {
    return (
      <CrmDetailLayout backLine="Products" backHref="/products">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Product not found</h2>
          <p>The product you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  const getStatusColor = (status: string) => {
    return getBadgeClasses('product_status', status)
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "—"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <CrmDetailLayout backLine="Products" backHref="/products">
      <CrmDetailLeftPanel>
        <div className="p-6 border-b border-border flex flex-col items-center text-center relative">
          <div className="w-20 h-20 bg-muted/50 border border-border rounded mb-4 flex items-center justify-center shadow-sm">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2 px-4 leading-tight">{product.name}</h1>
          <Badge className={`capitalize ${getStatusColor(product.status)}`}>
            {product.status}
          </Badge>

          <div className="flex w-full items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border bg-background text-muted-foreground hover:bg-accent flex-1"
              onClick={() => setActiveEditor('note')}
            >
              <AlignLeft className="h-3.5 w-3.5 mr-1.5 text-primary" /> Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border bg-background text-muted-foreground hover:bg-accent flex-1"
              onClick={() => setActiveEditor('call')}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5 text-primary" /> Call
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4 group">
            <h3 className="font-semibold text-sm text-foreground tracking-wide">About this product</h3>
          </div>

          <div className="space-y-4">
            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Name</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {product.name}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">SKU</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {product.sku || "—"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Price</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {formatCurrency(product.unit_price)}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Status</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                <Badge className={cn("capitalize text-xs", getStatusColor(product.status))}>
                  {product.status}
                </Badge>
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Type</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center capitalize">
                {product.product_type || "—"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Created</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {new Date(product.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CrmDetailLeftPanel>

      <CrmDetailCenterPanel>
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
          <Package className="w-12 h-12 mb-4 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground mb-1">Product Activity</p>
          <p className="text-xs text-muted-foreground text-center">Activity feed for this product will appear here.</p>
        </div>
      </CrmDetailCenterPanel>

      <CrmDetailRightPanel>
        <div className="p-6">
          <h3 className="font-semibold text-sm text-foreground tracking-wide mb-4">Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.product_description || "No description provided."}
          </p>
        </div>
      </CrmDetailRightPanel>

      <NoteEditorSheet open={activeEditor === 'note'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={id} workspaceId={workspaceId} />
      <CallEditorSheet open={activeEditor === 'call'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={id} workspaceId={workspaceId} />
      <EmailEditorSheet open={activeEditor === 'email'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={id} workspaceId={workspaceId} />
      <TaskEditorSheet open={activeEditor === 'task'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={id} workspaceId={workspaceId} />
      <MeetingEditorSheet open={activeEditor === 'meeting'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={id} workspaceId={workspaceId} />
    </CrmDetailLayout>
  )
}
