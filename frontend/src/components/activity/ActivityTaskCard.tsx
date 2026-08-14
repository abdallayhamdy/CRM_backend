"use client"

import * as React from "react"
import Image from "next/image"
import {
  ChevronDown,
  Clock,
  Info,
  ChevronRight,
  ChevronUp,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Pencil,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent, 
  PopoverTrigger, 
} from "@/components/ui/popover"
import { RichTextEditor } from "@/components/RichTextEditor"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { format, parseISO, parse } from "date-fns"
import { tasksService } from "@/services/tasks"
import { activityCommentsService } from "@/services/activity-comments"
import { authService } from "@/services/auth"
import { ActivityComment, Profile } from "@/lib/types/crm"
import { toast } from "sonner"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuth } from "@/hooks/use-auth"
import DOMPurify from "dompurify"
import { AssociationBadge } from "./AssociationBadge"

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
  None: "bg-gray-100 text-gray-700 border-gray-200",
}

interface ActivityTaskCardProps {
  id?: string
  title: string
  description?: string
  assignedTo: string
  dueDate: string
  dueTime: string
  isExpanded?: boolean
  associations?: { name: string; type: string }[]
  onSuccess?: () => void
  initialTaskSubtype?: string
  initialPriority?: string
  initialQueue?: string
  initialReminder?: string
  initialRepeat?: boolean
  initialCompleted?: boolean
  compact?: boolean
}

