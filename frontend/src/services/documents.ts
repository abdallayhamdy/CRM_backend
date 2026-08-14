import { laravelApi } from '@/lib/laravel-api'
import { Document, PaginationMeta, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

export const documentsService = {
  async getAll({
    workspace_id,
    limit = 25,
    page = 1,
    type,
    search,
    sortBy = 'created_at',
    sortDir = 'desc',
  }: {
    workspace_id: string
    limit?: number
    page?: number
    type?: string
    search?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const params: Record<string, string | number> = { page, limit, sort_by: sortBy, sort_dir: sortDir }
    if (type) params.documentable_type = type
    if (search) params.q = search

    const { data, error } = await laravelApi.get<{ data: Document[]; meta: { page: number; limit: number; total: number; last_page: number } }>(
      '/documents',
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
    } as ServiceListResponse<Document>
  },

  async getById(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.get<{ data: Document }>(`/documents/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Document>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Document>
  },

  async upload(file: File, metadata: {
    documentable_type: string
    documentable_id: string
    name?: string
    document_type?: string
  }) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentable_type', metadata.documentable_type)
    formData.append('documentable_id', metadata.documentable_id)
    if (metadata.name) formData.append('name', metadata.name)
    if (metadata.document_type) formData.append('document_type', metadata.document_type)

    const { data, error } = await laravelApi.upload<{ data: Document }>('/documents', formData)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Document>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Document>
  },

  async create(document: Partial<Document>) {
    const { data, error } = await laravelApi.post<{ data: Document }>('/documents', document)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Document>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Document>
  },

  async update(id: string, updates: Partial<Document>) {
    const { data, error } = await laravelApi.patch<{ data: Document }>(`/documents/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Document>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Document>
  },

  async delete(id: string) {
    const { error } = await laravelApi.delete(`/documents/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async download(id: string): Promise<Blob | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/laravel/documents/${id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) return null
      return await response.blob()
    } catch {
      return null
    }
  }
}
