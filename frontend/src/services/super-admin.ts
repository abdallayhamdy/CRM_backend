import { laravelApi, LaravelApiValidationErrors } from '@/lib/laravel-api'
import { ServiceResponse, ServiceListResponse, PaginationMeta } from '@/lib/types/crm'

function toServiceError(error: string, validationErrors?: LaravelApiValidationErrors): { message: string } {
  if (!validationErrors || Object.keys(validationErrors).length === 0) {
    return { message: error }
  }
  const details = Object.entries(validationErrors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join(' | ')
  return { message: details ? `${error} — ${details}` : error }
}

// ── Core entities ───────────────────────────────────────────────────

export interface Tenant {
  id: string
  company_name: string
  workspace_name?: string
  slug?: string
  admin_full_name: string
  admin_email: string
  admin_phone?: string
  admin_job_title?: string
  plan: 'starter' | 'pro' | 'enterprise'
  user_limit: number
  current_user_count: number
  status: 'active' | 'trial' | 'suspended' | 'churned'
  trial_end_date?: string
  subscription_start_date?: string
  billing_cycle?: 'monthly' | 'annual'
  timezone?: string
  fiscal_year_start?: string
  industry?: string
  company_domain?: string
  company_address?: string
  company_address2?: string
  company_city?: string
  company_state?: string
  company_zip?: string
  company_country?: string
  currency?: string
  currency_symbol?: string
  default_language?: string
  default_date_format?: string
  logo_path?: string
  billing_email?: string
  billing_phone?: string
  billing_address?: string
  billing_city?: string
  billing_state?: string
  billing_zip?: string
  billing_country?: string
  tax_id?: string
  created_at: string
  updated_at?: string
}

export interface CreateTenantInput {
  company_name: string
  name?: string
  slug?: string
  admin_full_name: string
  admin_email: string
  admin_phone?: string
  admin_job_title?: string
  plan: 'starter' | 'pro' | 'enterprise'
  billing_cycle?: 'monthly' | 'annual'
  user_limit: number
  status: 'active' | 'trial'
  trial_end_date?: string
  subscription_start_date?: string
  timezone?: string
  currency?: string
  default_language?: string
  default_date_format?: string
  fiscal_year_start?: string
  industry?: string
  company_domain?: string
  company_address?: string
  company_address2?: string
  company_city?: string
  company_state?: string
  company_zip?: string
  company_country?: string
  billing_email?: string
  billing_phone?: string
  billing_address?: string
  billing_city?: string
  billing_state?: string
  billing_zip?: string
  billing_country?: string
  tax_id?: string
  logo?: File | null
}

export interface SuperAdminUser {
  id: string
  name: string
  email: string
  tenant_id: string
  tenant_name: string
  role: 'Admin' | 'Member'
  status: 'Active' | 'Deactivated'
  created_at: string
}

// ── Billing ─────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  tenant_id: string
  tenant_name: string
  amount: number
  status: 'Paid' | 'Pending' | 'Overdue'
  issued_date: string
  due_date: string
  paid_date?: string
}

export interface BillingSummary {
  mrr: number
  arr: number
  overdue_invoice_count: number
  avg_revenue_per_tenant: number
  active_tenant_count: number
}

export interface PlanDistribution {
  plan: string
  count: number
}

export interface RevenueTrend {
  month: string
  mrr: number
}

// ── Health ──────────────────────────────────────────────────────────

export interface HealthSummary {
  uptime: number
  avg_response_ms: number
  error_count_24h: number
  active_queues: number
}

export interface UptimeDay {
  date: string
  uptime: number
}

export interface HourlyResponse {
  hour: string
  avg_ms: number
}

export interface ErrorLog {
  id: string
  timestamp: string
  level: 'Error' | 'Warning' | 'Info'
  message: string
  source: string
  tenant_id?: string
}

export interface JobQueue {
  name: string
  pending_count: number
  failed_count_24h: number
  avg_process_time: string
  status: 'Healthy' | 'Delayed' | 'Failing'
}

// ── Security ────────────────────────────────────────────────────────

