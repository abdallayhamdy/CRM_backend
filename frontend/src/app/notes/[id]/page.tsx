"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronDown, Pencil, Trash2, User, Link2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notesService } from "@/services/notes"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { format } from "date-fns"
import type { Note } from "@/lib/types/crm"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { DeleteConfirmDialog } from "@/components/crm/detail/DeleteConfirmDialog"

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string
  const { workspaceId } = useAuth()
  const { canEditNote, canDeleteNote } = usePermissions()

  const [note, setNote] = React.useState<Note | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [content, setContent] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (!noteId) return
    notesService.getById(noteId).then(({ data, error }) => {
      if (error || !data) {
        toast.error("Failed to load note")
        router.push("/notes")
        return
      }
      setNote(data as Note)
      setContent(data.content || "")
      setLoading(false)
    })
  }, [noteId, router])

  const handleUpdate = async () => {
    if (!note) return
    setIsSaving(true)
    try {
      const { error } = await notesService.update(note.id, { content })
      if (error) throw error
      setNote(prev => prev ? { ...prev, content } as Note : null)
      toast.success("Note updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update note")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!note) return
    try {
      const { error } = await notesService.delete(note.id)
      if (error) throw error
      toast.success("Note deleted")
      router.push("/notes")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note")
    }
  }

  if (loading) {
    return (
      <CrmDetailLayout backLine="Notes" backHref="/notes">
        <CrmDetailLeftPanel><div /></CrmDetailLeftPanel>
        <CrmDetailCenterPanel><div /></CrmDetailCenterPanel>
        <CrmDetailRightPanel><div /></CrmDetailRightPanel>
      </CrmDetailLayout>
    )
  }

  if (!note) return null

  const author = note.author
  const hasAssociation = note.contact_id || note.company_id || note.deal_id || note.ticket_id

  return (
    <CrmDetailLayout backLine="Notes" backHref="/notes">
      <CrmDetailLeftPanel>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Note</span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {canDeleteNote && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[13px] gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>

          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[16px] text-foreground">About this note</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Author</label>
                <div className="text-[14px] text-foreground">
                  {author ? `${author.first_name} ${author.last_name || ""}`.trim() : "System"}
                </div>
              </div>
              <div className="group relative">
                <label className="text-[13px] text-muted-foreground block mb-1">Created</label>
                <div className="text-[14px] text-foreground">
                  {note.created_at ? format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a") : "--"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CrmDetailLeftPanel>

      <CrmDetailCenterPanel>
        <div className="p-5">
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-foreground">Content</h3>
              {canEditNote && (
                <button
                  onClick={handleUpdate}
                  disabled={isSaving || !content.trim() || content === (note.content || "")}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-[color:var(--color-slate-50)] text-muted-foreground disabled:opacity-50"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-4">
              <textarea
                className="w-full min-h-[300px] text-[14px] text-foreground focus:outline-none resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your note..."
                readOnly={!canEditNote}
              />
            </div>
          </div>
        </div>
      </CrmDetailCenterPanel>

      <CrmDetailRightPanel>
        <div className="p-5">
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-[16px] text-foreground">Linked Records</h3>
            </div>
            <div className="p-4 space-y-3">
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
              {note.ticket_id && (
                <a href={`/tickets/${note.ticket_id}`} className="flex items-center gap-2 text-[14px] text-foreground hover:underline">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Ticket</span>
                </a>
              )}
              {!hasAssociation && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  <span className="text-sm">No linked records</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CrmDetailRightPanel>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="note"
        entityDisplayName={note.content?.slice(0, 50) || "Note"}
        onConfirm={handleDelete}
      />
    </CrmDetailLayout>
  )
}
