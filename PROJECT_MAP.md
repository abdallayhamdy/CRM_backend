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

### ActivityComment
- **$fillable:** activity_id, user_id, workspace_id, content
- **Relationships:** activity, user
- **Traits:** BelongsToWorkspace, HasUuids

### ApiKey
- **$fillable:** name, key_hash, key_prefix, key_tail, last_used_at, revoked_at
- **Relationships:** none
- **Traits:** HasUuids

### BroadcastMessage
- **$fillable:** title, message, audience, sent_by, recipient_count, sent_at
- **Relationships:** none
- **Traits:** HasUuids

### EmailTemplate
- **$fillable:** key, name, subject, body, is_active
- **Relationships:** none
- **Traits:** HasUuids

### FormLayout
- **$fillable:** workspace_id, object_type, groups
- **Relationships:** workspace
- **Traits:** BelongsToWorkspace, HasUuids

### ObjectConfig
- **$fillable:** workspace_id, object_type, lifecycle_stages, display_style
- **Relationships:** workspace
- **Traits:** BelongsToWorkspace

### PlatformAuditLog
- **$fillable:** admin_id, target_user_id, workspace_id, action, metadata, ip_address, user_agent
- **Relationships:** admin, targetUser, workspace
- **Traits:** HasUuids

### PlatformSettings
- **$fillable:** platform_name, support_email, default_trial_days, default_plan, two_factor_required, ip_whitelist_enabled, whitelisted_ips, session_timeout_minutes
- **Relationships:** none
- **Traits:** HasUuids

### SupportTicket
- **$fillable:** tenant_id, subject, description, status, priority, assigned_to
- **Relationships:** tenant
- **Traits:** HasUuids

### Webhook
- **$fillable:** url, secret, events, is_active, last_triggered_at
- **Relationships:** none
- **Traits:** HasUuids

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

## 10. Database Schema

> **All column lists below were read directly from migration files during the 2026-08-27 reconciliation pass.**
> Confidence tags: `verified` = read from migration this pass, `inferred` = deduced from usage, `unchanged` = not re-checked.

### Complete Table Inventory (57 tables)

Derived from `Schema::create` calls across all migration files in `backend/database/migrations/`. Count excludes Redis/cache tables.

#### Core Business Tables

| Table | Columns (from migration) | Source | Confidence |
|-------|------------------------|--------|------------|
| `users` | id, name, job_title, email, password, language, date_format, phone_country, phone_number, default_landing_page, work_start_day, work_end_day, work_start_time, work_end_time, avatar_path, workspace_id, created_at, updated_at | `0001_01_01_000000_create_users_table.php` | verified |
| `workspaces` | id, name, slug, status, plan, max_users, trial_end_date, subscription_start_date, billing_cycle, timezone, fiscal_year_start, industry, company_name, company_domain, company_address, company_address2, company_city, company_state, company_zip, company_country, currency, currency_symbol, default_language, default_date_format, logo_path, billing_email, billing_phone, billing_address, billing_city, billing_state, billing_zip, billing_country, tax_id, created_at, updated_at | `0000_01_01_000000_create_workspaces_table.php` | verified |
| `contacts` | id(uuid), workspace_id, company_id→companies, stage_id→stages, assigned_to→users, first_name, last_name, email, phone, custom_data(json), created_by→users, created_at, updated_at, deleted_at | `2026_06_25_143407_create_contacts_table.php` + `2026_07_22_000001_add_company_name_to_contacts_table.php` | verified |
| `companies` | id(uuid), workspace_id, name, industry, website, phone, email, custom_data(json), assigned_to→users, stage_id→stages, created_by→users, created_at, updated_at, deleted_at | `2026_06_25_143407_create_companies_table.php` + `2026_07_05_000002_add_assigned_to_and_stage_id_to_companies.php` | verified |
| `deals` | id(uuid), workspace_id, contact_id→contacts(nullable), company_id→companies, stage_id→stages, assigned_to→users, title, amount(15,2), status, value(15,2), expected_close_date, custom_data(json), pipeline_stage_id→pipeline_stages, created_at, updated_at, deleted_at | `2026_06_25_143408_create_deals_table.php` + `2026_06_30_022441_add_pipeline_stage_id_to_deals_table.php` | verified |
| `activities` | id(uuid), workspace_id, user_id→users, type, subject, description, activity_date, activitable_type, activitable_id, call_outcome, created_at, updated_at | `2026_06_25_143410_create_activities_table.php` + `2026_08_20_143433_add_call_outcome_to_activities_table.php` | verified |
| `tickets` | id(uuid), workspace_id, contact_id→contacts, assigned_to→users, subject, description, status(enum: open/pending/resolved/closed), priority(enum: low/medium/high/urgent), custom_data(json), created_at, updated_at | `2026_06_30_034158_create_tickets_table.php` + `2026_08_01_000001_add_custom_data_to_orders_tickets_products_table.php` | verified |
| `products` | id(uuid), workspace_id, name, sku, unit_price, status, product_folder, custom_data(json), created_at, updated_at, deleted_at | `2026_06_29_124550_create_products_table.php` + `2026_08_01_000001_add_custom_data_to_orders_tickets_products_table.php` | verified |
| `orders` | id(uuid), workspace_id, contact_id→contacts, company_id→companies, owner_id→users, order_number(unique), title, status(enum: open/paid/refunded), currency, subtotal(15,2), discount(15,2), tax(15,2), shipping(15,2), total(15,2), closed_at, custom_data(json), created_at, updated_at | `2026_06_29_124552_create_orders_table.php` + `2026_08_01_000001_add_custom_data_to_orders_tickets_products_table.php` | verified |
| `order_line_items` | id(uuid), order_id→orders, product_id→products, name, description, quantity, unit_price(15,2), discount(15,2), tax(15,2), total(15,2), display_order, created_at, updated_at | `2026_06_29_124554_create_order_line_items_table.php` | verified |
| `invoices` | id(uuid), workspace_id, amount(10,2), status, issued_date, due_date, paid_date, created_at, updated_at | `2026_07_26_000001_create_invoices_table.php` | verified |

