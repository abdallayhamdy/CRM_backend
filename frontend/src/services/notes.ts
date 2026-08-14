import { laravelApi } from '@/lib/laravel-api'
import { ServiceResponse, ServiceListResponse, PaginationMeta } from '@/lib/types/crm'

interface Note {
  id: string
  content: string
  contact_id?: string | null
  company_id?: string | null
  deal_id?: string | null
  ticket_id?: string | null
  type?: string
  notable_id?: string | null
  created_by?: string | null
  workspace_id?: string | null
  created_at: string
  author?: { id: string; first_name: string; last_name: string } | null
}

export const notesService = {
  async getAll({
    workspace_id,
    search,
    sort_by,
    sort_dir,
    user_id,
    contact_id,
    ticket_id,
    limit = 50,
    page = 1,
  }: {
    workspace_id: string
    search?: string
    sort_by?: string
    sort_dir?: string
    user_id?: string
    contact_id?: string
    ticket_id?: string
    limit?: number
    page?: number
  }) {
    const params: Record<string, string | number> = { page, limit }
    if (search) params.q = search
    if (sort_by) params.sort_by = sort_by
    if (sort_dir) params.sort_dir = sort_dir
    if (user_id) params.user_id = user_id
    if (contact_id) params.contact_id = contact_id
    if (ticket_id) params.ticket_id = ticket_id

    const { data, error } = await laravelApi.get<{ data: Note[]; meta: { page: number; limit: number; total: number; last_page: number } }>('/notes', params)

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
    } as ServiceListResponse<Note>
  },

  async getById(id: string) {
    const { data, error } = await laravelApi.get<{ data: Note }>(`/notes/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Note>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Note>
  },

  async create(note: {
    content: string
    notable_type?: string
    notable_id?: string
  }) {
    const { data, error } = await laravelApi.post<{ data: Note }>('/notes', note)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Note>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Note>
  },

  async update(id: string, updates: Partial<{
    content: string
    notable_type: string
    notable_id: string
  }>) {
    const { data, error } = await laravelApi.put<{ data: Note }>(`/notes/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Note>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Note>
  },

  async delete(id: string) {
    const { error } = await laravelApi.delete(`/notes/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },
}
