export interface Property {
  id: string
  label: string
  required?: boolean
  selected: boolean
  type?: string
}

export const DEFAULT_FIELDS: Property[] = [
  // Contact Activity
  { id: "act_membership_notes", label: "Membership notes", selected: true },
  { id: "act_message", label: "Message", selected: true },
  { id: "act_status", label: "Status", selected: true },

  // Contact Information
  { id: "annual_revenue", label: "Annual revenue", selected: true },
  { id: "chat_iql_date", label: "Chat Assistant IQL Date", selected: true },
  { id: "chat_source", label: "Chat Assistant Source", selected: true },
  { id: "chat_summary", label: "Chat Assistant:Summary", selected: true },
  { id: "city", label: "City", selected: true },
  { id: "company_name", label: "Company name", selected: true },
  { id: "country", label: "Country/Region", selected: true },
  { id: "country_code", label: "Country/Region Code", selected: true },
  { id: "email", label: "Email", required: true, selected: true },
  { id: "employment_role", label: "Employment Role", selected: true },
  { id: "employment_seniority", label: "Employment Seniority", selected: true },
  { id: "employment_sub_role", label: "Employment Sub Role", selected: true },
  { id: "fav_topics", label: "Favorite Content Topics", selected: true },
  { id: "fax", label: "Fax number", selected: true },
  { id: "first_name", label: "First name", required: true, selected: true },
  { id: "industry", label: "Industry", selected: true },
  { id: "inferred_langs", label: "Inferred Language Codes", selected: true },
  { id: "job_title", label: "Job title", selected: true },
  { id: "last_name", label: "Last name", required: true, selected: true },
  { id: "lifecycle_stage", label: "Lifecycle stage", selected: true },
  { id: "member_email", label: "Member email", selected: true },
  { id: "mobile_phone", label: "Mobile phone number", selected: true },
  { id: "num_employees", label: "Number of employees", selected: true },
  { id: "persona", label: "Persona", selected: true },
  { id: "phone", label: "Phone number", selected: true },
  { id: "postal_code", label: "Postal code", selected: true },
  { id: "pref_channels", label: "Preferred channels", selected: true },
  { id: "pref_lang", label: "Preferred language", selected: true },
  { id: "salutation", label: "Salutation", selected: true },
  { id: "state_region", label: "State/Region", selected: true },
  { id: "state_region_code", label: "State/Region Code", selected: true },
  { id: "street_address", label: "Street address", selected: true },
  { id: "timezone", label: "Time zone", selected: true },
  { id: "twitter", label: "Twitter username", selected: true },
  { id: "website", label: "Website URL", selected: true },
  { id: "whatsapp", label: "WhatsApp Phone Number", selected: true },

  // Conversion Information
  { id: "fb_click_id", label: "Facebook click id", selected: true },
  { id: "google_click_id", label: "Google ad click id", selected: true },
  { id: "linkedin_click_id", label: "LinkedIn click id", selected: true },
  { id: "tiktok_click_id", label: "TikTok click id", selected: true },

  // Deal Information
  { id: "buying_role", label: "Buying Role", selected: true },
  { id: "deal_close_date", label: "Close date", selected: true },

  // Email Information
  { id: "email_quarantine_reason", label: "Email address quarantine reason", selected: true },
  { id: "email_type", label: "Email type", selected: true },
  { id: "email_legal_basis", label: "Legal basis for processing contact's data", required: true, selected: true },

  // Facebook Ads properties
  { id: "fb_company_size", label: "Company size", selected: true },
  { id: "fb_dob", label: "Date of birth", selected: true },
  { id: "fb_degree", label: "Degree", selected: true },
  { id: "fb_field_study", label: "Field of study", selected: true },
  { id: "fb_gender", label: "Gender", selected: true },
  { id: "fb_grad_date", label: "Graduation date", selected: true },
  { id: "fb_job_function", label: "Job function", selected: true },
  { id: "fb_marital", label: "Marital status", selected: true },
  { id: "fb_military", label: "Military status", selected: true },
  { id: "fb_rel_status", label: "Relationship status", selected: true },
  { id: "fb_school", label: "School", selected: true },
  { id: "fb_seniority", label: "Seniority", selected: true },
  { id: "fb_start_date", label: "Start date", selected: true },
  { id: "fb_work_email", label: "Work email", selected: true },

  // Sales properties
  { id: "owner", label: "Contact owner", selected: true },
  { id: "lead_status", label: "Lead status", selected: true },

  // Social media information
  { id: "linkedin_url", label: "LinkedIn URL", selected: true },

  // Web analytics history
  { id: "latest_traffic_source", label: "Latest Traffic Source", selected: true },
  { id: "latest_traffic_source_date", label: "Latest Traffic Source Date", selected: true },
  { id: "orig_traffic_source", label: "Original Traffic Source", selected: true },
]
