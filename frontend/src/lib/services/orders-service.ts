import { laravelApi } from '@/lib/laravel-api'

export type Order = {
  id: string
  amount: number | null
  closed_at: string | null
  company_id: string | null
  contact_id: string | null
  created_at: string
  currency: string | null
  custom_fields: Record<string, unknown> | null
  deal_id: string | null
  discount: number | null
  metadata: Record<string, unknown> | null
  notes: string | null
  order_number: string | null
  owner_id: string | null
  pipeline: string | null
  quote_id: string | null
  shipping: number | null
  stage: string | null
  status: string | null
  store: string | null
  subtotal: number | null
  tax: number | null
  title: string | null
  total: number | null
  updated_at: string
  workspace_id: string
}

export type OrderLineItem = {
  id: string
  created_at: string
  description: string | null
  discount: number | null
  display_order: number | null
  name: string | null
  order_id: string
  product_id: string | null
  quantity: number | null
  tax: number | null
  total: number | null
  unit_price: number | null
}

export interface OrderWithLineItems extends Order {
  line_items?: OrderLineItem[]
  contact?: { id: string; first_name: string; last_name: string | null } | null
  company?: { id: string; name: string } | null
}

export const ordersService = {
  async list(workspaceId: string): Promise<Order[]> {
    const { data, error } = await laravelApi.get<{ data: Order[] }>('/orders')

    if (error) throw new Error(error)
    return data?.data || []
  },

  async get(id: string, _workspaceId: string): Promise<OrderWithLineItems> {
    const { data, error } = await laravelApi.get<{ data: OrderWithLineItems }>(`/orders/${id}`)

    if (error) throw new Error(error)
    return (data?.data || data) as OrderWithLineItems
  },

  async create(order: Partial<Order>, lineItems: Partial<OrderLineItem>[] = []): Promise<Order> {
    const { line_items: _li, contact: _c, company: _co, ...orderData } = order as Partial<Order> & { line_items?: unknown; contact?: unknown; company?: unknown }

    const { data, error } = await laravelApi.post<{ data: Order }>('/orders', orderData)

    if (error) throw new Error(error)

    if (lineItems.length > 0 && data) {
      const created = data?.data || data
      const items = lineItems.map((item, index) => ({
        ...item,
        order_id: created.id,
        display_order: item.display_order ?? index,
      }))

      const { error: itemsError } = await laravelApi.post(`/orders/${created.id}/line-items`, items)

      if (itemsError) throw new Error(itemsError)
    }

    return (data?.data || data) as Order
  },

  async update(id: string, updates: Partial<Order>, _workspaceId: string): Promise<Order> {
    const { line_items: _li, contact: _c, company: _co, ...orderData } = updates as Partial<Order> & { line_items?: unknown; contact?: unknown; company?: unknown }

    const { data, error } = await laravelApi.patch<{ data: Order }>(`/orders/${id}`, orderData)

    if (error) throw new Error(error)
    return (data?.data || data) as Order
  },

  async delete(id: string, _workspaceId: string): Promise<void> {
    const { error } = await laravelApi.delete(`/orders/${id}`)

    if (error) throw new Error(error)
  },

  async upsertLineItems(orderId: string, items: Partial<OrderLineItem>[]): Promise<void> {
    const formatted = items.map((item, index) => ({
      ...item,
      display_order: item.display_order ?? index,
    }))

    const { error } = await laravelApi.put(`/orders/${orderId}/line-items`, formatted)

    if (error) throw new Error(error)
  },
}
