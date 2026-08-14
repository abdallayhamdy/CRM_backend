import { z } from 'zod'

// ── Reusable option schema (checkbox, dropdown, radio share the same shape) ──
const optionItemSchema = z.object({
  id: z.string(),
  order: z.number(),
  label: z.string(),
  internal_name: z.string(),
  in_forms: z.boolean(),
}).passthrough()

// ── Form field group schema ──
const formFieldGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  selected: z.boolean().optional(),
}).passthrough()

// ── Lifecycle stage schema ──
const lifecycleStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  order: z.number(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  calculated_props: z.boolean(),
  used_in: z.number(),
}).passthrough()

export const createContactSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  lifecycle_stage: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  owner_id: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  state_code: z.string().optional().nullable(),
  street_address: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  time_zone: z.string().optional().nullable(),
  mobile_phone: z.string().optional().nullable(),
  whatsapp_phone: z.string().optional().nullable(),
  fax_number: z.string().optional().nullable(),
  website_url: z.string().url().optional().nullable().or(z.literal('')),
  linkedin_url: z.string().url().optional().nullable().or(z.literal('')),
  twitter_username: z.string().optional().nullable(),
  lead_status: z.string().optional().nullable(),
  sales_region: z.string().optional().nullable(),
  persona: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  annual_revenue: z.number().nonnegative().optional().nullable(),
  number_of_employees: z.number().int().nonnegative().optional().nullable(),
  salutation: z.string().optional().nullable(),
  preferred_language: z.string().optional().nullable(),
  custom_fields: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().nonnegative().optional().nullable(),
  stage: z.string().optional().nullable(),
  pipeline_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  close_date: z.string().optional().nullable(),
  deal_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  owner_id: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
})

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  owner_id: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  number_of_employees: z.number().int().nonnegative().optional().nullable(),
  annual_revenue: z.number().nonnegative().optional().nullable(),
  custom_fields: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  status: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().optional().nullable(),
})

// ── Pipeline ──────────────────────────────────────────────
export const createPipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(100),
})

// ── Pipeline Stage ────────────────────────────────────────
export const createPipelineStageSchema = z.object({
  pipeline_id: z.string().uuid('Invalid pipeline ID'),
  name: z.string().min(1, 'Stage name is required').max(100),
  stage_order: z.number().int().nonnegative().optional(),
})

// ── Property (POST) — required fields + passthrough for field-type-specific extras ──
export const createPropertySchema = z.object({
  label: z.string().min(1, 'Label is required').max(200),
  field_type: z.string().min(1, 'Field type is required'),
  object_type: z.string().optional(),
  group_name: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  is_required: z.boolean().optional(),
  options: z.array(z.string()).optional().nullable(),
  default_value: z.string().optional().nullable(),
  show_in_forms: z.boolean().optional(),
  require_unique: z.boolean().optional(),
  require_min_chars: z.boolean().optional(),
  min_chars: z.number().int().nonnegative().optional().nullable(),
  limit_max_chars: z.boolean().optional(),
  max_chars: z.number().int().nonnegative().optional().nullable(),
  auto_remove_disallowed: z.boolean().optional(),
  allowed_characters: z.string().optional(),
  allowed_spaces: z.string().optional(),
  case_sensitivity: z.string().optional(),
  internal_name: z.string().max(200).optional(),
  rules: z.record(z.string(), z.unknown()).optional().nullable(),
  access: z.unknown().optional().nullable(),
  date_display_format: z.string().optional(),
  numberFormat: z.string().optional(),
  checkbox_options: z.array(optionItemSchema).optional(),
  option_style: z.string().optional(),
  checkboxOptions: z.array(optionItemSchema).optional(),
  checkboxOptionStyle: z.string().optional(),
  checkboxDefaultValue: z.unknown().optional(),
  checkbox_default_values: z.array(z.unknown()).optional().nullable(),
  checkbox_sort: z.string().optional().nullable(),
  datetime_display_format: z.string().optional(),
  datetime_default_date: z.string().optional().nullable(),
  datetime_default_time: z.string().optional().nullable(),
  dropdown_option_style: z.string().optional(),
  dropdown_options: z.array(optionItemSchema).optional().nullable(),
  dropdown_default_value: z.string().optional().nullable(),
  dropdown_sort: z.string().optional().nullable(),
  radio_option_style: z.string().optional(),
  radio_options: z.array(optionItemSchema).optional().nullable(),
  radio_default_value: z.string().optional().nullable(),
  radio_sort: z.string().optional().nullable(),
  calc_property_type: z.string().optional(),
  calc_output_type: z.string().optional(),
  calc_number_format: z.string().optional(),
  calc_formula: z.string().optional().nullable(),
  calc_start_date_property: z.string().optional().nullable(),
  calc_end_date_property: z.string().optional().nullable(),
  rollup_type: z.string().optional(),
  rollup_number_format: z.string().optional(),
  rollup_associated_record_type: z.string().optional().nullable(),
  rollup_date_format: z.string().optional(),
  user_selection_type: z.string().optional(),
  file_access: z.string().optional(),
}).passthrough()

