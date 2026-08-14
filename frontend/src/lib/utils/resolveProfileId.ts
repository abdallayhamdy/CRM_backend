import { api } from '../api'

/**
 * Resolves a user ID to the corresponding profiles.id (UUID).
 * If the input is already a UUID (not starting with "user_"), returns it as-is.
 * Returns null if no matching profile is found.
 */
export async function resolveProfileId(userId: string): Promise<string | null> {
  if (!userId) return null

  // Already a UUID — no resolution needed
  if (!userId.startsWith('user_')) return userId

  const { data, error } = await api.post<{ id: string }>('/profiles/resolve', { clerk_user_id: userId })

  if (error || !data) return null
  return data.id
}
