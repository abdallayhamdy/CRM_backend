"use client"

import { useState } from "react"
import { ChevronLeft, ChevronDown, Check, ExternalLink, Pencil, Info, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const PERMISSION_CATEGORIES: Record<string, { label: string; subcategories: string[] }> = {
  CRM: { label: "CRM", subcategories: ["CRM objects", "CRM tools"] },
  Reporting: { label: "Reporting", subcategories: [] },
  Account: { label: "Account", subcategories: ["Settings access"] },
}

// ─── CRM Objects ─────────────────────────────────────────────
interface CrmObjectPerm {
  id: string
  label: string
  type: "scope" | "toggle"
  critical?: boolean
  defaultValue: any
  scopeOptions?: string[]
  showUnassigned?: boolean
}

interface CrmObject {
  id: string
  label: string
  description: string
  hasPropertyAccess: boolean
  permissions: CrmObjectPerm[]
}

const CRM_OBJECTS: CrmObject[] = [
  {
    id: "contacts", label: "Contacts", description: "Save important info about your customers as a contact, so your team can connect with them.", hasPropertyAccess: true,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All contacts", "Their team's contacts", "Their contacts", "None"] },
      { id: "create", label: "Create", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All contacts", "Their team's contacts", "Their contacts", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "all", scopeOptions: ["All contacts", "Their team's contacts", "Their contacts", "None"] },
      { id: "merge", label: "Merge", type: "scope", defaultValue: "all", scopeOptions: ["All contacts", "Their team's contacts", "Their contacts", "None"] },
    ]
  },
  {
    id: "companies", label: "Companies", description: "Save useful info about companies in your database, so your team stays organized.", hasPropertyAccess: true,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All companies", "Their team's companies", "Their companies", "None"] },
      { id: "create", label: "Create", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All companies", "Their team's companies", "Their companies", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "all", scopeOptions: ["All companies", "Their team's companies", "Their companies", "None"] },
      { id: "merge", label: "Merge", type: "scope", defaultValue: "all", scopeOptions: ["All companies", "Their team's companies", "Their companies", "None"] },
    ]
  },
  {
    id: "deals", label: "Deals", description: "Store, track, and manage the deals your team is working on.", hasPropertyAccess: true,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All deals", "Their team's deals", "Their deals", "None"] },
      { id: "create", label: "Create", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All deals", "Their team's deals", "Their deals", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "all", scopeOptions: ["All deals", "Their team's deals", "Their deals", "None"] },
      { id: "merge", label: "Merge", type: "scope", defaultValue: "all", scopeOptions: ["All deals", "Their team's deals", "Their deals", "None"] },
    ]
  },
  {
    id: "orders", label: "Orders", description: "Store, track, and manage orders from your customers.", hasPropertyAccess: false,
    permissions: [
      { id: "view", label: "View", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "toggle", defaultValue: true },
    ]
  },
  {
    id: "tickets", label: "Tickets", description: "Log customer issues as tickets to assign to team members and organize them in one place.", hasPropertyAccess: true,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All tickets", "Their team's tickets", "Their tickets", "None"] },
      { id: "create", label: "Create", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All tickets", "Their team's tickets", "Their tickets", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "all", scopeOptions: ["All tickets", "Their team's tickets", "Their tickets", "None"] },
    ]
  },
  {
    id: "tasks", label: "Tasks", description: "Store, track, and manage the tasks your team is working on.", hasPropertyAccess: false,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All tasks", "Their tasks", "None"] },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All tasks", "Their tasks", "None"] },
    ]
  },
  {
    id: "notes", label: "Notes", description: "Manage access for notes and attachments on CRM records.", hasPropertyAccess: false,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "their", scopeOptions: ["Their notes", "None"], showUnassigned: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "none", scopeOptions: ["None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "none", scopeOptions: ["None"] },
    ]
  },
  {
    id: "calls", label: "Calls", description: "Track and manage phone calls logged in the CRM.", hasPropertyAccess: false,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All calls", "Their team's calls", "Their calls", "None"] },
      { id: "create", label: "Create", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All calls", "Their team's calls", "Their calls", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "none", scopeOptions: ["All calls", "Their team's calls", "Their calls", "None"] },
    ]
  },
  {
    id: "products", label: "Products", description: "Track the items or services your business sells.", hasPropertyAccess: true,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All products", "Their team's products", "Their products", "None"] },
      { id: "create", label: "Create", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All products", "Their team's products", "Their products", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "none", scopeOptions: ["All products", "Their team's products", "Their products", "None"] },
    ]
  },
  {
    id: "documents", label: "Documents", description: "Store, manage, and share business documents like proposals, contracts, and invoices.", hasPropertyAccess: false,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All documents", "Their team's documents", "Their documents", "None"] },
      { id: "create", label: "Create", type: "toggle", defaultValue: true },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All documents", "Their team's documents", "Their documents", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "none", scopeOptions: ["All documents", "Their team's documents", "Their documents", "None"] },
    ]
  },
  {
    id: "activity_feed", label: "Activity Feed", description: "View the centralized activity timeline showing all CRM events and actions across the workspace.", hasPropertyAccess: false,
    permissions: [
      { id: "view", label: "View", type: "scope", defaultValue: "all", scopeOptions: ["All activities", "Their team's activities", "Their activities", "None"] },
      { id: "edit", label: "Edit", type: "scope", defaultValue: "all", scopeOptions: ["All activities", "Their team's activities", "Their activities", "None"] },
      { id: "delete", label: "Delete", type: "scope", critical: true, defaultValue: "none", scopeOptions: ["All activities", "Their team's activities", "Their activities", "None"] },
    ]
  },
]

