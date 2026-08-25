"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ordersService } from "@/services/orders"
import { CustomFieldsForm } from "@/components/properties/CustomFieldsForm"

interface LineItem {
  name: string
  description: string
  quantity: number
  unit_price: number
  discount: number
}

interface CreateOrderSheetProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateOrderSheet({ isOpen, onClose, onCreated }: CreateOrderSheetProps) {
  const [loading, setLoading] = React.useState(false)
  const [customValues, setCustomValues] = React.useState<Record<string, any>>({})
  const [customFieldErrors, setCustomFieldErrors] = React.useState<Record<string, string>>({})
  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    { name: "", description: "", quantity: 1, unit_price: 0, discount: 0 },
  ])

  React.useEffect(() => {
    if (isOpen) {
      setCustomValues({})
      setCustomFieldErrors({})
      setLineItems([{ name: "", description: "", quantity: 1, unit_price: 0, discount: 0 }])
    }
  }, [isOpen])

  const setCustomValue = React.useCallback((name: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const subtotal = React.useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount / 100), 0)
  }, [lineItems])

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { name: "", description: "", quantity: 1, unit_price: 0, discount: 0 }])
  }

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = customValues.title || customValues.order_name || customValues.order_number || ""
    if (!title.trim()) {
      toast.error("Order name is required")
      return
    }
    if (Object.keys(customFieldErrors).length > 0) {
      toast.error("Please fill in all required custom fields")
      return
    }

    setLoading(true)
    try {
      const result = await ordersService.create({
        title: title.trim(),
        status: customValues.stage || customValues.order_status || "open",
        currency: customValues.currency || "USD",
        subtotal,
        total: subtotal,
        line_items: lineItems
          .filter((item) => item.name.trim())
          .map((item, index) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            total: item.quantity * item.unit_price * (1 - item.discount / 100),
            display_order: index,
          })),
        ...(Object.keys(customValues).length > 0 ? { custom_fields: customValues } : {}),
      })

      if (result.error) throw new Error(result.error.message)

      toast.success("Order created successfully")
      onCreated?.()
      onClose()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Create Order</SheetTitle>
        </SheetHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
        <div className="space-y-4">
          <CustomFieldsForm
            objectType="order"
            values={customValues}
            onChange={setCustomValue}
            onValidationChange={setCustomFieldErrors}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Line Items</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
              Add Item
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {lineItems.map((item, index) => (
              <div key={index} className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Item name" value={item.name} onChange={(e) => handleLineItemChange(index, "name", e.target.value)} />
                    <Input placeholder="Description (optional)" value={item.description} onChange={(e) => handleLineItemChange(index, "description", e.target.value)} />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" min="1" value={item.quantity} onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => handleLineItemChange(index, "unit_price", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Discount %</Label>
                        <Input type="number" min="0" max="100" value={item.discount} onChange={(e) => handleLineItemChange(index, "discount", parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveLineItem(index)} disabled={lineItems.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 flex justify-end">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Subtotal: </span>
              <span className="font-bold text-lg">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(subtotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Order"}</Button>
        </div>
      </form>
      </SheetContent>
    </Sheet>
  )
}
