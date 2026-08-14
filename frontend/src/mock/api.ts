// Mock API Client - Replaces real API calls
import { mockDb, MockEntity } from './database'

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
}

// Simulate network delay
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms))

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
    const items = mockDb.search<T>(entity, query, fields)
    return { data: items, error: null }
  }
}

export const mockApi = new MockApiClient()

// Initialize mock data on first load
export function initializeMockData() {
  if (typeof window === 'undefined') return
  
  // Check if data already exists
  if (localStorage.getItem('crm_mock_initialized')) return
  
  // Import and seed data
  import('./data').then(data => {
    // Seed contacts
    data.mockContacts.forEach(contact => {
      mockDb.create('contacts', contact)
    })
    
    // Seed companies
    data.mockCompanies.forEach(company => {
      mockDb.create('companies', company)
    })
    
    // Seed deals
    data.mockDeals.forEach(deal => {
      mockDb.create('deals', deal)
    })
    
    // Seed activities
    data.mockActivities.forEach(activity => {
      mockDb.create('activities', activity)
    })
    
    // Seed quotations
    data.mockQuotations.forEach(quotation => {
      mockDb.create('quotations', quotation)
    })
    
    // Seed invoices
    data.mockInvoices.forEach(invoice => {
      mockDb.create('invoices', invoice)
    })
    
    // Seed tickets
    data.mockTickets.forEach(ticket => {
      mockDb.create('tickets', ticket)
    })
    
    // Seed products
    data.mockProducts.forEach(product => {
      mockDb.create('products', product)
    })
    
    // Seed documents
    data.mockDocuments.forEach(document => {
      mockDb.create('documents', document)
    })
    
    localStorage.setItem('crm_mock_initialized', 'true')
    console.log('[Mock DB] Data initialized successfully')
  })
}
