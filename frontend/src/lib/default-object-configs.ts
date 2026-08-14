export const DEFAULT_CONTACT_STAGES = [
  { id: 'subscriber', name: 'Subscriber', color: '#1E6FEB', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 1 },
  { id: 'lead', name: 'Lead', color: '#F04444', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 9 },
  { id: 'marketing_qualified_lead', name: 'Marketing Qualified Lead', color: '#17A18B', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'sales_qualified_lead', name: 'Sales Qualified Lead', color: '#D9468F', order: 3, is_default: false, is_active: true, calculated_props: true, used_in: 1 },
  { id: 'opportunity', name: 'Opportunity', color: '#E8930C', order: 4, is_default: false, is_active: true, calculated_props: true, used_in: 1 },
  { id: 'customer', name: 'Customer', color: '#7C3AED', order: 5, is_default: false, is_active: true, calculated_props: true, used_in: 2 },
  { id: 'evangelist', name: 'Evangelist', color: '#D8B4FE', order: 6, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'other', name: 'Other', color: '#D1D5DB', order: 7, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_COMPANY_STAGES = [
  { id: 'lead', name: 'Lead', color: '#E8930C', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'prospect', name: 'Prospect', color: '#1E6FEB', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'opportunity', name: 'Opportunity', color: '#7C3AED', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'customer', name: 'Customer', color: '#10B981', order: 3, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'churned', name: 'Churned', color: '#F04444', order: 4, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_DEAL_STAGES = [
  { id: 'appointment_scheduled', name: 'Appointment Scheduled', color: '#E8930C', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'qualified_to_buy', name: 'Qualified to Buy', color: '#1E6FEB', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'presentation_scheduled', name: 'Presentation Scheduled', color: '#7C3AED', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'decision_maker_bought_in', name: 'Decision Maker Bought In', color: '#D9468F', order: 3, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'contract_sent', name: 'Contract Sent', color: '#06B6D4', order: 4, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'closed_won', name: 'Closed Won', color: '#10B981', order: 5, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'closed_lost', name: 'Closed Lost', color: '#F04444', order: 6, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_TICKET_STAGES = [
  { id: 'new', name: 'New', color: '#6366F1', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'waiting_on_contact', name: 'Waiting on Contact', color: '#E8930C', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'waiting_on_us', name: 'Waiting on Us', color: '#1E6FEB', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'closed', name: 'Closed', color: '#10B981', order: 3, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_PRODUCT_STAGES = [
  { id: 'draft', name: 'Draft', color: '#71717A', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'active', name: 'Active', color: '#10B981', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'discontinued', name: 'Discontinued', color: '#F04444', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_ORDER_STAGES = [
  { id: 'open', name: 'Open', color: '#1E6FEB', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'paid', name: 'Paid', color: '#10B981', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'refunded', name: 'Refunded', color: '#E8930C', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_CALL_STAGES = [
  { id: 'planned', name: 'Planned', color: '#1E6FEB', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'completed', name: 'Completed', color: '#10B981', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'follow_up', name: 'Follow Up', color: '#E8930C', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_NOTE_STAGES = [
  { id: 'active', name: 'Active', color: '#1E6FEB', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'archived', name: 'Archived', color: '#71717A', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_TASK_STAGES = [
  { id: 'todo', name: 'To Do', color: '#1E6FEB', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'in_progress', name: 'In Progress', color: '#E8930C', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'done', name: 'Done', color: '#10B981', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_DOCUMENT_STAGES = [
  { id: 'draft', name: 'Draft', color: '#71717A', order: 0, is_default: true, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'review', name: 'In Review', color: '#E8930C', order: 1, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'approved', name: 'Approved', color: '#10B981', order: 2, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'published', name: 'Published', color: '#1E6FEB', order: 3, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
  { id: 'archived', name: 'Archived', color: '#D1D5DB', order: 4, is_default: false, is_active: true, calculated_props: true, used_in: 0 },
]

export const DEFAULT_STAGES_MAP = {
  contact: DEFAULT_CONTACT_STAGES,
  company: DEFAULT_COMPANY_STAGES,
  deal: DEFAULT_DEAL_STAGES,
  ticket: DEFAULT_TICKET_STAGES,
  product: DEFAULT_PRODUCT_STAGES,
  order: DEFAULT_ORDER_STAGES,
  call: DEFAULT_CALL_STAGES,
  note: DEFAULT_NOTE_STAGES,
  task: DEFAULT_TASK_STAGES,
  document: DEFAULT_DOCUMENT_STAGES,
}

export type ObjectType = 'contact' | 'company' | 'deal' | 'ticket' | 'document' | 'product' | 'order' | 'call' | 'note' | 'task'
export type StageConfig = {
  id: string
  name: string
  color: string
  order: number
  is_default: boolean
  is_active: boolean
  calculated_props: boolean
  used_in: number
}
