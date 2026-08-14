"use client"

import { useState } from "react"
import { 
  Search, X, ChevronsUpDown, Plus, Settings2, 
  SlidersHorizontal, MoreHorizontal, ArrowUpDown 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type TabType = "active" | "deactivated"

const TABS: { id: TabType; label: string; count: number }[] = [
  { id: "active", label: "Active Users", count: 2 },
  { id: "deactivated", label: "Deactivated Users", count: 0 },
]

const MOCK_USERS = [
  {
    id: "1",
    name: "Ahmed Mohamed",
    email: "admin@leadswift.com",
    initials: "AM",
    seat: "Core",
    access: "Super Admin",
    defaultTeam: "--",
    inviteStatus: "Accepted",
  },
  {
    id: "2",
    name: "Sara Ali",
    email: "sara@leadswift.com",
    initials: "SA",
    seat: "Core",
    access: "Member",
    defaultTeam: "--",
    inviteStatus: "Accepted",
  },
]

type FilterState = {
  status: string | null
  lastActive: string | null
}

export function ActiveUsersTab() {
  const [activeTab, setActiveTab] = useState<TabType>("active")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    status: null,
    lastActive: null,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const clearFilters = () => setFilters({ status: null, lastActive: null })

  const filtered = MOCK_USERS.filter(u =>
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
        {TABS.map(tab => (
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
        <div className="ml-auto flex items-center gap-2 pr-4">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add view (4/5)
          </Button>
          <span className="text-muted-foreground">|</span>
          <Button variant="ghost" size="sm" className="text-xs">
            All views
          </Button>
        </div>
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

          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
            <Plus className="h-3 w-3" />
            Add quick filter
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advanced filters
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

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8">
            Edit columns
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8">
            Export view
          </Button>
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
