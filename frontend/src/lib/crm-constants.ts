import { LifecycleStage } from "./types/crm";
import { getBadgeClasses, getBadgeCssVar } from "./badge-colors";

export const LIFECYCLE_STAGE_OPTIONS: { value: LifecycleStage; label: string; color: string; badgeColor: string }[] = [
  { value: 'subscriber', label: 'Subscriber', color: getBadgeCssVar('lifecycle', 'subscriber'), badgeColor: getBadgeClasses('lifecycle', 'subscriber', 'solid') },
  { value: 'lead', label: 'Lead', color: getBadgeCssVar('lifecycle', 'lead'), badgeColor: getBadgeClasses('lifecycle', 'lead', 'solid') },
  { value: 'marketing_qualified_lead', label: 'Marketing Qualified Lead', color: getBadgeCssVar('lifecycle', 'marketing_qualified_lead'), badgeColor: getBadgeClasses('lifecycle', 'marketing_qualified_lead', 'solid') },
  { value: 'sales_qualified_lead', label: 'Sales Qualified Lead', color: getBadgeCssVar('lifecycle', 'sales_qualified_lead'), badgeColor: getBadgeClasses('lifecycle', 'sales_qualified_lead', 'solid') },
  { value: 'opportunity', label: 'Opportunity', color: getBadgeCssVar('lifecycle', 'opportunity'), badgeColor: getBadgeClasses('lifecycle', 'opportunity', 'solid') },
  { value: 'customer', label: 'Customer', color: getBadgeCssVar('lifecycle', 'customer'), badgeColor: getBadgeClasses('lifecycle', 'customer', 'solid') },
  { value: 'evangelist', label: 'Evangelist', color: getBadgeCssVar('lifecycle', 'evangelist'), badgeColor: getBadgeClasses('lifecycle', 'evangelist', 'solid') },
  { value: 'other', label: 'Other', color: getBadgeCssVar('lifecycle', 'other'), badgeColor: getBadgeClasses('lifecycle', 'other', 'solid') },
];

export const CRM_BOARD_COLUMNS = [
  ...LIFECYCLE_STAGE_OPTIONS.map(stage => ({
    id: stage.value,
    label: stage.label,
    color: stage.color
  })),
  { id: "null", label: "Unassigned", color: "var(--stage-slate-light)" }
];

export const LIFECYCLE_FILTER_OPTIONS = LIFECYCLE_STAGE_OPTIONS.map(stage => ({
  value: stage.value,
  label: stage.label,
  color: stage.color,
  badgeColor: stage.badgeColor
}));

export const LEAD_STATUS_OPTIONS = [
  { value: "New", label: "New", color: getBadgeCssVar('lead_status', 'new'), badgeColor: getBadgeClasses('lead_status', 'new', 'solid') },
  { value: "Open", label: "Open", color: getBadgeCssVar('lead_status', 'open'), badgeColor: getBadgeClasses('lead_status', 'open', 'solid') },
  { value: "In progress", label: "In Progress", color: getBadgeCssVar('lead_status', 'in progress'), badgeColor: getBadgeClasses('lead_status', 'in progress', 'solid') },
  { value: "Open deal", label: "Open Deal", color: getBadgeCssVar('lead_status', 'open deal'), badgeColor: getBadgeClasses('lead_status', 'open deal', 'solid') },
  { value: "Unqualified", label: "Unqualified", color: getBadgeCssVar('lead_status', 'unqualified'), badgeColor: getBadgeClasses('lead_status', 'unqualified', 'solid') },
  { value: "Attempted to contact", label: "Attempted to Contact", color: getBadgeCssVar('lead_status', 'attempted to contact'), badgeColor: getBadgeClasses('lead_status', 'attempted to contact', 'solid') },
  { value: "Connected", label: "Connected", color: getBadgeCssVar('lead_status', 'connected'), badgeColor: getBadgeClasses('lead_status', 'connected', 'solid') },
  { value: "Bad timing", label: "Bad Timing", color: getBadgeCssVar('lead_status', 'bad timing'), badgeColor: getBadgeClasses('lead_status', 'bad timing', 'solid') },
];
export const DEAL_STAGE_OPTIONS = [
  { value: "new", label: "New", color: getBadgeCssVar('deal_stage', 'new'), badgeColor: getBadgeClasses('deal_stage', 'new', 'solid') },
  { value: "qualified", label: "Qualified", color: getBadgeCssVar('deal_stage', 'qualified'), badgeColor: getBadgeClasses('deal_stage', 'qualified', 'solid') },
  { value: "proposal", label: "Proposal", color: getBadgeCssVar('deal_stage', 'proposal'), badgeColor: getBadgeClasses('deal_stage', 'proposal', 'solid') },
  { value: "negotiation", label: "Negotiation", color: getBadgeCssVar('deal_stage', 'negotiation'), badgeColor: getBadgeClasses('deal_stage', 'negotiation', 'solid') },
  { value: "closed_won", label: "Closed Won", color: getBadgeCssVar('deal_stage', 'closed_won'), badgeColor: getBadgeClasses('deal_stage', 'closed_won', 'solid') },
  { value: "closed_lost", label: "Closed Lost", color: getBadgeCssVar('deal_stage', 'closed_lost'), badgeColor: getBadgeClasses('deal_stage', 'closed_lost', 'solid') },
];

export const OBJECT_TYPES = [
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "deal", label: "Deal" },
  { value: "ticket", label: "Ticket" },
  { value: "product", label: "Product" },
  { value: "order", label: "Order" },
];

export const OBJECT_TYPE_GROUPS: Record<string, string[]> = {
  contact: ["Contact information", "Social media", "Email information"],
  company: ["Company information", "Finance"],
  deal: ["Deal information", "Sales"],
  ticket: ["Ticket information", "Support"],
  product: ["Product information", "Pricing"],
  order: ["Order information", "Fulfillment", "E-commerce"],
};