#### Property & Config Tables

| Table | Columns (from migration) | Source | Confidence |
|-------|------------------------|--------|------------|
| `properties` | id(uuid), workspace_id, created_by→users, name, label, field_type, object_type, group_name, description, is_required, is_archived, show_in_forms, display_order, options(json), settings(json), deleted_at, created_at, updated_at | `2026_07_11_000005_create_properties_table.php` | verified |
| `property_groups` | id(uuid), workspace_id, object_type, name, display_order, created_at, updated_at | `2026_07_26_000007_create_property_groups_table.php` | verified |
| `tasks` | id(uuid), workspace_id, assigned_to→users, title, description, created_by→users, due_date(datetime), status, taskable_type, taskable_id, task_subtype, task_priority(20), task_queue(50), set_repeat(bool), reminder(30), created_at, updated_at | `2026_06_25_143409_create_tasks_table.php` + 5 alter migrations | verified |
| `stages` | id(uuid), workspace_id, object_type, name, slug, color, order, is_system, created_at, updated_at | `2026_06_25_143411_create_stages_table.php` | verified |
| `pipelines` | id(uuid), workspace_id, name, is_default, created_at, updated_at | `2026_06_30_034155_create_pipelines_table.php` | verified |
| `pipeline_stages` | id(uuid), pipeline_id→pipelines, name, display_order, win_probability, created_at, updated_at | `2026_06_30_034156_create_pipeline_stages_table.php` | verified |

#### Communication & Activity Tables

| Table | Columns (from migration) | Source | Confidence |
|-------|------------------------|--------|------------|
| `activities` | *(listed above in Core Business — calls are activities where type='call')* | | verified |
| `activity_comments` | id(uuid), activity_id→activities, user_id→users, workspace_id, content, created_at, updated_at | `2026_07_04_000001_create_activity_comments_table.php` | verified |
| `notes` | id(uuid), workspace_id, user_id→users, content, notable_type, notable_id (polymorphic: contact/company/deal), created_at, updated_at | `2026_06_25_143409_create_notes_table.php` | verified |
| `documents` | id(uuid), workspace_id, documentable_type, documentable_id (polymorphic), name, document_type, file_path, mime_type, size, uploaded_by→users, created_at, updated_at | `2026_06_30_030138_create_documents_table.php` + `2026_07_20_000000_add_document_type_to_documents_table.php` | verified |
| `audit_logs` | id, workspace_id, user_id→users, action, category, subcategory, auditable_type, auditable_id, changes(json), assisted_by, source, source_url, ip_address, user_agent, created_at, updated_at | `2026_06_25_143411_create_audit_logs_table.php` | verified |
| `notification_preferences` | id, user_id→users, topic_preferences(json), channels(json), new_leads(bool), task_reminders(bool), weekly_digest(bool), browser_alerts(bool), created_at, updated_at | `2026_07_11_000003_create_notification_preferences_table.php` + `2026_08_09_000001_add_channels_to_notification_preferences_table.php` | verified |

#### Platform / SuperAdmin Tables

| Table | Columns (from migration) | Source | Confidence |
|-------|------------------------|--------|------------|
| `support_tickets` | id(uuid), tenant_id→workspaces, subject, description, status, priority, assigned_to, created_at, updated_at | `2026_08_09_000005_create_support_tickets_table.php` | verified |
| `platform_settings` | id, platform_name, support_email, default_trial_days, default_plan, two_factor_required, ip_whitelist_enabled, whitelisted_ips(json), session_timeout_minutes, created_at, updated_at | `2026_07_24_000001_create_platform_settings_table.php` | verified |
| `platform_audit_logs` | id, admin_id→users, target_user_id→users, workspace_id, action, metadata(json), ip_address, user_agent, created_at, updated_at | `2026_07_27_000001_create_platform_audit_logs_table.php` | verified |
| `api_keys` | id, name, key_hash, key_prefix, key_tail, last_used_at, revoked_at, created_at, updated_at | `2026_08_09_000003_create_api_keys_table.php` | verified |
| `webhooks` | id, workspace_id, url, secret, events(json), is_active, last_triggered_at, created_at, updated_at | `2026_08_09_000004_create_webhooks_table.php` | verified |
| `broadcast_messages` | id, title, message, audience, sent_by→users, recipient_count, sent_at, created_at, updated_at | `2026_08_09_000006_create_broadcast_messages_table.php` | verified |
| `email_templates` | id, key, name, subject, body, is_active, created_at, updated_at | `2026_08_09_000007_create_email_templates_table.php` | verified |

#### Import Tables

| Table | Columns (from migration) | Source | Confidence |
|-------|------------------------|--------|------------|
| `contact_imports` | id(uuid), workspace_id, user_id→users, file_name, file_path, total_rows, processed_rows, failed_rows, status, errors(json), created_at, updated_at | `2026_07_04_000003_create_contact_imports_table.php` | verified |
| `company_imports` | id(uuid), workspace_id, user_id→users, file_name, file_path, total_rows, processed_rows, failed_rows, status, errors(json), created_at, updated_at | `2026_07_22_000002_create_company_imports_table.php` | verified |
| `deal_imports` | id(uuid), workspace_id, user_id→users, file_name, file_path, total_rows, processed_rows, failed_rows, status, errors(json), created_at, updated_at | `2026_07_26_000008_create_deal_imports_table.php` | verified |

