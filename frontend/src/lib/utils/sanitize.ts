/**
 * Sanitizes a record before Supabase insert/update.
 * Converts undefined, "undefined", "null", and empty _id fields to null.
 */
export function sanitizeRecord<T extends Record<string, any>>(data: T): T {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === 'undefined' || value === 'null') {
      result[key] = null
    } else if (value === '' && key.endsWith('_id')) {
      result[key] = null
    } else {
      result[key] = value
    }
  }

  return result as T
}

/**
 * Sanitizes a search query for Supabase ilike operations.
 * Escapes % and _ characters to prevent unintended pattern matching.
 */
export function sanitizeSearchQuery(query: string): string {
  return query.replace(/[%,_]/g, '\\$&').trim()
}
