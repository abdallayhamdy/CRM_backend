"use client"

import { useState, useEffect } from "react"
import { Info, X, ChevronsUpDown } from "lucide-react"
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

const SEAT_TYPES = [
  { id: "view_only", label: "VIEW-ONLY", count: 0, total: "Unlimited seats", hasInfo: true, badge: null },
  { id: "core", label: "CORE SEATS", count: 1, total: "Unlimited seats", hasInfo: true, badge: "Trial" },
  { id: "developer", label: "DEVELOPER", count: 0, total: "Unlimited seats", hasInfo: true, badge: null },
  { id: "sales_professional", label: "SALES PROFESSIONAL SEATS", count: 1, total: "Unlimited seats", hasInfo: true, badge: "Trial" },
  { id: "service_professional", label: "SERVICE PROFESSIONAL SEATS", count: 1, total: "Unlimited seats", hasInfo: true, badge: "Trial" },
]

type FilterState = {
  seat: string | null
  permissionSet: string | null
  inviteStatus: string[] | null
}

export function SeatsTab() {
  const { workspaceId } = useAuth()
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<{ id: string; name: string; email: string; initials: string; seat: string; permissionSet: string; inviteStatus: string }[]>([])
  const [filters, setFilters] = useState<FilterState>({
    seat: null,
    permissionSet: null,
    inviteStatus: ["Invite accepted", "Pending invite", "Invite bounced"],
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
          permissionSet: p.role === "owner" || p.role === "admin" ? "Super Admin" : "Standard user",
          inviteStatus: "Accepted",
        })))
      }
    }).catch(() => {})
  }, [workspaceId])

  const clearInviteFilter = () =>
    setFilters(prev => ({ ...prev, inviteStatus: null }))

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This is where you can manage the seats in your account.
      </p>

      {/* Seat summary cards */}
      <div className="border rounded-lg p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 sm:divide-x">
          {SEAT_TYPES.map(seat => (
            <div key={seat.id} className="px-6 first:pl-0 last:pr-0 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {seat.label}
                </span>
                {seat.hasInfo && (
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                {seat.badge && (
                  <span className="text-xs bg-status-success text-white px-1.5 py-0.5 rounded-full font-medium">
                    {seat.badge}
                  </span>
                )}
              </div>
              <p className="text-3xl font-semibold text-foreground">{seat.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{seat.total}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              Seat <ChevronsUpDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {SEAT_TYPES.map(s => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => setFilters(prev => ({ ...prev, seat: s.id }))}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              Permission set <ChevronsUpDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem>Super Admin</DropdownMenuItem>
            <DropdownMenuItem>Standard user</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {filters.inviteStatus && (
          <div className="flex items-center gap-1 h-8 px-3 border rounded-md bg-muted text-xs font-medium">
            Invite Status ({filters.inviteStatus.length})
            <button
              type="button"
              onClick={clearInviteFilter}
              className="ml-1 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Input
          placeholder="Search name or email address"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-8 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
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
                  Name <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  Seat <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  Permission Set <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  Invite Status <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  Last Active <ChevronsUpDown className="h-3 w-3" />
                </div>
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
                    <div>
                      <p className="font-medium text-primary dark:text-primary">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm">{user.seat}</span>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {user.permissionSet}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-success flex-shrink-0" />
                    <span className="text-sm">{user.inviteStatus}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  --
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
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
