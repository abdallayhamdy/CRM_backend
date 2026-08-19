// Mock API Client - Replaces real API calls
import { mockDb, MockEntity } from './database'
import { mockAuth } from './auth'
import { mockContacts, mockCompanies, mockDeals, mockActivities, mockQuotations, mockInvoices, mockTickets, mockProducts, mockDocuments } from './data'

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
}

const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms))

const ENTITIES_WITH_OWNER = new Set([
  'contacts', 'deals', 'activities', 'tickets',
  'quotations', 'invoices', 'documents',
])

function shouldFilterByOwner(entity: string): boolean {
  return ENTITIES_WITH_OWNER.has(entity)
}

function filterByOwner<T extends MockEntity>(items: T[]): T[] {
  const currentUser = mockAuth.getUser()
  if (!currentUser) return items

  const role = currentUser.role
  if (role === 'owner' || role === 'admin') return items

  const userId = currentUser.id
  return items.filter((item) => {
    const ownerId = (item as Record<string, unknown>).owner_id
    return ownerId === userId
  })
}

class MockApiClient {
  async get<T extends MockEntity>(entity: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<ApiResponse<{ data: T[]; meta: { total: number; page: number; limit: number } }>> {
    await delay()
    
    let items = mockDb.getAll<T>(entity)
    
    // Apply search
    if (params?.q) {
      const query = String(params.q).toLowerCase()
      items = items.filter(item =>
        Object.values(item).some(value =>
          value && String(value).toLowerCase().includes(query)
        )
      )
    }
    
    // Apply explicit filter params (e.g. filter[assigned_to] from contacts service)
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        const filterMatch = key.match(/^filter\[(.+)\]$/)
        if (!filterMatch) continue
        const filterField = filterMatch[1]
        const filterValue = String(val)

        if (filterValue === 'null') {
          items = items.filter(item => {
            const rv = (item as Record<string, unknown>)[filterField]
            return rv === null || rv === undefined || rv === ''
          })
        } else {
          items = items.filter(item => {
            const rv = (item as Record<string, unknown>)[filterField]
            return rv === filterValue
          })
        }
      }
    }
    
    // Apply owner-based filtering for member/viewer roles
    if (shouldFilterByOwner(entity)) {
      items = filterByOwner(items)
    }
    
    // Apply sorting
    const sortBy = String(params?.sort_by || 'created_at')
    const sortDir = params?.sort_dir === 'asc' ? 1 : -1
    items.sort((a, b) => {
      const aVal = a[sortBy as keyof T]
      const bVal = b[sortBy as keyof T]
      if (aVal < bVal) return -1 * sortDir
      if (aVal > bVal) return 1 * sortDir
      return 0
    })
    
    // Apply pagination
    const page = Number(params?.page || 1)
    const limit = Number(params?.limit || 20)
    const result = mockDb.paginate(items, page, limit)
    
    return { data: result, error: null }
  }

  async getById<T extends MockEntity>(entity: string, id: string): Promise<ApiResponse<T>> {
    await delay()
    const item = mockDb.getById<T>(entity, id)
    if (!item) return { data: null, error: 'Not found' }
    return { data: item, error: null }
  }

  async create<T extends MockEntity>(entity: string, data: Partial<T>): Promise<ApiResponse<T>> {
    await delay()
    const item = mockDb.create<T>(entity, data as any)
    return { data: item, error: null }
  }

  async update<T extends MockEntity>(entity: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    await delay()
    const item = mockDb.update<T>(entity, id, data)
    if (!item) return { data: null, error: 'Not found' }
    return { data: item, error: null }
  }

  async delete(entity: string, id: string): Promise<ApiResponse<null>> {
    await delay()
    const success = mockDb.delete(entity, id)
    if (!success) return { data: null, error: 'Not found' }
    return { data: null, error: null }
  }

  async search<T extends MockEntity>(entity: string, query: string, fields: (keyof T)[]): Promise<ApiResponse<T[]>> {
    await delay()
    let items = mockDb.search<T>(entity, query, fields)
    if (shouldFilterByOwner(entity)) {
      items = filterByOwner(items)
    }
    return { data: items, error: null }
  }
}

export const mockApi = new MockApiClient()

let initPromise: Promise<void> | null = null

export function initializeMockData(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  
  if (localStorage.getItem('crm_mock_initialized')) return Promise.resolve()
  
  if (initPromise) return initPromise
  
  initPromise = Promise.resolve().then(() => {
    mockContacts.forEach(contact => {
      mockDb.create('contacts', contact)
    })
    
    mockCompanies.forEach(company => {
      mockDb.create('companies', company)
    })
    
    mockDeals.forEach(deal => {
      mockDb.create('deals', deal)
    })
    
    mockActivities.forEach(activity => {
      mockDb.create('activities', activity)
    })
    
    mockQuotations.forEach(quotation => {
      mockDb.create('quotations', quotation)
    })
    
    mockInvoices.forEach(invoice => {
      mockDb.create('invoices', invoice)
    })
    
    mockTickets.forEach(ticket => {
      mockDb.create('tickets', ticket)
    })
    
    mockProducts.forEach(product => {
      mockDb.create('products', product)
    })
    
    mockDocuments.forEach(document => {
      mockDb.create('documents', document)
    })
    
    localStorage.setItem('crm_mock_initialized', 'true')
    console.log('[Mock DB] Data initialized successfully')
  })
  
  return initPromise
}
