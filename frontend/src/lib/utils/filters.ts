import { laravelApi } from '@/lib/laravel-api'

// Use a generic query builder type that supports all filter methods
type QueryBuilder = any

/**
 * Applies a numeric filter parsed from JSON to a Supabase query.
 * Returns the modified query.
 */
export function applyNumericFilter(
  query: QueryBuilder,
  column: string,
  valArray: string[]
): { query: QueryBuilder; applied: boolean } {
  if (valArray.length !== 1 || !valArray[0].startsWith('{')) {
    return { query, applied: false }
  }

  try {
    const numFilter = JSON.parse(valArray[0])
    if (!numFilter.operator) {
      return { query, applied: false }
    }

    const { operator, val1, val2 } = numFilter
    switch (operator) {
      case 'is between':
        query = query.gte(column, val1).lte(column, val2)
        break
      case 'is equal to':
        query = query.eq(column, val1)
        break
      case "isn't equal to":
        query = query.neq(column, val1)
        break
      case 'is less than':
        query = query.lt(column, val1)
        break
      case 'is less than or equal to':
        query = query.lte(column, val1)
        break
      case 'is greater than':
        query = query.gt(column, val1)
        break
      case 'is greater than or equal to':
        query = query.gte(column, val1)
        break
      default:
        return { query, applied: false }
    }
    return { query, applied: true }
  } catch {
    return { query, applied: false }
  }
}

/**
 * Date range label to start/end date conversion.
 */
export interface DateRange {
  start: Date
  end?: Date
}

export function parseDateRange(rangeLabel: string): DateRange | null {
  if (!rangeLabel || rangeLabel === 'all' || rangeLabel === '') return null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (rangeLabel) {
    case 'today':
    case 'Today':
      return { start: startOfToday }
    case 'yesterday':
    case 'Yesterday': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 1)
      const end = new Date(startOfToday)
      end.setMilliseconds(end.getMilliseconds() - 1)
      return { start, end }
    }
    case 'last_7_days':
    case 'Last 7 days': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 7)
      return { start }
    }
    case 'last_30_days':
    case 'Last 30 days': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 30)
      return { start }
    }
    case 'last_90_days':
    case 'Last 90 days': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 90)
      return { start }
    }
    case 'this_month':
    case 'This month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1) }
    case 'last_month':
    case 'Last month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    case 'this_week': {
      const day = now.getDay()
      const start = new Date(now)
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      return { start }
    }
    case 'last_14': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 14)
      return { start }
    }
    case 'last_60': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 60)
      return { start }
    }
    case 'last_180': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 180)
      return { start }
    }
    case 'last_365': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 365)
      return { start }
    }
    default:
      return null
  }
}

/**
 * Applies date range filter to a Supabase query.
 */
export function applyDateRangeFilter(
  query: QueryBuilder,
  column: string,
  rangeLabel: string
): QueryBuilder {
  const range = parseDateRange(rangeLabel)
  if (!range) return query

  if (range.end) {
    query = query.gte(column, range.start.toISOString()).lte(column, range.end.toISOString())
  } else {
    query = query.gte(column, range.start.toISOString())
  }

  return query
}

/**
 * Advanced filter operators.
 */
export type AdvancedFilterOperator =
  | 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'is_known' | 'is_unknown'

export interface AdvancedFilter {
  property: string
  operator: string
  value?: unknown
}

/**
 * Applies an advanced filter to a Supabase query.
 */
export function applyAdvancedFilter(
  query: QueryBuilder,
  column: string,
  filter: AdvancedFilter
): QueryBuilder {
  const { operator, value } = filter

  switch (operator) {
    case 'eq': return query.eq(column, value)
    case 'neq': return query.neq(column, value)
    case 'gt': return query.gt(column, value)
    case 'lt': return query.lt(column, value)
    case 'gte': return query.gte(column, value)
    case 'lte': return query.lte(column, value)
    case 'contains': return query.ilike(column, `%${value}%`)
    case 'not_contains': return query.not(column, 'ilike', `%${value}%`)
    case 'starts_with': return query.ilike(column, `${value}%`)
    case 'ends_with': return query.ilike(column, `%${value}`)
    case 'is_known': return query.not(column, 'is', null)
    case 'is_unknown': return query.is(column, null)
    default: return query
  }
}

/**
 * Owner enrichment helper - enriches records with owner profile data.
 */
export interface OwnerEnrichable {
  owner_id?: string | null
  owner?: any
}

export async function enrichWithOwnerProfiles<T extends OwnerEnrichable>(
  records: T[],
  _supabase?: any
): Promise<void> {
  if (!records?.length) return

  const ownerIds = [...new Set(records.map(r => r.owner_id).filter(Boolean))] as string[]
  if (ownerIds.length === 0) return

  const { data: profiles } = await laravelApi.get<{ id: string; user_id: string; first_name: string; last_name: string; avatar_url: string }[]>('/profiles', {
    ids: ownerIds.join(','),
  })

  const profileMap = new Map<string, Record<string, unknown>>()
  profiles?.forEach((p: Record<string, unknown>) => {
    profileMap.set(p.id as string, p)
    if (p.user_id) profileMap.set(p.user_id as string, p)
  })

  records.forEach(r => {
    if (r.owner_id) {
      r.owner = profileMap.get(r.owner_id) || null
    }
  })
}
