import { laravelApi, LaravelApiValidationErrors } from '@/lib/laravel-api'
import { Deal, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

interface DealFilters {
  search?: string
  properties?: Record<string, string[]>
  dateRanges?: Record<string, string>
  numbers?: Record<string, { min?: number | string; max?: number | string }>
  pipeline_id?: string
}

export interface DealImport {
  id: string
  status: string
  total_rows: number
  processed_rows: number
  failed_rows: number
  errors?: string[] | null
  file_name: string
  created_at: string
}

export const dealsService = {
  async getAll(
    filters: DealFilters = {},
    {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortDir = 'desc',
      workspace_id,
    }: {
      page?: number
      limit?: number
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      workspace_id?: string
    } = {}
  ) {
    const params: Record<string, string | number> = {
      page,
      limit,
      sort_by: sortBy,
      sort_dir: sortDir,
    }
    if (filters?.search) params.q = filters.search
    if (filters?.pipeline_id) params.pipeline_id = filters.pipeline_id

    // Custom property filters
    if (filters?.properties) {
      for (const [key, values] of Object.entries(filters.properties)) {
        if (key.startsWith('custom_') && values?.length) {
          const propName = key.slice('custom_'.length)
          params[`filter[${propName}]`] = values.join(',')
        }
      }
    }

    const { data, error } = await laravelApi.get<{ data: Deal[]; meta: { page: number; limit: number; total: number } }>(
      '/deals',
      params
    )

    if (error) return { data: null, error: { message: error }, meta: { total: 0, page, limit } }

    return {
      data: data?.data ?? [],
      error: null,
      meta: {
        total: data?.meta?.total ?? 0,
        page: data?.meta?.page ?? page,
        limit: data?.meta?.limit ?? limit,
      }
    } as ServiceListResponse<Deal>
  },

  async getById(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.get<{ data: Deal }>(`/deals/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Deal>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Deal>
  },

  async create(deal: Partial<Deal>) {
    const result = await laravelApi.post<{ data: Deal }>('/deals', deal)
    if (result.error) return { data: null, error: { message: result.error }, validationErrors: result.validationErrors }
    return { data: result.data?.data ?? null, error: null, validationErrors: undefined }
  },

  async update(id: string, updates: Partial<Deal>, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.patch<{ data: Deal }>(`/deals/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Deal>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Deal>
  },

  async delete(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { error } = await laravelApi.delete(`/deals/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async moveStage(id: string, pipelineStageId: string, workspace_id?: string) {
    const { data, error } = await laravelApi.post<{ data: Deal }>(`/deals/${id}/move-stage`, {
      pipeline_stage_id: pipelineStageId,
    })
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Deal>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Deal>
  },

  async associateContact(dealId: string, contactId: string, workspace_id?: string) {
    const { data, error } = await laravelApi.post<{ data: Deal }>(`/deals/${dealId}/associate-contact`, {
      contact_id: contactId,
    })
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Deal>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Deal>
  },

  async searchAll(search: string, workspaceId?: string) {
    const params: Record<string, string> = {}
    if (search) params.q = search
    if (workspaceId) params.workspace_id = workspaceId

    const { data, error } = await laravelApi.get<{ data: Deal[] }>('/deals/search', params)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Deal[]>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Deal[]>
  },

  // Backend: POST /api/deals/import — stores CSV, dispatches queue job, returns 202.
  // Poll GET /api/deals/import/{id} via getImport() until processing finishes.
  async importCSV(file: File, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const formData = new FormData()
    formData.append('file', file)
    const { data, error } = await laravelApi.upload<{ data: { import_id: string; status: string } }>(
      '/deals/import',
      formData
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<{ import_id: string; status: string }>
    return { data: data?.data ?? null, error: null } as ServiceResponse<{ import_id: string; status: string }>
  },

  async getImport(importId: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.get<{ data: DealImport }>(`/deals/import/${importId}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<DealImport>
    return { data: data?.data ?? null, error: null } as ServiceResponse<DealImport>
  },

  async getPipeline(workspace_id?: string, pipeline_id?: string) {
    const params: Record<string, string> = {}
    if (pipeline_id) params.pipeline_id = pipeline_id

    const { data, error } = await laravelApi.get<{ data: Deal[] }>('/deals', params)
    if (error) return { error: { message: error } }

    const pipeline = (data?.data ?? []).reduce((acc: Record<string, Deal[]>, deal: Deal) => {
      const stageKey = deal.pipeline_stage?.name || deal.stage || 'new'
      if (!acc[stageKey]) acc[stageKey] = []
      acc[stageKey].push(deal)
      return acc
    }, {} as Record<string, Deal[]>)

    return { data: pipeline } as ServiceResponse<Record<string, Deal[]>>
  }
}
