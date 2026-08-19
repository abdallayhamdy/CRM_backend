'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { laravelApi, storeToken, removeToken, getStoredToken } from '@/lib/laravel-api'
import { mockAuth, MockUser } from '@/mock/auth'
import { initializeMockData } from '@/mock/api'
import { authService } from '@/services/auth'

export type Role = 'owner' | 'admin' | 'member' | 'viewer'

const VALID_ROLES: ReadonlySet<string> = new Set(['owner', 'admin', 'member', 'viewer'])
const ROLE_MAP: Record<string, Role> = {
  'workspace owner': 'owner',
  'workspace admin': 'admin',
  'workspace member': 'member',
  'workspace viewer': 'viewer',
}
function safeRole(raw: unknown): Role {
  if (typeof raw !== 'string') return 'viewer'
  if (VALID_ROLES.has(raw)) return raw as Role
  return ROLE_MAP[raw.toLowerCase()] ?? 'viewer'
}

interface AuthContextType {
  user: { id: string; email: string; firstName?: string; lastName?: string; avatarUrl?: string; profileId?: string } | null
  session: { user: { id: string; email: string; firstName?: string; lastName?: string; avatarUrl?: string; profileId?: string } } | null
  workspaceId: string | null
  userRole: Role | null
  isSuperAdmin: boolean
  roles: string[]
  permissions: string[]
  activeWorkspace: { id: string; name: string } | null
  setActiveWorkspace: (workspace: { id: string; name: string }) => void
  loading: boolean
  isLoading: boolean
  signOut: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; isSuperAdmin?: boolean }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  workspaceId: null,
  userRole: null,
  isSuperAdmin: false,
  roles: [],
  permissions: [],
  activeWorkspace: null,
  setActiveWorkspace: () => {},
  loading: true,
  isLoading: true,
  signOut: async () => {},
  login: async () => ({ success: false }),
})

interface LoginResponse {
  status: string
  data: {
    user: {
      id: string
      name: string
      email: string
      workspace_id: string
    }
    token: string
  }
}

interface MeResponse {
  data: {
    id: string
    name: string
    email: string
    workspace_id: string
    is_super_admin: boolean
    roles: string[]
    permissions: string[]
  }
}

