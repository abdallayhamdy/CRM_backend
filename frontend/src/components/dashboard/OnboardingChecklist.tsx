"use client"

import * as React from "react"
import Link from "next/link"
import { X, UserPlus, Contact, GitBranch, Upload, CheckCircle2, Circle, Sparkles } from "lucide-react"
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
  const [completedSteps, setCompletedSteps] = React.useState<string[]>([])

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
        const [contactsResponse, dealsResponse] = await Promise.all([
          laravelApi.get<any>('/contacts?limit=1'),
          laravelApi.get<any>('/deals?limit=1'),
        ])

        const hasContacts = contactsResponse.data?.data?.length > 0
        const hasDeals = dealsResponse.data?.data?.length > 0
        const done: string[] = []
        if (hasContacts) done.push('contact')
        if (hasDeals) done.push('deal')
        setCompletedSteps(done)

        setDismissed(hasContacts && hasDeals)
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
    <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-foreground">Get started with SalesHub</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Complete these steps to set up your workspace ({completedSteps.length}/{steps.length})
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
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id)
            return (
              <Link
                key={step.id}
                href={step.href}
                className={`group flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 text-left ${
                  isCompleted
                    ? 'border-status-success/30 bg-status-success/5 cursor-default'
                    : 'border-border bg-card hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm'
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-status-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                  )}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`transition-colors ${isCompleted ? 'text-status-success' : 'text-muted-foreground/70 group-hover:text-primary'}`}>
                    {step.icon}
                  </span>
                  <span className={`text-[13px] font-medium truncate ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
