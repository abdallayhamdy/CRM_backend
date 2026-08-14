import { laravelApi } from '@/lib/laravel-api'
import { ServiceResponse, ServiceListResponse } from '@/lib/types/crm'
import { Task } from '@/lib/types/crm'

export const tasksService = {
  async getAll({
    workspace_id,
    search,
    status,
    assigned_to,
    contact_id,
    company_id,
    deal_id,
    limit = 50,
    page = 1,
    sort_by,
    sort_dir,
    due_date_from,
    due_date_to,
  }: {
    workspace_id: string
    search?: string
    status?: string
    assigned_to?: string
    contact_id?: string
    company_id?: string
    deal_id?: string
    limit?: number
    page?: number
    sort_by?: string
    sort_dir?: 'asc' | 'desc'
    due_date_from?: string
    due_date_to?: string
  }) {
    const params: Record<string, string | number> = { page, limit }
    if (search) params.q = search
    if (status) params.status = status
    if (assigned_to) params.assigned_to = assigned_to
    if (contact_id) params.contact_id = contact_id
    if (company_id) params.company_id = company_id
    if (deal_id) params.deal_id = deal_id
    if (sort_by) params.sort_by = sort_by
    if (sort_dir) params.sort_dir = sort_dir
    if (due_date_from) params.due_date_from = due_date_from
    if (due_date_to) params.due_date_to = due_date_to

    const { data, error } = await laravelApi.get<any>('/tasks', params)

    if (error) return { data: null, error: { message: error }, meta: { total: 0, page, limit } }

    const tasks = data?.data?.data ?? data?.data ?? []
    const meta = data?.data?.meta ?? data?.meta ?? { total: 0, page, limit }

    return {
      data: tasks,
      error: null,
      meta,
    } as ServiceListResponse<Task>
  },

  async getById(id: string) {
    const { data, error } = await laravelApi.get<{ data: Task }>(`/tasks/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Task>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Task>
  },

  async create(task: {
    title: string
    description?: string
    assigned_to?: string | null
    due_date?: string | null
    status?: string
    taskable_type?: string
    taskable_id?: string
  }) {
    const { data, error } = await laravelApi.post<{ data: Task }>('/tasks', task)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Task>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Task>
  },

  async update(id: string, updates: Partial<{
    title: string
    description: string
    assigned_to: string
    due_date: string
    status: string
    taskable_type: string
    taskable_id: string
  }>) {
    const { data, error } = await laravelApi.put<{ data: Task }>(`/tasks/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Task>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Task>
  },

  async delete(id: string) {
    const { error } = await laravelApi.delete(`/tasks/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },
}