#### System & Pivot Tables

| Table | Columns (from migration) | Source | Confidence |
|-------|------------------------|--------|------------|
| `workspace_user` | workspace_id→workspaces, user_id→users (composite PK), is_active(bool), role_name, created_at, updated_at | `2026_07_02_031823_create_workspace_user_table.php` + `2026_07_04_000002_add_is_active_to_workspace_user_table.php` | verified |
| `team_user` | team_id→teams, user_id→users (composite PK), created_at, updated_at | `2026_06_25_143412_create_team_user_table.php` | verified |
| `invitations` | id(uuid), workspace_id, email, role_name, expires_at, created_at, updated_at | `2026_07_02_000001_create_invitations_table.php` | verified |
| `impersonation_sessions` | id, admin_id→users, target_user_id→users, target_workspace_id→workspaces, token_id, expires_at, ip_address, user_agent, revoked_at, created_at, updated_at | `2026_07_27_000002_create_impersonation_sessions_table.php` | verified |
| `object_configs` | id(uuid), workspace_id, object_type, lifecycle_stages(json), display_style, created_at, updated_at | `2026_07_12_000001_create_object_configs_table.php` | verified |
| `form_layouts` | id(uuid), workspace_id, object_type, groups(json), created_at, updated_at | `2026_07_12_000002_create_form_layouts_table.php` | verified |
| `panel_configs` | id(uuid), workspace_id, object_type, config(json), created_at, updated_at | `2026_07_12_000003_create_panel_configs_table.php` | verified |
| `user_view_preferences` | id, user_id→users, object_type, visible_columns(json), column_order(json), created_at, updated_at | `2026_06_25_143411_create_user_view_preferences_table.php` | verified |
| `backups` | id(uuid), workspace_id, type, status, backup_date, expires_on, size, download_url, created_by→users, created_at, updated_at | `2026_07_20_000002_create_backups_table.php` | verified |
| `restore_history` | id(uuid), workspace_id, restore_type, status, source, objects(json), changed_by, start_date, end_date, requested_by, created_at, updated_at | `2026_07_20_000004_create_restore_history_table.php` | verified |
| `password_reset_tokens` | email, token, created_at | `0001_01_01_000000_create_password_reset_tokens_table.php` | unchanged |
| `sessions` | id, user_id, ip_address, user_agent, payload, last_activity | `0001_01_01_000000_create_sessions_table.php` | unchanged |
| `personal_access_tokens` | id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at | `0001_01_01_000000_create_personal_access_tokens_table.php` | unchanged |
| `failed_jobs` | id, uuid, connection, queue, payload, exception, failed_at | `0001_01_01_000000_create_failed_jobs_table.php` | unchanged |
| `jobs` | id, queue, payload, attempts, reserved_at, available_at, created_at | `0001_01_01_000000_create_jobs_table.php` | unchanged |
| `job_batches` | id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at | `0001_01_01_000000_create_job_batches_table.php` | unchanged |

### Multi-tenancy: `BelongsToWorkspace` Trait

Applied to **26 models**: Activity, ActivityComment, AuditLog, Backup, Company, CompanyImport, Contact, ContactImport, Deal, DealImport, Document, FormLayout, Invitation, Note, ObjectConfig, Order, PanelConfig, Pipeline, Product, Property, PropertyGroup, RestoreHistory, Stage, Task, Team, Ticket. *(Verified by grep across all model files, 2026-08-27.)*

- Global scope adds `WHERE workspace_id = ?` on every query
- `scopeForWorkspace($id)` — explicit workspace filter
- `scopeForCurrentWorkspace()` — session/domain resolver
- Auto-fills `workspace_id` on create

---

## 11. API Contracts

> **All routes verified against `backend/routes/api.php` during the 2026-08-27 reconciliation pass.**
> Confidence tags: `verified` = read from route/controller file this pass, `inferred` = deduced from naming patterns.

**Base URL**: `http://localhost:8000/api/v1` | **Auth**: Sanctum Bearer token

**Standard Response**: `{ "success": true, "data": [...], "meta": { ... } }` (varies by endpoint — see notes)

**54 FormRequest classes** enforce `ValidateWorkspaceMembership` + `ValidateWorkspaceAccess` on every endpoint. *(Count from `backend/app/Http/Requests/` directory.)*

### Endpoints by Controller

#### Auth (AuthController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Returns `{ user, workspace, token, workspaces }` |
| POST | `/auth/2fa/verify` | Complete 2FA |
| POST | `/logout` | Revoke token |
| GET | `/auth/me` | Current user with roles/permissions |

#### Contacts (ContactController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | `lead_status`, `lifecycle_stage`, `assigned_to`, `search`, `sort_by`/`sort_dir`, custom data filters |
| POST | `/contacts` | Store — resolves lifecycle_stage→stage_id |
| GET/PUT/DELETE | `/contacts/{id}` | CRUD — soft delete |
| POST | `/contacts/import` | CSV import (ContactImportController) |
| GET | `/contacts/import/{import}` | Import status |

#### Companies (CompanyController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | `assigned_to`, `lifecycle_stage`, `search`, `sort_by`/`sort_dir`, custom data filters |
| POST | `/companies` | Store |
| GET/PUT/DELETE | `/companies/{id}` | CRUD — soft delete |
| POST | `/companies/import` | CSV import (CompanyImportController) |
| GET | `/companies/import/{import}` | Import status |

