import { laravelApi } from '@/lib/laravel-api'

export interface PermissionSetPermission {
  id: string
  object: string
  key: string
  value: string | null
  scope: string | null
}

export interface PermissionSetUser {
  id: string
  name: string
  email: string
}

export interface PermissionSet {
  id: string
  workspace_id: string
  name: string
  description: string | null
  locked: boolean
  created_by: string | null
  permissions: PermissionSetPermission[]
  users_count: number | null
  users: PermissionSetUser[]
  created_at: string | null
  updated_at: string | null
}

export interface PermissionSetInputPermission {
  object: string
  key: string
  value: string | null
  scope?: string | null
}

export interface PermissionSetInput {
  name: string
  description?: string | null
  locked?: boolean
  permissions?: PermissionSetInputPermission[]
}

export const permissionSetsService = {
  async list(workspaceId: string) {
    const { data, error } = await laravelApi.get<{ data: PermissionSet[] }>(
      `/workspaces/${workspaceId}/permission-sets`
    )
    if (error) return { data: null, error: { message: error } }
    return { data: data?.data ?? [], error: null }
  },

  async get(workspaceId: string, id: string) {
    const { data, error } = await laravelApi.get<PermissionSet>(
      `/workspaces/${workspaceId}/permission-sets/${id}`
    )
    if (error) return { data: null, error: { message: error } }
    return { data: data ?? null, error: null }
  },

  async create(workspaceId: string, input: PermissionSetInput) {
    const { data, error, validationErrors } = await laravelApi.post<PermissionSet>(
      `/workspaces/${workspaceId}/permission-sets`,
      input
    )
    if (error) return { data: null, error: { message: error }, validationErrors }
    return { data: data ?? null, error: null, validationErrors }
  },

  async update(workspaceId: string, id: string, input: PermissionSetInput) {
    const { data, error, validationErrors } = await laravelApi.put<PermissionSet>(
      `/workspaces/${workspaceId}/permission-sets/${id}`,
      input
    )
    if (error) return { data: null, error: { message: error }, validationErrors }
    return { data: data ?? null, error: null, validationErrors }
  },

  async remove(workspaceId: string, id: string) {
    const { error } = await laravelApi.delete(`/workspaces/${workspaceId}/permission-sets/${id}`)
    return { error: error ? { message: error } : null }
  },

  async assign(workspaceId: string, id: string, userIds: string[]) {
    const { data, error } = await laravelApi.post<PermissionSet>(
      `/workspaces/${workspaceId}/permission-sets/${id}/assign`,
      { user_ids: userIds }
    )
    if (error) return { data: null, error: { message: error } }
    return { data: data ?? null, error: null }
  },
}