"use client"

import * as React from "react"
import Image from "next/image"
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Bold,
  Italic,
  Underline,
  Type,
  Link2,
  Image as ImageIcon,
  GraduationCap,
  AlignLeft,
  ChevronUp,
  Pencil,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { RichTextEditor } from "@/components/RichTextEditor"
import {
  List,
  Quote,
  Highlighter,
  AlignJustify
} from "lucide-react"
import { activityCommentsService } from "@/services/activity-comments"
import { activitiesService } from "@/services/activities"
import { notesService } from "@/services/notes"
import { authService } from "@/services/auth"
import { ActivityComment, Profile } from "@/lib/types/crm"
import { toast } from "sonner"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuth } from "@/hooks/use-auth"
import DOMPurify from "dompurify"
import { sanitizeRichText } from "@/components/ui/tiptap-editor"
import dynamic from "next/dynamic"
import { TiptapEditorSkeleton } from "@/components/ui/TiptapEditorSkeleton"

const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <TiptapEditorSkeleton /> }
)
import { Button } from "@/components/ui/button"
import { AssociationBadge } from "./AssociationBadge"

interface ActivityLogCardProps {
  id: string
  feedType: 'note' | 'activity'
  type: "Note" | "Email" | "Call" | "Meeting" | "Task" | "Contact Activity" | string
  author?: string
  date: string
  content: string
  icon?: React.ReactNode
  isExpanded?: boolean
  associations?: { name: string; type: string }[]
  compact?: boolean
  onSuccess?: () => void
}

