import { laravelApi } from '@/lib/laravel-api'
import { ServiceResponse } from '@/lib/types/crm'

export const dashboardService = {
  async getOverview(workspaceId: string) {
    if (!workspaceId) throw new Error('workspaceId is required')

    const response = await laravelApi.get<any>('/dashboard/overview')
    if (response.error) return { data: null, error: { message: response.error } } as ServiceResponse<any>
    return { data: response.data?.data ?? response.data, error: null } as ServiceResponse<any>
  },

  async getRecentActivity(workspaceId: string) {
    if (!workspaceId) throw new Error('workspaceId is required')

    const response = await laravelApi.get<any>('/dashboard/recent-activity')
    if (response.error) return { data: null, error: { message: response.error } } as ServiceResponse<any>
    return { data: response.data?.data ?? response.data, error: null } as ServiceResponse<any>
  }
}
