"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Ticket,
  MessageSquare,
  Trash2,
  Pencil
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ticketsService } from "@/services/tickets"
import { activityCommentsService } from "@/services/activity-comments"
import { authService } from "@/services/auth"
import { ActivityComment, Profile } from "@/lib/types/crm"
import Image from "next/image"
import { toast } from "sonner"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuth } from "@/hooks/use-auth"
import { sanitizeRichText } from "@/components/ui/tiptap-editor"
import dynamic from "next/dynamic"
import { TiptapEditorSkeleton } from "@/components/ui/TiptapEditorSkeleton"

const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <TiptapEditorSkeleton /> }
)
import DOMPurify from "dompurify"
import { AssociationBadge } from "./AssociationBadge"

interface ActivityTicketCardProps {
  id?: string
  subject: string
  description?: string
  assignedTo?: string
  status?: string
  priority?: string
  category?: string
  createdAt?: string
  isExpanded?: boolean
  associations?: { name: string; type: string }[]
  onSuccess?: () => void
  compact?: boolean
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
  None: "bg-gray-100 text-gray-700 border-gray-200",
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  pending: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  scheduled: "bg-cyan-100 text-cyan-700",
}

export function ActivityTicketCard({
  id = "",
  subject: initialSubject,
  description = "",
  assignedTo = "Unassigned",
  status: initialStatus = "open",
  priority: initialPriority = "None",
  category: initialCategory = "general",
  createdAt,
  isExpanded: initialExpanded = true,
  associations = [],
  onSuccess,
  compact = false,
}: ActivityTicketCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded)
  const [editedSubject, setEditedSubject] = React.useState(initialSubject || "")
  const [editedDescription, setEditedDescription] = React.useState(description || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [priority, setPriority] = React.useState(initialPriority)
  const [status, setStatus] = React.useState(initialStatus)
  const [category, setCategory] = React.useState(initialCategory)
  const [editedAssignedTo, setEditedAssignedTo] = React.useState(assignedTo)
  const [isEditing, setIsEditing] = React.useState(false)

  const [showComments, setShowComments] = React.useState(false)
  const [comments, setComments] = React.useState<ActivityComment[]>([])
  const [newComment, setNewComment] = React.useState("")
  const [isSavingComment, setIsSavingComment] = React.useState(false)
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const { workspaceId } = useAuth()

  React.useEffect(() => {
    const loadUser = async () => {
      const { data } = await authService.getCurrentUser()
      if (data) setCurrentUser(data)
    }
    loadUser()
  }, [])

  const fetchComments = React.useCallback(async () => {
    if (!id) return
    setIsLoadingComments(true)
    const { data, error } = await activityCommentsService.getByTarget(id, "activity", workspaceId!)
    if (!error && data) setComments(data)
    setIsLoadingComments(false)
  }, [id, workspaceId])

  useRealtime(
    React.useCallback((payload: any) => {
      if (payload.type === "comment" && payload.new && payload.new.target_id === id) {
        fetchComments()
      }
    }, [id, fetchComments]),
    ["activity_comments"],
    workspaceId
  )

  React.useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || isSavingComment || !id || !currentUser?.id) return
    const sanitizedContent = sanitizeRichText(newComment)
    const payload = {
      content: sanitizedContent,
      target_id: id,
      target_type: "activity" as const,
      author_id: currentUser.id,
    }
    setIsSavingComment(true)
    try {
      const { data, error } = await activityCommentsService.create(payload, workspaceId!)
      if (error) throw error
      if (data) {
        setComments([...comments, { ...data, author: currentUser } as ActivityComment])
        setNewComment("")
        toast.success("Comment added")
      }
    } catch (err: unknown) {
      toast.error(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsSavingComment(false)
    }
  }

  React.useEffect(() => {
    setEditedSubject(initialSubject || "")
    setEditedDescription(description || "")
    setPriority(initialPriority)
    setStatus(initialStatus)
    setCategory(initialCategory)
    setEditedAssignedTo(assignedTo)
  }, [id, initialSubject, description, initialPriority, initialStatus, initialCategory, assignedTo])

  const hasChanges =
    editedSubject !== (initialSubject || "") ||
    editedDescription !== (description || "") ||
    priority !== initialPriority ||
    status !== initialStatus ||
    category !== initialCategory ||
    editedAssignedTo !== assignedTo

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!id) {
      toast.error("Cannot save: Ticket ID is missing")
      return
    }
    if (!(editedSubject || "").trim()) {
      toast.error("Ticket subject cannot be empty")
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await ticketsService.update(id, {
        subject: (editedSubject || "").trim(),
        description: (editedDescription || "").trim() || undefined,
        priority,
        status,
      }, workspaceId!)
      if (error) throw error
      toast.success("Ticket updated")
      setIsEditing(false)
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id || isDeleting) return
    if (!confirm("Are you sure you want to delete this ticket?")) return
    setIsDeleting(true)
    try {
      const { error } = await ticketsService.delete(id, workspaceId!)
      if (error) throw error
      toast.success("Ticket deleted")
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete ticket")
    } finally {
      setIsDeleting(false)
    }
  }

  if (compact) {
    return (
      <div className="bg-background border border-border rounded-md overflow-hidden shadow-sm">
        <div className="px-3 py-2 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-status-warning shrink-0" />
          <span className="text-[12px] font-bold text-foreground truncate">{initialSubject}</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", statusColors[status] || statusColors.open)}>
            {status.replace("_", " ")}
          </span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", priorityColors[priority] || priorityColors.None)}>
            {priority}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border border-border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-foreground shrink-0" />
          )}
          <Ticket className="w-4 h-4 text-status-warning shrink-0" />
          <span className="text-[13px] font-bold text-foreground truncate">{editedSubject}</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0", statusColors[status] || statusColors.open)}>
            {status.replace("_", " ")}
          </span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border shrink-0", priorityColors[priority] || priorityColors.None)}>
            {priority}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Edit ticket"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={isDeleting}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
            title="Delete ticket"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {createdAt && (
            <span className="text-[12px] text-muted-foreground truncate ml-1">
              {new Date(createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true
              }) + " GMT+2"}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Normal Mode - Read Only */}
            {!isEditing && (
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-[12px] px-2 py-0.5 rounded-full font-medium", statusColors[status] || statusColors.open)}>
                    {status.replace("_", " ")}
                  </span>
                  <span className={cn("text-[12px] px-2 py-0.5 rounded-full font-medium border", priorityColors[priority] || priorityColors.None)}>
                    {priority}
                  </span>
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {category.replace("_", " ")}
                  </span>
                  <span className="text-[12px] text-muted-foreground">•</span>
                  <span className="text-[12px] text-muted-foreground">{editedAssignedTo}</span>
                </div>
                {description && (
                  <div className="text-[13px] text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
                )}
              </div>
            )}

            {/* Edit Mode - Full Form */}
            {isEditing && (
              <div className="px-3 pb-3 space-y-3">
                {/* Subject - editable */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-2 py-1.5 text-[13px] border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </div>

                {/* Status & Priority & Category row */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">Status</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn("w-full px-2 py-1.5 text-[12px] font-medium rounded-md border text-left transition-colors", statusColors[status] || statusColors.open)}>
                          {status.replace("_", " ")}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {["open", "in_progress", "pending", "resolved", "closed"].map((s) => (
                          <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                            {s.replace("_", " ")}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">Priority</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn("w-full px-2 py-1.5 text-[12px] font-medium rounded-md border text-left transition-colors", priorityColors[priority] || priorityColors.None)}>
                          {priority}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {["urgent", "high", "medium", "low", "None"].map((p) => (
                          <DropdownMenuItem key={p} onClick={() => setPriority(p)}>
                            {p}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">Category</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full px-2 py-1.5 text-[12px] font-medium rounded-md border border-border bg-background text-foreground text-left">
                          {category.replace("_", " ")}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {["general", "technical", "feature_request", "training", "billing"].map((c) => (
                          <DropdownMenuItem key={c} onClick={() => setCategory(c)}>
                            {c.replace("_", " ")}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Assigned to */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Assigned to</label>
                  <span className="text-[13px] text-foreground">{editedAssignedTo}</span>
                </div>

                {/* Description - editable */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Description</label>
                  <div className="border border-border rounded-md overflow-hidden">
                    <TiptapEditor
                      content={editedDescription}
                      onChange={(html) => setEditedDescription(html)}
                      placeholder="Add description..."
                      toolbarVariant="note"
                      minHeight="80px"
                    />
                  </div>
                </div>

                {/* Save/Cancel buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="h-7 text-[12px]"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <button
                    onClick={() => {
                      setEditedSubject(initialSubject || "")
                      setEditedDescription(description || "")
                      setPriority(initialPriority)
                      setStatus(initialStatus)
                      setCategory(initialCategory)
                      setEditedAssignedTo(assignedTo)
                      setIsEditing(false)
                    }}
                    className="text-[12px] font-bold text-primary hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Comments section */}
            <div className="px-3 pb-3 border-t border-border pt-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowComments(!showComments)
                    }}
                    className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <MessageSquare className="w-3 h-3" />
                    {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}` : "Add comment"}
                  </button>
                  <AssociationBadge associations={associations} />
                </div>

                <AnimatePresence>
                  {showComments && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 space-y-3 overflow-hidden"
                    >
                      {comments.length > 0 && (
                        <div className="space-y-2">
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 overflow-hidden">
                                {comment.author?.avatar_url ? (
                                  <Image src={comment.author.avatar_url} alt="" width={24} height={24} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  `${comment.author?.first_name?.[0] || 'U'}${comment.author?.last_name?.[0] || ''}`
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[11px] font-bold text-foreground">
                                    {comment.author?.first_name} {comment.author?.last_name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <div
                                  className="text-[12px] text-foreground bg-background p-2 rounded-md border border-border shadow-xs rich-text-content"
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New Comment */}
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                          {currentUser?.avatar_url ? (
                            <Image src={currentUser.avatar_url} alt="" width={24} height={24} className="w-full h-full rounded-full" />
                          ) : (
                            `${currentUser?.first_name?.[0] || 'V'}${currentUser?.last_name?.[0] || 'R'}`
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-background border border-border rounded-md shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                            <TiptapEditor
                              content={newComment}
                              onChange={setNewComment}
                              placeholder="Leave a comment and mention a teammate using @"
                              className="w-full text-[13px] min-h-[80px]"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCommentSubmit(); }}
                              disabled={!newComment.trim() || isSavingComment}
                              className={cn(
                                "px-3 py-1 text-[12px] font-bold rounded transition-colors",
                                newComment.trim() && !isSavingComment
                                  ? "bg-primary text-primary-foreground hover:bg-primary/10"
                                  : "bg-border/40 text-muted-foreground cursor-not-allowed"
                              )}
                            >
                              {isSavingComment ? "Saving..." : "Comment"}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowComments(false); setNewComment(""); }}
                              className="text-[12px] font-bold text-primary hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