export function ActivityTaskCard({
  id = "",
  title: initialTitle,
  description = "",
  assignedTo,
  dueDate,
  dueTime,
  isExpanded: initialExpanded = true,
  associations = [],
  onSuccess,
  initialTaskSubtype = "To-do",
  initialPriority = "None",
  initialQueue = "None",
  initialReminder = "At task due time",
  initialRepeat = false,
  initialCompleted = false,
  compact = false,
}: ActivityTaskCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded)
  const [editedTitle, setEditedTitle] = React.useState(initialTitle || "")
  const [editedNotes, setEditedNotes] = React.useState(description || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editedDueDate, setEditedDueDate] = React.useState(dueDate)

  // Local state for dropdowns — initialized from persisted props
  const [taskType, setTaskType] = React.useState(initialTaskSubtype)
  const [priority, setPriority] = React.useState(initialPriority)
  const [queue, setQueue] = React.useState(initialQueue)
  const [reminder, setReminder] = React.useState(initialReminder)
  const [isRepeat, setIsRepeat] = React.useState(initialRepeat)

  const [editedDueTime, setEditedDueTime] = React.useState(dueTime)
  const [editedAssignedTo, setEditedAssignedTo] = React.useState(assignedTo)
  const [isCompleted, setIsCompleted] = React.useState(initialCompleted)
  const [isEditing, setIsEditing] = React.useState(false)
  
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<ActivityComment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [isSavingComment, setIsSavingComment] = React.useState(false);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { workspaceId } = useAuth();

  // Load current user for attribution
  React.useEffect(() => {
    const loadUser = async () => {
      const { data } = await authService.getCurrentUser();
      if (data) setCurrentUser(data);
    };
    loadUser();
  }, []);

  const fetchComments = React.useCallback(async () => {
    if (!id) return;
    setIsLoadingComments(true);
    const { data, error } = await activityCommentsService.getByTarget(id, 'activity', workspaceId!);
    if (!error && data) {
      setComments(data);
    }
    setIsLoadingComments(false);
  }, [id, workspaceId]);

  // Real-time updates for comments on this specific task
  useRealtime(React.useCallback((payload: any) => {
    if (payload.type === 'comment' && payload.new && payload.new.target_id === id) {
      fetchComments();
    }
  }, [id, fetchComments]), ['activity_comments'], workspaceId);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const commentEditorRef = React.useRef<HTMLDivElement>(null);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || isSavingComment || !id || !currentUser?.id) return;

    const payload = {
      content: newComment,
      target_id: id,
      target_type: 'activity' as const,
      author_id: currentUser.id
    };

    setIsSavingComment(true);
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
      setIsSavingComment(false);
    }
  };
  
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4)
    const minute = (i % 4) * 15
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const displayMinute = minute === 0 ? "00" : minute
    return `${displayHour}:${displayMinute} ${ampm}`
  })

  const safeParseDate = (dateStr: string) => {
    if (!dateStr) return undefined
    try {
      // Try ISO first
      const parsedIso = parseISO(dateStr)
      if (!isNaN(parsedIso.getTime())) return parsedIso
      
      // Try common formats if ISO fails
      const formats = ["MM/dd/yyyy", "yyyy-MM-dd", "M/d/yyyy"]
      for (const f of formats) {
        const parsed = parse(dateStr, f, new Date())
        if (!isNaN(parsed.getTime())) return parsed
      }
      
      // Last resort: native Date
      const fallback = new Date(dateStr)
      if (!isNaN(fallback.getTime())) return fallback
    } catch (e) {
      console.error("Error parsing date:", dateStr, e)
    }
    return undefined
  }

  const formattedDateValue = React.useMemo(() => {
    const date = safeParseDate(editedDueDate)
    return date ? format(date, "MM/dd/yyyy") : "Select date"
  }, [editedDueDate])

  const taskEditorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setEditedTitle(initialTitle || "")
    setEditedNotes(description || "")
    setEditedDueDate(dueDate)
    setEditedDueTime(dueTime)
    setTaskType(initialTaskSubtype)
    setPriority(initialPriority)
    setQueue(initialQueue)
    setReminder(initialReminder)
    setIsRepeat(initialRepeat)
    setEditedAssignedTo(assignedTo)
    setIsCompleted(initialCompleted)
  }, [id, initialTitle, description, dueDate, dueTime, initialTaskSubtype, initialPriority, initialQueue, initialReminder, initialRepeat, assignedTo, initialCompleted])

  const hasChanges = 
    editedTitle !== (initialTitle || "") ||
    editedNotes !== (description || "") ||
    editedDueDate !== dueDate ||
    editedDueTime !== dueTime ||
    taskType !== initialTaskSubtype ||
    priority !== initialPriority ||
    queue !== initialQueue ||
    reminder !== initialReminder ||
    isRepeat !== initialRepeat ||
    editedAssignedTo !== assignedTo ||
    isCompleted !== initialCompleted;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!id) {
      toast.error("Cannot save: Task ID is missing");
      return;
    }
    if (!(editedTitle || "").trim()) {
      toast.error("Task title cannot be empty");
      return;
    }
    setIsSubmitting(true)
    try {
      // Build due_date ISO string from the edited date + time inputs
      let dueDateISO: string | undefined = undefined
      if (editedDueDate) {
        const timeStr = editedDueTime || "00:00"
        const combined = new Date(`${editedDueDate}T${timeStr}`)
        if (!isNaN(combined.getTime())) {
          dueDateISO = combined.toISOString()
        }
      }

      const { error } = await tasksService.update(id, {
        title: (editedTitle || "").trim(),
        description: (editedNotes || "").trim() || undefined,
        status: isCompleted ? "completed" : "pending",
        ...(dueDateISO ? { due_date: dueDateISO } : {})
      })
      if (error) throw error
      toast.success("Task updated")
      setIsEditing(false)
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update task")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = async () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    
    // Immediate persistence for completion toggle
    try {
      const { error } = await tasksService.update(id, {
        status: newStatus ? "completed" : "pending"
      })
      if (error) throw error;
      toast.success(newStatus ? "Task completed" : "Task reopened");
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update task status");
      setIsCompleted(!newStatus); // Revert on error
    }
  };

  const handleDelete = async () => {
    if (!id || isDeleting) return;
    if (!confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);
    try {
      const { error } = await tasksService.delete(id);
      if (error) throw error;
      toast.success("Task deleted");
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-foreground" />
            )}
          </button>
          <div className="flex items-center gap-1.5 text-[14px] min-w-0">
            <span className="font-bold text-foreground shrink-0">Task</span>
            <span className="text-foreground shrink-0">assigned to</span>
            <span className="font-bold text-foreground hover:text-primary cursor-pointer truncate">{assignedTo}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[14px] text-foreground opacity-80 truncate text-right">
            Overdue: {safeParseDate(dueDate) ? format(safeParseDate(dueDate) as Date, "MM/dd/yyyy") : dueDate} at {dueTime}
          </span>
        </div>
      </div>

      {/* Task Content */}
      <div className="px-4 md:px-12 py-3">
        <div className="flex items-center gap-3 w-full">
          <button 
            type="button"
            onClick={handleToggleComplete}
            className="p-0 flex items-center justify-center shrink-0 transition-colors outline-none"
            title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            <CheckCircle2
              className={cn(
                "w-7 h-7 transition-colors",
                isCompleted ? "text-primary fill-primary/10" : "text-destructive fill-primary-foreground"
              )}
              strokeWidth={1.75}
            />
          </button>
          {isEditing ? (
            <input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-[15px] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 w-full text-foreground"
              placeholder="Task title..."
              autoFocus
            />
          ) : (
            <span className={cn(
              "text-[15px] font-medium w-full",
              isCompleted ? "text-muted-foreground line-through decoration-2" : "text-foreground"
            )}>
              {editedTitle || "Untitled task"}
            </span>
          )}
        </div>
      </div>

      {/* Normal Mode - Read Only */}
      {!isEditing && isExpanded && (
        <div className="px-4 md:px-12 pb-3 pt-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{taskType}</span>
            <span className={cn("text-[12px] px-2 py-0.5 rounded-full font-medium border", priorityColors[priority] || "bg-muted text-muted-foreground border-border")}>{priority}</span>
            <span className="text-[12px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{queue}</span>
            <span className="text-[12px] text-muted-foreground">•</span>
            <span className="text-[12px] text-muted-foreground">Due {formattedDateValue} at {editedDueTime}</span>
            <span className="text-[12px] text-muted-foreground">•</span>
            <span className="text-[12px] text-muted-foreground">{editedAssignedTo}</span>
          </div>
          {description && (
            <div className="mt-2 text-[13px] text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
          )}
        </div>
      )}

      {/* Edit Mode - Full Form */}
      {isEditing && (
        <div className={cn("px-4 md:px-12 pb-6 pt-2", compact && "!px-3 !pb-4 !pt-2")}>
          {/* Field Grid */}
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-4 pb-4 border-b border-border", compact && "!grid-cols-2 !gap-4 !mb-3 !pb-3")}>
            <div className={cn("space-y-1.5 col-span-2", compact && "!col-span-2")}>
              <label className={cn("text-[12px] font-bold text-muted-foreground", compact && "!text-[11px]")}>Due date</label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      type="button" 
                      className="flex items-center gap-3 px-4 py-2 border border-border rounded-md bg-background hover:border-primary hover:bg-accent transition-all outline-none h-[40px] flex-1 group"
                    >
                      <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-[14px] font-bold text-foreground">
                        {formattedDateValue}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 shadow-2xl border-border bg-background rounded-lg" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={safeParseDate(editedDueDate)}
                      onSelect={(date) => date && setEditedDueDate(format(date, "yyyy-MM-dd"))}
                    />
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      type="button" 
                      className="flex items-center gap-3 px-4 py-2 border border-border rounded-md bg-background hover:border-primary hover:bg-accent transition-all outline-none h-[40px] w-[140px] group text-left"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-[14px] font-bold text-foreground truncate">
                        {editedDueTime}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[160px] max-h-[300px] overflow-y-auto p-1 shadow-2xl border-border bg-background rounded-lg">
                    {timeOptions.map((opt) => (
                      <DropdownMenuItem 
                        key={opt} 
                        className={cn(
                          "px-4 py-2 text-[14px] cursor-pointer rounded-md transition-colors",
                          editedDueTime === opt ? "bg-muted/50 font-bold text-primary" : "text-foreground hover:bg-accent"
                        )}
                        onClick={() => setEditedDueTime(opt)}
                      >
                        {opt}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground">Reminder</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="w-full flex items-center gap-2 py-1.5 bg-transparent outline-none cursor-pointer">
                    <span className="text-[14px] font-bold text-foreground">{reminder}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px]">
                  {["No reminder", "15 minutes before", "30 minutes before", "1 hour before", "At task due time"].map((opt) => (
                    <DropdownMenuItem key={opt} onClick={() => setReminder(opt)}>
                      {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-transparent select-none block">Spacer</label>
              <div className="flex items-center gap-2 py-1.5 w-fit">
                <Checkbox
                  id="task-repeat"
                  checked={isRepeat}
                  onCheckedChange={(checked) => setIsRepeat(checked === true)}
                />
                <label htmlFor="task-repeat" className="text-[14px] text-muted-foreground cursor-pointer hover:text-foreground select-none">Set to repeat</label>
              </div>
            </div>
          </div>

          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-6 pb-4 border-b border-border", compact && "!grid-cols-2 !gap-4 !mb-4 !pb-3")}>
            <div className="space-y-1.5">
              <label className={cn("text-[12px] font-bold text-muted-foreground", compact && "!text-[11px]")}>Task type</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between py-2 px-3 bg-muted/50 hover:bg-border rounded-md border border-border transition-colors outline-none group">
                    <span className="text-[14px] font-bold text-foreground">{taskType}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px] p-1 shadow-2xl border-border bg-background rounded-lg">
                  {["To-do", "Call", "Email", "Meeting"].map((opt) => (
                    <DropdownMenuItem 
                      key={opt} 
                      onClick={() => setTaskType(opt)}
                      className={cn(
                        "px-3 py-2 text-[14px] cursor-pointer rounded-md transition-colors",
                        taskType === opt ? "bg-muted/50 font-bold text-primary" : "text-foreground hover:bg-accent"
                      )}
                    >
                      {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Priority</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="w-full flex items-center gap-2 py-2 px-3 bg-muted/50 hover:bg-border rounded-md border border-border transition-colors outline-none group">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${priority === 'High' ? 'bg-stage-orange' : priority === 'Medium' ? 'bg-stage-amber' : 'bg-border'}`} />
                    <span className="text-[14px] font-bold text-foreground flex-1 text-left">{priority}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px] p-1 shadow-2xl border-border bg-background rounded-lg">
                  {["None", "Low", "Medium", "High"].map((opt) => (
                    <DropdownMenuItem 
                      key={opt} 
                      onClick={() => setPriority(opt)} 
                      className={cn(
                        "px-3 py-2 text-[14px] cursor-pointer rounded-md transition-colors flex items-center gap-2",
                        priority === opt ? "bg-muted/50 font-bold text-primary" : "text-foreground hover:bg-accent"
                      )}
                    >
                       <div className={`w-2 h-2 rounded-full ${opt === 'High' ? 'bg-stage-orange' : opt === 'Medium' ? 'bg-stage-amber' : 'bg-border'}`} />
                       {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Queue</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between py-2 px-3 bg-muted/50 hover:bg-border rounded-md border border-border transition-colors outline-none group">
                    <span className="text-[14px] font-bold text-foreground truncate flex-1 text-left">{queue}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px] p-1 shadow-2xl border-border bg-background rounded-lg">
                  {["None", "Sales Queue", "Support Queue"].map((opt) => (
                    <DropdownMenuItem 
                      key={opt} 
                      onClick={() => setQueue(opt)}
                      className={cn(
                        "px-3 py-2 text-[14px] cursor-pointer rounded-md transition-colors",
                        queue === opt ? "bg-muted/50 font-bold text-primary" : "text-foreground hover:bg-accent"
                      )}
                    >
                      {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Assigned to</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between py-2 px-3 bg-muted/50 hover:bg-border rounded-md border border-border transition-colors outline-none group">
                    <span className="text-[14px] font-bold text-foreground truncate flex-1 text-left">{editedAssignedTo}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] p-1 shadow-2xl border-border bg-background rounded-lg">
                  {[assignedTo, "Saleh Omar", "Mahmoud Otiefy"].filter((v, i, a) => a.indexOf(v) === i && v).map((opt) => (
                    <DropdownMenuItem 
                      key={opt} 
                      onClick={() => setEditedAssignedTo(opt)}
                      className={cn(
                        "px-3 py-2 text-[14px] cursor-pointer rounded-md transition-colors",
                        editedAssignedTo === opt ? "bg-muted/50 font-bold text-primary" : "text-foreground hover:bg-accent"
                      )}
                    >
                      {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Notes */}
          <div className={cn("space-y-1.5 mb-6", compact && "!mb-4")}>
            <label className={cn("text-[12px] font-bold text-muted-foreground", compact && "!text-[11px]")}>Task notes</label>
            <div className="border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all rounded-lg overflow-hidden bg-background shadow-sm">
              <RichTextEditor
                ref={taskEditorRef}
                initialValue={editedNotes}
                onChange={setEditedNotes}
                placeholder="Start typing to add notes..."
                className={cn("w-full min-h-[120px] text-[14px]", compact && "!min-h-[80px] !text-[12px]")}
              />
            </div>
            
            <div className="pt-2 flex items-center gap-3">
              <Button 
                type="button"
                className="h-8 px-4 text-[13px] bg-primary hover:bg-primary text-primary-foreground rounded"
                onClick={handleSave}
                disabled={isSubmitting || !(editedTitle || "").trim()}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <div 
                className="text-[14px] font-bold text-primary hover:underline cursor-pointer" 
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditedTitle(initialTitle || ""); setEditedNotes(description || ""); setTaskType(initialTaskSubtype); setPriority(initialPriority); setQueue(initialQueue); setReminder(initialReminder); setEditedDueDate(dueDate); setEditedDueTime(dueTime); setIsRepeat(initialRepeat); setEditedAssignedTo(assignedTo); setIsCompleted(initialCompleted); setIsEditing(false) } }}
                onClick={() => {
                  setEditedTitle(initialTitle || "");
                  setEditedNotes(description || "");
                  setTaskType(initialTaskSubtype);
                  setPriority(initialPriority);
                  setQueue(initialQueue);
                  setReminder(initialReminder);
                  setEditedDueDate(dueDate);
                  setEditedDueTime(dueTime);
                  setIsRepeat(initialRepeat);
                  setEditedAssignedTo(assignedTo);
                  setIsCompleted(initialCompleted);
                  setIsEditing(false);
                }}
              >
                Cancel
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Footer - always visible when expanded */}
        {isExpanded && (
          <div className="px-4 md:px-12 pb-3 pt-0">
            <div className="flex items-center justify-between pt-3 border-t border-border">
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
                className="mt-6 space-y-6 overflow-hidden"
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
                  <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
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
                        className="w-full text-[14px] min-h-[100px]"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || isSavingComment}
                        className={cn(
                          "px-4 py-1.5 text-[13px] font-bold rounded transition-colors",
                          newComment.trim() && !isSavingComment
                            ? "bg-primary text-primary-foreground hover:bg-primary/10"
                            : "bg-border/40 text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {isSavingComment ? "Saving..." : "Comment"}
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
    </div>
  )
}
