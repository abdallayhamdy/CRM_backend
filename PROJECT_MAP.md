# CRM Project Map & Status

> Last updated: 2026-08-27
> Monorepo: frontend + backend in same git repo

---

## Architecture

- **Frontend**: Next.js 16 (App Router) + React 19, TypeScript, TailwindCSS
- **Backend**: Laravel 13.8, PHP, MySQL, Sanctum auth
- **Frontend path**: `frontend/src/`
- **Backend path**: `backend/`
- **API**: Laravel serves at `/api/laravel/...` proxied by Next.js

---

## CRM Pages - Backend/Frontend Status

### Deals (`/deals`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | `deals.ts` → `q` param | `DealController` `title LIKE` | DONE |
| Sort | `sortBy`/`sortDir` sent | `sort_by` maps `createDate→created_at`, `closeDate→expected_close_date` | DONE |
| Pipeline filter | `pipeline_id` sent | `DealController` filters by pipeline_stage | DONE |
| Stage filter | client-side only (`use-filtered-deals.ts`) | backend supports `stage` param but not wired from sidebar | PARTIAL |
| Owner filter | client-side only | backend supports `owner_id` but not sent from sidebar | PARTIAL |
| Custom props | `filter[propName]` sent | `applyCustomDataFilters` | DONE |
| Date ranges | tracked in state, NOT sent, NOT filtered | no support | NOT DONE |
| Amount range | client-side only (`use-filtered-deals.ts`) | not sent | PARTIAL |
| Pagination | `limit: 100` + client-side filter | supports paginated | PARTIAL (overfetch) |

### Activities (`/activities`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | `search` → `q` param | `ActivityController` `subject/description LIKE` | DONE |
| Sort | `sortBy`/`sortDir` sent | `sort_by` whitelist: subject, type, created_at, activity_date | DONE |
| Type filter | `activeTab` → `type` param | `ActivityController` `where type` | DONE |
| Completed filter | NOT sent from page | backend now supports `completed` param | PARTIAL (backend ready) |
| Date range | UI exists, not sent | no support | NOT DONE |
| Pagination | `page`/`limit` sent | `paginate()` | DONE |

### Tickets (`/tickets`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | `search` → `q` param | `TicketController` `subject LIKE` | DONE |
| Sort | `sortBy`/`sortDir` sent | `sort_by` whitelist: subject, status, priority, created_at, updated_at | DONE |
| Status filter | `status` sent | `TicketController` `where status` | DONE |
| Priority filter | `priority` sent | `TicketController` `where priority` | DONE |
| Owner filter | sent when tab="my" | `TicketController` `where assigned_to` | DONE |
| Custom props | `filter[propName]` sent | `applyCustomDataFilters` | DONE |
| Date range | client-side only | no support | PARTIAL |
| Pagination | `limit: 100` | supports paginated | PARTIAL (overfetch) |

### Tasks (`/tasks`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | sent as `q` | `TaskController` `title/description LIKE` | DONE |
| Sort | sent | `sort_by` whitelist: title, status, due_date, created_at, updated_at | DONE |
| Status filter | sent | `where status` | DONE |
| Date range (due_date) | `due_date_from`/`due_date_to` sent | supported | DONE |
| Edit sidebar | all fields editable | `task_priority`, `task_queue`, `set_repeat`, `reminder` now in DB + $fillable + validation | DONE |

### Calls (`/calls`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | `filters.search` sent | `ActivityController` `subject/description LIKE` | DONE |
| Sort | `sortBy`/`sortDir` sent | backend whitelist: subject, type, created_at, activity_date | DONE (partial - custom fields like call_duration not server-sortable) |
| Mine tab | `owner_id` sent | `ActivityController` `where user_id` | DONE |
| Date range | UI exists, not sent | no support | NOT DONE |
| Pagination | sent | `paginate()` | DONE |
| Sort field mismatch | Frontend offers `call_duration`, `call_direction`, `call_outcome` — not in backend whitelist | falls back to `created_at` | PARTIAL |

### Notes (`/notes`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | sent as `q` | `NoteController` `content LIKE` | DONE |
| Sort | `sort_by`/`sort_dir` sent | whitelist: created_at, updated_at | DONE |
| Date range | `created_from`/`created_to` sent | supported | DONE |
| Mine tab | `user_id` sent | `where user_id` | DONE |
| Workspace isolation | — | `where workspace_id` added | DONE (was CRITICAL bug) |
| Pagination | sent | `paginate()` | DONE |

### Documents (`/documents`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | `filters.search` sent | `DocumentController` `name/mime_type LIKE` | DONE |
| Sort | `sortBy`/`sortDir` sent | whitelist: name, size, mime_type, created_at, updated_at | DONE |
| Type filter | client-side only | no `document_type` filter in backend | PARTIAL |
| Date range | UI exists, not applied | no support | NOT DONE |
| Workspace isolation | — | `where workspace_id` added | DONE (was CRITICAL bug) |
| Pagination | default 25 | `paginate()` | DONE |
| Upload | fixed 422 (mimes→extensions) | backend accepts | DONE |
| Rename | React.memo removed from DataTableRow | — | DONE |

### Products (`/products`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | sent as `q` | `ProductController` `name/sku LIKE` | DONE |
| Sort | `sortBy`/`sortDir` sent | whitelist: name, sku, unit_price, status, product_folder, created_at, updated_at | DONE |
| Status filter | `status` sent | `ProductController` `where status` added | DONE |
| Folder filter | `productFolder` sent | `ProductController` `where product_folder` added | DONE |
| Custom props | `filter[propName]` sent | `applyCustomDataFilters` | DONE |
| Product status label | "Inactive" → "Archived" in columns + detail page | — | DONE |