// ─── CRM Tools ───────────────────────────────────────────────
interface CrmToolPerm {
  id: string
  label: string
  type: "scope" | "toggle"
  critical?: boolean
  defaultValue: any
  scopeOptions?: string[]
}

interface CrmToolSection {
  id: string
  label: string
  description: string
  section?: string
  sectionDescription?: string
  type?: "scope" | "toggle"
  critical?: boolean
  defaultValue?: any
  scopeOptions?: string[]
  permissions?: CrmToolPerm[]
}

const CRM_TOOLS: CrmToolSection[] = [
  {
    id: "bulk_delete", label: "Bulk delete",
    description: "Delete records in bulk from your account.",
    type: "toggle", defaultValue: false, critical: true,
  },
  {
    id: "import", label: "Import",
    description: "Import CRM records into your account in bulk or one at a time.",
    type: "toggle", defaultValue: true, critical: true,
  },
  {
    id: "export", label: "Export",
    description: "Download reports and CRM records from your account.",
    type: "toggle", defaultValue: false, critical: true,
  },
  {
    id: "edit_customer_tasks", label: "Edit customer tasks",
    description: "View, edit, and delete tasks assigned to customers.",
    type: "toggle", defaultValue: false,
  },
  {
    id: "edit_associations", label: "Edit associations",
    description: "Create, edit and delete associations and labels on existing records. To change associations while on a record, a user also needs the CRM objects > Edit permission for the record they're on.",
    type: "toggle", defaultValue: true,
  },
  {
    id: "customize_record_page", label: "Customize record page layout",
    description: "Let users edit the record page layout and content within object settings.",
    type: "toggle", defaultValue: false,
  },
]

// ─── Reporting ───────────────────────────────────────────────
interface ReportingPerm {
  id: string
  label: string
  type: "scope" | "toggle"
  critical?: boolean
  defaultValue: any
  scopeOptions?: string[]
}

interface ReportingItem {
  id: string
  label: string
  description: string
  type?: "scope" | "toggle"
  critical?: boolean
  defaultValue?: any
  scopeOptions?: string[]
  isMaster?: boolean
  permissions?: ReportingPerm[]
}

const REPORTING_PERMISSIONS: ReportingItem[] = [
  {
    id: "reports_access", label: "Reports Access",
    description: "Give access to reporting tools. This includes dashboards, reports, and analytics tools. If turned off, users won't see Reports in the main menu.",
    type: "toggle", defaultValue: true, isMaster: true,
  },
  {
    id: "dashboard_reports_analytics", label: "Dashboard, reports, and analytics",
    description: "Give access to advanced dashboard features (i.e. - data records, share, and creation of dashboards, plus more).",
    permissions: [
      { id: "view", label: "View", type: "toggle", defaultValue: false },
      { id: "edit", label: "Edit", type: "toggle", defaultValue: true },
      { id: "create_own", label: "Create/Own", type: "toggle", defaultValue: true },
      { id: "admin", label: "Admin", type: "toggle", defaultValue: false },
    ]
  },
]

// ─── Account → Settings access ───────────────────────────────
interface SettingsAccessPerm {
  id: string
  label: string
  description: string
  type: "toggle"
  critical?: boolean
  defaultValue: any
  hasInfo?: boolean
}

const SETTINGS_ACCESS_PERMISSIONS: SettingsAccessPerm[] = [
  {
    id: "permanently_delete_contacts", label: "Permanently delete contacts",
    description: "Permanently delete contacts. This permission needs access to delete records.",
    type: "toggle", defaultValue: false,
  },
  {
    id: "edit_property_settings", label: "Edit property settings",
    description: "Let users create and edit object properties.",
    type: "toggle", defaultValue: false,
  },
]

// ─── Templates ───────────────────────────────────────────────
const ROLE_TEMPLATES = [
  { value: "super_admin", label: "Super Admin", group: "Role templates" },
  { value: "view_only", label: "View only", group: "Role templates" },
  { value: "standard_user", label: "Standard user", group: "Role templates" },
  { value: "marketing_manager", label: "Marketing manager", group: "Role templates" },
  { value: "sales_manager", label: "Sales manager", group: "Role templates" },
  { value: "sales_rep", label: "Sales rep", group: "Role templates" },
]

