import { laravelApi } from '@/lib/laravel-api'
import { Product, PaginationMeta, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

export const productsService = {
  async getAll({
    search,
    workspace_id,
    limit = 20,
    page = 1,
    sortBy = 'created_at',
    sortDir = 'desc',
  }: {
    search?: string
    workspace_id: string
    limit?: number
    page?: number
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const params: Record<string, string | number> = {
      page,
      limit,
      sort_by: sortBy,
      sort_dir: sortDir,
    }
    if (search) params.q = search

    const { data, error } = await laravelApi.get<{ data: Product[]; meta: { current_page: number; per_page: number; total: number } }>(
      '/products',
      params
    )

    if (error) return { data: null, error: { message: error }, meta: { total: 0, page, limit } }

    const meta: PaginationMeta = {
      total: data?.meta?.total ?? 0,
      page: data?.meta?.current_page ?? page,
      limit: data?.meta?.per_page ?? limit,
    }

    return {
      data: data?.data ?? [],
      error: null,
      meta,
    } as ServiceListResponse<Product>
  },

  async getById(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.get<{ data: Product }>(`/products/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Product>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Product>
  },

  async create(product: Partial<Product>) {
    const { data, error } = await laravelApi.post<{ data: Product }>('/products', product)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Product>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Product>
  },

  async update(id: string, updates: Partial<Product>, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.patch<{ data: Product }>(`/products/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Product>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Product>
  },

  async delete(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { error } = await laravelApi.delete(`/products/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async search(search: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const params: Record<string, string> = {}
    if (search) params.q = search

    const { data, error } = await laravelApi.get<{ data: Product[] }>('/products/search', params)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Product[]>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Product[]>
  }
}