### Orders (`/orders`)
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Search | sent | OrderController handles | DONE |
| Sort | `sortBy`/`sortDir` sent | handled | DONE |
| Pagination | sent | paginate() | DONE |

---

## Shared Components & Hooks (extracted)

| File | Purpose | Status |
|------|---------|--------|
| `hooks/use-sort-state.ts` | Sort state + localStorage | DONE, used by all pages |
| `hooks/use-table-settings.ts` | Table settings persistence | DONE, used by all pages |
| `hooks/use-owners.ts` | Workspace owners loading | DONE, used by all pages |
| `hooks/use-tab-config.ts` | Tab management | DONE (not yet applied to all pages) |
| `hooks/use-column-visibility.ts` | Column visibility | DONE (not yet applied to all pages) |
| `components/crm/CrmErrorBoundary.tsx` | Shared error boundary | DONE, replaces 15 error files |
| `components/crm/CrmModuleLoading.tsx` | Shared loading skeleton | DONE, replaces 10 loading files |
| `components/crm/CrmDataTable.tsx` | Shared data table | DONE |
| `components/crm/CrmFilterBar.tsx` | Shared filter bar | DONE |
| `components/crm/CrmPageLayout.tsx` | Shared page header | DONE |

---

## CRITICAL Bugs Fixed

1. **NoteController no workspace isolation** — Returned all notes across all workspaces. Fixed by adding `where workspace_id`.
2. **DocumentController no workspace isolation** — Same issue. Fixed by adding `where workspace_id`.
3. **Task edit sidebar backend gap** — Frontend allowed editing `type`, `task_priority`, `task_queue`, `set_repeat`, `reminder` but backend had no columns. Fixed: migration + model + validation + resource.

---

## Known Remaining Issues

### High Priority
- **Calls sort field mismatch**: Frontend offers `call_duration`, `call_direction`, `call_outcome` as sortable but backend only allows `subject`, `type`, `created_at`, `activity_date`. Need to add these columns to backend whitelist or store in `custom_data`.
- **Deals stage/owner/amount filters**: Sidebar filters exist but are only applied client-side on `limit: 100` results. Need to wire to backend params.

### Medium Priority
- **Date range filters on Deals, Tickets, Calls, Documents**: UI exists but not wired to backend or applied client-side. Dead feature.
- **Overfetch pattern**: Many pages fetch `limit: 100` then filter client-side. Should move to server-side filtering.

### Low Priority
- **Advanced filters**: Tracked in state but not applied anywhere.
- **`useTabConfig` and `useColumnVisibility` hooks**: Created but not yet applied to all pages.

---

## File Quick Reference

### Backend Controllers
- `backend/app/Http/Controllers/Api/DealController.php`
- `backend/app/Http/Controllers/Api/ActivityController.php`
- `backend/app/Http/Controllers/Api/TicketController.php`
- `backend/app/Http/Controllers/Api/TaskController.php`
- `backend/app/Http/Controllers/Api/NoteController.php`
- `backend/app/Http/Controllers/Api/DocumentController.php`
- `backend/app/Http/Controllers/Api/ProductController.php`
- `backend/app/Http/Controllers/Api/OrderController.php`

### Backend Models
- `backend/app/Models/Task.php` — includes `task_priority`, `task_queue`, `set_repeat`, `reminder`
- `backend/app/Models/Note.php`
- `backend/app/Models/Document.php`

### Backend Requests
- `backend/app/Http/Requests/StoreTaskRequest.php` — includes task fields validation
- `backend/app/Http/Requests/UpdateTaskRequest.php` — includes task fields validation
- `backend/app/Http/Requests/StoreDocumentRequest.php` — fixed `extensions` rule

### Backend Resources
- `backend/app/Http/Resources/TaskResource.php` — returns all task fields

### Frontend Services
- `frontend/src/services/deals.ts`
- `frontend/src/services/activities.ts`
- `frontend/src/services/tickets.ts`
- `frontend/src/services/products.ts`
- `frontend/src/services/documents.ts`
- `frontend/src/services/notes.ts`
- `frontend/src/services/tasks.ts`

### Frontend Pages
- `frontend/src/app/deals/page.tsx`
- `frontend/src/app/activities/page.tsx`
- `frontend/src/app/tickets/page.tsx`
- `frontend/src/app/tasks/page.tsx`
- `frontend/src/app/calls/page.tsx`
- `frontend/src/app/notes/page.tsx`
- `frontend/src/app/documents/page.tsx`
- `frontend/src/app/products/page.tsx`
- `frontend/src/app/orders/page.tsx`

### Frontend Shared
- `frontend/src/hooks/use-crm-filters.ts` — core filter state
- `frontend/src/hooks/use-sort-state.ts` — sort state + localStorage
- `frontend/src/hooks/use-table-settings.ts` — table settings
- `frontend/src/hooks/use-owners.ts` — workspace owners
- `frontend/src/hooks/use-tab-config.ts` — tab management
- `frontend/src/hooks/use-column-visibility.ts` — column visibility
- `frontend/src/components/crm/CrmFilterBar.tsx` — filter bar
- `frontend/src/components/crm/CrmDataTable.tsx` — data table
- `frontend/src/components/crm/CrmErrorBoundary.tsx` — error boundary
- `frontend/src/components/crm/CrmModuleLoading.tsx` — loading skeleton
- `frontend/src/components/crm/CrmPageLayout.tsx` — page header
- `frontend/src/components/tasks/TaskEditSidebar.tsx` — task edit sidebar
- `frontend/src/lib/field-configs/tasks.ts` — task field config
- `frontend/src/lib/types/crm.ts` — TypeScript types
- `frontend/src/components/documents/UploadDocumentSheet.tsx` — upload sheet
