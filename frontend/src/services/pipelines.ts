import { laravelApi } from '@/lib/laravel-api'

export interface PipelineStage {
  id: string
  name: string
  display_order: number
  win_probability: number
}

export interface Pipeline {
  id: string
  name: string
  is_default: boolean
  workspace_id: string
  stages: PipelineStage[]
  created_at: string
  updated_at: string
}

let cachedPipelines: Record<string, Pipeline[]> = {}
let pendingPipelinesPromises: Record<string, Promise<{ data: Pipeline[] | null; error: { message: string } | null }> | null> = {}

export const pipelinesService = {
  async getAll(workspaceId?: string) {
    const key = workspaceId || 'global'
    if (cachedPipelines[key]) {
      return { data: cachedPipelines[key], error: null }
    }
    if (!pendingPipelinesPromises[key]) {
      const params: Record<string, string | number> = { limit: 50 }
      if (workspaceId) params.workspace_id = workspaceId

      pendingPipelinesPromises[key] = laravelApi.get<{ pipelines: { data: Pipeline[] } }>(
        '/pipelines',
        params
      ).then(res => {
        const p = res.data?.pipelines?.data ?? []
        cachedPipelines[key] = p
        pendingPipelinesPromises[key] = null
        return { data: p, error: null }
      }).catch(err => {
        pendingPipelinesPromises[key] = null
        return { data: null, error: { message: String(err) } }
      })
    }
    return pendingPipelinesPromises[key]!
  },

  async getById(id: string) {
    const { data, error } = await laravelApi.get<{ pipeline: Pipeline }>(`/pipelines/${id}`)
    if (error) return { data: null, error: { message: error } }
    return { data: data?.pipeline ?? null, error: null }
  },

  async create(pipeline: { name: string; is_default?: boolean; stages?: { name: string; win_probability?: number }[] }) {
    const { data, error } = await laravelApi.post<{ pipeline: Pipeline }>('/pipelines', pipeline)
    if (error) return { data: null, error: { message: error } }
    cachedPipelines = {} // invalidate
    return { data: data?.pipeline ?? null, error: null }
  },

  async update(id: string, updates: { name?: string; is_default?: boolean }) {
    const { data, error } = await laravelApi.patch<{ pipeline: Pipeline }>(`/pipelines/${id}`, updates)
    if (error) return { data: null, error: { message: error } }
    cachedPipelines = {} // invalidate
    return { data: data?.pipeline ?? null, error: null }
  },

  async delete(id: string) {
    const { error } = await laravelApi.delete(`/pipelines/${id}`)
    if (!error) {
      cachedPipelines = {} // invalidate
    }
    return { error: error ? { message: error } : null }
  },

  clearCache() {
    cachedPipelines = {}
    pendingPipelinesPromises = {}
  }
}
