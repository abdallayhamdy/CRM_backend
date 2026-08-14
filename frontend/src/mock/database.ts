// Mock Database - Simulates a database using localStorage
export interface MockEntity {
  id: string
  created_at: string
  updated_at: string
  workspace_id?: string | null
}

class MockDatabase {
  private getStorageKey(entity: string): string {
    return `crm_mock_${entity}`
  }

  getAll<T extends MockEntity>(entity: string): T[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(this.getStorageKey(entity))
    return data ? JSON.parse(data) : []
  }

  getById<T extends MockEntity>(entity: string, id: string): T | null {
    const items = this.getAll<T>(entity)
    return items.find(item => item.id === id) || null
  }

  create<T extends MockEntity>(entity: string, item: Omit<T, 'created_at' | 'updated_at'>): T {
    const items = this.getAll<T>(entity)
    const now = new Date().toISOString()
    const newItem = {
      ...item,
      id: item.id || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: now,
      updated_at: now
    } as T
    items.push(newItem)
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(items))
    return newItem
  }

  update<T extends MockEntity>(entity: string, id: string, updates: Partial<T>): T | null {
    const items = this.getAll<T>(entity)
    const index = items.findIndex(item => item.id === id)
    if (index === -1) return null
    
    const updatedItem = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    items[index] = updatedItem
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(items))
    return updatedItem
  }

  delete<T extends MockEntity>(entity: string, id: string): boolean {
    const items = this.getAll<T>(entity)
    const filteredItems = items.filter(item => item.id !== id)
    if (filteredItems.length === items.length) return false
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(filteredItems))
    return true
  }

  search<T extends MockEntity>(entity: string, query: string, fields: (keyof T)[]): T[] {
    const items = this.getAll<T>(entity)
    const lowerQuery = query.toLowerCase()
    return items.filter(item =>
      fields.some(field => {
        const value = item[field]
        return value && String(value).toLowerCase().includes(lowerQuery)
      })
    )
  }

  paginate<T extends MockEntity>(items: T[], page: number, limit: number): { data: T[]; meta: { total: number; page: number; limit: number } } {
    const start = (page - 1) * limit
    const end = start + limit
    return {
      data: items.slice(start, end),
      meta: {
        total: items.length,
        page,
        limit
      }
    }
  }
}

export const mockDb = new MockDatabase()
