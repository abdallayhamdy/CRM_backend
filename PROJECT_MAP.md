# CRM Project Map

> Complete feature inventory — every page, controller, model, component, hook, and service.
> Last updated: 2026-08-27

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, TanStack Table, TipTap editor |
| Backend | Laravel 13.8, PHP, MySQL, Sanctum auth, Spatie QueryBuilder |
| Repo | Monorepo — frontend + backend in single git repo |

---

## Table of Contents

1. [Frontend Routes & Pages](#1-frontend-routes--pages)
2. [Backend Controllers](#2-backend-controllers)
3. [Backend Models](#3-backend-models)
4. [Backend Routes](#4-backend-routes)
5. [Frontend Services](#5-frontend-services)
6. [Frontend Hooks](#6-frontend-hooks)
7. [Frontend Components](#7-frontend-components)
8. [Frontend Lib Utilities](#8-frontend-lib-utilities)
9. [Feature Matrix](#9-feature-matrix)

---

## 1. Frontend Routes & Pages

### Public / Auth Pages

| Route | Features |
|-------|----------|
| `/login` | Email/password login, 2FA flow, dark mode forced, liquid animation |
| `/bootstrap` | First-time Platform Owner setup (name, email, password) |
| `/reset-password` | Password reset via token query param |
| `/accept-invite` | Accept workspace invitation via token |

### CRM List Pages

| Route | Views | Tabs | Filters | Sort | Bulk Ops | Create | Preview | History | Import |
|-------|-------|------|---------|------|----------|--------|---------|---------|--------|
| `/contacts` | Table + Board | All/My/Unassigned + custom | Owner, leadStatus, lifecycle, dates | createDate/updateDate/name | Delete/Edit/Assign/Export | CreateContactSheet | RecordPreviewPanel | PropertyHistoryPanel | — |
| `/companies` | Table + Board | All/My/New today + custom | Owner, lifecycle, dates | createDate/updateDate/name | Delete/Edit/Assign/Export | CreateCompanySheet | CompanyPreviewSheet | PropertyHistoryPanel | CSV Import |
| `/deals` | Table + Board | All/My/ClosedWon/ClosedLost | Owner, stage, dates | createDate/amount/title/closeDate | Delete/Edit/Assign/Export | CreateDealSheet | RecordPreviewPanel | PropertyHistoryPanel | CSV Import |
| `/tickets` | Table | All/MyOpen/Unassigned/Closed | Owner, priority, status | createDate/updateDate/subject | Delete/Edit/Assign/Export | CreateTicketSheet | TicketPreviewSheet | PropertyHistoryPanel | — |
| `/tasks` | Table | All/My/Overdue/Upcoming/Completed | Assignee, type, dueDate, queue | title/type/dueDate/assignedTo/queue | Delete/Edit/Assign | CreateTaskSheet | TaskPreviewSheet | PropertyHistoryPanel | — |
| `/activities` | Table | All/Tasks/Calls/Emails/Meetings/Notes | Search, createDate | createDate/updateDate/title | Delete only | — | — | — | — |
| `/calls` | Table | All/Recorded/My | Search, activityDate | title/contact/duration/direction/outcome | — | CallEditorSheet | CallPreviewSheet | — | — |
| `/notes` | Table | All/My | Search, createDate | createDate/updateDate | — | CreateNoteSheet | NotePreviewSheet | — | — |
| `/documents` | Table + Panel | All/Proposals/Contracts | Type, uploadDate | name/type/size/date | Delete | UploadDocumentSheet | — | — | — |
| `/products` | Table | All/Active/Archived | Status, folder, custom | name/sku/price/status/folder | Delete/Edit/Export | CreateProductSheet | RecordPreviewPanel | PropertyHistoryPanel | — |
| `/orders` | Table | All/Open/Paid/Refunded | Search, dates, pipeline | title/status/total/pipeline | Delete/Edit/Export | CreateOrderSheet | RecordPreviewPanel | PropertyHistoryPanel | — |

### CRM Detail Pages

| Route | Layout | Features |
|-------|--------|----------|
| `/contacts/[id]` | CrmDetailLayout (left/center/right) | Contact info, custom fields, associated companies/deals/tickets, activity feed, note/task/call/email/meeting editors, real-time updates |
| `/companies/[id]` | CrmDetailLayout | Company info, custom fields, associated contacts/deals/tickets, activity feed, editors, real-time |
| `/deals/[id]` | CrmDetailLayout | Deal info, custom fields, activity feed, stage picker, editors, real-time |
| `/tickets/[id]` | CrmDetailLayout | Ticket info, custom fields, activity feed, property history, editors |
| `/tasks/[id]` | CrmDetailLayout | Task info, toggle complete, edit/delete |
| `/products/[id]` | CrmDetailLayout | Product info (name, SKU, price, status, type, description), custom fields, property history |
| `/orders/[id]` | CrmDetailLayout | Order info, line items, activity feed, notes, real-time |

### Other Pages

| Route | Features |
|-------|----------|
| `/dashboard` | Server component: overview cards, tasks, recent activity, phone calls, overdue, onboarding checklist, call outcomes, integrations |
| `/reports` | 7 tabs: Executive, Sales, Customers, Orders, Support, Productivity, Calls. Export CSV |
| `/search` | Global search across 10 entity types (limit 5 each) |
| `/activity-feed` | Activity timeline with type filter, search, realtime |
| `/pipelines` | Pipeline CRUD, stage management (name + win_probability) |
| `/about` | About page |
| `/pricing` | 3-tier pricing (Starter/Growth/Enterprise), Arabic/English toggle |

### Settings Pages

| Route | Features |
|-------|----------|
| `/settings/account-defaults/general` | Account name, timezone, fiscal year, company info |
| `/settings/account-defaults/currency` | Currency management, history log |
| `/settings/account-defaults/user-defaults` | Default language, date/number format |
| `/settings/workspace` | Workspace logo, name, plan, member count |
| `/settings/general` | Profile (avatar, name, phone, language, date format, work schedule) |
| `/settings/general/security` | Password change, 2FA, session management |
| `/settings/appearance` | Theme preview, light/dark/system switcher |
| `/settings/notifications` | Channel toggles, email settings, topic-based notification matrix |
| `/settings/objects` | Lifecycle stage DnD reorder for 10 object types, display style |
| `/settings/properties` | Property CRUD for 8 object types, archive, groups, rules, access control |
| `/settings/properties/create` | Multi-step property creation wizard |
| `/settings/properties/[id]/edit` | Property edit |
| `/settings/properties/archived` | Archived properties (restore/delete) |
| `/settings/properties/groups` | Property group CRUD |
| `/settings/users-teams` | Users (invite, roles, activate/deactivate), Teams (CRUD, members), Permission Sets |
| `/settings/backup-restore` | Backup schedule, manual backup, restore CRM changes, restore deleted records |
| `/settings/audit-log` | Filtered audit table (category, subcategory, action, date range) |

### Super Admin Pages

| Route | Features |
|-------|----------|
| `/super-admin/tenants` | Tenant list, create/view/edit/delete tenant |
| `/super-admin/tenants/new` | 30+ field tenant creation form |
| `/super-admin/tenants/[id]` | View/edit/delete tenant |
| `/super-admin/users` | User list with company/role/status filters, deactivate/reactivate |
| `/super-admin/users/[id]` | View user, impersonate |
| `/super-admin/platform-owners` | Platform owner CRUD |
| `/super-admin/settings` | Platform name, email templates, API keys, webhooks |
| `/super-admin/security` | 2FA, IP whitelist, session timeout, active sessions, audit log |
| `/super-admin/billing` | MRR/ARR KPIs, plan distribution, revenue trend, invoice management |
| `/super-admin/health` | Uptime, response time, errors, queue status, error logs |
| `/super-admin/support` | Support tickets (inline status update), broadcast messages |
| `/super-admin/usage` | Tenant/user growth, usage by tenant, feature adoption |

---

## 2. Backend Controllers

### AuthController
- `login(email, password)` — Sanctum token, 2FA flow, workspace active check
- `verifyTwoFactor(email, code)` — Complete 2FA
- `currentUser()` — Return user with roles/permissions
- `logout()` — Delete token

### ContactController
- `index(q, sort_by, sort_dir, lead_status, lifecycle_stage, assigned_to, custom filters)` — Paginated, permission-scoped
- `store(StoreContactRequest)` — Creates contact, resolves lifecycle_stage→stage_id
- `show(contact)` — With relations
- `update(UpdateContactRequest, contact)` — Field mapping
- `destroy(contact)` — Soft delete

### CompanyController
- `index(q, sort_by, sort_dir, assigned_to, lifecycle_stage, custom filters)` — Paginated
- `store(StoreCompanyRequest)` — Creates company
- `show(company)` — With activities, notes, tasks
- `update(UpdateCompanyRequest, company)` — Handles contacts association
- `destroy(company)` — Soft delete

### DealController
- `index(q, pipeline_id, stage, sort_by, sort_dir, custom filters)` — Paginated, sort maps createDate→created_at, closeDate→expected_close_date
- `store(StoreDealRequest)` — Auto-assigns to default pipeline first stage
- `show(deal)` — With all relations
- `update(UpdateDealRequest, deal)` — Field mapping
- `moveStage(deal, pipeline_stage_id/stage)` — Moves deal between stages
- `associateContact(deal, contact_id)` — Associates contact
- `destroy(deal)` — Soft delete

### ActivityController
- `index(q, type, owner_id, completed, sort_by, sort_dir, deal_id, contact_id, company_id, ticket_id)` — Permission-scoped (view_all vs own)
- `store(StoreActivityRequest)` — Links to contact/deal/ticket/company
- `show(activity)` — With user + activitable
- `update(UpdateActivityRequest, activity)` — Re-links entity
- `destroy(activity)` — Delete

### ActivityCommentController
- `index(activity)` — Paginated comments
- `store(StoreActivityCommentRequest)` — Create comment
- `show/update/destroy` — CRUD

### TaskController
- `index(q, status, assigned_to, due_date_from, due_date_to, sort_by, sort_dir, contact_id, company_id, deal_id)` — Paginated
- `store(StoreTaskRequest)` — With task_priority, task_queue, set_repeat, reminder
- `show/update/destroy` — CRUD

### TicketController
- `index(q, status, priority, owner_id, sort_by, sort_dir, custom filters)` — Paginated
- `store(StoreTicketRequest)` — Maps owner_id→assigned_to
- `show(ticket)` — With documents, activities
- `update/destroy` — CRUD

### NoteController
- `index(q, user_id, contact_id, company_id, deal_id, ticket_id, created_from, created_to, sort_by, sort_dir)` — **Workspace-scoped**
- `store(StoreNoteRequest)` — Polymorphic notable
- `show/update/destroy` — CRUD

### DocumentController
- `index(q, documentable_type, documentable_id, sort_by, sort_dir)` — **Workspace-scoped**
- `store(StoreDocumentRequest)` — File upload to `documents/{workspaceId}`
- `show/update` — CRUD
- `download(document)` — File download
- `destroy(document)` — Delete file + record

### ProductController
- `index(q, status, product_folder, sort_by, sort_dir, custom filters)` — Paginated
- `search(q)` — Quick search (limit 20)
- `store(StoreProductRequest)` — Creates product
- `show/update/destroy` — CRUD

### OrderController
- `index(q, status, sort_by, sort_dir)` — Paginated
- `store(StoreOrderRequest)` — Creates order + line items, computes financials
- `show/update` — CRUD
- `addLineItems(order, items)` — Appends items
- `replaceLineItems(order, items)` — Replaces all items
- `destroy(order)` — Delete

### PipelineController
- `index/store/show/update/destroy` — Pipeline CRUD with stages

### PropertyController
- `index(object_type, counts_only, search, group, field_type, archived, sort_by, sort_dir)` — Paginated
- `store/update/destroy` — CRUD (name change migrates custom_data keys)
- `getRules/updateRules` — Validation rules per property
- `getAccess/updateAccess/addAssignment/removeAssignment/updateAssignment` — Access control
- `stats(object_type)` — Usage stats

### PropertyGroupController
- `index/store/rename/merge/destroy` — Group CRUD

### UserProfileController
- `show/update` — Profile (avatar upload/delete, password change)
- `sessions/logoutAll` — Session management

### UserViewPreferenceController
- `index/store/show/update/destroy` — Per-user column preferences

### NotificationPreferenceController
- `show/update` — Notification channels and topic preferences

### PanelConfigController
- `show/update` — Per-object-type panel configuration

### BackupRestoreController
- `indexBackups/storeBackup` — Backup management
- `showSchedule/updateSchedule` — Backup schedule
- `indexRestoreHistory/storeRestoreHistory` — Restore history

### AuditLogController
- `index(q, date_from, category, action, modified_by_me, ...)` — Paginated, filtered
- `store` — Create log entry

### SearchController
- `contacts(q)` / `companies(q)` / `deals(q)` / `products(q)` — Entity-specific search
- `search(q)` — Global search across all 10 entity types

### DashboardController
- `overview()` — Aggregated stats (contacts, deals, tasks, tickets) — cached 10 min
- `recentActivity()` — Last 10 activities

### ReportController
- `executive(period)` — KPIs with trends
- `sales(from, to, stages, reps)` — Pipeline, win/loss, by rep, forecast, trends
- `customers(from, to)` — New customers, lead sources, top accounts
- `orders(from, to, products)` — Top products, trends, AOV
- `tickets(from, to, priorities, types)` — Volume, by status/priority
- `productivity(from, to, employees)` — Task completion, team activity
- `calls(from, to, reps)` — Calls over time, by type, call log
- `filterOptions()` — Available filter options
- `export(section, from, to)` — CSV export

### Import Controllers (ContactImport, CompanyImport, DealImport)
- `store(file)` — Upload CSV, dispatch job, return import_id
- `show(import)` — Import status

### BootstrapController
- `status()` — Has platform owner?
- `create(name, email, password)` — Create first Platform Owner

### Super Admin Controllers
- `SuperAdminWorkspaceController` — Tenant CRUD
- `UserController` — User management
- `PlatformOwnerController` — Platform owner CRUD
- `UsageController` — Summary, growth, tenant usage, feature adoption
- `HealthController` — Uptime, response times, errors, queues
- `BillingController` — Invoices, plan distribution, revenue trend
- `PlatformSettingsController` — General settings, email templates
- `ApiKeyController` — API key CRUD
- `WebhookController` — Webhook CRUD
- `SupportTicketController` — Support tickets
- `BroadcastController` — Broadcast messages
- `SecurityController` — 2FA, IP whitelist, sessions, audit log
- `ImpersonationController` — Start/stop impersonation

---

## 3. Backend Models

### User
- **$fillable:** workspace_id, name, job_title, email, password, language, date_format, phone_country, phone_number, default_landing_page, work_start_day, work_end_day, work_start_time, work_end_time, avatar_path
- **Relationships:** currentWorkspace, workspaces, viewPreferences, tasks, teams, impersonationSessions
- **Traits:** HasApiTokens, HasUuids, SoftDeletes, HasRoles

### Contact
- **$fillable:** workspace_id, company_id, company_name, stage_id, assigned_to, first_name, last_name, email, phone, custom_data, created_by
- **Relationships:** workspace, company, stage, assignee, creator, deals, tasks, notes, activities, documents

### Company
- **$fillable:** workspace_id, name, industry, website, phone, email, custom_data, assigned_to, stage_id, created_by
- **Relationships:** workspace, creator, assignee, stage, contacts, deals, tasks, notes, activities, documents

### Deal
- **$fillable:** workspace_id, contact_id, company_id, stage_id, assigned_to, title, amount, status, expected_close_date, custom_data, pipeline_stage_id
- **Relationships:** workspace, contact, company, stage, assignee, pipelineStage, tasks, notes, activities, documents

### Activity
- **$fillable:** workspace_id, user_id, activitable_type, activitable_id, type, subject, description, activity_date, call_outcome
- **Relationships:** activitable (morphTo), user

### Task
- **$fillable:** workspace_id, taskable_type, taskable_id, assigned_to, created_by, title, description, due_date, status, task_subtype, task_priority, task_queue, set_repeat, reminder
- **Relationships:** taskable (morphTo), workspace, assignee

### Ticket
- **$fillable:** workspace_id, contact_id, assigned_to, subject, description, status, priority, custom_data
- **Relationships:** contact, assignee, documents, activities

### Note
- **$fillable:** workspace_id, notable_type, notable_id, content, user_id
- **Relationships:** notable (morphTo), workspace, user

### Document
- **$fillable:** workspace_id, documentable_type, documentable_id, name, document_type, file_path, mime_type, size, uploaded_by
- **Relationships:** documentable (morphTo), uploader

### Product
- **$fillable:** workspace_id, name, sku, unit_price, status, product_folder, custom_data

### Order
- **$fillable:** workspace_id, contact_id, company_id, owner_id, order_number, title, status, currency, subtotal, discount, tax, shipping, total, closed_at, custom_data
- **Relationships:** lineItems, contact, company, owner

### OrderLineItem
- **$fillable:** order_id, product_id, name, description, quantity, unit_price, discount, tax, total, display_order
- **Relationships:** order, product

### Pipeline
- **$fillable:** workspace_id, name, is_default
- **Relationships:** stages

### PipelineStage
- **$fillable:** pipeline_id, name, display_order, win_probability
- **Relationships:** pipeline, deals

### Stage (Lifecycle)
- **$fillable:** workspace_id, object_type, name, slug, color, order, is_system
- **Relationships:** workspace, contacts, deals

### Workspace
- **$fillable:** name, slug, status, plan, max_users, trial_end_date, timezone, currency, currency_symbol, ... (30+ fields)
- **Relationships:** users, ownerUsers, contacts, deals

### Property
- **$fillable:** workspace_id, created_by, name, label, field_type, object_type, group_name, description, is_required, is_archived, show_in_forms, display_order, options, settings
- **Relationships:** workspace, creator

### PropertyGroup
- **$fillable:** workspace_id, object_type, name, display_order

### Team
- **$fillable:** workspace_id, name, description
- **Relationships:** users

### AuditLog
- **$fillable:** workspace_id, user_id, action, category, subcategory, auditable_type, auditable_id, changes, assisted_by, source, source_url, ip_address

### Other Models
- Backup, RestoreHistory, PanelConfig, UserViewPreference, NotificationPreference, Invoice, Invitation, ImpersonationSession, ContactImport, CompanyImport, DealImport

---

## 4. Backend Routes (Summary)

| Category | Count | Examples |
|----------|-------|---------|
| Auth (public) | 7 | login, 2fa, forgot/reset password, bootstrap, accept invite |
| Auth (authenticated) | 4 | logout, me, change password, logout all |
| CRUD Resources | 12 | contacts, companies, deals, notes, tasks, activities, tickets, documents, products, orders, pipelines, properties |
| Custom Routes | 15+ | move-stage, associate-contact, search, download, line-items, stats, rules, access, groups |
| Settings | 12 | profile, avatar, notifications, workspace, backup, restore, panel-configs, object-configs, form-layouts |
| Teams & Members | 10 | teams CRUD, members, invitations, roles |
| Dashboard | 2 | overview, recent-activity |
| Reports | 9 | executive, sales, customers, orders, tickets, productivity, calls, filter-options, export |
| Search | 5 | contacts, companies, deals, products, global |
| Import | 6 | contacts, companies, deals (store + show) |
| Super Admin | 40+ | tenants, users, platform-owners, settings, security, billing, health, support, usage, impersonation |

---

## 5. Frontend Services

| Service | Methods |
|---------|---------|
| `contactsService` | getAll, getById, create, update, delete, importCSV |
| `companiesService` | getAll, getById, create, update, delete, importCSV |
| `dealsService` | getAll, getById, create, update, delete, moveStage, associateContact, searchAll, importCSV, getImport, getPipeline |
| `activitiesService` | getAll, getById, getByDealId, getByContactId, create, update, complete, delete, logSystemActivity |
| `tasksService` | getAll, getById, create, update, delete |
| `ticketsService` | getAll, getById, create, update, delete |
| `notesService` | getAll, getById, create, update, delete |
| `documentsService` | getAll, getById, upload, create, update, delete, download |
| `productsService` | getAll, getById, create, update, delete, search |
| `ordersService` | list, getById, create, update, delete |
| `pipelinesService` | getAll, getById, create, update, delete, clearCache |
| `activityCommentsService` | getByActivity, getByTarget, create, delete |
| `authService` | getCurrentUser, listProfiles |
| `dashboardService` | getOverview, getRecentActivity |
| `reportsService` | exportReport, getFilterOptions, getExecutive, getSales, getCustomers, getOrders, getTickets, getProductivity, getCalls |
| `superAdminService` | Extensive: tenants, users, platform-owners, impersonation, billing, health, support, usage, settings |
| `getPropertyHistory` | getPropertyHistory, formatCustomPropertyValue |

---

## 6. Frontend Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Auth context: user, session, workspaceId, roles, permissions, signIn, signOut, impersonate |
| `useCrmFilters` | Generic filter state: search, properties, dateRanges, numbers, advancedFilters |
| `useSortState` | Persisted sort field + direction (localStorage) |
| `useTableSettings` | Table density and compact mode persistence |
| `useOwners` | Fetch workspace member profiles |
| `useTabConfig` | Custom tab management (add/remove/reorder) with localStorage |
| `useColumnVisibility` | Column visibility persistence (localStorage) |
| `useBulkSelection` | Multi-select: toggleOne, toggleAll, clearSelection, selectedIds |
| `useDebounce` | Debounce value by delay |
| `useFilteredDeals` | Client-side deal filtering (search, owner, stage, type, priority) |
| `useDealsActiveFilters` | Active filter chips for deals |
| `useDealsColumnOptions` | Available column options for deals |
| `useActiveFilters` | Active filter chips for contacts |
| `useProperties` | Fetch/cache custom properties per object type |
| `useObjectConfig` | Lifecycle stages and display style per object type |
| `useFormLayout` | Form field layout persistence |
| `usePanelCards` | Custom panel card configuration |
| `usePermissions` | Derived permission booleans |
| `useRealtime` | Poll-based realtime replacement |
| `useMediaQuery` | SSR-safe media query |
| `useContentReady` | Prevent flash of incomplete content |

---

## 7. Frontend Components

### CRM Core (`components/crm/` — 63 files)

| Component | Purpose |
|-----------|---------|
| `CrmPageLayout` | Standard page layout wrapper |
| `CrmFilterBar` | Top filter bar with pinned filters, sort, search |
| `CrmFilterSidebar` | Right sidebar filter panel |
| `CrmFilterChipRow` | Removable filter chips |
| `CrmQuickFilterPopover` | Quick filter dropdown |
| `CrmDataTable` | Core TanStack data table with inline editing |
| `DataTableRow` | Individual table row |
| `CrmColumnEditor` | Column visibility/reorder editor |
| `CrmTabs` | Tab switcher (All/My/Unassigned) |
| `CrmBoardView` | Kanban board with DnD |
| `CrmEmptyState` | Empty state placeholder |
| `CrmErrorBoundary` | React error boundary |
| `CrmModuleLoading` | Loading skeleton |
| `CrmDateCell` | Formatted date cell |
| `CrmDetailLayout` | Full detail layout (left/center/right) |
| `SummaryStatsBar` | Stats bar (counts/sums) |
| `BulkActionToolbar` | Bulk action bar |
| `BulkEditSheet` | Side sheet for bulk editing |
| `ExportSlideOver` | CSV export panel |
| `SortPopover` | Sort field/direction selector |
| `PaginationBar` | Pagination controls |
| `TableSettingsDialog` | Display settings |
| `EditableField` | Click-to-edit field |
| `PropertyRow` | Key-value property display |
| `PropertyHistoryPanel` | Property change history |
| `PropertySelectionSidebar` | Property display selector |
| `AddPropertiesPopover` | Add properties popover |
| `RecordPreviewPanel` | Record preview panel |
| `CardPreview` | Card preview |
| `LeadStatusBadge` | Lead status badge |
| `LifecycleBadge` | Lifecycle stage badge |
| `LifecycleDropdown` | Lifecycle dropdown |
| `Badge` | Generic badge |
| `TypeBadge` | Record type badge |
| `ActivityButtons` | Activity type action buttons |
| `ActivityFeedCenterPanel` | Activity timeline |
| `Avatar` | User avatar |
| `DraggableFieldRow` | Draggable form field |
| `SortableFormFields` | Sortable form field list |
| `FormFieldInput` | Field type input renderer |
| `FormFieldsSkeleton` | Loading skeleton |
| `EditorHeader` | Record editor header |
| `EditCardDrawer` | Edit record drawer |
| `EditDefaultCardView` | Default card editing |
| `CreateRightCardView` | Create custom card |
| `RecordPageLayoutEditor` | DnD layout editor |
| `SidebarPreviewButton` | Sidebar preview toggle |
| `ConditionalLogicModal` | Conditional logic config |
| `Skeletons` | Various loading skeletons |
| `edit-card-drawer-constants` | Default field groups |
| `edit-contact-form-editor-constants` | Contact form defaults |
| `edit-task-form-editor-constants` | Task form defaults |

### CRM Detail (`components/crm/detail/` — 6 files)
- `PropertyHistoryDialog`, `DeleteConfirmDialog`, `RecordAccessDialog`, `CustomCardsRenderer`, `feed-utils`

### UI Primitives (`components/ui/` — 46 files)
- All Radix-based: alert, avatar, badge, breadcrumb, button, calendar, card, chart, checkbox, collapsible, color-picker, command, date-picker, date-time-picker, dialog, dropdown-menu, input, label, pagination, popover, radio-group, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, tooltip, visually-hidden
- TipTap editor: tiptap-editor, TiptapEditorSkeleton, editor-toolbar
- Animated: LiquidEther, orbiting-circles, shooting-stars-grid, synced-typewriter

### Layout (`components/layout/` — 3 files)
- `AppShell`, `SecondarySidebarLayout`, `SidebarContext`

### Auth (`components/auth/` — 1 file)
- `RouteGuard` — Role-based route guard

### Module-Specific Components

| Directory | Files | Key Components |
|-----------|-------|---------------|
| `components/activities/` | 7 | CallEditorSheet, EmailEditorSheet, MeetingEditorSheet, NoteEditorSheet, TaskEditorSheet, FloatingPanel |
| `components/activity/` | 5 | ActivityFilterPopover, ActivityLogCard, ActivityTaskCard, ActivityTicketCard, AssociationBadge |
| `components/contacts/` | 2 | contact-data, ContactPage |
| `components/documents/` | 3 | CreateFolderModal, FoldersSection, UploadDocumentSheet |
| `components/orders/` | 1 | CreateOrderSheet |
| `components/tasks/` | 1 | TaskEditSidebar |
| `components/dashboard/` | 9 | CrmOverviewCards, TasksCard, RecentActivityCard, PhoneCallCard, OverdueCard, OnboardingChecklist, CallOutcomeCards, IntegrationCards, DashboardHeader |
| `components/properties/` | 22 | PropertyFormWizard, CreatePropertySidebar, CustomFieldsDisplay, CustomFieldsForm, EditRecordSheet, FieldLogicDialog, FieldTypeSelector, FileFieldEditor, RollupEditor, RulesStep, ManageAccessStep, etc. |
| `components/settings/` | 5+ | SettingsSidebar, SettingsPageHeader, PersonalSecurityContent, UsersTeamsContainer, ActiveUsersTab, PermissionSetsTab, SeatsTab |
| `components/reports/` | 3 | ExportReportButton, ReportsSectionSkeleton, ReportsSidebar |
| `components/super-admin/` | 4 | SuperAdminLayout, SuperAdminSidebar, ImpersonationBanner, SuperAdminPlaceholder |
| `components/shared/` | 11 | PageHeader, DataTable, SearchInput, EmptyState, LoadingSkeleton, ConfirmDialog, StatusBadge, FormField, Pagination, date-time-picker |
| `components/about/` | 4 | AboutPage, AboutFAQ, SystemSection, about-data |
| `components/landing/` | 24 | LandingPage, HeroSection, FeaturesSection, HowItWorksSection, etc. |
| `components/contact/` | 2 | contact-data, ContactPage |
| `components/editor/` | 1 | tiptap-editor |

---

## 8. Frontend Lib Utilities

| File | Purpose |
|------|---------|
| `laravel-api.ts` | Core HTTP client: get/post/put/patch/delete/upload, token management, impersonation |
| `utils.ts` | cn() (clsx+twMerge), formatCurrency, exportToCSV |
| `navigation-data.ts` | Sidebar navigation structure |
| `layout-constants.ts` | Sidebar width, topnav height, mobile breakpoint |
| `crm-constants.ts` | Lifecycle stages, board columns, lead statuses, deal stages, object types |
| `crm-properties.tsx` | Property groups config, converts DB properties to column definitions |
| `badge-colors.ts` | Single source of truth for all badge/status color mappings |
| `custom-fields.ts` | Field type helpers, validation, normalization |
| `default-object-configs.ts` | Default lifecycle stages for all 10 modules |
| `filter-data.ts` | Sidebar filter config builders |
| `error-reporter.ts` | Safe error extraction and logging |
| `activity-formatters.ts` | Activity change description parsing |
| `audit.ts` | Audit log posting |
| `property-history-format.ts` | Property history diff formatting |
| `types/crm.ts` | All TypeScript interfaces and const enums |
| `field-configs/*.ts` | 9 files: field definitions for deals, contacts, companies, tasks, tickets, calls, notes, products, orders |
| `validations/schemas.ts` | Zod schemas for create/update forms |
| `services/orders-service.ts` | Higher-level order CRUD with line items |
| `tiptap/color-utils.ts` | Color conversion utilities |
| `tiptap/font-size.ts` | TipTap font size extension |

---

## 9. Feature Matrix

### List Page Capabilities

| Feature | Contacts | Companies | Deals | Tickets | Tasks | Calls | Notes | Documents | Products | Orders | Activities |
|---------|----------|-----------|-------|---------|-------|-------|-------|-----------|----------|--------|------------|
| Table view | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Board/Kanban | Y | Y | Y | — | — | — | — | — | — | — | — |
| Panel/Card view | — | — | — | — | — | — | — | Y | — | — | — |
| Search (server) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Sort (server) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Filter sidebar | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Pinned filters | Y | Y | Y | — | — | — | — | — | — | — | — |
| Tabs | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Summary stats | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Column editor | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Inline editing | Y | Y | Y | Y | Y | — | — | — | Y | Y | — |
| Custom properties | Y | Y | Y | Y | — | — | — | — | Y | Y | — |
| Bulk select | Y | Y | Y | Y | Y | — | — | — | Y | Y | Y |
| Bulk delete | Y | Y | Y | Y | Y | — | — | — | Y | Y | Y |
| Bulk edit | Y | Y | Y | Y | Y | — | — | — | Y | Y | — |
| Bulk assign | Y | Y | Y | Y | Y | — | — | — | — | — | — |
| Export CSV | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Import CSV | — | Y | — | — | — | — | — | — | — | — | — |
| Create sheet | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | — |
| Preview panel | Y | Y | Y | Y | Y | Y | — | — | Y | Y | — |
| Property history | Y | Y | Y | Y | Y | — | — | — | Y | Y | — |
| Drag & drop | Y | Y | Y | — | — | — | — | — | — | — | — |
| Detail page | Y | Y | Y | Y | Y | — | — | — | Y | Y | — |
| Server pagination | — | — | — | — | — | Y | Y | — | — | — | Y |

---

## Known Gaps & Remaining Work

### High Priority
- **Calls sort field mismatch**: Frontend offers `call_duration`, `call_direction`, `call_outcome` but backend only allows `subject`, `type`, `created_at`, `activity_date`
- **Deals sidebar filters**: Stage, owner, amount filters are client-side only (overfetch pattern with limit:100)

### Medium Priority
- **Date range filters**: UI exists on Deals, Tickets, Calls, Documents but not wired to backend
- **Client-side filtering**: Many pages fetch limit:100 then filter client-side
- **Advanced filters**: Tracked in state but not applied

### Low Priority
- **useTabConfig, useColumnVisibility**: Hooks created but not applied to all pages
- **Activities completed filter**: Backend ready but page doesn't send it yet
