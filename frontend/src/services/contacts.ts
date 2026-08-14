import { laravelApi } from '@/lib/laravel-api'
import { Contact, PaginationMeta, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

interface ContactFilters {
  properties?: Record<string, string[]>
  dateRanges?: Record<string, string>
  numbers?: Record<string, { min?: number | string; max?: number | string }>
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

export const getColumn = (columnId: string): string =>
  columnId
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()

export const contactsService = {
  async getAll({
    search,
    filters,
    workspace_id,
    page = 1,
    limit = 20,
    sortBy = '',
    sortDir = 'desc',
    view,
    currentUserId,
  }: {
    search?: string
    filters?: ContactFilters
    workspace_id: string
    page?: number
    limit?: number
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
      const backendSortField = sortBy === 'createDate' ? 'created_at' : sortBy
      params.sort_by = backendSortField
      params.sort_dir = sortDir
    }
    if (search) params.q = search

    // --- Tab-based view filtering ---
    if (view === 'my' && currentUserId) {
      params['filter[assigned_to]'] = currentUserId
    } else if (view === 'unassigned') {
      params['filter[assigned_to]'] = 'null'
    }

    // --- Property filters → Spatie QueryBuilder ---
    if (filters?.properties) {
      // Lead Status: stored in custom_data JSON
      const leadStatus = filters.properties['leadStatus']
      if (leadStatus?.length) {
        params['filter[lead_status]'] = leadStatus.join(',')
      }

      // Lifecycle Stage: slug via stages table join
      const lifecycleStage = filters.properties['lifecycle_stage']
      if (lifecycleStage?.length) {
        params['filter[lifecycle_stage]'] = lifecycleStage.join(',')
      }

      // Contact Owner: assigned_to user ID
      const contactOwner = filters.properties['contactOwner']
      if (contactOwner?.length) {
        params['filter[assigned_to]'] = contactOwner.join(',')
      }
    }

    // --- Date range filters ---
    if (filters?.dateRanges) {
      // Created date
      const createDateRange = filters.dateRanges['createDate'] || filters.dateRanges['created_at']
      if (createDateRange && createDateRange !== 'all') {
        Object.assign(params, dateRangeToParams(createDateRange, 'created_at'))
      }

      // Last activity date
      const lastActivityRange = filters.dateRanges['lastActivity']
      if (lastActivityRange && lastActivityRange !== 'all') {
        Object.assign(params, dateRangeToParams(lastActivityRange, 'last_activity_at'))
      }
    }

    const { data, error } = await laravelApi.get<any>(
      '/contacts',
      params
    )

    if (error) return { data: null, error: { message: error }, meta: { total: 0, page, limit } }

    // Handle both wrapped { status, data: { data, meta } } and raw paginated { data, meta }
    const inner = data?.data
    const contacts = inner?.data ?? inner ?? []
    const meta: PaginationMeta = {
      total: inner?.meta?.total ?? data?.meta?.total ?? 0,
      page: inner?.meta?.current_page ?? data?.meta?.current_page ?? page,
      limit: inner?.meta?.per_page ?? data?.meta?.per_page ?? limit,
    }

    return {
      data: contacts,
      error: null,
      meta,
    } as ServiceListResponse<Contact>
  },

  async getById(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.get<{ data: Contact }>(`/contacts/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Contact>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Contact>
  },

  async create(contact: Partial<Contact>) {
    const { data, error } = await laravelApi.post<{ data: Contact }>('/contacts', contact)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Contact>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Contact>
  },

  async update(id: string, updates: Partial<Contact>, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { data, error } = await laravelApi.patch<{ data: Contact }>(`/contacts/${id}`, updates)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Contact>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Contact>
  },

  async delete(id: string, workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    const { error } = await laravelApi.delete(`/contacts/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async importCSV(csvData: Partial<Contact>[], workspace_id?: string) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const formData = new FormData()
    formData.append('workspace_id', workspace_id)

    const csvContent = csvData.map(row => Object.values(row).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    formData.append('file', blob, 'import.csv')

    const { data, error } = await laravelApi.upload<{ data: { inserted: number; skipped: number } }>(
      '/contacts/import',
      formData
    )

    if (error) return { data: null, error: { message: error } } as ServiceResponse<{ inserted: number; skipped: number }>
    return { data: data?.data ?? null, error: null } as ServiceResponse<{ inserted: number; skipped: number }>
  }
}
