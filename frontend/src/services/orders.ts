import { laravelApi } from '@/lib/laravel-api'
import { PaginationMeta, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

export interface OrderFromApi {
  id: string
  order_number: string | null
  title: string | null
  status: string | null
  currency: string
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  contact_id: string | null
  company_id: string | null
  owner_id: string | null
  closed_at: string | null
  workspace_id: string
  contact?: { id: string; first_name: string; last_name: string | null } | null
  company?: { id: string; name: string } | null
  owner?: { id: string; first_name: string; last_name: string } | null
  line_items?: OrderLineItemFromApi[]
  custom_fields?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrderLineItemFromApi {
  id: string
  order_id: string
  product_id: string | null
  name: string
  description: string | null
  quantity: number
  unit_price: number
  discount: number
  tax: number
  total: number
  display_order: number
  created_at: string
  updated_at: string
}

export interface OrderLineItemInput {
  product_id?: string | null
  name: string
  description?: string | null
  quantity: number
  unit_price: number
  discount?: number
  tax?: number
  total: number
  display_order?: number
}

export type CreateOrderInput = Partial<Omit<OrderFromApi, 'line_items'>> & {
  line_items?: OrderLineItemInput[]
}

export const ordersService = {
  async list({
    workspace_id,
    search,
    status,
    sort_by,
    sort_dir,
    limit = 25,
    page = 1,
  }: {
    workspace_id: string
    search?: string
    status?: string
    sort_by?: string
    sort_dir?: "asc" | "desc"
    limit?: number
    page?: number
  }) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const params: Record<string, string | number> = { page, limit }
    if (search) params.q = search
    if (status) params.status = status
    if (sort_by) params.sort_by = sort_by
    if (sort_dir) params.sort_dir = sort_dir

    const { data, error } = await laravelApi.get<{ data: OrderFromApi[]; meta: { page: number; limit: number; total: number; last_page: number } }>(
      '/orders',
      params
    )

    if (error) return { data: null as OrderFromApi[] | null, error: { message: error }, meta: { total: 0, page, limit } }
    const meta: PaginationMeta = {
      total: data?.meta?.total ?? 0,
      page: data?.meta?.page ?? page,
      limit: data?.meta?.limit ?? limit,
    }
    return { data: data?.data ?? [], error: null, meta } as ServiceListResponse<OrderFromApi>
  },

  async getById(id: string, workspace_id: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.get<{ data: OrderFromApi }>(`/orders/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<OrderFromApi>
    return { data: data?.data ?? null, error: null } as ServiceResponse<OrderFromApi>
  },

  async create(order: CreateOrderInput) {
    const { data, error } = await laravelApi.post<{ data: OrderFromApi }>('/orders', order)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<OrderFromApi>
    return { data: data?.data ?? null, error: null } as ServiceResponse<OrderFromApi>
  },

  async update(id: string, updates: Partial<OrderFromApi>, workspace_id: string) {
    const { data, error } = await laravelApi.patch<{ data: OrderFromApi }>(`/orders/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<OrderFromApi>
    return { data: data?.data ?? null, error: null } as ServiceResponse<OrderFromApi>
  },

  async delete(id: string, workspace_id: string) {
    const { error } = await laravelApi.delete(`/orders/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },
}
