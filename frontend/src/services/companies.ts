import { laravelApi, LaravelApiValidationErrors } from '@/lib/laravel-api'
import { Company, PaginationMeta, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

interface CompanyFilters {
  properties?: Record<string, string[]>
  dateRanges?: Record<string, string>
  numbers?: Record<string, { min?: number; max?: number }>
}

function dateRangeToParams(
  range: string | undefined,
  filterName: string
): Record<string, string> {
  if (!range || range === 'all') return {}
  const now = new Date()
  const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c }
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  let from: Date | null = null
  let to: Date | null = null

  switch (range) {
    case 'today': from = startOfDay(now); to = now; break
    case 'yesterday': {
      const d = startOfDay(now); d.setDate(d.getDate() - 1); from = d
      const endOfYesterday = startOfDay(now); endOfYesterday.setMilliseconds(endOfYesterday.getTime() - 1); to = endOfYesterday; break
    }
    case 'this_week': {
      const d = startOfDay(now); d.setDate(d.getDate() - d.getDay()); from = d; to = now; break
    }
    case 'last_7_days': from = new Date(now); from.setDate(from.getDate() - 7); to = now; break
    case 'this_month': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break
    case 'last_month': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      from = d; to = endOfLastMonth; break
    }
    case 'last_30_days': from = new Date(now); from.setDate(from.getDate() - 30); to = now; break
    case 'last_90_days': from = new Date(now); from.setDate(from.getDate() - 90); to = now; break
    default: return {}
  }

  const params: Record<string, string> = {}
  if (from) params[`filter[${filterName}][from]`] = fmt(from)
  if (to) params[`filter[${filterName}][to]`] = fmt(to)
  return params
}

export const companiesService = {
  async getAll({
    search,
    filters,
    workspace_id,
    limit = 20,
    page = 1,
    sortBy = '',
    sortDir = 'desc',
    view,
    currentUserId,
  }: {
    search?: string
    filters?: CompanyFilters
    workspace_id: string
    limit?: number
    page?: number
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    view?: string
    currentUserId?: string
  }) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const params: Record<string, string | number> = {
      page,
      limit,
    }

    if (sortBy) {
      const sortMap: Record<string, string> = { createDate: 'created_at', lastActivity: 'last_activity_at' }
      const backendSortField = sortMap[sortBy] || sortBy
      params.sort_by = backendSortField
      params.sort_dir = sortDir
    }

    if (search) params.q = search

    if (view === 'my' && currentUserId) {
      params['filter[assigned_to]'] = currentUserId
    } else if (view === 'unassigned') {
      params['filter[assigned_to]'] = 'null'
    }

    if (filters?.properties) {
      const owner = filters.properties['owner']
      if (owner?.length) {
        params['filter[assigned_to]'] = owner.join(',')
      }

      const lifecycleStage = filters.properties['lifecycle_stage']
      if (lifecycleStage?.length) {
        params['filter[lifecycle_stage]'] = lifecycleStage.join(',')
      }
    }

    if (filters?.dateRanges) {
      const createDateRange = filters.dateRanges['createDate'] || filters.dateRanges['created_at']
      if (createDateRange && createDateRange !== 'all') {
        Object.assign(params, dateRangeToParams(createDateRange, 'created_at'))
      }

      const lastActivityRange = filters.dateRanges['lastActivity']
      if (lastActivityRange && lastActivityRange !== 'all') {
        Object.assign(params, dateRangeToParams(lastActivityRange, 'last_activity_at'))
      }
    }

    const { data, error } = await laravelApi.get<any>(
      '/companies',
      params
    )

    if (error) return { data: null, error: { message: error }, meta: { total: 0, page, limit } }

    const inner = data?.data
    const companies = inner?.data ?? inner ?? []
    const meta: PaginationMeta = {
      total: inner?.meta?.total ?? data?.meta?.total ?? 0,
      page: inner?.meta?.current_page ?? data?.meta?.current_page ?? page,
      limit: inner?.meta?.per_page ?? data?.meta?.per_page ?? limit,
    }

    return {
      data: companies,
      error: null,
      meta,
    } as ServiceListResponse<Company>
  },

  async getById(id: string, workspaceId?: string) {
    if (!workspaceId) throw new Error('workspaceId is required')
    const { data, error } = await laravelApi.get<{ data: Company }>(`/companies/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Company>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Company>
  },

  async create(company: Partial<Company>) {
    const result = await laravelApi.post<{ data: Company }>('/companies', company)
    if (result.error) return { data: null, error: { message: result.error }, validationErrors: result.validationErrors }
    return { data: result.data?.data ?? null, error: null, validationErrors: undefined }
  },

  async update(id: string, updates: Partial<Company>, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.patch<{ data: Company }>(`/companies/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Company>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Company>
  },

  async delete(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { error } = await laravelApi.delete(`/companies/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async importCSV(csvData: Partial<Company>[], workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const formData = new FormData()
    formData.append('workspace_id', workspace_id)

    const csvContent = csvData.map(row => Object.values(row).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    formData.append('file', blob, 'import.csv')

    const { data, error } = await laravelApi.upload<{ data: { inserted: number; skipped: number } }>(
      '/companies/import',
      formData
    )

    if (error) return { data: null, error: { message: error } } as ServiceResponse<{ inserted: number; skipped: number }>
    return { data: data?.data ?? null, error: null } as ServiceResponse<{ inserted: number; skipped: number }>
  }
}