#### Deals (DealController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/deals` | `owner_id`, `stage`, `lead_source`, `search`, `sort_by`/`sort_dir` |
| POST | `/deals` | Store — auto-assigns to default pipeline first stage |
| GET/PUT/DELETE | `/deals/{id}` | CRUD |
| PATCH/POST | `/deals/{deal}/move-stage` | Move between stages |
| PATCH/POST | `/deals/{deal}/associate-contact` | Associate contact |
| POST | `/deals/import` | CSV import (DealImportController) |
| GET | `/deals/import/{import}` | Import status |
| GET | `/deals/search` | Quick search |

#### Activities (ActivityController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activities` | `owner_id`, `completed`, `search`, `sort_by`/`sort_dir`, `entity_type`/`record_id` for history |
| POST | `/activities` | Store — polymorphic via `activitable_type`/`activitable_id` |
| GET/PUT/DELETE | `/activities/{id}` | CRUD |

#### Activity Comments (ActivityCommentController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activities/{activity}/comments` | List comments for activity |
| POST | `/activity-comments` | Create comment |
| GET/PUT/DELETE | `/activity-comments/{id}` | CRUD |

#### Tasks (TaskController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | `status`, `assigned_to`, `search`, `sort_by`/`sort_dir`, custom data filters |
| POST | `/tasks` | Store — polymorphic via `taskable_type`/`taskable_id` |
| GET/PUT/DELETE | `/tasks/{id}` | CRUD |

#### Tickets (TicketController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | `status`, `priority`, `owner_id`, `contact_id`, `search`, `sort_by`/`sort_dir` (allowed: subject, status, priority, created_at, updated_at) |
| POST | `/tickets` | Store — `owner_id` mapped to `assigned_to` |
| GET/PUT/DELETE | `/tickets/{id}` | CRUD |

#### Notes (NoteController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | `search`, `sort_by`/`sort_dir`, custom data filters |
| POST | `/notes` | Store — polymorphic via `notable_type`/`notable_id` |
| GET/PUT/DELETE | `/notes/{id}` | CRUD |

#### Documents (DocumentController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | `search`, `sort_by`/`sort_dir`, custom data filters |
| POST | `/documents` | Store — file upload, polymorphic via `documentable_type`/`documentable_id` |
| GET/PUT/DELETE | `/documents/{id}` | CRUD |
| GET | `/documents/{document}/download` | File download |

#### Products (ProductController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | `status`, `search`, `sort_by`/`sort_dir` |
| GET | `/products/search` | Quick search (limit 20) |
| POST | `/products` | Store |
| GET/PUT/DELETE | `/products/{id}` | CRUD |

#### Orders (OrderController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | `status`, `search`, `sort_by`/`sort_dir` |
| POST | `/orders` | Store + line items |
| GET/PUT/DELETE | `/orders/{id}` | CRUD |
| POST | `/orders/{order}/line-items` | Add line items |
| PUT | `/orders/{order}/line-items` | Replace all line items |

#### Properties (PropertyController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/properties` | `search`, `sort_by`/`sort_dir` |
| GET | `/properties/stats` | Property statistics |
| POST | `/properties` | Store |
| GET/PUT/DELETE | `/properties/{id}` | CRUD |
| GET/PATCH | `/properties/{property}/rules` | Access rules |
| GET/PATCH | `/properties/{property}/access` | Access control |
| POST | `/properties/{property}/access/assignments` | Create assignment |
| DELETE/PATCH | `/properties/{property}/access/assignments/{assignment}` | Manage assignment |

#### Property Groups (PropertyGroupController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/property-groups` | List groups |
| POST | `/property-groups` | Create group |
| PATCH | `/property-groups/rename` | Rename group |
| POST | `/property-groups/merge` | Merge groups |
| DELETE | `/property-groups/{group}` | Delete group |

#### Pipelines (PipelineController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pipelines` | List pipelines with stages |
| POST | `/pipelines` | Create pipeline |
| GET/PUT/DELETE | `/pipelines/{id}` | CRUD |

#### Search (SearchController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Global search |
| GET | `/search/contacts` | Contact search |
| GET | `/search/companies` | Company search |
| GET | `/search/deals` | Deal search |
| GET | `/search/products` | Product search |

#### Dashboard (DashboardController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/overview` | Aggregate stats |
| GET | `/dashboard/recent-activity` | Recent activity feed |

#### Reports (ReportController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/executive` | Executive summary |
| GET | `/reports/sales` | Sales report |
| GET | `/reports/customers` | Customer/contact report (labeled "New Customers" in UI) |
| GET | `/reports/orders` | Order report |
| GET | `/reports/tickets` | Ticket report |
| GET | `/reports/productivity` | Productivity report |
| GET | `/reports/activity/calls` | Call activity report |
| GET | `/reports/filter-options` | Filter options for reports |
| GET | `/reports/export` | Export CSV |

#### User Profile (UserProfileController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/user/profile` | View/update profile |
| POST | `/user/profile/avatar` | Upload avatar |
| DELETE | `/user/profile/avatar` | Delete avatar |
| PUT | `/user/password` | Change password |
| GET | `/user/sessions` | Active sessions |
| POST | `/user/logout-all` | Logout all sessions |

#### Settings — verified
| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET/PUT | `/settings/notifications` | NotificationPreferenceController | Channel/topic preferences |
| GET/PUT | `/panel-configs/{type}` | PanelConfigController | Panel layout config |
| GET/POST | `/settings/backups` | BackupRestoreController | Backup management |
| GET/PATCH | `/settings/backup-schedule` | BackupRestoreController | Backup schedule |
| GET/POST | `/settings/restore-history` | BackupRestoreController | Restore history |
| GET/PUT | `/workspace/settings` | WorkspaceSettingsController | Workspace settings |
| POST | `/workspace/settings/logo` | WorkspaceSettingsController | Upload logo |
| GET/PUT | `/settings/object-configs` | ObjectConfigController | Object lifecycle/display config |
| GET/PUT | `/settings/form-layouts` | FormLayoutController | Form layout config |
| GET/PUT | `/user/preferences/{type}` | UserViewPreferenceController | View preferences |

