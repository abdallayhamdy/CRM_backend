// Mock Auth Service - Replaces real Clerk authentication
import { mockUsers, mockWorkspaces } from './data'

export interface MockUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'
  workspace_id: string
  profile_id: string
}

export interface MockWorkspace {
  id: string
  name: string
  logo_url?: string | null
  clerk_org_id?: string
}

const STORAGE_KEY = 'crm_mock_current_user'
const WORKSPACE_KEY = 'crm_mock_current_workspace'

class MockAuthService {
  private currentUser: MockUser | null = null
  private currentWorkspace: MockWorkspace | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY)
        const storedWorkspace = localStorage.getItem(WORKSPACE_KEY)
        if (storedUser) this.currentUser = JSON.parse(storedUser)
        if (storedWorkspace) this.currentWorkspace = JSON.parse(storedWorkspace)
      } catch { /* ignore */ }
    }
  }

  getUser(): MockUser | null {
    return this.currentUser
  }

  getWorkspace(): MockWorkspace | null {
    return this.currentWorkspace
  }

  getWorkspaceId(): string | null {
    return this.currentWorkspace?.id || null
  }

  getRole(): string {
    return this.currentUser?.role || 'viewer'
  }

  getProfileId(): string | null {
    return this.currentUser?.profile_id || null
  }

  async signIn(email: string, _password: string): Promise<{ success: boolean; error?: string }> {
    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      return { success: false, error: 'البريد الإلكتروني غير مسجل' }
    }
    
    this.currentUser = user
    this.currentWorkspace = mockWorkspaces.find(w => w.id === user.workspace_id) || null

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      if (this.currentWorkspace) {
        localStorage.setItem(WORKSPACE_KEY, JSON.stringify(this.currentWorkspace))
      }
    }
    
    return { success: true }
  }

  async signOut(): Promise<void> {
    this.currentUser = null
    this.currentWorkspace = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(WORKSPACE_KEY)
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }
}

export const mockAuth = new MockAuthService()
