// ── as const objects: single source of truth for types + runtime values ──

export const LIFECYCLE_STAGES = [
  'subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead',
  'opportunity', 'customer', 'evangelist', 'other',
] as const
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number]

export const DEAL_STAGES = [
  'new', 'qualified', 'proposal', 'negotiation',
  'appointment_scheduled', 'closed_won', 'closed_lost',
] as const
export type DealStage = (typeof DEAL_STAGES)[number]

export const TICKET_STATUSES = ['open', 'pending', 'resolved', 'closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'task', 'system'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const USER_ROLES = ['owner', 'admin', 'member', 'viewer'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const DEAL_TYPES = ['New Business', 'Existing Business', 'Renewal', 'Upsell'] as const
export type DealType = (typeof DEAL_TYPES)[number]

export const DEAL_PRIORITIES = ['High', 'Medium', 'Low'] as const
export type DealPriority = (typeof DEAL_PRIORITIES)[number]

export const LEAD_STATUSES = [
  'new', 'open', 'in_progress', 'open_deal', 'unqualified',
  'attempted_to_contact', 'connected', 'bad_timing',
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const SALUTATIONS = ['mr', 'mrs', 'miss', 'ms', 'prof', 'dr'] as const
export type Salutation = (typeof SALUTATIONS)[number]

export const CALL_DIRECTIONS = ['Inbound', 'Outbound'] as const
export type CallDirection = (typeof CALL_DIRECTIONS)[number]

export const ACTIVITY_COMMENT_TARGETS = ['note', 'activity'] as const
export type ActivityCommentTarget = (typeof ACTIVITY_COMMENT_TARGETS)[number]

export const PRODUCT_STATUSES = ['Active', 'Archived'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export const CART_STATUSES = ['active', 'abandoned', 'converted', 'closed'] as const
export type CartStatus = (typeof CART_STATUSES)[number]

export interface AdvancedFilter {
  property: string
  operator: string
  value: unknown
}

export interface BaseFilters {
  page?: number
  limit?: number
  search?: string
  owner_id?: string
  workspace_id?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  properties?: Record<string, string[]>
  dateRanges?: Record<string, string>
  numbers?: Record<string, { min?: string; max?: string }>
  advancedFilters?: AdvancedFilter[]
}

export interface Profile {
  id: string
  user_id?: string
  clerk_user_id?: string | null
  name?: string
  email?: string
  first_name: string
  last_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string | null
  email?: string
  phone?: string
  company_id?: string
  company_name?: string | null
  owner_id?: string
  lifecycle_stage: string | null
  source?: string
  tags?: string[]
  custom_fields?: Record<string, unknown>
  workspace_id?: string | null
  isFollowing?: boolean
  emailOptOut?: boolean
  created_at: string
  updated_at: string
  
  // Address fields
  city?: string | null
  state?: string | null
  country?: string | null
  country_code?: string | null
  state_code?: string | null
  street_address?: string | null
  postal_code?: string | null
  time_zone?: string | null

  // Phone/contact fields
  mobile_phone?: string | null
  whatsapp_phone?: string | null
  fax_number?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  twitter_username?: string | null

  // Sales/CRM fields
  lead_status?: LeadStatus | null
  sales_region?: string | null
  Rootline_score?: number
  contact_unworked?: boolean
  persona?: string | null

  // Demographic/enrichment fields
  industry?: string | null
  annual_revenue?: number | null
  number_of_employees?: number | null
  salutation?: Salutation | null
  preferred_language?: string | null
  employment_role?: string | null
  employment_seniority?: string | null
  employment_sub_role?: string | null

  // Metadata fields
  record_source_detail_1?: string | null
  record_source_detail_2?: string | null
  record_source_detail_3?: string | null
  registered_at?: string | null
  registration_method?: string | null
  member_email?: string | null
  preferred_channels?: string[] | null

  // Email compliance fields
  email_unsubscribed?: boolean
  email_invalid?: boolean
  email_quarantined?: boolean
  email_quarantine_reason?: string | null
  email_hard_bounce_reason?: string | null
  gdpr_legal_basis?: string | null
  marketing_email_confirmation_status?: string | null
  marketing_emails_bounced?: number
  marketing_emails_clicked?: number
  email_opted_out_marketing?: boolean
  first_marketing_email_click_date?: string | null
  first_marketing_email_open_date?: string | null
  last_marketing_email_click_date?: string | null
  last_marketing_email_name?: string | null

  // Computed/Rollup fields
  last_contacted_at?: string | null
  last_activity_at?: string | null
  last_engagement_date?: string | null
  total_revenue?: number | null
  recent_deal_amount?: number | null
  days_to_close?: number | null
  first_deal_created_date?: string | null
  buying_role?: string | null
  first_closed_order_id?: string | null
  first_order_closed_date?: string | null
  recent_closed_order_date?: string | null

  // Relations
  company?: Company
  owner?: Profile
  deals?: Deal[]
  activities?: Activity[]
  notes?: Note[]
  tickets?: Ticket[]
  orders?: Order[]
  analytics?: ContactAnalytics
  tasks?: Task[]
}

export interface Order {
  id: string
  contact_id?: string | null
  order_number?: string | null
  status?: string | null
  amount?: number | null
  currency: string
  closed_at?: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
  custom_fields?: Record<string, unknown>
}

export interface ContactAnalytics {
  id: string
  contact_id: string
  latest_traffic_source?: string | null
  original_traffic_source?: string | null
  original_traffic_source_drill1?: string | null
  original_traffic_source_drill2?: string | null
  latest_traffic_source_date?: string | null
  latest_traffic_source_drill1?: string | null
  latest_traffic_source_drill2?: string | null
  first_referring_site?: string | null
  last_referring_site?: string | null
  first_page_seen?: string | null
  last_page_seen?: string | null
  first_touch_converting_campaign?: string | null
  last_touch_converting_campaign?: string | null
  number_of_sessions: number
  number_of_pageviews: number
  number_of_event_completions: number
  average_pageviews: number
  event_revenue: number
  time_first_seen?: string | null
  time_last_seen?: string | null
  time_of_first_session?: string | null
  time_of_last_session?: string | null
  updated_at: string
}

export interface Company {
  id: string
  name: string
  domain?: string
  industry?: string
  size?: string
  phone?: string
  address?: string
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  employee_count?: number | null
  annual_revenue?: number | null
  time_zone?: string | null
  description?: string | null
  linkedin_url?: string | null
  lifecycle_stage?: string | null
  owner_id?: string | null
  workspace_id?: string | null
  custom_fields?: Record<string, unknown>
  created_at: string
  updated_at: string
  owner?: Profile
  notes?: Note[]
  activities?: Activity[]
  contacts?: Contact[]
  deals?: Deal[]
  isFollowing?: boolean
  emailOptOut?: boolean
  tickets?: Ticket[]
  tasks?: Task[]
}

export interface Deal {
  id: string
  title: string
  amount: number
  stage: string | null
  contact_id?: string | null
  company_id?: string | null
  owner_id?: string | null
  close_date?: string | null
  probability: number
  pipeline?: string
  pipeline_id?: string
  stage_id?: string
  pipeline_stage_id?: string | null
  deal_type?: DealType | null
  priority?: DealPriority | null
  activities?: Activity[]
  workspace_id?: string | null
  created_at: string
  updated_at: string
  contact?: Contact
  company?: Company
  owner?: Profile
  pipeline_stage?: { id: string; name: string; stage_order: number }
  line_items?: { product_id: string; quantity: number }[]
  tasks?: Task[]
  notes?: Note[]
  custom_fields?: Record<string, unknown>
}

export interface LineItem {
  id: string
  deal_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product?: Product
}

export interface Ticket {
  id: string
  subject: string
  description?: string
  status: string | null
  priority: string | null
  contact_id?: string
  owner_id?: string
  workspace_id?: string | null
  created_at: string
  updated_at: string
  contact?: Contact
  owner?: Profile
  activities?: Activity[]
  custom_fields?: Record<string, unknown>
}

export interface Task {
  id: string
  title: string
  description?: string | null
  status?: string
  due_date?: string | null
  type?: string
  task_priority?: string | null
  task_queue?: string | null
  task_subtype?: string | null
  taskable_id?: string | null
  taskable_type?: string
  assigned_to?: { id: string; name: string } | null
  contact?: { id: string; first_name: string; last_name?: string | null; phone?: string | null } | null
  company?: { id: string; name: string } | null
  deal?: { id: string; name: string } | null
  created_at?: string
  workspace_id?: string | null
}

export interface ActivityChange {
  key: string
  old: unknown
  new: unknown
  old_label?: string | null
  new_label?: string | null
}

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  formatted_description?: string | null
  contact_id?: string | null
  deal_id?: string | null
  ticket_id?: string | null
  company_id?: string | null
  owner_id?: string | null
  due_date?: string | null
  completed: boolean
  workspace_id?: string | null
  created_at: string
  updated_at?: string
  entity_type?: string | null
  entity_name?: string | null
  entity_route?: string | null
  activity_date?: string | null
  changes?: ActivityChange[]
  has_changes?: boolean
  resolved_changes?: ActivityChange[]
  
  // Task specific
  task_subtype?: string
  task_priority?: string
  task_queue?: string
  task_reminder?: string
  task_repeat?: boolean
  
  // Call specific
  call_duration?: string
  call_direction?: CallDirection
  call_outcome?: string
  call_recording_url?: string
  call_transcript?: string
  
  // Meeting specific
  meeting_start_time?: string
  meeting_end_time?: string
  meeting_location?: string
  meeting_outcome?: string
  
  // Relations
  owner?: Profile
  contact?: Contact
  company?: Company
  deal?: Deal
  ticket?: Ticket
  custom_fields?: Record<string, unknown>
}

export interface Note {
  id: string
  content: string
  contact_id?: string | null
  company_id?: string | null
  deal_id?: string | null
  ticket_id?: string | null
  created_by?: string | null
  workspace_id?: string | null
  created_at: string
  author?: Profile
}

export interface ActivityComment {
  id: string
  content: string
  author_id: string
  target_id: string
  target_type: ActivityCommentTarget
  workspace_id?: string | null
  created_at: string
  author?: Profile
}

export interface Document {
  id: string
  name: string
  type: string
  mime_type?: string | null
  size: number
  url?: string
  views_count?: number
  links_count?: number
  owner_id?: string
  workspace_id?: string | null
  created_at: string
  updated_at: string
  owner?: Profile
  storage_path?: string | null
  uploaded_by?: string | null
  parent_folder_id?: string | null
  documentable_type?: string | null
  documentable_id?: string | null
  uploader?: { id: string; name: string }
}

export interface Product {
  id: string
  name: string
  sku?: string | null
  status: ProductStatus
  unit_price: number
  product_folder?: string | null
  workspace_id?: string | null
  created_at: string
  updated_at: string
  product_description?: string | null
  product_type?: string | null
  product_image_url?: string | null
  unit_cost?: number | null
  billing_frequency?: string | null
  url?: string | null
  owner_id?: string | null
  custom_fields?: Record<string, unknown>
}

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends import("@tanstack/react-table").RowData> {
    onRowClick?: (item: TData) => void
    onUpdateCell?: (row: TData, columnId: string, value: string | number | boolean | null) => Promise<void>
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends import("@tanstack/react-table").RowData, TValue> {
    editable?: boolean
    options?: (string | { value: string; label: string; color?: string; badgeColor?: string })[]
  }
}

export interface Snippet {
  id: string
  name: string
  internal_name?: string
  content?: string
  shortcut?: string
  owner_id?: string
  workspace_id?: string | null
  created_at: string
  updated_at: string
  owner?: Profile
}

export interface Template {
  id: string
  name: string
  subject?: string
  content?: string
  folder_id?: string | null
  is_folder: boolean
  owner_id?: string
  workspace_id?: string | null
  created_at: string
  updated_at: string
  owner?: Profile
}

export interface Quote {
  id: string
  workspace_id?: string | null
  contact_id?: string | null
  company_id?: string | null
  deal_id?: string | null
  status: QuoteStatus
  title: string
  subtotal: number
  discount: number
  tax: number
  total: number
  valid_until?: string | null
  notes?: string | null
  created_by?: string
  created_at: string
  updated_at?: string
  // Relations
  contact?: Contact
  company?: Company
  deal?: Deal
}

export interface Cart {
  id: string
  workspace_id?: string | null
  contact_id?: string | null
  company_id?: string | null
  status: CartStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  notes?: string | null
  created_by?: string
  created_at: string
  updated_at?: string
  // Relations
  contact?: Contact
  company?: Company
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export interface ServiceResponse<T> {
  data: T | null
  error: { message: string } | null
}

export interface ServiceListResponse<T> {
  data: T[]
  error: { message: string } | null
  meta: PaginationMeta
}

export interface DashboardOverview {
  contacts: {
    total: number
    companies: number
    duplicatedPhones: number
    leadStatuses: Record<string, number>
  }
  deals: {
    total: number
    stages: Record<string, number>
  }
  tasks: {
    total: number
    statuses: Record<string, number>
  }
  tickets: {
    total: number
    statuses: Record<string, number>
    priorities: Record<string, number>
  }
}