#### Teams (TeamController — Workspace namespace) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams` | List teams |
| POST | `/teams` | Create team |
| PUT | `/teams/{team}` | Update team |
| DELETE | `/teams/{team}` | Delete team |
| GET | `/teams/{team}/users` | List team members |
| POST | `/teams/{team}/users` | Add member |
| DELETE | `/teams/{team}/users/{user}` | Remove member |

#### Invitations (InvitationController — Workspace namespace) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invitations` | List pending invitations |
| POST | `/invitations` | Send invitation |
| POST | `/invitations/accept` | Accept invitation |
| GET | `/roles` | List available roles |

#### Members (MemberController — Workspace namespace) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspace/members` | List workspace members |
| PATCH | `/workspace/members/{user}/role` | Change member role |
| PATCH | `/workspace/members/{user}/deactivate` | Deactivate member |
| PATCH | `/workspace/members/{user}/activate` | Activate member |
| DELETE | `/workspace/members/{user}` | Remove member |

#### Audit Log (AuditLogController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-log` | List audit logs |
| POST | `/audit-log` | Create audit entry |

#### Bootstrap (BootstrapController) — verified
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bootstrap/status` | Platform status (throttled: 10/min) |
| POST | `/bootstrap` | Initial platform setup |

#### Password Reset — verified
| Method | Endpoint | Controller |
|--------|----------|------------|
| POST | `/forgot-password` | ForgotPasswordController |
| POST | `/reset-password` | ResetPasswordController |

### SuperAdmin Endpoints (SuperAdmin namespace) — all verified

| Controller | Endpoints |
|------------|-----------|
| UserController | `GET /super-admin/users`, `GET /super-admin/users/{user}`, `PATCH /super-admin/users/{user}/workspaces/{workspace}` |
| WorkspaceController | `GET/POST /super-admin/workspaces`, `DELETE /super-admin/workspaces/{workspace}`, `GET/POST /super-admin/tenants`, `GET/PATCH/DELETE /super-admin/tenants/{workspace}` |
| PlatformOwnerController | `GET/POST /super-admin/platform-owners`, `POST /super-admin/platform-owners/{user}/deactivate`, `POST /super-admin/platform-owners/terminate-self` |
| ImpersonationController | `POST /super-admin/impersonate`, `POST /super-admin/impersonate/stop`, `GET /super-admin/impersonate/status` |
| BillingController | `GET /super-admin/billing/summary`, `GET/POST /super-admin/billing/invoices`, `PATCH /super-admin/billing/invoices/{invoice}/pay`, `GET /super-admin/billing/plan-distribution`, `GET /super-admin/billing/revenue-trend` |
| PlatformSettingsController | `GET/PUT /super-admin/settings/general` |
| EmailTemplateController | `GET /super-admin/email-templates`, `GET/PUT /super-admin/email-templates/{template}` |
| ApiKeyController | `GET/POST /super-admin/api-keys`, `POST /super-admin/api-keys/{key}/revoke` |
| WebhookController | `GET/POST /super-admin/webhooks`, `PATCH /super-admin/webhooks/{webhook}/toggle`, `DELETE /super-admin/webhooks/{webhook}` |
| SupportTicketController | `GET /super-admin/support-tickets`, `PATCH /super-admin/support-tickets/{ticket}/status` |
| BroadcastController | `GET/POST /super-admin/broadcasts` |
| HealthController | `GET /super-admin/health/summary`, `GET /super-admin/health/uptime`, `GET /super-admin/health/response-times`, `GET /super-admin/health/errors`, `GET /super-admin/health/queues` |
| UsageController | `GET /super-admin/usage/summary`, `GET /super-admin/usage/growth`, `GET /super-admin/usage/tenant-usage`, `GET /super-admin/usage/feature-adoption` |
| SecurityController | `GET/PATCH /super-admin/security/settings`, `GET /super-admin/security/audit-log`, `GET/DELETE /super-admin/security/sessions` |

---

## 12. Authorization & Permissions

### Spatie Permission System
- **Guard**: `web` | **Provider**: `spatie_laravel_permission_permission_user_provider`
- **Sync**: Every 24h via `SyncPermissionsCommand`
- **Pattern**: `view_*_all` / `edit_*_all` / `delete_*_all` (cross-workspace) vs `view_*_own` / `edit_*_own` / `delete_*_own` (own records only)

### Permissions (31 total)
`view_properties_all`, `edit_properties_all`, `delete_properties_all`, `view_properties_own`, `edit_properties_own`, `delete_properties_own`, `view_leads_all`, `edit_leads_all`, `delete_leads_all`, `view_leads_own`, `edit_leads_own`, `delete_leads_own`, `view_deals_all`, `edit_deals_all`, `delete_deals_all`, `view_deals_own`, `edit_deals_own`, `delete_deals_own`, `view_contacts_all`, `edit_contacts_all`, `delete_contacts_all`, `view_contacts_own`, `edit_contacts_own`, `delete_contacts_own`, `view_reports`, `manage_team`, `view_users`, `manage_users`, `view_audit_log`, `view_activity`, `manage_activity`, `view_notes`, `manage_notes`

### Policies (21 total)
`ActivityCommentPolicy`, `ActivityPolicy`, `BackupPolicy`, `CompanyImportPolicy`, `CompanyPolicy`, `ContactImportPolicy`, `ContactPolicy`, `DealImportPolicy`, `DealPolicy`, `DocumentPolicy`, `InvitationPolicy`, `NotePolicy`, `OrderPolicy`, `PipelinePolicy`, `ProductPolicy`, `PropertyPolicy`, `RestoreHistoryPolicy`, `TaskPolicy`, `TicketPolicy`, `UserPolicy`, `UserViewPreferencePolicy`

**PropertyPolicy**: `viewAny` requires `view_properties_all` or `view_properties_own`. `view` checks owner (workspace_user_id match) or all. `create`/`update`/`delete` check `edit_*`/`delete_*` permissions with workspace scoping.

**TeamPolicy**: `manage_team` permission required for all mutations. View is unrestricted.

### Middleware Stack
CORS → TrimStrings → ConvertEmptyStringsToNull → ValidatePostSize → SetSessionForApi → StartSession → CSRF → RouteModelBinding → **Auth** → **Impersonation** → VerifyCsrfToken

### Impersonation Flow
1. Super Admin `POST /impersonations/start` with `target_user_id`
2. Creates `ImpersonationSession` with expiry
3. Issues new Sanctum token for impersonated user
4. Impersonation middleware checks session per request
5. `POST /impersonations/stop` ends session

---

## 13. Known Risk Areas & Remaining Work

### High Priority — Data Integrity
| Risk | Description | Impact |
|------|-------------|--------|
| `customers` naming confusion | Section 10 previously documented a `customers` table and `CustomerController` — neither exist. The real entities are `contacts` (ContactController → `contacts` table) and `companies` (CompanyController → `companies` table). ReportController labels contact data as "New Customers" in reports, which may cause future contributors to conflate the two | Phantom table/model confusion — same class of bug as the prior Tasks/Notes table mismatch |
| Phantom table/model references throughout PROJECT_MAP | Section 10 originally listed `calls`, `comments`, `activity_logs`, `notifications`, `reminders`, `property_folders`, `quotations`, `leads` as real tables — most don't exist. `calls` are activities with type='call'; `comments` are `activity_comments`; `activity_logs` is `audit_logs`; `notifications` is `notification_preferences`; `reminders` and `quotations` have no table/model; `leads` has a migration but no model/controller/routes; `property_folders` is `property_groups` | Phantom references lead to incorrect architecture understanding — always verify against `Schema::create` in migrations and model files |
| Multi-tenancy gap in TeamController | `Workspace\TeamController` does check workspace membership for addMember, but `index()` and `show()` queries are not scoped to current workspace — returns all teams across all workspaces | Cross-tenant data exposure |
| ImpersonationController is deliberately cross-workspace | `SuperAdmin\ImpersonationController` uses `withoutGlobalScopes()` and `target_workspace_id` — intentional for super admin, but if authorization is bypassed, any user could impersonate across tenants | Privilege escalation |

### Medium Priority — API Consistency
| Risk | Description | Impact |
|------|-------------|--------|
| Inconsistent response format | Some `{'data': [...]}`, some `[...]`, some `{data: [...], success: true}` | Frontend parsing complexity |
| Missing validation on some endpoints | Not all endpoints have FormRequest classes | Invalid data saved |
| Inconsistent error handling | Mixed exception throwing vs error responses | Unpredictable errors |

### Low Priority — Performance
| Risk | Description | Impact |
|------|-------------|--------|
| ReportController::customers() runs 4+ queries | Computes newCustomers, leadSources, topAccounts, kpis separately | Multiple DB hits per dashboard load |
| Hardcoded date ranges in DealController | `Carbon::now()->subDays(30)` | Can't customize |
| Missing pagination on some endpoints | All records fetched | Memory issues at scale |

### Remaining Frontend Gaps
| Issue | Page | Description |
|-------|------|-------------|
| `useTabConfig` hook unused | All | Tab management hook not applied |
| `useColumnVisibility` hook unused | All | Column visibility hook not applied |
| Calls sort field mismatch | Calls | Frontend: `call_duration`, `call_direction`, `call_outcome` vs Backend: `subject`, `type`, `created_at`, `activity_date` |
| Deals sidebar filters | Deals | Client-side only (overfetch limit:100) |
| Date range filters | Deals, Tickets, Calls, Documents | UI exists but not wired to backend |
| Advanced filters | Multiple | Tracked in state but not applied |
| Activities completed filter | Activities | Backend ready but page doesn't send it |

### Reconciliation Log (2026-08-27 pass)

Every mismatch found during the full cross-reference verification pass, and how it was resolved:

| # | What was wrong | Evidence | Resolution |
|---|---------------|----------|------------|
| 1 | Section 10 listed `activities` TWICE with conflicting schemas — line 607 (FK-based: title, status, priority, start_date, due_date, workspace_user_id, deal_id, owner_id) vs line 631 (polymorphic: activitable_type/id) | Migration `2026_06_25_143410`: columns are id, workspace_id, user_id, type, subject, description, activity_date, activitable_type, activitable_id. Model `$fillable`: same + call_outcome. No title, status, priority, start_date, due_date, workspace_user_id, deal_id, owner_id columns exist. | Deleted fabricated FK-based entry. Kept only polymorphic entry. |
| 2 | Section 10 listed `tickets` with wrong columns: title, type, category, workspace_user_id, deal_id | Migration `2026_06_30_034158`: columns are id, workspace_id, contact_id, assigned_to, subject, description, status(enum), priority(enum). Model `$fillable`: workspace_id, contact_id, assigned_to, subject, description, status, priority, custom_data. | Rewrote with verified columns from migration. |
| 3 | Section 10 listed `support_tickets` as a CRM entity with workspace_user_id, contact_id, company_id | Migration `2026_08_09_000005`: columns are id, tenant_id (not workspace_id), subject, description, status, priority, assigned_to. Model has no BelongsToWorkspace trait. Used by `SuperAdmin\SupportTicketController` only. | Moved to Platform/SuperAdmin Tables section. Clarified it's platform-level, not CRM. |
| 4 | Section 10 listed `deals` with wrong columns: deal_name, deal_type, stage, probability, close_date, workspace_user_id | Migration `2026_06_25_143408` + alter: columns are id, workspace_id, contact_id, company_id, stage_id, assigned_to, title, amount, status, value, expected_close_date, custom_data, pipeline_stage_id. | Rewrote with verified columns. |
| 5 | Section 10 listed `properties` as real estate (address, price, bedrooms, bathrooms, area, lat, lng) | Migration `2026_07_11_000005`: columns are id, workspace_id, created_by, name, label, field_type, object_type, group_name, description, is_required, is_archived, show_in_forms, display_order, options(json), settings(json). This is a field-definition/config table, not real estate properties. | Rewrote with verified columns. Note: this table stores custom field definitions for CRM objects. |
| 6 | Section 10 listed `orders` with wrong columns: grand_total, workspace_user_id, deal_id | Migration `2026_06_29_124552` + alter: columns are id, workspace_id, contact_id, company_id, owner_id, order_number, title, status(enum), currency, subtotal, discount, tax, shipping, total, closed_at, custom_data. | Rewrote with verified columns. |
| 7 | Section 10 listed `invoices` with wrong columns: invoice_number, grand_total, workspace_user_id, deal_id | Migration `2026_07_26_000001`: columns are id, workspace_id, amount, status, issued_date, due_date, paid_date. No invoice_number, no grand_total, no deal_id. | Rewrote with verified columns. |
| 8 | Section 10 listed `documents` with wrong columns: document_number, title, file_type, file_size, file_url, folder | Migration `2026_06_30_030138` + alter: columns are id, workspace_id, documentable_type, documentable_id, name, document_type, file_path, mime_type, size, uploaded_by. | Rewrote with verified columns. |
| 9 | Section 10 listed `tasks` with wrong columns: type, deal_id, owner_id, priority | Migration `2026_06_25_143409` + 5 alters: columns are id, workspace_id, assigned_to, title, description, created_by, due_date, status, taskable_type, taskable_id, task_subtype, task_priority, task_queue, set_repeat, reminder. No `type`, `deal_id`, `owner_id`, or `priority` columns. | Rewrote with verified columns. |
| 10 | Section 10 listed `notes` with wrong columns: title, customer_id, deal_id, lead_id, property_id, activity_id, task_id, call_id | Migration `2026_06_25_143409`: columns are id, workspace_id, user_id, content, notable_type, notable_id. Uses polymorphic `notable` — no FK columns for customer, deal, lead, etc. | Rewrote with verified columns. |
| 11 | Section 10 listed `users` with wrong columns: workspaces_limit, profile_image, phone, title, avatar | Migration `0001_01_01_000000`: columns include job_title (not title), avatar_path (not avatar), phone_country+phone_number (not phone), no workspaces_limit or profile_image. | Rewrote with verified columns. |
| 12 | Section 10 listed `workspace_user` as `id, user_id, workspace_id, is_active` | Migration `2026_07_02_031823` + alter: composite PK on (workspace_id, user_id), plus is_active, role_name. No separate `id` column. | Rewrote with verified columns. |
| 13 | Section 10 listed `activity_files` as a real table | Full-text grep of all migrations and backend code: zero references to `activity_files`. Table does not exist. | Deleted phantom entry entirely. |
| 14 | Section 10 listed `notification_preferences` with wrong columns: channels, topics | Migration `2026_07_11_000003` + alter: columns are id, user_id, topic_preferences(json), channels(json), new_leads, task_reminders, weekly_digest, browser_alerts. | Rewrote with verified columns. |
| 15 | Section 10 listed `api_keys` with wrong columns: user_id, name, key, last_used_at | Migration `2026_08_09_000003`: columns are id, name, key_hash, key_prefix, key_tail, last_used_at, revoked_at. No user_id, no `key` (uses key_hash). | Rewrote with verified columns. |
| 16 | Section 10 listed `object_configs` as `workspace_id, object_type, config` | Migration `2026_07_12_000001`: columns are id, workspace_id, object_type, lifecycle_stages(json), display_style. | Rewrote with verified columns. |
| 17 | Section 10 listed `form_layouts` as `workspace_id, object_type, layout` | Migration `2026_07_12_000002`: columns are id, workspace_id, object_type, groups(json). | Rewrote with verified columns. |
| 18 | Section 10 listed `panel_configs` as `workspace_id, panel_type, config` | Migration `2026_07_12_000003`: columns are id, workspace_id, object_type (not panel_type), config(json). | Rewrote with verified columns. |
| 19 | Section 10 listed `user_view_preferences` as `user_id, view_type, preferences` | Migration `2026_06_25_143411`: columns are id, user_id, object_type (not view_type), visible_columns(json), column_order(json). | Rewrote with verified columns. |
| 20 | Section 10 listed `stages` with `pipelineable_type, pipelineable_id` | Migration `2026_06_25_143411`: columns are id, workspace_id, object_type (not pipelineable_type), name, slug, color, order, is_system. | Rewrote with verified columns. |
| 21 | Section 2 listed `CallController` as a separate controller | No CallController.php exists. Calls are activities with type='call', handled by ActivityController. Frontend `callsService` calls `/activities` endpoint. | Removed phantom CallController from Section 11. Calls section replaced with note that calls = activities. |
| 22 | Section 2 listed `EmailTemplateController` as part of PlatformSettingsController | `EmailTemplateController.php` is a separate file with its own routes (`/super-admin/email-templates`). | Added as separate entry in Section 11 SuperAdmin table. |
| 23 | Section 2 omitted 9 controllers with active routes | `ForgotPasswordController`, `ResetPasswordController`, `WorkspaceSettingsController`, `ObjectConfigController`, `FormLayoutController`, `TeamController`, `InvitationController`, `MemberController`, `EmailTemplateController` all have routes but were missing from Section 2/11. | Added all to Section 11 with verified endpoints. |
| 24 | Section 3 omitted 10 models that exist as files | `ActivityComment`, `ApiKey`, `BroadcastMessage`, `EmailTemplate`, `FormLayout`, `ObjectConfig`, `PlatformAuditLog`, `PlatformSettings`, `SupportTicket`, `Webhook` all have model files and migrations but were not listed in Section 3. | Resolved — all 10 added to Section 3 with fillable/relationships sourced from the model files. |
| 25 | Section 11 listed `CallController` with separate CRUD endpoints | No `/calls` route exists in `routes/api.php`. Calls are fetched via `GET /activities` with type filter. | Removed phantom CallController section. |

---

## 14. Environment & Integrations

### Environment Variables
| Variable | Purpose | Required |
|----------|---------|----------|
| `APP_NAME` | Application name | No |
| `APP_ENV` | Environment (local/production) | Yes |
| `APP_KEY` | Encryption key | Yes |
| `APP_DEBUG` | Debug mode | Yes |
| `APP_URL` | Application URL | Yes |
| `DB_CONNECTION` | Database driver | Yes |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Database connection | Yes |
| `CACHE_STORE` | Cache store (file/redis/database) | Yes |
| `QUEUE_CONNECTION` | Queue (sync/redis/database) | Yes |
| `SESSION_DRIVER` | Session (file/database/redis) | Yes |
| `SANCTUM_STATEFUL_DOMAINS` | SPA auth domains | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `FILESYSTEM_DISK` | File storage | No |
| `MAIL_MAILER` | Mail driver | No |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis config | Optional |

### External Integrations
**None** — Self-contained CRM with no third-party API dependencies.

### Built-in Integrations
- **Audit Logging**: `AuditLog` model → `audit_logs` table, tracks all CRUD
- **Queue/Job System**: `jobs`, `job_batches`, `failed_jobs` tables, default `sync` driver
- **Notification Preferences**: `NotificationPreference` model → `notification_preferences` table, channel/topic config per user

### Development Requirements
PHP 8.2+, Node.js 18+, Composer 2+, npm 9+, MySQL 8+ or SQLite

### Production Considerations
- Switch queue from `sync` to `redis`/`database`
- Enable Redis cache
- Configure SMTP or transactional email
- Consider S3 for file uploads
- Add rate limiting, SSL, CDN
- Configure automated backups + monitoring

---

## Known Gaps & Remaining Work

### High Priority
- **`customers` naming confusion**: `customers` is NOT a real table or model — the actual entities are `contacts` (ContactController → `contacts` table) and `companies` (CompanyController → `companies` table). ReportController labels contact data as "New Customers" which caused Section 10 to fabricate a non-existent `customers` table
- **Calls sort field mismatch**: Frontend offers `call_duration`, `call_direction`, `call_outcome` but backend only allows `subject`, `type`, `created_at`, `activity_date`
- **Deals sidebar filters**: Stage, owner, amount filters are client-side only (overfetch pattern with limit:100)
- **TeamController multi-tenancy gap**: `index()` and `show()` not scoped to current workspace

### Medium Priority
- **Date range filters**: UI exists on Deals, Tickets, Calls, Documents but not wired to backend
- **Client-side filtering**: Many pages fetch limit:100 then filter client-side
- **Advanced filters**: Tracked in state but not applied
- **Inconsistent response formats**: Mixed `{data: [...], success: true}` vs `[...]` vs `{'data': [...]}`
- **N+1 queries**: ReportController::customers() runs 4+ queries per dashboard load

### Low Priority
- **useTabConfig, useColumnVisibility**: Hooks created but not applied to all pages
- **Activities completed filter**: Backend ready but page doesn't send it yet
- **Missing pagination**: Some list endpoints fetch all records

---

## Keeping This File Accurate

This file was last fully reconciled on 2026-08-27 by reading every migration file, model file, controller file, and route definition directly. Prior versions contained fabricated table schemas, phantom controllers, and invented column lists — the result of editing this file from memory rather than source code.

**To re-verify after any backend change:**

1. **Schema**: Run `ls backend/database/migrations/` and compare against Section 10. Any new `Schema::create` migration means a new table; any `Schema::table` migration means altered columns.
2. **Routes**: Run `php artisan route:list --path=api` (or read `routes/api.php`) and compare against Section 11. Any new route means a new endpoint.
3. **Models**: Run `ls backend/app\Models/` and compare against Section 3 and the BelongsToWorkspace list. Any new model file means a new entity.
4. **Controllers**: Run `ls backend/app/Http/Controllers/Api/ backend/app/Http/Controllers/SuperAdmin/ backend/app/Http/Controllers/Workspace/ backend/app/Http/Controllers/Settings/` and compare against Section 2 and Section 11.

**Do not edit Sections 10-11 from memory.** Every column list must come from a migration file, every route must come from `routes/api.php`, and every model relationship must come from the model's method definitions. If you cannot verify a claim against source code, mark it `inferred` rather than `verified`.