// ── Property Access (PATCH) ───────────────────────────────
export const updatePropertyAccessSchema = z.object({
  access: z.object({
    level: z.enum(['all', 'teams', 'users', 'private']).optional(),
    teams: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
  }).passthrough(),
})

// ── Property Access Assignments (users/teams) ─────────────
export const propertyAccessAssignmentSchema = z.object({
  assignments: z.array(z.object({
    entity_id: z.string().min(1),
    access_level: z.string().min(1),
  })),
})

// ── Integration ───────────────────────────────────────────
export const createIntegrationSchema = z.object({
  app_name: z.string().min(1, 'App name is required').max(200),
  app_slug: z.string().min(1, 'App slug is required').max(100),
  app_logo_url: z.string().url().optional().nullable().or(z.literal('')),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

// ── Integration Notification ──────────────────────────────
export const createIntegrationNotificationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  notification_type: z.string().min(1, 'Notification type is required'),
  app_ids: z.array(z.string()).optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  frequency: z.string().optional(),
})

// ── Property Group ────────────────────────────────────────
export const createPropertyGroupSchema = z.object({
  object_type: z.string().min(1, 'Object type is required'),
  name: z.string().min(1, 'Group name is required').max(200),
})

// ── Meetings Settings ─────────────────────────────────────
export const updateMeetingsSchema = z.object({
  meetings_url_slug: z.string().max(200).optional(),
  default_meeting_link: z.string().url().optional().nullable().or(z.literal('')),
  scheduling_pages_enabled: z.boolean().optional(),
  include_meetings_in_chat: z.boolean().optional(),
}).passthrough()

// ── Notification Preferences ──────────────────────────────
export const updateNotificationPreferencesSchema = z.object({
  topic_preferences: z.array(z.string()).optional(),
  notify_for: z.enum(['all', 'mentions', 'none']).optional(),
  new_leads: z.boolean().optional(),
  task_reminders: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
  browser_alerts: z.boolean().optional(),
})

// ── Form Layout ───────────────────────────────────────────
export const updateFormLayoutSchema = z.object({
  object_type: z.string().min(1, 'Object type is required'),
  groups: z.array(formFieldGroupSchema).min(1, 'At least one group is required'),
})

// ── Object Config ─────────────────────────────────────────
export const updateObjectConfigSchema = z.object({
  object_type: z.string().min(1, 'Object type is required'),
  lifecycle_stages: z.array(lifecycleStageSchema).min(1, 'At least one lifecycle stage is required'),
  display_style: z.string().optional(),
})

export const createOrderSchema = z.object({
  title: z.string().min(1, 'Order title is required'),
  amount: z.number().nonnegative().optional().nullable(),
  stage: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  order_number: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  closed_at: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  line_items: z.array(z.object({
    product_id: z.string().uuid().optional().nullable(),
    description: z.string().optional().nullable(),
    quantity: z.number().int().positive(),
    unit_price: z.number().nonnegative(),
    discount: z.number().min(0).max(100).optional().nullable(),
    display_order: z.number().int().optional().nullable(),
  })).optional().nullable(),
})
