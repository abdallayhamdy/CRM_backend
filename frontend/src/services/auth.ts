import { laravelApi } from '@/lib/laravel-api'
import { Profile, ServiceResponse } from '@/lib/types/crm'

let cachedUser: Profile | null = null
let pendingUserPromise: Promise<ServiceResponse<Profile>> | null = null

const cachedProfiles: Record<string, Profile[]> = {}
const pendingProfilesPromises: Record<string, Promise<ServiceResponse<Profile[]>> | null> = {}

export const authService = {
  async getUser(): Promise<null> {
    return null
  },

  async getCurrentUser() {
    if (cachedUser) {
      return { data: cachedUser, error: null } as ServiceResponse<Profile>
    }
    if (!pendingUserPromise) {
      pendingUserPromise = laravelApi.get<{ data: Profile }>('/auth/me')
        .then(res => {
          const user = res.data?.data ?? null
          cachedUser = user
          pendingUserPromise = null
          return { data: user, error: null } as ServiceResponse<Profile>
        })
        .catch(err => {
          pendingUserPromise = null
          return { data: null, error: { message: String(err) } } as ServiceResponse<Profile>
        })
    }
    return pendingUserPromise
  },

  async listProfiles(workspaceId: string) {
    if (cachedProfiles[workspaceId]) {
      return { data: cachedProfiles[workspaceId], error: null } as ServiceResponse<Profile[]>
    }
    if (!pendingProfilesPromises[workspaceId]) {
      pendingProfilesPromises[workspaceId] = laravelApi.get<{ data: Profile[] }>('/workspace/members')
        .then(res => {
          const profiles = res.data?.data ?? []
          cachedProfiles[workspaceId] = profiles
          pendingProfilesPromises[workspaceId] = null
          return { data: profiles, error: null } as ServiceResponse<Profile[]>
        })
        .catch(err => {
          pendingProfilesPromises[workspaceId] = null
          return { data: null, error: { message: String(err) } } as ServiceResponse<Profile[]>
        })
    }
    return pendingProfilesPromises[workspaceId]
  },

  clearCache() {
    cachedUser = null
    pendingUserPromise = null
    for (const key in cachedProfiles) {
      delete cachedProfiles[key]
    }
    for (const key in pendingProfilesPromises) {
      delete pendingProfilesPromises[key]
    }
  }
}
