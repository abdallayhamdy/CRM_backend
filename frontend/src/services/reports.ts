import { laravelApi } from '@/lib/laravel-api'
import { ServiceResponse } from '@/lib/types/crm'

function handleResponse<T>(response: any): ServiceResponse<T> {
  if (response.error) return { data: null, error: { message: response.error } }
  return { data: response.data?.data ?? response.data, error: null }
}

function buildDateParams(from?: Date, to?: Date): Record<string, string> {
  const params: Record<string, string> = {}
  if (from) params.from = from.toISOString()
  if (to) params.to = to.toISOString()
  return params
}

export const reportsService = {
  async exportReport(section: string, filters?: Record<string, string>): Promise<void> {
    const params = new URLSearchParams({ section });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
    }

    const token = localStorage.getItem('auth_token');
    const workspaceId = localStorage.getItem('active_workspace_id');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (workspaceId) headers['X-Workspace-Id'] = workspaceId;

    const response = await fetch(`/api/laravel/reports/export?${params.toString()}`, { headers });
    if (!response.ok) {
      let message = `Export failed (${response.status})`
      try {
        const json = await response.json()
        if (response.status === 403) {
          message = "You don't have permission to export reports. Please contact your workspace admin."
        } else if (json?.message) {
          message = json.message
        }
      } catch {
        // non-JSON body, keep default message
      }
      throw new Error(message)
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : `report_${section}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async getFilterOptions() {
    const response = await laravelApi.get<any>('/reports/filter-options')
    return handleResponse<{
      salesStages: string[];
      salesReps: string[];
      employees: string[];
      products: string[];
      ticketTypes: string[];
      ticketPriorities: string[];
    }>(response)
  },

  async getExecutive(period?: string) {
    const params: Record<string, string> = {}
    if (period) params.period = period
    const response = await laravelApi.get<any>('/reports/executive', params)
    return handleResponse<{
      kpis: any[];
      performanceTrend: any[];
      periodComparison: any[];
    }>(response)
  },

  async getSales(filters?: { stages?: string[]; reps?: string[]; from?: Date; to?: Date }) {
    const params: Record<string, string> = { ...buildDateParams(filters?.from, filters?.to) }
    if (filters?.stages?.length) params.stages = filters.stages.join(',')
    if (filters?.reps?.length) params.reps = filters.reps.join(',')
    const response = await laravelApi.get<any>('/reports/sales', params)
    return handleResponse<{
      pipeline: any[];
      winLoss: any[];
      winRate: number;
      salesByRep: any[];
      revenueForecast: any[];
      salesTrendsMonthly: any[];
      salesTrendsQuarterly: any[];
      kpis: any[];
    }>(response)
  },

  async getCustomers(filters?: { sources?: string[]; from?: Date; to?: Date }) {
    const params: Record<string, string> = { ...buildDateParams(filters?.from, filters?.to) }
    if (filters?.sources?.length) params.sources = filters.sources.join(',')
    const response = await laravelApi.get<any>('/reports/customers', params)
    return handleResponse<{
      newCustomers: any[];
      leadSources: any[];
      topAccounts: any[];
      kpis: any[];
    }>(response)
  },

  async getOrders(filters?: { products?: string[]; from?: Date; to?: Date }) {
    const params: Record<string, string> = { ...buildDateParams(filters?.from, filters?.to) }
    if (filters?.products?.length) params.products = filters.products.join(',')
    const response = await laravelApi.get<any>('/reports/orders', params)
    return handleResponse<{
      topProducts: any[];
      orderTrends: any[];
      aovSparkline: number[];
      kpis: any[];
    }>(response)
  },

  async getTickets(filters?: { priorities?: string[]; types?: string[]; from?: Date; to?: Date }) {
    const params: Record<string, string> = { ...buildDateParams(filters?.from, filters?.to) }
    if (filters?.priorities?.length) params.priorities = filters.priorities.join(',')
    if (filters?.types?.length) params.types = filters.types.join(',')
    const response = await laravelApi.get<any>('/reports/tickets', params)
    return handleResponse<{
      ticketVolume: any[];
      ticketsByType: any[];
      ticketsByPriority: any[];
      csatData: any | null;
      kpis: any[];
    }>(response)
  },

  async getProductivity(filters?: { employees?: string[]; from?: Date; to?: Date }) {
    const params: Record<string, string> = { ...buildDateParams(filters?.from, filters?.to) }
    if (filters?.employees?.length) params.employees = filters.employees.join(',')
    const response = await laravelApi.get<any>('/reports/productivity', params)
    return handleResponse<{
      taskCompletion: any[];
      teamActivity: any[];
      kpis: any[];
    }>(response)
  },

  async getCalls(filters?: { reps?: string[]; types?: string[]; results?: string[]; from?: Date; to?: Date }) {
    const params: Record<string, string> = { ...buildDateParams(filters?.from, filters?.to) }
    if (filters?.reps?.length) params.reps = filters.reps.join(',')
    if (filters?.types?.length) params.types = filters.types.join(',')
    if (filters?.results?.length) params.results = filters.results.join(',')
    const response = await laravelApi.get<any>('/reports/activity/calls', params)
    return handleResponse<{
      callsOvertime: any[];
      callTypeData: any[];
      dialTypeData: any[];
      callLogData: any[];
      totalCallsByHour: number;
      kpis: any[];
    }>(response)
  },
}
