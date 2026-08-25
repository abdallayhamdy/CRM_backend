"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronDown, ChevronLeft, MoreHorizontal, X, UserPlus, Clock, Users,
  Search, SlidersHorizontal, ArrowUpDown, Copy, Trash2, ExternalLink, Check, Info, Pencil,
  Mail, Shield, AlertCircle,
} from 'lucide-react';
import { laravelApi } from '@/lib/laravel-api';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionSetsTab } from '@/components/settings/users-teams/PermissionSetsTab';

import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function timeAgo(date: Date | string | null): string {
  if (!date) return '—'
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return '—'
  }
}

function isExpired(date: string | null): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

interface Team {
  id: string
  name: string
  description: string | null
  member_count?: number
  created_at: string
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface Member {
  id: string
  name: string
  email: string
  role_name: string
  is_active: boolean
  roles: string[]
  joined_at: string | null
}

interface Invitation {
  id: string
  email: string
  role_name: string
  expires_at: string | null
  created_at: string | null
}

interface Role {
  id: string
  name: string
}

const AVATAR_BG = 'bg-[var(--color-hs-border)]'

function displayRole(roleName: string): string {
  switch (roleName) {
    case 'Workspace Owner': return 'Owner'
    case 'Workspace Admin': return 'Admin'
    case 'Workspace Member': return 'Member'
    case 'Workspace Viewer': return 'Viewer'
    default: return roleName
  }
}

export default function UsersTeamsPage() {
  const { user, workspaceId } = useAuth()

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteErrors, setInviteErrors] = useState<Record<string, string[]>>({})
  const [roles, setRoles] = useState<Role[]>([])