export interface SecuritySettings {
  two_factor_required: boolean
  ip_whitelist_enabled: boolean
  whitelisted_ips: string[]
  session_timeout_minutes: number
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actor_name: string
  actor_email: string
  action: string
  target_type: 'Tenant' | 'User' | 'Invoice' | 'System'
  target_id?: string
  target_label: string
  ip_address: string
}

export interface ActiveSession {
  id: string
  user_name: string
  user_id: string
  device: string
  ip_address: string
  location: string
  last_active: string
  is_current_session: boolean
}

// ── Settings ────────────────────────────────────────────────────────

export interface GeneralPlatformSettings {
  platform_name: string
  support_email: string
  default_trial_days: number
  default_plan: 'starter' | 'pro' | 'enterprise'
}

export interface EmailTemplate {
  id: string
  key: string
  name: string
  subject: string
  body: string
  is_active: boolean
  updated_at: string | null
}

export interface ApiKey {
  id: string
  name: string
  key_preview: string
  created_at: string
  last_used_at: string | null
  status: 'Active' | 'Revoked'
}

export interface CreateApiKeyResult extends ApiKey {
  full_key: string
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  status: 'Active' | 'Disabled'
  last_triggered_at: string | null
}

export const WEBHOOK_EVENTS = [
  'tenant.created',
  'invoice.paid',
  'user.deactivated',
  'ticket.created',
  'broadcast.sent',
] as const

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export interface SupportTicket {
  id: string
  tenant_id: string | null
  tenant_name: string | null
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export type BroadcastAudience = 'All Tenants' | 'Active Only' | 'Trial Only'

export interface BroadcastMessage {
  id: string
  title: string
  message: string
  audience: BroadcastAudience
  sent_by: string
  recipient_count: number
  sent_at: string | null
}

// ── Usage / Analytics ───────────────────────────────────────────────

export interface UsageSummary {
  total_tenants: number
  total_active_users: number
  avg_users_per_tenant: number
  churn_rate: number
}

export interface GrowthData {
  month: string
  new_tenants: number
  total_active_users: number
}

export interface TenantUsage {
  tenant_id: string
  tenant_name: string
  audit_events: number
}

export interface FeatureAdoption {
  feature: string
  adopted: number
  total: number
}

// ── Platform Owners ─────────────────────────────────────────────────

export interface PlatformOwner {
  id: string
  name: string
  email: string
  created_at: string
  last_login_at?: string
}

// ── Constants ───────────────────────────────────────────────────────

export const PLAN_PRICE: Record<string, number> = {
  starter: 49,
  pro: 149,
  enterprise: 399,
}

// ── Impersonation ──────────────────────────────────────────────────

export interface ImpersonationSession {
  token: string
  expires_at: string
  session_id: string
  target_user: {
    id: string
    name: string
    email: string
  }
  workspace: {
    id: string
    name: string
  }
}

export interface ImpersonationStatus {
  active: boolean
  session_id?: string
  expires_at?: string
  target_user?: {
    id: string
    name: string
    email: string
  }
  workspace?: {
    id: string
    name: string
  }
}

// ── Helper ──────────────────────────────────────────────────────────

function query(params?: Record<string, string | number | undefined>): Record<string, string | number> | undefined {
  if (!params) return undefined
  const q: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== 'all') q[k] = v
  }
  return Object.keys(q).length > 0 ? q : undefined
}

// ── Service ─────────────────────────────────────────────────────────

