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

class MockAuthService {
  private currentUser: MockUser | null = null
  private currentWorkspace: MockWorkspace | null = null

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
    
    return { success: true }
  }

  async signOut(): Promise<void> {
    this.currentUser = null
    this.currentWorkspace = null
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }
}

export const mockAuth = new MockAuthService()
