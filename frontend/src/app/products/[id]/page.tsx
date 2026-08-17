"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { productsService } from "@/services/products"
import { Product } from "@/lib/types/crm"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Package, AlignLeft, Pencil, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBadgeClasses } from "@/lib/badge-colors"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { CustomFieldsDisplay } from "@/components/properties/CustomFieldsDisplay"
import { EditRecordSheet, type EditFieldConfig } from "@/components/properties/EditRecordSheet"
import { DeleteConfirmDialog } from "@/components/crm/detail/DeleteConfirmDialog"
import { PropertyHistoryDialog } from "@/components/crm/detail/PropertyHistoryDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspaceId } = useAuth()
  const { canDeleteProduct } = usePermissions()
  const [product, setProduct] = React.useState<Product | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const [aboutEditOpen, setAboutEditOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [propertyHistoryOpen, setPropertyHistoryOpen] = React.useState(false)

  const productAboutFields: EditFieldConfig[] = [
    { name: "name", label: "Name", type: "text" },
    { name: "sku", label: "SKU", type: "text" },
    { name: "unit_price", label: "Price", type: "number" },
    { name: "product_type", label: "Type", type: "text" },
    { name: "product_description", label: "Description", type: "text" },
  ]

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await productsService.getById(id, workspaceId ?? undefined)
      if (error) throw error
      setProduct(data)
    } catch {
      toast.error("Failed to load product details")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateProduct = React.useCallback(async (data: Partial<Product>) => {
    if (!product || !workspaceId) return
    try {
      await productsService.update(product.id, data, workspaceId)
      setProduct(prev => prev ? { ...prev, ...data } : null)
      toast.success("Product updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update product")
    }
  }, [product, workspaceId])

  const handleDeleteProduct = React.useCallback(() => {
    if (!product) return
    setDeleteDialogOpen(true)
  }, [product])

  const execDeleteProduct = React.useCallback(async () => {
    if (!product || !workspaceId) return
    try {
      const { error } = await productsService.delete(product.id, workspaceId)
      if (error) throw error
      toast.success("Product deleted")
      router.push("/products")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product")
    }
  }, [product, workspaceId, router])

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
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPropertyHistoryOpen(true)}>
                  View history
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canDeleteProduct && (
                  <DropdownMenuItem className="text-destructive" onClick={handleDeleteProduct}>
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-20 h-20 bg-muted/50 border border-border rounded mb-4 flex items-center justify-center shadow-sm">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2 px-4 leading-tight">{product.name}</h1>
          <Badge className={`capitalize ${getStatusColor(product.status)}`}>
            {product.status}
          </Badge>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4 group">
            <h3 className="font-semibold text-sm text-foreground tracking-wide">About this product</h3>
            <button
              onClick={() => setAboutEditOpen(true)}
              className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-[color:var(--color-slate-50)] text-muted-foreground"
            >
              <Pencil className="w-4 h-4" />
            </button>
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

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Updated</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : "—"}
              </div>
            </div>

            <CustomFieldsDisplay objectType="product" values={product.custom_fields || {}} />
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

      <EditRecordSheet
        open={aboutEditOpen}
        onOpenChange={setAboutEditOpen}
        objectType="product"
        title="Product"
        fields={productAboutFields}
        initialValues={product || {}}
        onSave={handleUpdateProduct}
      />

      <PropertyHistoryDialog
        open={propertyHistoryOpen}
        onOpenChange={setPropertyHistoryOpen}
        entityType="product"
        entityId={id}
        entityLabel="product"
        entityTitle={product.name || ""}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="product"
        entityDisplayName={product.name || "this product"}
        onConfirm={execDeleteProduct}
      />
    </CrmDetailLayout>
  )
}