export const superAdminService = {

  // ── Tenants ─────────────────────────────────────────────────────

  async getTenants(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const q = query({ page: params?.page, limit: params?.limit, q: params?.search, status: params?.status })
    const { data, error } = await laravelApi.get<{ data: Tenant[]; meta: PaginationMeta }>(
      '/super-admin/tenants', q
    )
    if (error) return { data: [], error: { message: error }, meta: { page: 1, limit: 20, total: 0 } } as ServiceListResponse<Tenant>
    return {
      data: data?.data ?? [],
      error: null,
      meta: data?.meta ?? { page: 1, limit: 20, total: 0 },
    } as ServiceListResponse<Tenant>
  },

  async getTenantById(id: string) {
    const { data, error } = await laravelApi.get<{ data: Tenant }>(`/super-admin/tenants/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Tenant>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Tenant>
  },

  async createTenant(input: CreateTenantInput) {
    const { logo, ...rest } = input

    if (logo) {
      const formData = new FormData()
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') formData.append(k, String(v))
      })
      formData.append('logo', logo)
      const { data, error, validationErrors } = await laravelApi.upload<{ data: Tenant }>('/super-admin/tenants', formData)
      if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<Tenant>
      return { data: data?.data ?? null, error: null } as ServiceResponse<Tenant>
    }

    const { data, error, validationErrors } = await laravelApi.post<{ data: Tenant }>('/super-admin/tenants', rest)
    if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<Tenant>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Tenant>
  },

  async updateTenant(id: string, updates: Partial<Tenant>) {
    const { data, error, validationErrors } = await laravelApi.patch<{ data: Tenant }>(`/super-admin/tenants/${id}`, updates)
    if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<Tenant>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Tenant>
  },

  async deleteTenant(id: string) {
    const { error } = await laravelApi.delete(`/super-admin/tenants/${id}`)
    return { error: error ? { message: error } : null }
  },

  // ── Users ─────────────────────────────────────────────────────

  async getUsers(params?: { page?: number; limit?: number; search?: string; tenant_id?: string; status?: string; role?: string }) {
    const q = query({ page: params?.page, limit: params?.limit, q: params?.search, tenant_id: params?.tenant_id, status: params?.status, role: params?.role })
    const { data, error } = await laravelApi.get<{ data: SuperAdminUser[]; meta: PaginationMeta }>(
      '/super-admin/users', q
    )
    if (error) return { data: [], error: { message: error }, meta: { page: 1, limit: 20, total: 0 } } as ServiceListResponse<SuperAdminUser>
    return {
      data: data?.data ?? [],
      error: null,
      meta: data?.meta ?? { page: 1, limit: 20, total: 0 },
    } as ServiceListResponse<SuperAdminUser>
  },

  async getUserById(id: string) {
    const { data, error } = await laravelApi.get<{ data: SuperAdminUser }>(`/super-admin/users/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<SuperAdminUser>
    return { data: data?.data ?? null, error: null } as ServiceResponse<SuperAdminUser>
  },

  async updateMembershipStatus(userId: string, workspaceId: string, status: 'Active' | 'Deactivated') {
    const { data, error } = await laravelApi.patch<{ data: SuperAdminUser }>(
      `/super-admin/users/${userId}/workspaces/${workspaceId}`, { status }
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<SuperAdminUser>
    return { data: data?.data ?? null, error: null } as ServiceResponse<SuperAdminUser>
  },

  // ── Billing ───────────────────────────────────────────────────

  async getBillingSummary() {
    const { data, error } = await laravelApi.get<{ data: BillingSummary }>('/super-admin/billing/summary')
    if (error) return { data: null, error: { message: error } } as ServiceResponse<BillingSummary>
    return { data: data?.data ?? null, error: null } as ServiceResponse<BillingSummary>
  },

  async getInvoices(params?: { page?: number; status?: string }) {
    const q = query({ page: params?.page, status: params?.status })
    const { data, error } = await laravelApi.get<{ data: Invoice[]; meta: PaginationMeta }>(
      '/super-admin/billing/invoices', q
    )
    if (error) return { data: [], error: { message: error }, meta: { page: 1, limit: 20, total: 0 } } as ServiceListResponse<Invoice>
    return {
      data: data?.data ?? [],
      error: null,
      meta: data?.meta ?? { page: 1, limit: 20, total: 0 },
    } as ServiceListResponse<Invoice>
  },

  async markInvoiceAsPaid(id: string) {
    const { data, error } = await laravelApi.patch<{ data: Invoice }>(
      `/super-admin/billing/invoices/${id}/pay`
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Invoice>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Invoice>
  },

  async createInvoice(invoice: { tenant_id: string; amount: number; issued_date: string; due_date: string; paid_date?: string }) {
    const { data, error } = await laravelApi.post<{ data: Invoice }>(
      '/super-admin/billing/invoices', invoice
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Invoice>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Invoice>
  },

  async getPlanDistribution() {
    const { data, error } = await laravelApi.get<{ data: PlanDistribution[] }>('/super-admin/billing/plan-distribution')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: PlanDistribution[]; error: null }
  },

  async getRevenueTrend() {
    const { data, error } = await laravelApi.get<{ data: RevenueTrend[] }>('/super-admin/billing/revenue-trend')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: RevenueTrend[]; error: null }
  },

  // ── Health ────────────────────────────────────────────────────

  async getHealthSummary() {
    const { data, error } = await laravelApi.get<{ data: HealthSummary }>('/super-admin/health/summary')
    if (error) return { data: null, error: { message: error } } as ServiceResponse<HealthSummary>
    return { data: data?.data ?? null, error: null } as ServiceResponse<HealthSummary>
  },

  async getUptime() {
    const { data, error } = await laravelApi.get<{ data: UptimeDay[] }>('/super-admin/health/uptime')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: UptimeDay[]; error: null }
  },

  async getHourlyResponse() {
    const { data, error } = await laravelApi.get<{ data: HourlyResponse[] }>('/super-admin/health/response-times')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: HourlyResponse[]; error: null }
  },

  async getErrorLogs(params?: { page?: number; level?: string }) {
    const q = query({ page: params?.page, level: params?.level })
    const { data, error } = await laravelApi.get<{ data: ErrorLog[]; meta: PaginationMeta }>(
      '/super-admin/health/errors', q
    )
    if (error) return { data: [], error: { message: error }, meta: { page: 1, limit: 20, total: 0 } } as ServiceListResponse<ErrorLog>
    return {
      data: data?.data ?? [],
      error: null,
      meta: data?.meta ?? { page: 1, limit: 20, total: 0 },
    } as ServiceListResponse<ErrorLog>
  },

  async getJobQueues() {
    const { data, error } = await laravelApi.get<{ data: JobQueue[] }>('/super-admin/health/queues')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: JobQueue[]; error: null }
  },

  // ── Security ──────────────────────────────────────────────────

  async getSecuritySettings() {
    const { data, error } = await laravelApi.get<{ data: SecuritySettings }>('/super-admin/security/settings')
    if (error) return { data: null, error: { message: error } } as ServiceResponse<SecuritySettings>
    return { data: data?.data ?? null, error: null } as ServiceResponse<SecuritySettings>
  },

  async updateSecuritySettings(settings: Partial<SecuritySettings>) {
    const { data, error } = await laravelApi.patch<{ data: SecuritySettings }>(
      '/super-admin/security/settings', settings
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<SecuritySettings>
    return { data: data?.data ?? null, error: null } as ServiceResponse<SecuritySettings>
  },

  async getAuditLog(params?: { page?: number; action?: string }) {
    const q = query({ page: params?.page, action: params?.action })
    const { data, error } = await laravelApi.get<{ data: AuditLogEntry[]; meta: PaginationMeta }>(
      '/super-admin/security/audit-log', q
    )
    if (error) return { data: [], error: { message: error }, meta: { page: 1, limit: 20, total: 0 } } as ServiceListResponse<AuditLogEntry>
    return {
      data: data?.data ?? [],
      error: null,
      meta: data?.meta ?? { page: 1, limit: 20, total: 0 },
    } as ServiceListResponse<AuditLogEntry>
  },

  async getActiveSessions() {
    const { data, error } = await laravelApi.get<{ data: ActiveSession[] }>('/super-admin/security/sessions')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: ActiveSession[]; error: null }
  },

  async revokeSession(id: string) {
    const { error } = await laravelApi.delete(`/super-admin/security/sessions/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  // ── Settings ──────────────────────────────────────────────────

  async getGeneralSettings() {
    const { data, error } = await laravelApi.get<{ data: GeneralPlatformSettings }>('/super-admin/settings/general')
    if (error) return { data: null, error: { message: error } } as ServiceResponse<GeneralPlatformSettings>
    return { data: data?.data ?? null, error: null } as ServiceResponse<GeneralPlatformSettings>
  },

  async updateGeneralSettings(settings: Partial<GeneralPlatformSettings>) {
    const { data, error } = await laravelApi.put<{ data: GeneralPlatformSettings }>(
      '/super-admin/settings/general', settings
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<GeneralPlatformSettings>
    return { data: data?.data ?? null, error: null } as ServiceResponse<GeneralPlatformSettings>
  },

  async getEmailTemplates() {
    const { data, error } = await laravelApi.get<{ data: EmailTemplate[] }>('/super-admin/email-templates')
    if (error) return { data: [], error: { message: error } } as ServiceResponse<EmailTemplate[]>
    return { data: data?.data ?? [], error: null } as ServiceResponse<EmailTemplate[]>
  },

  async getEmailTemplate(id: string) {
    const { data, error } = await laravelApi.get<{ data: EmailTemplate }>(`/super-admin/email-templates/${id}`)
    if (error) return { data: null, error: { message: error } } as ServiceResponse<EmailTemplate>
    return { data: data?.data ?? null, error: null } as ServiceResponse<EmailTemplate>
  },

  async updateEmailTemplate(id: string, updates: { name?: string; subject: string; body: string; is_active?: boolean }) {
    const { data, error, validationErrors } = await laravelApi.put<{ data: EmailTemplate }>(
      `/super-admin/email-templates/${id}`, updates
    )
    if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<EmailTemplate>
    return { data: data?.data ?? null, error: null } as ServiceResponse<EmailTemplate>
  },

  async getApiKeys() {
    const { data, error } = await laravelApi.get<{ data: ApiKey[] }>('/super-admin/api-keys')
    if (error) return { data: [], error: { message: error } } as ServiceResponse<ApiKey[]>
    return { data: data?.data ?? [], error: null } as ServiceResponse<ApiKey[]>
  },

  async createApiKey(name: string) {
    const { data, error, validationErrors } = await laravelApi.post<{ data: CreateApiKeyResult }>(
      '/super-admin/api-keys', { name }
    )
    if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<CreateApiKeyResult>
    return { data: data?.data ?? null, error: null } as ServiceResponse<CreateApiKeyResult>
  },

  async revokeApiKey(id: string) {
    const { data, error } = await laravelApi.post<{ data: ApiKey }>(
      `/super-admin/api-keys/${id}/revoke`
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<ApiKey>
    return { data: data?.data ?? null, error: null } as ServiceResponse<ApiKey>
  },

  async getWebhooks() {
    const { data, error } = await laravelApi.get<{ data: Webhook[] }>('/super-admin/webhooks')
    if (error) return { data: [], error: { message: error } } as ServiceResponse<Webhook[]>
    return { data: data?.data ?? [], error: null } as ServiceResponse<Webhook[]>
  },

  async createWebhook(url: string, events: string[]) {
    const { data, error, validationErrors } = await laravelApi.post<{ data: Webhook }>(
      '/super-admin/webhooks', { url, events }
    )
    if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<Webhook>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Webhook>
  },

  async toggleWebhookStatus(id: string) {
    const { data, error } = await laravelApi.patch<{ data: Webhook }>(
      `/super-admin/webhooks/${id}/toggle`
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<Webhook>
    return { data: data?.data ?? null, error: null } as ServiceResponse<Webhook>
  },

  async deleteWebhook(id: string) {
    const { error } = await laravelApi.delete(`/super-admin/webhooks/${id}`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async getSupportTickets() {
    const { data, error } = await laravelApi.get<{ data: SupportTicket[] }>('/super-admin/support-tickets')
    if (error) return { data: [], error: { message: error } } as ServiceResponse<SupportTicket[]>
    return { data: data?.data ?? [], error: null } as ServiceResponse<SupportTicket[]>
  },

  async updateTicketStatus(id: string, status: TicketStatus) {
    const { data, error, validationErrors } = await laravelApi.patch<{ data: SupportTicket }>(
      `/super-admin/support-tickets/${id}/status`, { status }
    )
    if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<SupportTicket>
    return { data: data?.data ?? null, error: null } as ServiceResponse<SupportTicket>
  },

  async getBroadcasts() {
    const { data, error } = await laravelApi.get<{ data: BroadcastMessage[] }>('/super-admin/broadcasts')
    if (error) return { data: [], error: { message: error } } as ServiceResponse<BroadcastMessage[]>
    return { data: data?.data ?? [], error: null } as ServiceResponse<BroadcastMessage[]>
  },

  async createBroadcast(input: { title: string; message: string; audience: BroadcastAudience }) {
    const { data, error, validationErrors } = await laravelApi.post<{ data: BroadcastMessage }>(
      '/super-admin/broadcasts', input
    )
    if (error) return { data: null, error: toServiceError(error, validationErrors) } as ServiceResponse<BroadcastMessage>
    return { data: data?.data ?? null, error: null } as ServiceResponse<BroadcastMessage>
  },

  // ── Usage / Analytics ─────────────────────────────────────────

  async getUsageSummary() {
    const { data, error } = await laravelApi.get<{ data: UsageSummary }>('/super-admin/usage/summary')
    if (error) return { data: null, error: { message: error } } as ServiceResponse<UsageSummary>
    return { data: data?.data ?? null, error: null } as ServiceResponse<UsageSummary>
  },

  async getGrowthData() {
    const { data, error } = await laravelApi.get<{ data: GrowthData[] }>('/super-admin/usage/growth')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: GrowthData[]; error: null }
  },

  async getTenantUsage() {
    const { data, error } = await laravelApi.get<{ data: TenantUsage[] }>('/super-admin/usage/tenant-usage')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: TenantUsage[]; error: null }
  },

  async getFeatureAdoption() {
    const { data, error } = await laravelApi.get<{ data: FeatureAdoption[] }>('/super-admin/usage/feature-adoption')
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: FeatureAdoption[]; error: null }
  },

  // ── Platform Owners ─────────────────────────────────────────────

  async getPlatformOwners() {
    const { data, error } = await laravelApi.get<{ data: PlatformOwner[]; meta: { total: number } }>(
      '/super-admin/platform-owners'
    )
    if (error) return { data: [], error: { message: error } }
    return { data: data?.data ?? [], error: null } as { data: PlatformOwner[]; error: null }
  },

  async createPlatformOwner(owner: { name: string; email: string; password: string; password_confirmation: string }) {
    const { data, error } = await laravelApi.post<{ data: PlatformOwner }>(
      '/super-admin/platform-owners', owner
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<PlatformOwner>
    return { data: data?.data ?? null, error: null } as ServiceResponse<PlatformOwner>
  },

  async deactivatePlatformOwner(userId: string) {
    const { error } = await laravelApi.post(`/super-admin/platform-owners/${userId}/deactivate`)
    return { error: error ? { message: error } : null } as { error: { message: string } | null }
  },

  async terminateSelf(password: string) {
    const { data, error } = await laravelApi.post<{ message: string }>(
      '/super-admin/platform-owners/terminate-self', { password }
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<{ message: string }>
    return { data: data ?? null, error: null } as ServiceResponse<{ message: string }>
  },

  // ── Impersonation ─────────────────────────────────────────────────

  async startImpersonation(targetUserId: string, targetWorkspaceId: string) {
    const { data, error } = await laravelApi.post<{ data: ImpersonationSession }>(
      '/super-admin/impersonate', { target_user_id: targetUserId, target_workspace_id: targetWorkspaceId }
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<ImpersonationSession>
    return { data: data?.data ?? null, error: null } as ServiceResponse<ImpersonationSession>
  },

  async stopImpersonation() {
    const { data, error } = await laravelApi.post<{ message: string }>(
      '/super-admin/impersonate/stop'
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<{ message: string }>
    return { data: data ?? null, error: null } as ServiceResponse<{ message: string }>
  },

  async getImpersonationStatus() {
    const { data, error } = await laravelApi.get<{ data: ImpersonationStatus }>(
      '/super-admin/impersonate/status'
    )
    if (error) return { data: null, error: { message: error } } as ServiceResponse<ImpersonationStatus>
    return { data: data?.data ?? null, error: null } as ServiceResponse<ImpersonationStatus>
  },
}
