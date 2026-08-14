// Mock API Client - Replaces real API calls
import { mockApi, initializeMockData } from '@/mock/api'
import { MockEntity } from '@/mock/database'

export interface ApiOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | boolean | null | undefined>
}

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
}

// Initialize mock data
if (typeof window !== 'undefined') {
  initializeMockData()
}

// Mock API that mimics the real API interface
async function request<T>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params } = options

  // Parse path to determine entity and operation
  const pathParts = path.split('/').filter(Boolean)
  const entity = pathParts[0] || 'unknown'
  const id = pathParts.length > 1 ? pathParts[1] : null
  const action = pathParts.length > 2 ? pathParts[2] : null

  try {
    // GET single item
    if (method === 'GET' && id && !action) {
      const result = await mockApi.getById<MockEntity>(entity, id)
      return { data: result.data as T, error: result.error }
    }

    // GET list
    if (method === 'GET') {
      const result = await mockApi.get<MockEntity>(entity, params)
      return { data: result.data as T, error: result.error }
    }

    // POST (create or action)
    if (method === 'POST') {
      const bodyRecord = body as Record<string, unknown> | undefined
      if (action === 'move-stage') {
        // Handle deal stage movement
        const dealId = id
        const newStage = bodyRecord?.stage as string | undefined
        if (dealId && newStage) {
          const result = await mockApi.update<MockEntity>('deals', dealId, { stage: newStage } as Partial<MockEntity> & Record<string, unknown>)
          return { data: result.data as T, error: result.error }
        }
      }
      
      if (action === 'associate-contact') {
        // Handle deal-contact association
        const dealId = id
        const contactId = bodyRecord?.contact_id as string | undefined
        if (dealId && contactId) {
          const result = await mockApi.update<MockEntity>('deals', dealId, { contact_id: contactId } as Partial<MockEntity> & Record<string, unknown>)
          return { data: result.data as T, error: result.error }
        }
      }
      
      // Regular create
      const result = await mockApi.create<MockEntity>(entity, body as Partial<MockEntity>)
      return { data: result.data as T, error: result.error }
    }

    // PATCH/PUT (update)
    if (method === 'PATCH' || method === 'PUT') {
      if (id) {
        const result = await mockApi.update<MockEntity>(entity, id, body as Partial<MockEntity>)
        return { data: result.data as T, error: result.error }
      }
    }

    // DELETE
    if (method === 'DELETE' && id) {
      const result = await mockApi.delete(entity, id)
      return { data: null, error: result.error }
    }

    return { data: null, error: 'Unknown operation' }
  } catch (error) {
    console.error('[Mock API] Error:', error)
    return { data: null, error: (error as Error).message || 'Unknown error' }
  }
}

async function uploadRequest<T>(_path: string, _formData: FormData): Promise<ApiResponse<T>> {
  // Mock upload - just return success
  return { data: { success: true } as T, error: null }
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | null | undefined>) =>
    request<T>(path, { params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, formData: FormData) =>
    uploadRequest<T>(path, formData),

  download: async (_path: string): Promise<Blob | null> => {
    // Mock download
    return new Blob(['mock file content'], { type: 'text/plain' })
  },
}

// No-op hook for mock mode
export function useLaravelClient() {
  return api
}
