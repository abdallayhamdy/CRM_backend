"use client"

import * as React from "react"
import Link from "next/link"
import { X, UserPlus, Contact, GitBranch, Upload, Circle, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { laravelApi } from "@/lib/laravel-api"

const steps = [
  {
    id: "invite",
    label: "Invite your first team member",
    icon: <UserPlus className="h-4 w-4" />,
    href: "/settings/users-teams",
  },
  {
    id: "contact",
    label: "Add your first contact",
    icon: <Contact className="h-4 w-4" />,
    href: "/contacts",
  },
  {
    id: "deal",
    label: "Create a deal pipeline",
    icon: <GitBranch className="h-4 w-4" />,
    href: "/deals",
  },
  {
    id: "import",
    label: "Import your data",
    icon: <Upload className="h-4 w-4" />,
    href: "/settings/backup-restore",
  },
]

export function OnboardingChecklist() {
  const { workspaceId } = useAuth()
  const [dismissed, setDismissed] = React.useState(true)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!workspaceId) return

    const dismissKey = `onboarding_dismissed_${workspaceId}`
    if (localStorage.getItem(dismissKey) === "true") {
      setDismissed(true)
      setLoading(false)
      return
    }

    async function checkWorkspaceEmpty() {
      try {
        const [contactsResult, dealsResult] = await Promise.all([
          laravelApi.get<{ count: number }>('/contacts', { count_only: '1' }),
          laravelApi.get<{ count: number }>('/deals', { count_only: '1' }),
        ])

        const totalContacts = contactsResult.data?.count ?? 0
        const totalDeals = dealsResult.data?.count ?? 0

        setDismissed(totalContacts + totalDeals > 0)
      } catch {
        setDismissed(true)
      } finally {
        setLoading(false)
      }
    }

    checkWorkspaceEmpty()
  }, [workspaceId])

  const handleDismiss = () => {
    if (workspaceId) {
      localStorage.setItem(`onboarding_dismissed_${workspaceId}`, "true")
    }
    setDismissed(true)
  }

  if (loading || dismissed) return null

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-foreground">Get started with Rootline CRM</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Complete these steps to set up your workspace ({0}/{steps.length})
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDismiss}
            className="text-muted-foreground/70 hover:text-foreground -mt-1 -mr-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm transition-all duration-150 text-left"
            >
              <div className="shrink-0">
                <Circle className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground/70 group-hover:text-primary transition-colors">
                  {step.icon}
                </span>
                <span className="text-[13px] font-medium text-foreground truncate">
                  {step.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