// ─── Template presets ────────────────────────────────────────
const TEMPLATE_PRESETS: Record<string, Record<string, any>> = {
  view_only: {
    contacts: { view: 'all', create: false, edit: 'none', delete: 'none', merge: 'none' },
    companies: { view: 'all', create: false, edit: 'none', delete: 'none', merge: 'none' },
    deals: { view: 'all', create: false, edit: 'none', delete: 'none', merge: 'none' },
    tickets: { view: 'all', create: false, edit: 'none', delete: 'none', merge: 'none' },
    tasks: { view: 'all', edit: 'none' },
    calls: { view: 'all', create: false, edit: 'none', delete: 'none' },
    products: { view: 'all', create: false, edit: 'none', delete: 'none' },
    documents: { view: 'all', create: false, edit: 'none', delete: 'none' },
    activity_feed: { view: 'all', edit: 'none', delete: 'none' },
    communicate: 'none', bulk_delete: false, import: false, export: false,
    edit_customer_tasks: false, edit_associations: false,
    customize_record_page: false, view_connected_record_data: false, shared_inbox: false,
    goals_view: 'their', goals_edit: 'none',
    reports_access: true, dashboard_view: false, dashboard_edit: false,
    marketing_reports: false, multi_account_reports: false,
    custom_events_view: false, custom_events_edit: false, custom_events_delete: false,
    modify_billing: false, personal_email_access: false, app_marketplace_access: false,
    app_marketplace_uninstall: false, template_marketplace: false,
    permanently_delete_contacts: false, edit_property_settings: false,
  },
  standard_user: {
    contacts: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    companies: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    deals: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    tickets: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    tasks: { view: 'all', edit: 'all' },
    calls: { view: 'all', create: true, edit: 'all', delete: 'their' },
    products: { view: 'all', create: true, edit: 'all', delete: 'their' },
    documents: { view: 'all', create: true, edit: 'all', delete: 'their' },
    activity_feed: { view: 'all', edit: 'all', delete: 'their' },
    communicate: 'all', bulk_delete: false, import: true, export: false,
    edit_customer_tasks: false, edit_associations: true,
    customize_record_page: false, view_connected_record_data: false, shared_inbox: true,
    goals_view: 'their', goals_edit: 'none',
    reports_access: true, dashboard_view: false, dashboard_edit: true, dashboard_create: true,
    marketing_reports: true, multi_account_reports: false,
    custom_events_view: true, custom_events_edit: false, custom_events_delete: false,
    modify_billing: false, personal_email_access: true, app_marketplace_access: false,
    app_marketplace_uninstall: false, template_marketplace: true,
    permanently_delete_contacts: false, edit_property_settings: false,
  },
  marketing_manager: {
    contacts: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    companies: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    deals: { view: 'all', create: false, edit: 'none', delete: 'none', merge: 'none' },
    tickets: { view: 'all', create: false, edit: 'none', delete: 'none', merge: 'none' },
    tasks: { view: 'all', edit: 'all' },
    calls: { view: 'all', create: true, edit: 'all', delete: 'none' },
    products: { view: 'all', create: false, edit: 'none', delete: 'none' },
    documents: { view: 'all', create: true, edit: 'all', delete: 'none' },
    activity_feed: { view: 'all', edit: 'all', delete: 'none' },
    communicate: 'all', bulk_delete: true, import: true, export: true,
    edit_associations: true, customize_record_page: false,
    shared_inbox: false,
    goals_view: 'all', goals_edit: 'all',
    reports_access: true, dashboard_view: true, dashboard_edit: true, dashboard_create: true, dashboard_admin: false,
    marketing_reports: true, multi_account_reports: false,
    custom_events_view: true, custom_events_edit: false, custom_events_delete: false,
    personal_email_access: false, app_marketplace_access: false,
    template_marketplace: true, edit_property_settings: true,
  },
  sales_manager: {
    contacts: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    companies: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    deals: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    tickets: { view: 'all', create: true, edit: 'all', delete: 'all', merge: 'all' },
    tasks: { view: 'all', edit: 'all' },
    calls: { view: 'all', create: true, edit: 'all', delete: 'their' },
    products: { view: 'all', create: true, edit: 'all', delete: 'their' },
    documents: { view: 'all', create: true, edit: 'all', delete: 'their' },
    activity_feed: { view: 'all', edit: 'all', delete: 'their' },
    communicate: 'all', bulk_delete: true, import: true, export: true,
    edit_associations: true, customize_record_page: false,
    shared_inbox: true,
    goals_view: 'all', goals_edit: 'all',
    reports_access: true, dashboard_edit: true, dashboard_create: true, dashboard_admin: false,
    marketing_reports: false, multi_account_reports: false,
    custom_events_view: true, custom_events_edit: false, custom_events_delete: false,
    personal_email_access: true, app_marketplace_access: false,
    template_marketplace: false, edit_property_settings: true,
  },
  sales_rep: {
    contacts: { view: 'all', create: true, edit: 'all', delete: 'their', merge: 'their' },
    companies: { view: 'all', create: true, edit: 'all', delete: 'their', merge: 'their' },
    deals: { view: 'all', create: true, edit: 'all', delete: 'their', merge: 'their' },
    tickets: { view: 'all', create: true, edit: 'all', delete: 'their', merge: 'their' },
    tasks: { view: 'all', edit: 'all' },
    calls: { view: 'all', create: true, edit: 'all', delete: 'their' },
    products: { view: 'all', create: true, edit: 'all', delete: 'their' },
    documents: { view: 'all', create: true, edit: 'all', delete: 'their' },
    activity_feed: { view: 'all', edit: 'all', delete: 'their' },
    communicate: 'all', bulk_delete: false, import: true, export: false,
    edit_associations: true, customize_record_page: false,
    shared_inbox: true,
    goals_view: 'all', goals_edit: 'their',
    reports_access: true, dashboard_edit: false, dashboard_create: true,
    marketing_reports: false, multi_account_reports: false,
    custom_events_view: true, custom_events_edit: false, custom_events_delete: false,
    personal_email_access: true, app_marketplace_access: false,
    template_marketplace: false, edit_property_settings: false,
  },
}

// ─── Component ───────────────────────────────────────────────
interface CreatePermissionSetPageProps {
  onBack: () => void
}