export function ActivityLogCard({
  id,
  feedType,
  type,
  author,
  date,
  content,
  isExpanded: initialExpanded = true,
  associations = [],
  compact = false,
  onSuccess,
}: ActivityLogCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);

  // Sync with parent collapse-all control
  React.useEffect(() => {
    setIsExpanded(initialExpanded);
  }, [initialExpanded]);
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<ActivityComment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null);
  const { workspaceId } = useAuth();

  // Inline edit state for notes
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(content);
  const [isSavingNote, setIsSavingNote] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isNote = type === "Note";
  const isNoteRecord = feedType === "note";
  const hasContentChanged = isNote && isEditing && editedContent !== content;

  // Load current user for attribution
  React.useEffect(() => {
    const loadUser = async () => {
      const { data } = await authService.getCurrentUser();
      if (data) setCurrentUser(data);
    };
    loadUser();
  }, []);

  const fetchComments = React.useCallback(async () => {
    setIsLoadingComments(true);
    const { data, error } = await activityCommentsService.getByTarget(id, feedType, workspaceId!);
    if (!error && data) {
      setComments(data);
    }
    setIsLoadingComments(false);
  }, [id, feedType, workspaceId]);

  // Real-time updates for comments on this specific card
  useRealtime(React.useCallback((payload: any) => {
    if (payload.type === 'comment' && payload.new && payload.new.target_id === id) {
      fetchComments();
    }
  }, [id, fetchComments]), ['activity_comments'], workspaceId);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const commentEditorRef = React.useRef<HTMLDivElement>(null);

  const handleDelete = async () => {
    if (!id || isDeleting) return;
    if (!confirm("Are you sure you want to delete this?")) return;
    setIsDeleting(true);
    try {
      if (isNoteRecord) {
        const { error } = await notesService.delete(id);
        if (error) throw error;
      } else {
        const { error } = await activitiesService.delete(id, workspaceId!);
        if (error) throw error;
      }
      toast.success("Deleted successfully");
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || isSaving || !currentUser?.id) return;

    const payload = {
      content: newComment,
      target_id: id,
      target_type: feedType,
      author_id: currentUser.id
    };

    setIsSaving(true);
    try {
      const result = await activityCommentsService.create(payload, workspaceId!);
      const { data, error } = result;

      if (error) throw error;

      if (data) {
        const enrichedComment = {
          ...data,
          author: currentUser
        };
        setComments([...comments, enrichedComment as ActivityComment]);
        setNewComment("");
        if (commentEditorRef.current) commentEditorRef.current.innerHTML = "";
        toast.success("Comment added");
      }
    } catch (err: unknown) {
      toast.error(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const execFormatting = (command: string, value: string = '') => {
    if (commentEditorRef.current) {
      commentEditorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  const handleSaveNote = async () => {
    if (!id || !hasContentChanged) return;
    setIsSavingNote(true);
    try {
      const html = sanitizeRichText(editedContent);
      const title = html.replace(/<[^>]*>/g, "").trim().substring(0, 50);
      if (isNoteRecord) {
        const { error } = await notesService.update(id, { content: html });
        if (error) throw error;
      } else {
        const { error } = await activitiesService.update(id, {
          description: html,
          title: title + (title.length >= 50 ? "..." : "")
        }, workspaceId!);
        if (error) throw error;
      }
      toast.success("Note updated");
      setIsEditing(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-md shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className={cn("px-4 py-3 flex items-center justify-between border-b border-border group", compact && "!px-3 !py-2")}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className={cn("w-4 h-4 text-foreground", compact && "!w-3.5 !h-3.5")} />
            ) : (
              <ChevronRight className={cn("w-4 h-4 text-foreground", compact && "!w-3.5 !h-3.5")} />
            )}
          </button>
          <div className={cn("flex items-center gap-1.5 text-[14px] min-w-0", compact && "!text-[12px]")}>
            <span className="font-bold text-foreground shrink-0">{type}</span>
            <span className="text-foreground shrink-0">by</span>
            <span className="font-bold text-foreground hover:text-primary cursor-pointer truncate">{author || "System"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          {isNote && (
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                "p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",
                compact && "!p-1"
              )}
              title="Edit note"
            >
              <Pencil className={cn("w-3.5 h-3.5", compact && "!w-3 !h-3")} />
            </button>
          )}
          {type !== "Call" && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                "p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-destructive",
                compact && "!p-1"
              )}
              title="Delete"
            >
              <Trash2 className={cn("w-3.5 h-3.5", compact && "!w-3 !h-3")} />
            </button>
          )}
          <span className={cn("text-[14px] text-foreground opacity-80 truncate text-right", compact && "!text-[11px]")}>
            {date}
          </span>
        </div>
      </div>

      {/* Content — notes always show content; others show only when expanded */}
      {(isExpanded || isNote) && (
        <div className={cn("px-4 md:px-12 py-4", compact && "!px-3 !py-3")}>
          {isNote && isEditing ? (
            <div className="space-y-3">
              <TiptapEditor
                content={editedContent}
                onChange={setEditedContent}
                placeholder="Start typing your note..."
                toolbarVariant="note"
                minHeight="120px"
              />
              {hasContentChanged && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveNote}
                    disabled={isSavingNote || !hasContentChanged}
                    className="h-8 px-4 text-[13px] bg-primary hover:bg-primary text-primary-foreground rounded"
                  >
                    {isSavingNote ? "Saving..." : "Save"}
                  </Button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-[14px] font-bold text-primary hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn("text-[14px] text-foreground leading-relaxed rich-text-content", compact && "!text-[12px]")}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          )}

          <div className={cn("flex items-center justify-between pt-3 border-t border-border", compact && "!pt-2")}>
            <button
              onClick={() => setShowComments(!showComments)}
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
                className={cn("mt-6 space-y-6 overflow-hidden", compact && "!mt-4 !space-y-4")}
              >
                {/* Comments List */}
                {comments.length > 0 && (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 overflow-hidden">
                          {comment.author?.avatar_url ? (
                            <Image src={comment.author.avatar_url} alt={`${comment.author?.first_name || ''} ${comment.author?.last_name || ''}'s avatar`} width={32} height={32} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            `${comment.author?.first_name?.[0] || 'U'}${comment.author?.last_name?.[0] || ''}`
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-bold text-foreground">
                              {comment.author?.first_name} {comment.author?.last_name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div 
                            className="text-[14px] text-foreground bg-background p-3 rounded-md border border-border shadow-xs rich-text-content"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Comment */}
                <div className="flex gap-3">
                  <div className={cn("w-8 h-8 rounded-full bg-border flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0", compact && "!w-6 !h-6")}>
                    {currentUser?.avatar_url ? (
                      <Image src={currentUser.avatar_url} alt={`${currentUser?.first_name || ''} ${currentUser?.last_name || ''}'s avatar`} width={32} height={32} className="w-full h-full rounded-full" />
                    ) : (
                      `${currentUser?.first_name?.[0] || 'V'}${currentUser?.last_name?.[0] || 'R'}`
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="bg-background border border-border rounded-md shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                      <RichTextEditor
                        ref={commentEditorRef}
                        initialValue={newComment}
                        onChange={setNewComment}
                        placeholder="Leave a comment and mention a teammate using @"
                        className={cn("w-full p-4 text-[14px] min-h-[60px]", compact && "!p-3 !text-[12px] !min-h-[50px]")}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || isSaving}
                        className={cn(
                          "px-4 py-1.5 text-[13px] font-bold rounded transition-colors",
                          newComment.trim() && !isSaving
                            ? "bg-primary text-primary-foreground hover:bg-primary/10"
                            : "bg-border/40 text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {isSaving ? "Saving..." : "Comment"}
                      </button>
                      <button
                        onClick={() => { setShowComments(false); setNewComment(""); }}
                        className="text-[14px] font-bold text-primary hover:underline"
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
      )}
    </motion.div>
  )
}
