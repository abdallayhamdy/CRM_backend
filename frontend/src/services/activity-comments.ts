import { laravelApi } from '@/lib/laravel-api'
import { ActivityComment, ServiceResponse, ServiceListResponse } from '@/lib/types/crm'

export const activityCommentsService = {
  async getByActivity(activityId: string, workspace_id: string) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const { data, error } = await laravelApi.get<{ data: ActivityComment[]; meta: { page: number; limit: number; total: number; last_page: number } }>(
      `/activities/${activityId}/comments`,
    )

    const fallbackMeta = { total: 0, page: 1, limit: 20 }
    if (error) return { data: [], error: { message: error }, meta: fallbackMeta } as unknown as ServiceListResponse<ActivityComment>
    return { data: data?.data ?? [], error: null, meta: data?.meta ?? fallbackMeta } as ServiceListResponse<ActivityComment>
  },

  async getByTarget(targetId: string, targetType: 'note' | 'activity', workspace_id: string) {
    if (!workspace_id) throw new Error('workspace_id is required')
    if (targetType === 'activity') {
      return this.getByActivity(targetId, workspace_id)
    }
    return { data: [], error: null, meta: { total: 0, page: 1, limit: 20 } } as unknown as ServiceListResponse<ActivityComment>
  },

  async create(comment: Partial<ActivityComment>, workspace_id: string) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const { data, error } = await laravelApi.post<{ data: ActivityComment }>('/activity-comments', {
      ...comment,
    })

    if (error) return { data: null, error: { message: error } } as ServiceResponse<ActivityComment>
    return { data: data?.data ?? null, error: null } as ServiceResponse<ActivityComment>
  },

  async delete(id: string, workspace_id: string) {
    if (!workspace_id) throw new Error('workspace_id is required')

    const { error } = await laravelApi.delete(`/activity-comments/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  }
}
