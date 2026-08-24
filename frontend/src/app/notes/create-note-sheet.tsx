"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { notesService } from "@/services/notes"
import { contactsService } from "@/services/contacts"
import { toast } from "sonner"
import { FileText, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface CreateNoteSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateNoteSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateNoteSheetProps) {
  const [content, setContent] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [associatedContact, setAssociatedContact] = React.useState<string | null>(null)
  const [contactSearch, setContactSearch] = React.useState("")
  const [contactResults, setContactResults] = React.useState<any[]>([])
  const { workspaceId, user } = useAuth()

  React.useEffect(() => {
    if (contactSearch.length > 1 && workspaceId) {
      contactsService.getAll({ workspace_id: workspaceId, search: contactSearch })
        .then(({ data }) => setContactResults(data || []))
        .catch(err => console.error("[preview]", err))
    } else {
      setContactResults([])
    }
  }, [contactSearch, workspaceId])

  const handleCreate = async () => {
    if (!content.trim()) return

    setIsSaving(true)
    try {
      const payload: any = {
        content: content.trim(),
      }

      if (associatedContact) {
        payload.notable_type = "contact"
        payload.notable_id = associatedContact
      }

      const { error } = await notesService.create(payload)
      if (error) throw error

      toast.success("Note created")
      setContent("")
      setAssociatedContact(null)
      setContactSearch("")
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create note")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent side="right" className="sm:max-w-lg flex flex-col gap-0">
        <SheetHeader className="shrink-0">
          <SheetTitle>Create new note</SheetTitle>
        </SheetHeader>
      <div className="flex-1 flex flex-col min-h-0 bg-muted/50 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-bold text-foreground">Note Content</span>
            </div>
            <div className="p-4">
              <textarea
                autoFocus
                className="w-full min-h-[200px] text-[14px] text-foreground focus:outline-none resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your note here..."
              />
            </div>
          </div>

          <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <span className="text-[13px] font-bold text-foreground">Associate with contact (optional)</span>
            </div>
            <div className="p-4">
              <div className="relative">
                <Input
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                />
                {contactResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {contactResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setAssociatedContact(c.id)
                          setContactSearch(`${c.first_name} ${c.last_name}`)
                          setContactResults([])
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      >
                        {c.first_name} {c.last_name} — {c.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {associatedContact && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Associated with contact</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAssociatedContact(null)
                      setContactSearch("")
                    }}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[12px] text-muted-foreground italic">
            Note: You can optionally associate this note with a contact. The note will also appear on the contact&apos;s activity feed.
          </p>
        </div>

        <div className="shrink-0 px-6 py-4 bg-background border-t border-border flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-[13px] font-semibold border-border text-foreground hover:bg-muted/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSaving || !content.trim()}
            className="h-9 text-[13px] font-semibold bg-status-danger hover:bg-status-danger/90 text-primary-foreground shadow-sm disabled:opacity-50"
          >
            {isSaving ? "Creating..." : "Create note"}
          </Button>
        </div>
      </div>
      </SheetContent>
    </Sheet>
  )
}
