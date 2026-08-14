"use client"

import * as React from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { tasksService } from "@/services/tasks"
import { contactsService } from "@/services/contacts"
import { companiesService } from "@/services/companies"
import { dealsService } from "@/services/deals"
import { toast } from "sonner"
import { CheckSquare, X, User, Building2, DollarSign, ExternalLink } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface CreateTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type AssociationType = "contact" | "company" | "deal"

export function CreateTaskSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateTaskSheetProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [assignedTo, setAssignedTo] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [associationType, setAssociationType] = React.useState<AssociationType | null>(null)
  const [associatedId, setAssociatedId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const { workspaceId } = useAuth()

  React.useEffect(() => {
    let cancelled = false

    async function runSearch() {
      if (searchQuery.length > 1 && workspaceId && associationType) {
        const service = associationType === "contact" ? contactsService
          : associationType === "company" ? companiesService
          : dealsService
        try {
          const { data }: any = await service.getAll({ workspace_id: workspaceId, search: searchQuery } as any)
          if (!cancelled) setSearchResults(data || [])
        } catch (err: any) {
          console.error("[search]", err)
        }
      } else if (!cancelled) {
        setSearchResults([])
      }
    }

    runSearch()
    return () => { cancelled = true }
  }, [searchQuery, workspaceId, associationType])

  const handleCreate = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        assigned_to: assignedTo || undefined,
        status: "pending",
      }

      if (associationType && associatedId) {
        payload.taskable_type = associationType
        payload.taskable_id = associatedId
      }

      const { error } = await tasksService.create(payload)
      if (error) throw error

      toast.success("Task created")
      setTitle("")
      setDescription("")
      setDueDate("")
      setAssignedTo("")
      setAssociationType(null)
      setAssociatedId(null)
      setSearchQuery("")
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedLabel = React.useMemo(() => {
    if (!associationType || !associatedId) return null
    const found = searchResults.find((r: any) => r.id === associatedId)
    if (found) {
      if (associationType === "contact") return `${found.first_name} ${found.last_name || ""}`
      if (associationType === "company") return found.name
      if (associationType === "deal") return found.title || found.name
    }
    return "Selected"
  }, [associationType, associatedId, searchResults])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create new task</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full bg-muted/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-[13px] font-bold text-foreground">Task details</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dueDate">Due date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assignedTo">Assigned to (user ID)</Label>
                    <Input
                      id="assignedTo"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      placeholder="User UUID"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <span className="text-[13px] font-bold text-foreground">Association (optional)</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  {(["contact", "company", "deal"] as AssociationType[]).map((type) => (
                    <Button
                      key={type}
                      variant={associationType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setAssociationType(type === associationType ? null : type)
                        setAssociatedId(null)
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                      className="text-xs"
                    >
                      {type === "contact" ? <User className="h-3 w-3 mr-1" /> : type === "company" ? <Building2 className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
                {associationType && (
                  <div className="relative">
                    <Input
                      placeholder={`Search ${associationType}s...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((r: any) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setAssociatedId(r.id)
                              const label = associationType === "contact"
                                ? `${r.first_name} ${r.last_name || ""}`
                                : associationType === "company" ? r.name : r.title || r.name
                              setSearchQuery(label)
                              setSearchResults([])
                            }}
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          >
                            {associationType === "contact" ? `${r.first_name} ${r.last_name || ""} — ${r.email || ""}`
                              : associationType === "company" ? r.name
                              : r.title || r.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {associatedId && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Associated: {selectedLabel}</span>
                        <button
                          type="button"
                          onClick={() => { setAssociatedId(null); setSearchQuery("") }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground italic">
              Optionally associate this task with a contact, company, or deal.
            </p>
          </div>

          <div className="p-4 bg-background border-t border-border flex items-center justify-end gap-3">
            <Link
              href="/tasks/settings/form"
              className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1 mr-auto"
            >
              Edit form <ExternalLink className="h-3 w-3" />
            </Link>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-foreground font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving || !title.trim()}
              className="bg-status-danger hover:bg-status-danger/90 text-primary-foreground font-bold"
            >
              {isSaving ? "Creating..." : "Create task"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
