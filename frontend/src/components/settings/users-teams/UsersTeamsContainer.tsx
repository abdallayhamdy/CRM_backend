"use client"

import { useState } from "react"
import { ExternalLink, ChevronDown, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ActiveUsersTab } from "./ActiveUsersTab"

import { PermissionSetsTab } from "./PermissionSetsTab"

type MainTab = "users" | "teams" | "permissions"

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "users", label: "Users" },
  { id: "teams", label: "Teams" },
  { id: "permissions", label: "Permission sets" },
]

export function UsersTeamsContainer() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("users")

  const renderContent = () => {
    switch (activeMainTab) {
      case "users":
        return <ActiveUsersTab />
      case "permissions":
        return <PermissionSetsTab />
      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            {activeMainTab} content coming soon
          </div>
        )
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Main Tabs */}
      <div className="flex items-center gap-1 border-b px-4">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeMainTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header with description and actions */}
      <div className="flex items-center justify-between py-4 px-4">
        <p className="text-sm text-muted-foreground">
          Create new users, customize user permissions...
          <a href="#" className="inline-flex items-center gap-1 ml-1 text-foreground hover:underline font-medium">
            Learn more about user permissions
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem>Bulk actions</DropdownMenuItem>
              <DropdownMenuItem>Export all users</DropdownMenuItem>
              <DropdownMenuItem>Deactivate selected</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1">
                <UserPlus className="h-4 w-4" />
                Add users
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem>Add single user</DropdownMenuItem>
              <DropdownMenuItem>Import from CSV</DropdownMenuItem>
              <DropdownMenuItem>Invite via email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-4">
        {renderContent()}
      </div>
    </div>
  )
}
