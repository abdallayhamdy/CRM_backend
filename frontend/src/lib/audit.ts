import { laravelApi } from '@/lib/laravel-api'

export type AuditUser = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

type AuditParams = {
  /** @deprecated Ignored – kept for backward compatibility during migration */
  client?: unknown
  workspace_id: string
  action: string
  category: string
  subcategory?: string
  source?: string
  sourceUrl?: string
  modifiedBy?: AuditUser | null
  assistedBy?: string | null
  recordId?: string | null
  recordType?: string | null
}

export async function logAudit({
  workspace_id,
  action,
  category,
  subcategory,
  source = 'web',
  sourceUrl,
  modifiedBy,
  assistedBy,
  recordId,
  recordType,
}: AuditParams): Promise<void> {
  try {
    const name = [modifiedBy?.firstName, modifiedBy?.lastName]
      .filter(Boolean)
      .join(' ') || null

    await laravelApi.post('/audit-log', {
      workspace_id,
      action,
      category,
      subcategory: subcategory ?? category,
      source,
      source_url: sourceUrl ?? null,
      date_of_change: new Date().toISOString(),
      modified_by_name: name,
      modified_by_email: modifiedBy?.email ?? null,
      modified_by_avatar: modifiedBy?.avatarUrl ?? null,
      assisted_by: assistedBy ?? null,
      record_id: recordId ?? null,
      record_type: recordType ?? null,
    })
  } catch (err) {
    console.error('[logAudit]', err)
  }
}
