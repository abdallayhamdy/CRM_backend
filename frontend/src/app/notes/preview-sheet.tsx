"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { notesService } from "@/services/notes"
import { Note } from "@/lib/types/crm"
import { toast } from "sonner"
import { Trash2, User, Calendar, Link2, FileText } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"

interface NotePreviewSheetProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NotePreviewSheet({
  note,
  open,
  onOpenChange,
  onSuccess,
}: NotePreviewSheetProps) {
  const [content, setContent] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const { workspaceId } = useAuth()
  const { canEditNote, canDeleteNote } = usePermissions()

  React.useEffect(() => {
    if (note) {
      setContent(note.content || "")
    }
  }, [note])

  const handleUpdate = async () => {
    if (!note) return
    setIsSaving(true)
    try {
      const { error } = await notesService.update(note.id, { content })
      if (error) throw error
      toast.success("Note updated")
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update note")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!note) return
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      const { error } = await notesService.delete(note.id)
      if (error) throw error
      toast.success("Note deleted")
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note")
    }
  }

  if (!note) return null

  const author = note.author
  const hasAssociation = note.contact_id || note.company_id || note.deal_id

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Note Details</SheetTitle>
        </SheetHeader>
      <div className="flex flex-col h-full bg-muted/50">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] font-bold text-foreground">Content</span>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  className="w-full min-h-[200px] text-[14px] text-foreground focus:outline-none resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start typing your note..."
                  readOnly={!canEditNote}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-border flex items-center justify-center text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[12px] text-muted-foreground uppercase font-bold tracking-wider">Created By</div>
                    <div className="text-[14px] font-bold text-foreground">
                      {author ? `${author.first_name} ${author.last_name || ""}` : "System"}
                    </div>
                  </div>
                </div>
              </div>

              {hasAssociation ? (
                <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                  <div className="text-[12px] text-muted-foreground uppercase font-bold tracking-wider mb-3">Associated Record</div>
                  <div className="space-y-2">
                    {note.contact_id && (
                      <a href={`/contacts/${note.contact_id}`} className="flex items-center gap-2 text-[14px] text-foreground hover:underline">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Contact</span>
                      </a>
                    )}
                    {note.company_id && (
                      <a href={`/companies/${note.company_id}`} className="flex items-center gap-2 text-[14px] text-foreground hover:underline">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Company</span>
                      </a>
                    )}
                    {note.deal_id && (
                      <a href={`/deals/${note.deal_id}`} className="flex items-center gap-2 text-[14px] text-foreground hover:underline">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Deal</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    <span className="text-sm">No associated record</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-background border-t border-border flex items-center justify-between gap-3">
          {canDeleteNote && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 font-bold"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-foreground font-bold"
            >
              Cancel
            </Button>
            {canEditNote && (
              <Button
                onClick={handleUpdate}
                disabled={isSaving || !content.trim() || content === (note.content || "")}
                className="bg-status-danger hover:bg-status-danger/90 text-primary-foreground font-bold"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            )}
          </div>
        </div>
      </div>
      </SheetContent>
    </Sheet>
  )
}
