import { laravelApi } from '@/lib/laravel-api'
import { Activity, PaginationMeta, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

export const activitiesService = {
  async getAll({
    type,
    owner_id,
    workspace_id,
    completed,
    search,
    sort_by,
    sort_dir,
    contact_id,
    deal_id,
    company_id,
    ticket_id,
    limit = 50,
    page = 1
  }: {
    type?: string,
    owner_id?: string,
    workspace_id: string,
    completed?: boolean,
    search?: string,
    sort_by?: string,
    sort_dir?: string,
    contact_id?: string,
    deal_id?: string,
    company_id?: string,
    ticket_id?: string,
    limit?: number,
    page?: number
  }) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const params: Record<string, string | number | boolean> = { page, limit }
    if (search) params.q = search
    if (type) params.type = type
    if (owner_id) params.owner_id = owner_id
    if (completed !== undefined) params.completed = completed
    if (contact_id) params.contact_id = contact_id
    if (deal_id) params.deal_id = deal_id
    if (company_id) params.company_id = company_id
    if (ticket_id) params.ticket_id = ticket_id
    if (sort_by) params.sort_by = sort_by
    if (sort_dir) params.sort_dir = sort_dir

    const { data, error } = await laravelApi.get<{ data: Activity[]; meta: { page: number; limit: number; total: number; last_page: number } }>(
      '/activities',
      params
    )

    if (error) return { data: null, error: { message: error }, meta: { total: 0, page, limit } }

    const meta: PaginationMeta = {
      total: data?.meta?.total ?? 0,
      page: data?.meta?.page ?? page,
      limit: data?.meta?.limit ?? limit,
    }

    return {
      data: data?.data ?? [],
      error: null,
      meta,
    } as ServiceListResponse<Activity>
  },

  async getById(id: string, workspace_id: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.get<{ data: Activity }>(`/activities/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Activity>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Activity>
  },

  async getByDealId(dealId: string, workspace_id: string) {
    const { data, error } = await laravelApi.get<{ data: Activity[] }>('/activities', {
      deal_id: dealId,
    })
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Activity[]>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Activity[]>
  },

  async getByContactId(contactId: string, workspace_id: string) {
    const { data, error } = await laravelApi.get<{ data: Activity[] }>('/activities', {
      contact_id: contactId,
    })
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Activity[]>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Activity[]>
  },

  async create(activity: Partial<Activity>) {
    const { data, error } = await laravelApi.post<{ data: Activity }>('/activities', activity)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Activity>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Activity>
  },

  async update(id: string, updates: Partial<Activity>, workspace_id: string) {
    const { data, error } = await laravelApi.patch<{ data: Activity }>(`/activities/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Activity>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Activity>
  },

  async complete(id: string, workspace_id: string) {
    const { data, error } = await laravelApi.patch<{ data: Activity }>(`/activities/${id}`, {
      completed: true,
    })
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Activity>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Activity>
  },

  async delete(id: string, workspace_id: string) {
    const { error } = await laravelApi.delete(`/activities/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async logSystemActivity({
    title,
    description,
    type = 'system',
    workspace_id,
    owner_id,
    contact_id,
    deal_id,
    ticket_id,
    company_id,
  }: {
    title: string,
    description: string,
    type?: string,
    workspace_id?: string | null,
    owner_id?: string,
    contact_id?: string,
    deal_id?: string,
    ticket_id?: string,
    company_id?: string,
  }) {
    return this.create({
      type: type as any,
      title,
      description,
      owner_id: owner_id as any,
      contact_id: contact_id as any,
      deal_id: deal_id as any,
      ticket_id: ticket_id as any,
      company_id: company_id as any,
    })
  }
}