interface ProfileResponse {
  data: {
    avatar_url: string | null
  }
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function mockUserToAuthUser(mu: MockUser) {
  return {
    id: mu.id,
    email: mu.email,
    firstName: mu.firstName || '',
    lastName: mu.lastName || '',
    avatarUrl: mu.avatarUrl || undefined,
    profileId: mu.profile_id,
  }
}

async function isLaravelAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/laravel/auth/me', { method: 'GET', headers: { Accept: 'application/json' } })
    return res.status !== 404
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<{ id: string; name: string } | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false)
  const [roles, setRoles] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string; firstName: string; lastName: string; avatarUrl: string | null } | null>(null)
  const [useMock, setUseMock] = useState<boolean | null>(null)
  const initializingRef = useRef(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializingRef.current || initializedRef.current) return
    initializingRef.current = true

    const handleProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setUser(prev => prev ? {
        ...prev,
        firstName: detail?.name?.split(' ')[0] || prev.firstName,
        avatarUrl: detail?.avatarUrl ?? prev.avatarUrl,
      } : prev)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('profile-updated', handleProfileUpdated)
    }

    const initializeAuth = async () => {
      try {
        const laravelUp = await isLaravelAvailable()
        setUseMock(!laravelUp)

        if (!laravelUp) {
          // Mock mode: seed mock data and check for stored session
          await initializeMockData()
          const mockUser = mockAuth.getUser()
          if (mockUser) {
            setUser(mockUserToAuthUser(mockUser))
            const role = safeRole(mockUser.role)
            setUserRole(role)
            setWorkspaceId(mockUser.workspace_id)
            setProfileId(mockUser.profile_id)
            setActiveWorkspaceState({ id: mockUser.workspace_id, name: mockAuth.getWorkspace()?.name || '' })
            if (mockUser.workspace_id) {
              localStorage.setItem('active_workspace_id', mockUser.workspace_id)
            }
          }
          setLoading(false)
          return
        }

        // Laravel mode: existing logic
        const token = getStoredToken()
        if (!token) {
          setLoading(false)
          return
        }

        const { data, error } = await laravelApi.get<MeResponse>('/auth/me')

        if (error || !data?.data) {
          removeToken()
          setLoading(false)
          return
        }

        const me = data.data
        const { firstName, lastName } = parseName(me.name)

        let avatarUrl: string | null = null
        try {
          const { data: profileData } = await laravelApi.get<ProfileResponse>('/user/profile')
          avatarUrl = profileData?.data?.avatar_url || null
        } catch { /* profile fetch optional */ }

        setUser({
          id: me.id,
          email: me.email,
          firstName,
          lastName,
          avatarUrl,
        })

        setIsSuperAdmin(me.is_super_admin)
        setRoles(me.roles)
        setPermissions(me.permissions)
        setProfileId(me.id)

        if (me.is_super_admin) {
          const role = me.roles.length > 0 ? safeRole(me.roles[0]) : 'owner'
          setUserRole(role)
          return
        }

        const workspaceIdVal = me.workspace_id
        setWorkspaceId(workspaceIdVal)
        setActiveWorkspaceState({ id: workspaceIdVal, name: '' })

        const role = me.roles.length > 0 ? safeRole(me.roles[0]) : 'member'
        setUserRole(role)

        if (workspaceIdVal) {
          localStorage.setItem('active_workspace_id', workspaceIdVal)
        }
      } catch (err) {
        console.error('[useAuth] Exception during auth initialization:', err)
        removeToken()
      } finally {
        setLoading(false)
        initializingRef.current = false
        initializedRef.current = true
      }
    }

    initializeAuth()

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profile-updated', handleProfileUpdated)
      }
    }
  }, [])

  const setActiveWorkspace = useCallback((workspace: { id: string; name: string }) => {
    setActiveWorkspaceState(workspace)
    setWorkspaceId(workspace.id)
    localStorage.setItem('active_workspace_id', workspace.id)
  }, [])

  const signOut = useCallback(async () => {
    if (useMock) {
      await mockAuth.signOut()
    } else {
      await laravelApi.post('/logout')
      removeToken()
    }
    authService.clearCache()
    localStorage.removeItem('active_workspace_id')
    setUser(null)
    setActiveWorkspaceState(null)
    setWorkspaceId(null)
    setUserRole(null)
    setIsSuperAdmin(false)
    setRoles([])
    setPermissions([])
    setProfileId(null)
    window.location.href = '/login'
  }, [useMock])

  const login = useCallback(async (email: string, password: string) => {
    // Try Laravel first if available, otherwise use mock
    if (useMock === false) {
      const { data, error } = await laravelApi.post<LoginResponse>('/login', { email, password })

      if (error || !data) {
        return { success: false, error: error || 'Login failed', isSuperAdmin: false }
      }

      storeToken(data.data.token)

      const me = data.data.user
      const { firstName, lastName } = parseName(me.name)

      setUser({
        id: me.id,
        email: me.email,
        firstName,
        lastName,
        avatarUrl: null,
      })

      setProfileId(me.id)

      let resultIsSuperAdmin = false

      try {
        const { data: meData } = await laravelApi.get<MeResponse>('/auth/me')
        if (meData?.data) {
          const fullMe = meData.data
          const role = fullMe.roles.length > 0 ? safeRole(fullMe.roles[0]) : 'member'
          setUserRole(role)
          setIsSuperAdmin(fullMe.is_super_admin)
          setRoles(fullMe.roles)
          setPermissions(fullMe.permissions)
          resultIsSuperAdmin = fullMe.is_super_admin

          if (fullMe.is_super_admin) {
            return { success: true, isSuperAdmin: true }
          }

          const workspaceIdVal = fullMe.workspace_id
          setWorkspaceId(workspaceIdVal)
          setActiveWorkspaceState({ id: workspaceIdVal, name: '' })

          if (workspaceIdVal) {
            localStorage.setItem('active_workspace_id', workspaceIdVal)
          }
        } else {
          setUserRole('member')
        }
      } catch {
        setUserRole('member')
      }

      return { success: true, isSuperAdmin: resultIsSuperAdmin }
    }

    // Mock auth
    await initializeMockData()
    const result = await mockAuth.signIn(email, password)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    const mockUser = mockAuth.getUser()!
    setUser(mockUserToAuthUser(mockUser))
    const role = safeRole(mockUser.role)
    setUserRole(role)
    setWorkspaceId(mockUser.workspace_id)
    setProfileId(mockUser.profile_id)
    setActiveWorkspaceState({ id: mockUser.workspace_id, name: mockAuth.getWorkspace()?.name || '' })
    if (mockUser.workspace_id) {
      localStorage.setItem('active_workspace_id', mockUser.workspace_id)
    }

    return { success: true, isSuperAdmin: false }
  }, [useMock])

  const userObj = useMemo(() => user ? {
    id: user.id,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    avatarUrl: user.avatarUrl || '',
    profileId: profileId || undefined
  } : null, [user, profileId])

  const value = useMemo(() => ({
    user: userObj,
    session: userObj ? { user: userObj } : null,
    workspaceId,
    userRole,
    isSuperAdmin,
    roles,
    permissions,
    activeWorkspace,
    setActiveWorkspace,
    loading,
    isLoading: loading,
    signOut,
    login,
  }), [userObj, workspaceId, userRole, isSuperAdmin, roles, permissions, activeWorkspace, setActiveWorkspace, loading, signOut, login])

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  )
}

export const useAuth = () => useContext(AuthContext)