  // Teams state
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [editTeamOpen, setEditTeamOpen] = useState(false)
  const [editTeamId, setEditTeamId] = useState<string | null>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editTeamDesc, setEditTeamDesc] = useState('')
  const [isEditingTeam, setIsEditingTeam] = useState(false)

  // Team members management
  const [manageMembersTeam, setManageMembersTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamMembersLoading, setTeamMembersLoading] = useState(false)
  const [addMemberId, setAddMemberId] = useState('')
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false)

  // View sub-tabs
  const [activeView, setActiveView] = useState('active')

  // Search
  const [userSearch, setUserSearch] = useState('')

  // Members & Invitations state
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [invitationsLoading, setInvitationsLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true)
    const { data, error } = await laravelApi.get('/workspace/members')
    if (!error && data) {
      const paginated = data as { data?: Member[] }
      setMembers(paginated?.data || [])
    }
    setMembersLoading(false)
  }, [])

  const fetchInvitations = useCallback(async () => {
    setInvitationsLoading(true)
    const { data, error } = await laravelApi.get('/invitations')
    if (!error && data) {
      const list = data as { data?: Invitation[] }
      setInvitations(list?.data || [])
    } else {
      setInvitations([])
    }
    setInvitationsLoading(false)
  }, [])

  const fetchRoles = useCallback(async () => {
    const { data, error } = await laravelApi.get('/roles')
    if (!error && data) {
      const list = data as { data?: Role[] }
      const fetchedRoles = list?.data || []
      setRoles(fetchedRoles)
      if (fetchedRoles.length > 0 && !inviteRole) {
        const standardRole = fetchedRoles.find((r: Role) => r.name === 'Workspace Member')
        setInviteRole(standardRole?.name || fetchedRoles[0].name)
      }
    }
  }, [inviteRole])

  useEffect(() => {
    fetchMembers()
    fetchInvitations()
    fetchRoles()
  }, [fetchMembers, fetchInvitations, fetchRoles])

  // Fetch teams from real API
  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true)
    const { data, error } = await laravelApi.get('/teams')
    if (!error && data) {
      const paginated = data as { data?: Team[] }
      setTeams(paginated?.data || [])
    } else {
      setTeams([])
    }
    setTeamsLoading(false)
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) return
    setIsInviting(true)
    setInviteErrors({})
    try {
      const { data, error, validationErrors } = await laravelApi.post('/invitations', {
        email: inviteEmail,
        role_name: inviteRole,
      })
      if (error) {
        if (validationErrors) {
          setInviteErrors(validationErrors)
        }
        toast.error(error)
        return
      }
      toast.success('Invitation sent successfully.')
      setInviteEmail('')
      setInviteOpen(false)
      fetchInvitations()
    } catch {
      toast.error('Failed to send invitation.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    const { error } = await laravelApi.patch(`/workspace/members/${memberId}/role`, { role_name: newRole })
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Role updated.')
    fetchMembers()
  }

  const handleDeactivateMember = async (memberId: string) => {
    const { error } = await laravelApi.post(`/workspace/members/${memberId}/deactivate`)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Member deactivated.')
    fetchMembers()
  }

  const handleActivateMember = async (memberId: string) => {
    const { error } = await laravelApi.post(`/workspace/members/${memberId}/activate`)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Member activated.')
    fetchMembers()
  }

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await laravelApi.delete(`/workspace/members/${memberId}`)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Member removed.')
    fetchMembers()
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    setIsCreatingTeam(true)
    try {
      const { data, error, validationErrors } = await laravelApi.post('/teams', {
        name: teamName.trim(),
        description: teamDesc.trim() || null,
      })
      if (error) {
        toast.error(error)
        return
      }
      toast.success(`Team "${teamName}" created.`)
      setTeamName('')
      setTeamDesc('')
      setCreateTeamOpen(false)
      fetchTeams()
    } catch {
      toast.error('Failed to create team.')
    } finally {
      setIsCreatingTeam(false)
    }
  }

  const handleUpdateTeam = async () => {
    if (!editTeamId || !editTeamName.trim()) return
    setIsEditingTeam(true)
    try {
      const { error } = await laravelApi.put(`/teams/${editTeamId}`, {
        name: editTeamName.trim(),
        description: editTeamDesc.trim() || null,
      })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Team updated.')
      setEditTeamOpen(false)
      setEditTeamId(null)
      fetchTeams()
    } catch {
      toast.error('Failed to update team.')
    } finally {
      setIsEditingTeam(false)
    }
  }

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? This cannot be undone.`)) return
    const { error } = await laravelApi.delete(`/teams/${teamId}`)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Team deleted.')
    fetchTeams()
  }

  const openEditTeam = (team: Team) => {
    setEditTeamId(team.id)
    setEditTeamName(team.name)
    setEditTeamDesc(team.description || '')
    setEditTeamOpen(true)
  }

  const openManageMembers = async (team: Team) => {
    setManageMembersTeam(team)
    setAddMemberId('')
    setTeamMembersLoading(true)
    const { data, error } = await laravelApi.get(`/teams/${team.id}/members`)
    if (!error && data) {
      setTeamMembers((data as { data?: TeamMember[] }).data || [])
    } else {
      setTeamMembers([])
    }
    setTeamMembersLoading(false)
  }

  const handleAddTeamMember = async () => {
    if (!manageMembersTeam || !addMemberId) return
    setIsAddingTeamMember(true)
    const { error } = await laravelApi.post(`/teams/${manageMembersTeam.id}/members/${addMemberId}`)
    setIsAddingTeamMember(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Member added to team.')
    setAddMemberId('')
    await openManageMembers(manageMembersTeam)
    fetchTeams()
  }

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!manageMembersTeam) return
    const { error } = await laravelApi.delete(`/teams/${manageMembersTeam.id}/members/${memberId}`)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Member removed from team.')
    await openManageMembers(manageMembersTeam)
    fetchTeams()
  }

  const memberCount = members.length
  const activeMemberCount = members.filter(m => m.is_active).length
  const deactivatedMemberCount = members.filter(m => !m.is_active).length
  const pendingInvitationCount = invitations.filter(inv => !isExpired(inv.expires_at)).length

  const availableMembers = members.filter(m => m.is_active && !teamMembers.some(tm => tm.id === m.id))

  const filteredMembers = members.filter(m => {
    if (!userSearch) return true
    const name = (m.name || '').toLowerCase()
    const email = (m.email || '').toLowerCase()
    const q = userSearch.toLowerCase()
    const matchesSearch = name.includes(q) || email.includes(q)
    if (activeView === 'active') return matchesSearch && m.is_active
    if (activeView === 'deactivated') return matchesSearch && !m.is_active
    return matchesSearch
  })

  return (
    <div className="p-8 bg-background">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Users & Teams</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Manage users, seats, and teams in your account.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-[var(--color-hs-page-bg)] border border-border p-0.5">
          <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border px-5">
            Users
          </TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border px-5">
            Teams
          </TabsTrigger>
          <TabsTrigger value="permission-sets" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border px-5">
            Permission sets
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════
           USERS TAB
           ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="users">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[13px] text-muted-foreground">
              Create new users, customize user permissions...
            </p>
            <a href="#" className="text-[var(--color-hs-blue)] text-[13px] font-bold hover:underline inline-flex items-center gap-1">
              Learn more about user permissions <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="border border-border rounded-xs overflow-hidden">
            {/* Sub-header */}
            <div className="flex items-center justify-between p-4 pb-0">
              <div />
              <div className="flex items-center gap-2">
                <Dialog open={inviteOpen} onOpenChange={(open) => {
                  setInviteOpen(open)
                  if (!open) setInviteErrors({})
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold h-8 text-[12px] gap-1.5 px-3">
                      <UserPlus className="h-3.5 w-3.5" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="text-[18px] font-bold text-foreground">Invite User</DialogTitle>
                      <DialogDescription className="text-[13px] text-muted-foreground">
                        Send an invitation email to add a new user to your workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-[13px] font-bold text-foreground">Email address</Label>
                        <Input
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
                        />
                        {inviteErrors.email && (
                          <p className="text-[12px] text-destructive mt-1">{inviteErrors.email[0]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-bold text-foreground">Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger className="border-border h-10 focus:ring-[var(--color-hs-blue)]">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role.id} value={role.name}>
                                {displayRole(role.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {inviteErrors.role_name && (
                          <p className="text-[12px] text-destructive mt-1">{inviteErrors.role_name[0]}</p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteOpen(false)} className="border-border">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInvite}
                        disabled={isInviting || !inviteEmail || !inviteRole}
                        className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold"
                      >
                        {isInviting ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* View tabs — segmented buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[var(--color-hs-page-bg)] border border-border rounded-xs p-0.5">
                  {[
                    { key: 'all', label: 'All Users', count: memberCount },
                    { key: 'active', label: 'Active Users', count: activeMemberCount },
                    { key: 'deactivated', label: 'Deactivated Users', count: deactivatedMemberCount },
                    { key: 'invitations', label: 'Invitations', count: pendingInvitationCount },
                  ].map(v => (
                    <button
                      key={v.key}
                      onClick={() => setActiveView(v.key)}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-[2px] transition-all flex items-center gap-1.5 ${
                        activeView === v.key
                          ? 'bg-background text-foreground shadow-sm border border-border'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {v.label} <span className="text-muted-foreground/60">{v.count}</span>
                      {activeView === v.key && (
                        <X className="h-3 w-3 text-muted-foreground/60 cursor-pointer" onClick={e => { e.stopPropagation(); setActiveView('active') }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search bar (for member views) */}
              {activeView !== 'invitations' && (
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                    <Input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search name or email address"
                      className="pl-9 h-8 border-border text-[12px] focus-visible:ring-[var(--color-hs-blue)]"
                    />
                  </div>
                </div>
              )}

              {/* ═══ INVITATIONS VIEW ═══ */}
              {activeView === 'invitations' ? (
                <div className="border border-border rounded-xs overflow-hidden">
                  {invitationsLoading ? (
                    <div className="p-8 space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : invitations.length === 0 ? (
                    <div className="p-12 text-center">
                      <Mail className="h-10 w-10 text-[var(--color-hs-border)] mx-auto mb-3" />
                      <p className="text-[15px] font-bold text-foreground">No pending invitations</p>
                      <p className="text-[13px] text-muted-foreground mt-1">
                        All invitations have been accepted or expired.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-[var(--table-header-bg)]/75 backdrop-blur-sm">
                        <TableRow className="border-b border-border">
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Email</TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Role</TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Status</TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Sent</TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Expires</TableHead>
                          <TableHead className="w-6 px-4 py-3"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map(inv => {
                          const expired = isExpired(inv.expires_at)
                          return (
                            <TableRow key={inv.id} className="border-b border-border last:border-b-0 hover:bg-[var(--color-hs-light-bg)] group">
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[11px] font-bold flex-none">
                                    <Mail className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="text-[13px] font-bold text-foreground">{inv.email}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span className="text-[13px] text-muted-foreground">{displayRole(inv.role_name)}</span>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {expired ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-transparent text-[11px] font-semibold">
                                    Expired
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-transparent text-[11px] font-semibold">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-[13px] text-muted-foreground">
                                {timeAgo(inv.created_at)}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-[13px] text-muted-foreground">
                                {expired ? (
                                  <span className="text-destructive">Expired {timeAgo(inv.expires_at)}</span>
                                ) : (
                                  <span>{timeAgo(inv.expires_at)}</span>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span className="text-[11px] text-muted-foreground/60 italic opacity-0 group-hover:opacity-100 transition-opacity">
                                  No actions available
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                /* ═══ MEMBERS TABLE ═══ */
                <div className="border border-border rounded-xs overflow-hidden">
                  {membersLoading ? (
                    <div className="p-8 space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-[var(--table-header-bg)]/75 backdrop-blur-sm">
                        <TableRow className="border-b border-border">
                          <TableHead className="w-10 px-4 py-3">
                            <Checkbox className="data-[state=checked]:bg-[var(--color-hs-blue)]" />
                          </TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Name</TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Email</TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Role</TableHead>
                          <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">Status</TableHead>
                          <TableHead className="w-6 px-4 py-3"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                              No users match your search.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMembers.map(mem => {
                            const name = mem.name || 'Unknown'
                            const email = mem.email || ''
                            return (
                              <TableRow key={mem.id} className="border-b border-border last:border-b-0 hover:bg-[var(--color-hs-light-bg)] group">
                                <TableCell className="px-4 py-3">
                                  <Checkbox className="data-[state=checked]:bg-[var(--color-hs-blue)]" />
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full ${AVATAR_BG} flex items-center justify-center text-[var(--color-hs-card-bg)] text-[11px] font-bold flex-none`}>
                                      {getInitials(name)}
                                    </div>
                                    <span className="text-[13px] font-bold text-[var(--color-hs-blue)]">{name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-[13px] text-foreground">{email}</TableCell>
                                <TableCell className="px-4 py-3">
                                  <span className={`text-[13px] font-bold ${mem.role_name === 'Workspace Owner' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {displayRole(mem.role_name)}
                                  </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  {mem.is_active ? (
                                    <span className="inline-flex items-center gap-1 text-[12px] text-status-success">
                                      <Check className="h-3 w-3" />
                                      Active
                                    </span>
                                  ) : (
                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-transparent text-[11px] font-semibold">
                                      Deactivated
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                                          {name}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                                          Set role
                                        </DropdownMenuLabel>
                                        {roles.map(role => (
                                          <DropdownMenuItem
                                            key={role.id}
                                            disabled={role.name === mem.role_name}
                                            onClick={() => handleUpdateRole(mem.id, role.name)}
                                          >
                                            <span className="flex items-center justify-between w-full">
                                              {displayRole(role.name)}
                                              {role.name === mem.role_name && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
                                            </span>
                                          </DropdownMenuItem>
                                        ))}
                                        {mem.is_active ? (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-destructive focus:text-destructive"
                                              onClick={() => handleDeactivateMember(mem.id)}
                                            >
                                              Deactivate user
                                            </DropdownMenuItem>
                                          </>
                                        ) : (
                                          <>
                                            <DropdownMenuItem onClick={() => handleActivateMember(mem.id)}>
                                              Activate user
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-destructive focus:text-destructive"
                                              onClick={() => handleRemoveMember(mem.id)}
                                            >
                                              Remove from workspace
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
           TEAMS TAB
           ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="teams" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-muted-foreground">
              Organize users into teams for easier management and reporting.
            </p>
            <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold gap-2">
                   Create team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle className="text-[18px] font-bold text-foreground">Create team</DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground">
                    Create a new team to group users by department or function.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-foreground">Team name</Label>
                    <Input
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="Team name"
                      className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-foreground">Description</Label>
                    <Input
                      value={teamDesc}
                      onChange={e => setTeamDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateTeamOpen(false)} className="border-border">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={isCreatingTeam || !teamName.trim()}
                    className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold"
                  >
                    {isCreatingTeam ? 'Creating...' : 'Create team'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {teamsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-background border border-border rounded-lg p-12 text-center">
              <Users className="h-10 w-10 text-[var(--color-hs-border)] mx-auto mb-3" />
              <p className="text-[15px] font-bold text-foreground">No teams yet</p>
              <p className="text-[13px] text-muted-foreground mt-1">
                No teams yet. Create your first team.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map(t => (
                <div key={t.id} className="bg-background border border-border rounded-xs p-4 flex items-center justify-between hover:bg-[var(--color-hs-light-bg)] group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-[14px] font-bold text-foreground">{t.name}</p>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[11px] font-medium">
                        {t.member_count ?? 0} member{(t.member_count ?? 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {t.description && <p className="text-[12px] text-muted-foreground mt-0.5">{t.description}</p>}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-[var(--color-hs-blue)] font-bold px-2"
                      onClick={() => openEditTeam(t)}
                    >
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openEditTeam(t)}>
                          Edit team
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openManageMembers(t)}>
                          Manage members
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteTeam(t.id, t.name)}
                        >
                          Delete team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Team Dialog */}
          <Dialog open={editTeamOpen} onOpenChange={setEditTeamOpen}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-[18px] font-bold text-foreground">Edit team</DialogTitle>
                <DialogDescription className="text-[13px] text-muted-foreground">
                  Update team details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-foreground">Team name</Label>
                  <Input
                    value={editTeamName}
                    onChange={e => setEditTeamName(e.target.value)}
                    placeholder="Team name"
                    className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-foreground">Description</Label>
                  <Input
                    value={editTeamDesc}
                    onChange={e => setEditTeamDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditTeamOpen(false)} className="border-border">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTeam}
                  disabled={isEditingTeam || !editTeamName.trim()}
                  className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold"
                >
                  {isEditingTeam ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Manage Members Dialog */}
          <Dialog open={!!manageMembersTeam} onOpenChange={(open) => { if (!open) setManageMembersTeam(null) }}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-[18px] font-bold text-foreground">Manage members</DialogTitle>
                <DialogDescription className="text-[13px] text-muted-foreground">
                  {manageMembersTeam ? `Add or remove members from "${manageMembersTeam.name}".` : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Select value={addMemberId} onValueChange={setAddMemberId}>
                    <SelectTrigger className="border-border h-10 focus:ring-[var(--color-hs-blue)] flex-1">
                      <SelectValue placeholder="Select a user to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddTeamMember}
                    disabled={isAddingTeamMember || !addMemberId || availableMembers.length === 0}
                    className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold flex-none"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
                {availableMembers.length === 0 && (
                  <p className="text-[12px] text-muted-foreground">
                    All active workspace members are already in this team.
                  </p>
                )}
                <div className="border border-border rounded-xs overflow-hidden">
                  {teamMembersLoading ? (
                    <div className="p-6 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="p-6 text-center">
                      <Users className="h-8 w-8 text-[var(--color-hs-border)] mx-auto mb-2" />
                      <p className="text-[13px] text-muted-foreground">No members in this team yet.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {teamMembers.map(m => (
                        <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full ${AVATAR_BG} flex items-center justify-center text-[var(--color-hs-card-bg)] text-[11px] font-bold flex-none`}>
                              {getInitials(m.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold text-foreground truncate">{m.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{m.email}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveTeamMember(m.id)}
                            title="Remove from team"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
           PERMISSION SETS TAB
           ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="permission-sets">
          <PermissionSetsTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}
