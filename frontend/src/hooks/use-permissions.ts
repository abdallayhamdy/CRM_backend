'use client'

import { useAuth } from './use-auth'

export function usePermissions() {
  const { userRole, isSuperAdmin, permissions } = useAuth()
  
  const has = (perm: string) => permissions.includes(perm)

  // Per-model create permissions
  const canCreateContact = has('create_contacts')
  const canCreateCompany = has('create_companies')
  const canCreateDeal = has('create_deals')
  const canCreateTask = has('create_tasks')
  const canCreateTicket = has('create_tickets')
  const canCreateNote = has('create_notes')
  const canCreateActivity = has('create_activities')
  const canCreateDocument = has('create_documents')
  const canCreateProduct = has('create_products')
  const canCreateOrder = has('create_orders')
  const canCreatePipeline = has('create_pipelines')
  const canCreateStage = has('create_stages')

  // Per-model edit permissions
  const canEditContact = has('edit_contacts_all') || has('edit_contacts_own')
  const canEditCompany = has('edit_companies_all') || has('edit_companies_own')
  const canEditDeal = has('edit_deals_all') || has('edit_deals_own')
  const canEditTask = has('edit_tasks_all') || has('edit_tasks_own')
  const canEditTicket = has('edit_tickets_all') || has('edit_tickets_own')
  const canEditNote = has('edit_notes_all') || has('edit_notes_own')
  const canEditActivity = has('edit_activities_all') || has('edit_activities_own')
  const canEditDocument = has('edit_documents_all') || has('edit_documents_own')
  const canEditProduct = has('edit_products_all')
  const canEditOrder = has('edit_orders_all') || has('edit_orders_own')
  const canEditPipeline = has('edit_pipelines_all')

  // Per-model delete permissions
  const canDeleteContact = has('delete_contacts_all') || has('delete_contacts_own')
  const canDeleteCompany = has('delete_companies_all') || has('delete_companies_own')
  const canDeleteDeal = has('delete_deals_all') || has('delete_deals_own')
  const canDeleteTask = has('delete_tasks_all') || has('delete_tasks_own')
  const canDeleteTicket = has('delete_tickets_all') || has('delete_tickets_own')
  const canDeleteNote = has('delete_notes_all') || has('delete_notes_own')
  const canDeleteActivity = has('delete_activities_all') || has('delete_activities_own')
  const canDeleteDocument = has('delete_documents_all') || has('delete_documents_own')
  const canDeleteProduct = has('delete_products_all')
  const canDeleteOrder = has('delete_orders_all') || has('delete_orders_own')
  const canDeletePipeline = has('delete_pipelines_all')

  // Bulk permissions
  const canBulkDeleteContacts = has('bulk_delete_contacts')
  const canBulkDeleteCompanies = has('bulk_delete_companies')
  const canBulkDeleteDeals = has('bulk_delete_deals')
  const canBulkEditContacts = has('bulk_edit_contacts')
  const canBulkEditCompanies = has('bulk_edit_companies')
  const canBulkEditDeals = has('bulk_edit_deals')

  // Import/Export/Merge
  const canImportContacts = has('import_contacts')
  const canImportCompanies = has('import_companies')
  const canImportDeals = has('import_deals')
  const canExportContacts = has('export_contacts')
  const canExportCompanies = has('export_companies')
  const canExportDeals = has('export_deals')
  const canMergeContacts = has('merge_contacts')
  const canMergeCompanies = has('merge_companies')

  // Workspace management
  const canManageMembers = has('manage_workspace_members')
  const canManageRoles = has('manage_roles')
  const canManageTeams = has('manage_teams')
  const canManageSettings = has('manage_settings')
  const canManageBilling = userRole === 'owner'
  const canManagePipelines = has('manage_pipelines')
  const canManageCustomFields = has('manage_custom_fields')
  const canManageAutomations = has('manage_automations')
  const canManageIntegrations = has('manage_integrations')
  const canDeleteWorkspace = has('delete_workspace')
  const canManageAuditLog = has('manage_audit_log')
  const canManageBackup = has('manage_backup')
  const canManagePanelConfigs = has('manage_panel_configs')

  // Reports
  const canViewReports = has('view_reports')
  const canCreateReports = has('create_reports')
  const canEditReports = has('edit_reports')
  const canDeleteReports = has('delete_reports')
  const canExportReports = has('export_reports')

  // Dashboard
  const canViewDashboard = has('view_dashboard')

  // Members & Properties
  const canViewMembers = has('view_workspace_members')
  const canInviteUsers = has('invite_users')
  const canRemoveMembers = has('remove_workspace_members')
  const canViewProperties = has('view_properties')
  const canManageProperties = has('manage_properties')

  // Super admins bypass all checks (matches backend Gate::before)
  if (isSuperAdmin) {
    return {
      canCreateContact: true, canCreateCompany: true, canCreateDeal: true,
      canCreateTask: true, canCreateTicket: true, canCreateNote: true,
      canCreateActivity: true, canCreateDocument: true, canCreateProduct: true,
      canCreateOrder: true, canCreatePipeline: true, canCreateStage: true,
      canEditContact: true, canEditCompany: true, canEditDeal: true,
      canEditTask: true, canEditTicket: true, canEditNote: true,
      canEditActivity: true, canEditDocument: true, canEditProduct: true,
      canEditOrder: true, canEditPipeline: true,
      canDeleteContact: true, canDeleteCompany: true, canDeleteDeal: true,
      canDeleteTask: true, canDeleteTicket: true, canDeleteNote: true,
      canDeleteActivity: true, canDeleteDocument: true, canDeleteProduct: true,
      canDeleteOrder: true, canDeletePipeline: true,
      canBulkDeleteContacts: true, canBulkDeleteCompanies: true, canBulkDeleteDeals: true,
      canBulkEditContacts: true, canBulkEditCompanies: true, canBulkEditDeals: true,
      canImportContacts: true, canImportCompanies: true, canImportDeals: true,
      canExportContacts: true, canExportCompanies: true, canExportDeals: true,
      canMergeContacts: true, canMergeCompanies: true,
      canManageMembers: true, canManageRoles: true, canManageTeams: true,
      canManageSettings: true, canManageBilling: true, canManagePipelines: true,
      canManageCustomFields: true, canManageAutomations: true, canManageIntegrations: true,
      canDeleteWorkspace: true, canManageAuditLog: true, canManageBackup: true,
      canManagePanelConfigs: true,
      canViewReports: true, canCreateReports: true, canEditReports: true,
      canDeleteReports: true, canExportReports: true,
      canViewDashboard: true,
      canViewMembers: true, canInviteUsers: true, canRemoveMembers: true,
      canViewProperties: true, canManageProperties: true,
      role: userRole || 'owner',
    }
  }

  return {
    canCreateContact, canCreateCompany, canCreateDeal,
    canCreateTask, canCreateTicket, canCreateNote,
    canCreateActivity, canCreateDocument, canCreateProduct,
    canCreateOrder, canCreatePipeline, canCreateStage,
    canEditContact, canEditCompany, canEditDeal,
    canEditTask, canEditTicket, canEditNote,
    canEditActivity, canEditDocument, canEditProduct,
    canEditOrder, canEditPipeline,
    canDeleteContact, canDeleteCompany, canDeleteDeal,
    canDeleteTask, canDeleteTicket, canDeleteNote,
    canDeleteActivity, canDeleteDocument, canDeleteProduct,
    canDeleteOrder, canDeletePipeline,
    canBulkDeleteContacts, canBulkDeleteCompanies, canBulkDeleteDeals,
    canBulkEditContacts, canBulkEditCompanies, canBulkEditDeals,
    canImportContacts, canImportCompanies, canImportDeals,
    canExportContacts, canExportCompanies, canExportDeals,
    canMergeContacts, canMergeCompanies,
    canManageMembers, canManageRoles, canManageTeams,
    canManageSettings, canManageBilling, canManagePipelines,
    canManageCustomFields, canManageAutomations, canManageIntegrations,
    canDeleteWorkspace, canManageAuditLog, canManageBackup,
    canManagePanelConfigs,
    canViewReports, canCreateReports, canEditReports,
    canDeleteReports, canExportReports,
    canViewDashboard,
    canViewMembers, canInviteUsers, canRemoveMembers,
    canViewProperties, canManageProperties,
    role: userRole || 'viewer',
  }
}
