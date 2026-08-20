const API_BASE = '/api/laravel'

function getApiErrorMessage(json: unknown): string {
  if (typeof json !== 'object' || json === null) return ''
  const record = json as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (typeof record.error === 'string') return record.error
  if (record.errors !== null && typeof record.errors === 'object') {
    const parts = Object.values(record.errors as Record<string, unknown>)
      .flat()
      .filter((part): part is string => typeof part === 'string')
    if (parts.length > 0) return parts.join(', ')
  }
  return ''
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const impersonationToken = sessionStorage.getItem('impersonation_token')
  if (impersonationToken) return impersonationToken
  return localStorage.getItem('auth_token')
}

function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('active_workspace_id')
}

function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

export function getStoredToken(): string | null {
  return getToken()
}

export function storeToken(token: string): void {
  setToken(token)
}

export function removeToken(): void {
  clearToken()
}

export function isImpersonating(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('impersonation_token') !== null
}

export function storeImpersonationToken(token: string, workspaceId?: string): void {
  if (typeof window === 'undefined') return
  const originalToken = localStorage.getItem('auth_token')
  if (originalToken) {
    sessionStorage.setItem('original_token', originalToken)
  }
  const originalWorkspaceId = localStorage.getItem('active_workspace_id')
  if (originalWorkspaceId) {
    sessionStorage.setItem('original_workspace_id', originalWorkspaceId)
  }
  sessionStorage.setItem('impersonation_token', token)
  if (workspaceId) {
    localStorage.setItem('active_workspace_id', workspaceId)
  }
}

export function clearImpersonationToken(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('impersonation_token')
  const originalToken = sessionStorage.getItem('original_token')
  if (originalToken) {
    localStorage.setItem('auth_token', originalToken)
    sessionStorage.removeItem('original_token')
  }
  const originalWorkspaceId = sessionStorage.getItem('original_workspace_id')
  if (originalWorkspaceId) {
    localStorage.setItem('active_workspace_id', originalWorkspaceId)
    sessionStorage.removeItem('original_workspace_id')
  } else {
    localStorage.removeItem('active_workspace_id')
  }
}

export interface LaravelApiValidationErrors {
  [field: string]: string[]
}

interface LaravelApiResponse<T> {
  data: T | null
  error: string | null
  validationErrors?: LaravelApiValidationErrors
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<LaravelApiResponse<T>> {
  const token = getToken()
  const workspaceId = getActiveWorkspaceId()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (workspaceId) {
    headers['X-Workspace-Id'] = workspaceId
  }

  const isFormData = options.body instanceof FormData
  if (isFormData) {
    delete headers['Content-Type']
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    })

    const contentType = response.headers.get('content-type') || ''
    const json = contentType.includes('application/json') ? await response.json() : null

    if (response.status === 401) {
      const impersonating = typeof window !== 'undefined' && sessionStorage.getItem('impersonation_token') !== null
      if (impersonating) {
        clearImpersonationToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/super-admin/users'
        }
        return { data: null, error: getApiErrorMessage(json) || 'Impersonation session expired' }
      }
      clearToken()
      const isLoginPage =
        typeof window !== 'undefined' && window.location.pathname === '/login'
      if (!isLoginPage) {
        window.location.href = '/login'
      }
      return { data: null, error: getApiErrorMessage(json) || 'Unauthorized' }
    }

    if (response.status === 403) {
      const message = getApiErrorMessage(json) || 'You do not have permission to access this resource'
      return { data: null, error: message }
    }

    if (!response.ok) {
      const validationErrors: LaravelApiValidationErrors | undefined =
        response.status === 422 && json?.errors ? json.errors : undefined
      const message =
        getApiErrorMessage(json) || `Request failed with status ${response.status}`
      return { data: null, error: message, validationErrors }
    }

    return { data: json as T, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message || 'Network error: could not reach the server' }
  }
}

export const laravelApi = {
  get: <T>(path: string, params?: Record<string, string | number | boolean>) => {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString()
      : ''
    return request<T>(`${path}${queryString}`)
  },

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: formData,
    }),
}
