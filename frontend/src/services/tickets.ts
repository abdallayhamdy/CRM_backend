import { laravelApi } from '@/lib/laravel-api'
import { Ticket, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

interface TicketFilters {
  search?: string
  status?: string | null
  priority?: string | null
  owner_id?: string
  contact_id?: string
  deal_id?: string
  company_id?: string
  workspace_id: string
  limit?: number
  offset?: number
}

export const ticketsService = {
  async getAll(filters?: TicketFilters) {
    if (!filters?.workspace_id) throw new Error('workspace_id is required')

    const page = filters?.offset
      ? Math.floor(filters.offset / (filters.limit || 10)) + 1
      : 1

    const params: Record<string, string | number> = {
      page,
      limit: filters?.limit || 10,
    }
    if (filters?.search) params.q = filters.search
    if (filters?.status) params.status = filters.status
    if (filters?.priority) params.priority = filters.priority
    if (filters?.owner_id) params.owner_id = filters.owner_id
    if (filters?.contact_id) params.contact_id = filters.contact_id
    if (filters?.deal_id) params.deal_id = filters.deal_id
    if (filters?.company_id) params.company_id = filters.company_id

    const { data, error } = await laravelApi.get<{ data: Ticket[]; meta: { page: number; limit: number; total: number } }>(
      '/tickets',
      params
    )

    if (error) return { data: [], error: { message: error }, meta: { total: 0, page, limit: filters?.limit || 10 }, count: 0 } as ServiceListResponse<Ticket> & { count: number }

    return {
      data: data?.data ?? [],
      error: null,
      meta: {
        total: data?.meta?.total ?? 0,
        page: data?.meta?.page ?? page,
        limit: data?.meta?.limit ?? (filters?.limit || 10),
      },
      count: data?.meta?.total ?? 0,
    } as ServiceListResponse<Ticket> & { count: number }
  },

  async getById(id: string, workspaceId?: string) {
    if (!workspaceId) throw new Error('workspaceId is required')
    const { data, error } = await laravelApi.get<{ data: Ticket }>(`/tickets/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Ticket>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Ticket>
  },

  async create(ticket: Partial<Ticket>) {
    const { data, error } = await laravelApi.post<{ data: Ticket }>('/tickets', ticket)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Ticket>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Ticket>
  },

  async update(id: string, updates: Partial<Ticket>, workspaceId?: string) {
    if (!workspaceId) throw new Error('workspaceId is required')
    const { data, error } = await laravelApi.patch<{ data: Ticket }>(`/tickets/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Ticket>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Ticket>
  },

  async delete(id: string, workspaceId?: string) {
    if (!workspaceId) throw new Error('workspaceId is required')
    const { error } = await laravelApi.delete(`/tickets/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  }
}