export function CreatePermissionSetPage({ onBack }: CreatePermissionSetPageProps) {
  const [activeTab, setActiveTab] = useState<"access" | "review" | "users">("access")
  const [name, setName] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [template, setTemplate] = useState("standard_user")
  const [templateSearch, setTemplateSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("CRM objects")
  const [expandAll, setExpandAll] = useState(true)
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(
    new Set(CRM_OBJECTS.map(o => o.id))
  )

  // CRM Objects state
  const [permissions, setPermissions] = useState<Record<string, Record<string, any>>>(() => {
    const initial: Record<string, Record<string, any>> = {}
    CRM_OBJECTS.forEach(obj => {
      initial[obj.id] = {}
      obj.permissions.forEach(perm => {
        initial[obj.id][perm.id] = perm.defaultValue
      })
    })
    return initial
  })

  const [objectEnabled, setObjectEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(CRM_OBJECTS.map(o => [o.id, true]))
  )

  // CRM Tools state
  const [crmToolsEnabled, setCrmToolsEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(CRM_TOOLS.map(t => [t.id, t.defaultValue !== false]))
  )
  const [crmToolsExpanded, setCrmToolsExpanded] = useState<Set<string>>(new Set())
  const [crmToolsValues, setCrmToolsValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    CRM_TOOLS.forEach(t => { initial[t.id] = t.defaultValue })
    return initial
  })

  // Reporting state
  const [reportingEnabled, setReportingEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(REPORTING_PERMISSIONS.map(r => [r.id, r.defaultValue !== false]))
  )
  const [reportingExpanded, setReportingExpanded] = useState<Set<string>>(new Set())
  const [reportingValues, setReportingValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    REPORTING_PERMISSIONS.forEach(r => {
      if (r.permissions) {
        r.permissions.forEach(p => { initial[`${r.id}_${p.id}`] = p.defaultValue })
      } else {
        initial[r.id] = r.defaultValue
      }
    })
    return initial
  })

  // Settings access state
  const [settingsValues, setSettingsValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    SETTINGS_ACCESS_PERMISSIONS.forEach(p => { initial[p.id] = p.defaultValue })
    return initial
  })

  // Review tab state
  const [expandedReviewSections, setExpandedReviewSections] = useState<Set<string>>(
    new Set(['crm_objects', 'crm_tools', 'reporting', 'account'])
  )

  const toggleReviewSection = (id: string) => {
    setExpandedReviewSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  // Users tab state
  const [userSearch, setUserSearch] = useState("")
  const [selectedUsers, _setSelectedUsers] = useState<string[]>([])
  const [assignedUsers, setAssignedUsers] = useState<{id: string, name: string, email: string}[]>([])
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedObjects(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedObjects(new Set())
    } else {
      setExpandedObjects(new Set(CRM_OBJECTS.map(o => o.id)))
    }
    setExpandAll(!expandAll)
  }

  const updatePermission = (objectId: string, permId: string, value: any) => {
    setPermissions(prev => ({
      ...prev,
      [objectId]: { ...prev[objectId], [permId]: value }
    }))
  }

  const toggleCrmTool = (id: string) => {
    setCrmToolsEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleCrmToolExpand = (id: string) => {
    setCrmToolsExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const updateCrmToolValue = (id: string, value: any) => {
    setCrmToolsValues(prev => ({ ...prev, [id]: value }))
  }

  const toggleReportingExpand = (id: string) => {
    setReportingExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const updateReportingValue = (key: string, value: any) => {
    setReportingValues(prev => ({ ...prev, [key]: value }))
  }

  const updateSettingsValue = (id: string, value: boolean) => {
    setSettingsValues(prev => ({ ...prev, [id]: value }))
  }

  // ─── Template handling ──────────────────────────────────────
  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate)
    if (TEMPLATE_PRESETS[newTemplate]) {
      applyPreset(TEMPLATE_PRESETS[newTemplate])
    }
  }

  const handleReset = () => {
    if (template === "super_admin") return

    const preset = TEMPLATE_PRESETS[template]
    if (preset) {
      applyPreset(preset)
    } else {
      const newPermissions: Record<string, Record<string, any>> = {}
      CRM_OBJECTS.forEach(obj => {
        newPermissions[obj.id] = {}
        obj.permissions.forEach(perm => {
          newPermissions[obj.id][perm.id] = perm.defaultValue
        })
      })
      setPermissions(newPermissions)
      setObjectEnabled(Object.fromEntries(CRM_OBJECTS.map(o => [o.id, true])))

      const newCrmToolsValues: Record<string, any> = {}
      CRM_TOOLS.forEach(t => { newCrmToolsValues[t.id] = t.defaultValue })
      setCrmToolsValues(newCrmToolsValues)
      setCrmToolsEnabled(Object.fromEntries(CRM_TOOLS.map(t => [t.id, t.defaultValue !== false])))

      const newReportingValues: Record<string, any> = {}
      REPORTING_PERMISSIONS.forEach(r => {
        if (r.permissions) {
          r.permissions.forEach(p => { newReportingValues[`${r.id}_${p.id}`] = p.defaultValue })
        } else {
          newReportingValues[r.id] = r.defaultValue
        }
      })
      setReportingValues(newReportingValues)
      setReportingEnabled(Object.fromEntries(REPORTING_PERMISSIONS.map(r => [r.id, r.defaultValue !== false])))

      const newSettingsValues: Record<string, boolean> = {}
      SETTINGS_ACCESS_PERMISSIONS.forEach(p => { newSettingsValues[p.id] = p.defaultValue })
      setSettingsValues(newSettingsValues)
    }
  }

  const applyPreset = (preset: Record<string, any>) => {
    // CRM objects
    const newPermissions: Record<string, Record<string, any>> = {}
    CRM_OBJECTS.forEach(obj => {
      newPermissions[obj.id] = {}
      obj.permissions.forEach(perm => {
        if (preset[obj.id] && typeof preset[obj.id] === 'object') {
          newPermissions[obj.id][perm.id] = preset[obj.id][perm.id] ?? perm.defaultValue
        } else {
          newPermissions[obj.id][perm.id] = perm.defaultValue
        }
      })
    })
    setPermissions(newPermissions)

    // CRM tools
    const newCrmToolsValues: Record<string, any> = {}
    CRM_TOOLS.forEach(t => {
      newCrmToolsValues[t.id] = preset[t.id] ?? t.defaultValue
    })
    setCrmToolsValues(newCrmToolsValues)

    // Reporting
    const newReportingValues: Record<string, any> = {}
    REPORTING_PERMISSIONS.forEach(r => {
      if (r.permissions) {
        r.permissions.forEach(p => {
          newReportingValues[`${r.id}_${p.id}`] = preset[`${r.id}_${p.id}`] ?? preset[`${r.id}_view`] ?? p.defaultValue
        })
      } else {
        newReportingValues[r.id] = preset[r.id] ?? r.defaultValue
      }
    })
    setReportingValues(newReportingValues)

    // Settings access
    const newSettingsValues: Record<string, boolean> = {}
    SETTINGS_ACCESS_PERMISSIONS.forEach(p => {
      newSettingsValues[p.id] = preset[p.id] ?? p.defaultValue
    })
    setSettingsValues(newSettingsValues)
  }

  // ─── Render helpers ─────────────────────────────────────────
  const renderToggle = (checked: boolean, onChange: () => void, disabled?: boolean) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange()
      }}
      className={cn(
        "w-10 h-6 rounded border flex items-center justify-center flex-shrink-0",
        checked ? "bg-primary border-primary" : "bg-background border-input",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {checked && <Check className="h-3 w-3 text-primary-foreground" />}
    </button>
  )

  const renderScope = (
    value: string,
    options: string[],
    onSelect: (val: string) => void,
    dropdownId: string,
    objectLabel?: string,
    permLabel?: string
  ) => {
    const getDescription = (optLabel: string) => {
      if (!objectLabel || !permLabel) return ""
      const obj = objectLabel.toLowerCase()
      const action = permLabel.toLowerCase()
      if (optLabel.toLowerCase().startsWith('all')) return `Users can ${action} any ${obj}.`
      if (optLabel.toLowerCase().includes("team's")) return `Users can ${action} ${obj} owned by or shared with them or their teams.`
      if (optLabel.toLowerCase().startsWith('their')) return `Users can only ${action} ${obj} they own or that have been shared with them.`
      return `Users can not ${action} any ${obj}.`
    }

    const toValue = (opt: string) =>
      opt.toLowerCase().startsWith('all') ? 'all'
      : opt.toLowerCase().includes("team's") ? 'team'
      : opt.toLowerCase().startsWith('their') ? 'their'
      : 'none'

    return (
      <DropdownMenu
        open={openDropdownId === dropdownId}
        onOpenChange={(isOpen) => setOpenDropdownId(isOpen ? dropdownId : null)}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-foreground/80 hover:text-foreground"
          >
            {value === "all" ? options[0]
              : value === "their" ? options.find(o => o.startsWith("Their")) ?? options[0]
              : value === "none" ? "None"
              : value}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 z-[300] p-0"
          style={{ zIndex: 300 }}
          onInteractOutside={() => setOpenDropdownId(null)}
          onEscapeKeyDown={() => setOpenDropdownId(null)}
        >
          {options.map((opt, index) => (
            <div key={opt}>
              {index > 0 && <DropdownMenuSeparator className="my-0" />}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(toValue(opt))
                  setOpenDropdownId(null)
                }}
                className="flex flex-col items-start gap-0.5 py-3 px-3 cursor-pointer"
              >
                <span className="font-medium text-sm text-foreground">{opt}</span>
                {objectLabel && permLabel && (
                  <span className="text-xs text-muted-foreground leading-snug">
                    {getDescription(opt)}
                  </span>
                )}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ─── Category content ───────────────────────────────────────
  const renderCategoryContent = () => {
    // CRM objects
    if (activeCategory === "CRM objects") {
      return (
        <div className="space-y-4">
          {template === "super_admin" ? (
            <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 border border-primary/30 dark:border-primary/30 rounded-lg max-w-2xl">
              <p className="font-semibold text-sm">Super Admins can access almost everything.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Super Admins can manage all users, tools, and settings. If this super admin needs full access to sales or service tools, add a matching seat.
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Choose how to set access</span>
                  <span className="text-sm text-primary dark:text-primary cursor-pointer">Start with a template</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Choose a template</Label>
                  <div className="relative">
                    <Select value={template} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[300]" style={{ zIndex: 300 }}>
                        <div className="p-2">
                          <Input
                            placeholder="Search"
                            value={templateSearch}
                            onChange={e => setTemplateSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                          Role templates
                        </div>
                        {ROLE_TEMPLATES
                          .filter(t => t.label.toLowerCase().includes(templateSearch.toLowerCase()))
                          .map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))
                        }
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 border-t mt-1 pt-2">
                          User templates
                        </div>
                        <SelectItem value="custom" disabled>Workspace members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Reset changes
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Choose permissions</h3>
                <div className="flex items-center gap-2">
                  <Checkbox checked={expandAll} onCheckedChange={toggleExpandAll} id="expand-all" className="pointer-events-auto" />
                  <label htmlFor="expand-all" className="text-sm cursor-pointer">Expand all permissions</label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </>
          )}

          {template !== "super_admin" && CRM_OBJECTS.map(obj => (
            <div key={obj.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-background">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleExpand(obj.id)} className="mt-1">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", !expandedObjects.has(obj.id) && "-rotate-90")} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{obj.label}</span>
                      {obj.hasPropertyAccess && (
                        <span className="text-xs text-primary dark:text-primary hover:underline flex items-center gap-1 cursor-pointer">
                          Manage property access <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">{obj.description}</p>
                    {expandedObjects.has(obj.id) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {obj.permissions.map((p, i) => (
                          <span key={p.id}>
                            <span className={p.id === 'delete' || p.id === 'merge' ? 'font-semibold' : ''}>{p.label}</span>
                            {i < obj.permissions.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{objectEnabled[obj.id] ? "ON" : "OFF"}</span>
                  {renderToggle(objectEnabled[obj.id], () => setObjectEnabled(prev => ({ ...prev, [obj.id]: !prev[obj.id] })))}
                </div>
              </div>

              {expandedObjects.has(obj.id) && (
                <div className={cn("border-t divide-y", !objectEnabled[obj.id] && "opacity-40 pointer-events-none")}>
                  {obj.permissions.map(perm => (
                    <div key={perm.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{perm.label}</span>
                        {perm.critical && (
                          <span className="text-xs bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive px-1.5 py-0.5 rounded font-medium">
                            Critical
                          </span>
                        )}
                      </div>
                      {perm.type === 'toggle' ? (
                        renderToggle(permissions[obj.id]?.[perm.id] ?? perm.defaultValue, () => updatePermission(obj.id, perm.id, !permissions[obj.id]?.[perm.id]))
                      ) : (
                        <div className="flex items-center gap-2">
                          {renderScope(permissions[obj.id]?.[perm.id] ?? perm.defaultValue, perm.scopeOptions ?? [], (val) => updatePermission(obj.id, perm.id, val), `${obj.id}-${perm.id}`, obj.label, perm.label)}
                          {perm.showUnassigned && (
                            <div className="flex items-center gap-1.5">
                              <Checkbox
                                id={`${obj.id}-${perm.id}-unassigned`}
                                checked={permissions[obj.id]?.[`${perm.id}_unassigned`] || false}
                                onCheckedChange={(val) => updatePermission(obj.id, `${perm.id}_unassigned`, val)}
                                className="pointer-events-auto"
                              />
                              <label htmlFor={`${obj.id}-${perm.id}-unassigned`} className="text-xs text-muted-foreground cursor-pointer">
                                Unassigned
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    // CRM tools
    if (activeCategory === "CRM tools") {
      let currentSection: string | null = null
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">CRM tools</h3>
          {CRM_TOOLS.map(tool => {
            const showSectionHeader = tool.section && tool.section !== currentSection
            if (tool.section) currentSection = tool.section
            return (
              <div key={tool.id}>
                {showSectionHeader && tool.section && (
                  <div className="pt-4 pb-2">
                    <h4 className="text-sm font-semibold text-foreground">{tool.section}</h4>
                    {tool.sectionDescription && (
                      <p className="text-xs text-muted-foreground mt-0.5">{tool.sectionDescription}</p>
                    )}
                  </div>
                )}
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-background">
                    <div className="flex items-start gap-3">
                      {tool.permissions && (
                        <button onClick={() => toggleCrmToolExpand(tool.id)} className="mt-1">
                          <ChevronDown className={cn("h-4 w-4 transition-transform", !crmToolsExpanded.has(tool.id) && "-rotate-90")} />
                        </button>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tool.label}</span>
                          {tool.critical && (
                            <span className="text-xs bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive px-1.5 py-0.5 rounded font-medium">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{crmToolsEnabled[tool.id] ? "ON" : "OFF"}</span>
                      {renderToggle(crmToolsEnabled[tool.id], () => toggleCrmTool(tool.id))}
                    </div>
                  </div>

                  {crmToolsExpanded.has(tool.id) && crmToolsEnabled[tool.id] && tool.permissions && (
                    <div className="border-t divide-y">
                      {tool.permissions.map(perm => (
                        <div key={perm.id} className="flex items-center justify-between px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{perm.label}</span>
                            {perm.critical && (
                              <span className="text-xs bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive px-1.5 py-0.5 rounded font-medium">
                                Critical
                              </span>
                            )}
                          </div>
                          {perm.type === 'toggle' ? (
                            renderToggle(crmToolsValues[`${tool.id}_${perm.id}`] ?? perm.defaultValue, () => updateCrmToolValue(`${tool.id}_${perm.id}`, !crmToolsValues[`${tool.id}_${perm.id}`]))
                          ) : (
                            renderScope(crmToolsValues[`${tool.id}_${perm.id}`] ?? perm.defaultValue, perm.scopeOptions ?? [], (val) => updateCrmToolValue(`${tool.id}_${perm.id}`, val), `${tool.id}-${perm.id}`, tool.label, perm.label)
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!tool.permissions && crmToolsEnabled[tool.id] && (
                    <div className="border-t px-6 py-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Access:</span>
                      {tool.type === 'toggle' ? (
                        renderToggle(crmToolsValues[tool.id] ?? tool.defaultValue, () => updateCrmToolValue(tool.id, !crmToolsValues[tool.id]))
                      ) : (
                        renderScope(crmToolsValues[tool.id] ?? tool.defaultValue, tool.scopeOptions ?? [], (val) => updateCrmToolValue(tool.id, val), tool.id, tool.label, tool.label)
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // Reporting
    if (activeCategory === "Reporting") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Reporting</h3>
          {REPORTING_PERMISSIONS.map(item => {
            const isExpandable = item.permissions && item.permissions.length > 0
            return (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-background">
                  <div className="flex items-start gap-3">
                    {isExpandable && (
                      <button onClick={() => toggleReportingExpand(item.id)} className="mt-1">
                        <ChevronDown className={cn("h-4 w-4 transition-transform", !reportingExpanded.has(item.id) && "-rotate-90")} />
                      </button>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.label}</span>
                        {item.critical && (
                          <span className="text-xs bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive px-1.5 py-0.5 rounded font-medium">
                            Critical
                          </span>
                        )}
                        {item.isMaster && (
                          <span className="text-xs bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary px-1.5 py-0.5 rounded font-medium">
                            Master
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{reportingEnabled[item.id] ? "ON" : "OFF"}</span>
                    {renderToggle(reportingEnabled[item.id], () => setReportingEnabled(prev => ({ ...prev, [item.id]: !prev[item.id] })))}
                  </div>
                </div>

                {reportingExpanded.has(item.id) && reportingEnabled[item.id] && item.permissions && (
                  <div className="border-t divide-y">
                    {item.permissions.map(perm => (
                      <div key={perm.id} className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{perm.label}</span>
                          {perm.critical && (
                            <span className="text-xs bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive px-1.5 py-0.5 rounded font-medium">
                              Critical
                            </span>
                          )}
                        </div>
                        {perm.type === 'toggle' ? (
                          renderToggle(reportingValues[`${item.id}_${perm.id}`] ?? perm.defaultValue, () => updateReportingValue(`${item.id}_${perm.id}`, !reportingValues[`${item.id}_${perm.id}`]))
                        ) : (
                          renderScope(reportingValues[`${item.id}_${perm.id}`] ?? perm.defaultValue, perm.scopeOptions ?? [], (val) => updateReportingValue(`${item.id}_${perm.id}`, val), `${item.id}-${perm.id}`, item.label, perm.label)
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    // Settings access
    if (activeCategory === "Settings access") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Settings access</h3>
          {SETTINGS_ACCESS_PERMISSIONS.map(item => (
            <div key={item.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-background">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.critical && (
                        <span className="text-xs bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive px-1.5 py-0.5 rounded font-medium">
                          Critical
                        </span>
                      )}
                      {item.hasInfo && (
                        <Info className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{settingsValues[item.id] ? "ON" : "OFF"}</span>
                  {renderToggle(settingsValues[item.id], () => updateSettingsValue(item.id, !settingsValues[item.id]))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Coming soon placeholder
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="font-medium">{activeCategory}</p>
          <p className="text-sm mt-1">Coming soon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-[200] flex flex-col pointer-events-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-primary text-primary-foreground">
        <button onClick={onBack} className="flex items-center gap-2 text-sm hover:text-primary-foreground/70">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {editingName ? (
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              className="bg-transparent border-b border-primary-foreground text-primary-foreground text-sm outline-none px-1"
              placeholder="Permission set name"
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              {name || "Permission set name"}
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
        <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={onBack}>
          Create
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-background">
        {(["access", "review", "users"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors",
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground/80"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      {activeTab === "access" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — categories */}
          <div className="w-[180px] lg:w-[220px] border-r overflow-y-auto py-4 flex-shrink-0">
            {Object.entries(PERMISSION_CATEGORIES).map(([key, cat]) => (
              <div key={key}>
                <div className="px-4 py-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat.label}</span>
                </div>
                {cat.subcategories.length > 0 ? (
                  cat.subcategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActiveCategory(sub)}
                      className={cn(
                        "w-full text-left px-6 py-1.5 text-sm transition-colors",
                        activeCategory === sub
                          ? "bg-muted font-medium text-foreground border-l-2 border-primary"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {sub}
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => setActiveCategory(key)}
                    className={cn(
                      "w-full text-left px-6 py-1.5 text-sm transition-colors",
                      activeCategory === key
                        ? "bg-muted font-medium text-foreground border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {key}
                  </button>
                )}
              </div>
            ))}
            <div className="px-4 pt-4 border-t mt-4">
              <span className="text-sm text-primary dark:text-primary cursor-pointer hover:underline">
                Learn more about permissions ↗
              </span>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderCategoryContent()}
          </div>
        </div>
      )}

      {activeTab === "review" && (
        <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
          <h2 className="text-xl font-semibold text-center text-foreground">Review permission set access</h2>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
            You're almost done. Check all the access settings to make sure everything looks good.
          </p>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  All sections <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All sections</DropdownMenuItem>
                <DropdownMenuItem>CRM objects</DropdownMenuItem>
                <DropdownMenuItem>CRM tools</DropdownMenuItem>
                <DropdownMenuItem>Reporting</DropdownMenuItem>
                <DropdownMenuItem>Account</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-9" />
            </div>
          </div>

          <div className="space-y-6">
            {/* CRM Objects section */}
            <div>
              <button
                className="flex items-center gap-2 font-semibold text-sm mb-3"
                onClick={() => toggleReviewSection('crm_objects')}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", !expandedReviewSections.has('crm_objects') && "-rotate-90")} />
                CRM objects ({CRM_OBJECTS.filter(o => objectEnabled[o.id]).length})
              </button>

              {expandedReviewSections.has('crm_objects') && (
                <div className="space-y-4 pl-6">
                  {CRM_OBJECTS.filter(o => objectEnabled[o.id]).map(obj => (
                    <div key={obj.id}>
                      <p className="font-medium text-sm">{obj.label}</p>
                      <div className="mt-1 space-y-0.5">
                        {obj.permissions.map(perm => {
                          const val = permissions[obj.id]?.[perm.id]
                          if (perm.type === 'toggle' && !val) return null
                          return (
                            <p key={perm.id} className="text-xs text-muted-foreground">
                              <span className={perm.critical ? "font-semibold" : ""}>{perm.label}</span>
                              {perm.type === 'scope' && val && (
                                <span className="text-muted-foreground">
                                  {' '}({val === 'all' ? `All ${obj.label.toLowerCase()}`
                                    : val === 'team' ? `Their team's ${obj.label.toLowerCase()}`
                                    : val === 'their' ? `Their ${obj.label.toLowerCase()}`
                                    : 'None'})
                                </span>
                              )}
                              {perm.critical && (
                                <span className="ml-1 text-xs bg-destructive/10 text-destructive px-1 py-0.5 rounded">Critical</span>
                              )}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CRM Tools section */}
            <div>
              <button
                className="flex items-center gap-2 font-semibold text-sm mb-3"
                onClick={() => toggleReviewSection('crm_tools')}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", !expandedReviewSections.has('crm_tools') && "-rotate-90")} />
                CRM tools ({CRM_TOOLS.filter(t => crmToolsEnabled[t.id]).length})
              </button>

              {expandedReviewSections.has('crm_tools') && (
                <div className="space-y-3 pl-6">
                  {CRM_TOOLS.filter(t => crmToolsEnabled[t.id]).map(tool => (
                    <div key={tool.id}>
                      <p className="font-medium text-sm">{tool.label}</p>
                      <div className="mt-0.5">
                        {tool.type === 'toggle' ? (
                          <p className="text-xs text-muted-foreground">
                            {crmToolsValues[tool.id] ? 'On' : 'Off'}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {crmToolsValues[tool.id] === 'all' ? `All records`
                              : crmToolsValues[tool.id] === 'their' ? `Their records`
                              : 'None'}
                          </p>
                        )}
                        {tool.critical && (
                          <span className="ml-1 text-xs bg-destructive/10 text-destructive px-1 py-0.5 rounded">Critical</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reporting section */}
            <div>
              <button
                className="flex items-center gap-2 font-semibold text-sm mb-3"
                onClick={() => toggleReviewSection('reporting')}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", !expandedReviewSections.has('reporting') && "-rotate-90")} />
                Reporting ({REPORTING_PERMISSIONS.filter(r => reportingEnabled[r.id]).length})
              </button>

              {expandedReviewSections.has('reporting') && (
                <div className="space-y-3 pl-6">
                  {REPORTING_PERMISSIONS.filter(r => reportingEnabled[r.id]).map(item => (
                    <div key={item.id}>
                      <p className="font-medium text-sm">{item.label}</p>
                      <div className="mt-0.5 space-y-0.5">
                        {item.type === 'toggle' ? (
                          <p className="text-xs text-muted-foreground">
                            {reportingValues[item.id] ? 'On' : 'Off'}
                          </p>
                        ) : item.permissions ? (
                          item.permissions.map(perm => {
                            const val = reportingValues[`${item.id}_${perm.id}`]
                            if (!val) return null
                            return (
                              <p key={perm.id} className="text-xs text-muted-foreground">
                                <span>{perm.label}</span>
                                {perm.type === 'scope' && val && (
                                  <span className="text-muted-foreground">
                                    {' '}({val === 'their' ? 'Their goals' : val === 'all' ? 'All goals' : 'None'})
                                  </span>
                                )}
                              </p>
                            )
                          })
                        ) : null}
                        {item.critical && (
                          <span className="ml-1 text-xs bg-destructive/10 text-destructive px-1 py-0.5 rounded">Critical</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings access section */}
            <div>
              <button
                className="flex items-center gap-2 font-semibold text-sm mb-3"
                onClick={() => toggleReviewSection('settings_access')}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", !expandedReviewSections.has('settings_access') && "-rotate-90")} />
                Settings access ({SETTINGS_ACCESS_PERMISSIONS.filter(s => settingsValues[s.id]).length})
              </button>

              {expandedReviewSections.has('settings_access') && (
                <div className="space-y-3 pl-6">
                  {SETTINGS_ACCESS_PERMISSIONS.filter(s => settingsValues[s.id]).map(item => (
                    <div key={item.id}>
                      <p className="font-medium text-sm">{item.label}</p>
                      {item.critical && (
                        <span className="ml-1 text-xs bg-destructive/10 text-destructive px-1 py-0.5 rounded">Critical</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
          <h2 className="text-xl font-semibold text-center text-foreground">Assign users to permission set</h2>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-8">
            If a user already has a permission set, they'll get access from both.
          </p>

          {/* Search + Assign */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pr-8"
              />
            </div>
            <Button
              variant="outline"
              disabled={!selectedUsers.length}
              onClick={() => {
                // UI only — just clear search
                setUserSearch("")
              }}
            >
              Assign users
            </Button>
          </div>

          {/* Empty state */}
          {assignedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users assigned to this permission set.
            </p>
          ) : (
            <div className="space-y-2">
              {assignedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setAssignedUsers(prev => prev.filter(u => u.id !== user.id))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
