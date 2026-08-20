"use client"

import { useState, useEffect } from "react"
import {
  Search, X, ChevronsUpDown
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { authService } from "@/services/auth"
import { useAuth } from "@/hooks/use-auth"

type TabType = "active" | "deactivated"

type FilterState = {
  status: string | null
  lastActive: string | null
}

export function ActiveUsersTab() {
  const { workspaceId } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("active")
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<{ id: string; name: string; email: string; initials: string; seat: string; access: string; defaultTeam: string; inviteStatus: string }[]>([])
  const [filters, setFilters] = useState<FilterState>({
    status: null,
    lastActive: null,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const tabs = [
    { id: "active" as TabType, label: "Active Users", count: users.length },
    { id: "deactivated" as TabType, label: "Deactivated Users", count: 0 },
  ]

  useEffect(() => {
    if (!workspaceId) return
    authService.listProfiles(workspaceId).then(({ data }) => {
      if (data) {
        setUsers(data.map(p => ({
          id: p.id,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Unknown",
          email: p.email || "",
          initials: `${(p.first_name || "")[0] || ""}${(p.last_name || "")[0] || ""}`.toUpperCase() || "?",
          seat: "Core",
          access: p.role === "owner" || p.role === "admin" ? "Super Admin" : p.role === "viewer" ? "Viewer" : "Member",
          defaultTeam: "--",
          inviteStatus: "Accepted",
        })))
      }
    }).catch(() => {})
  }, [workspaceId])

  const clearFilters = () => setFilters({ status: null, lastActive: null })

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex items-center border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs">{tab.count}</span>
            {activeTab === tab.id && (
              <X className="inline-block ml-1 h-3 w-3" />
            )}
          </button>
        ))}
      </div>

      {/* Filters and Actions Row */}
      <div className="flex items-center justify-between py-3 border-b">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.status && (
            <div className="flex items-center gap-1 h-7 px-2 border rounded-md bg-muted text-xs font-medium">
              Status (1)
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, status: null }))}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                Last Active <ChevronsUpDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, lastActive: "today" }))}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, lastActive: "week" }))}>
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, lastActive: "month" }))}>
                This Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      </div>

      {/* Search and Action Buttons */}
      <div className="flex items-center justify-between py-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email address"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th scope="col" className="w-10 px-4 py-3">
                <Checkbox
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onCheckedChange={checked => {
                    setSelectedIds(checked ? new Set(filtered.map(u => u.id)) : new Set())
                  }}
                />
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  NAME <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                EMAIL
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                SEAT
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                ACCESS
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                DEFAULT TEAM (FORMERLY MAIN TEAM)
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                INVITE
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(user => (
              <tr
                key={user.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors",
                  selectedIds.has(user.id) && "bg-primary/5 dark:bg-primary/10"
                )}
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedIds.has(user.id)}
                    onCheckedChange={() => toggleSelect(user.id)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                      {user.initials}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {user.email}
                </td>
                <td className="px-4 py-4">
                  {user.seat}
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium">{user.access}</span>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {user.defaultTeam}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-success flex-shrink-0" />
                    <span className="text-status-success">{user.inviteStatus}</span>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
