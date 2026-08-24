"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  VisuallyHidden,
} from "@/components/ui/sheet"
import { Ticket, Profile } from "@/lib/types/crm"
import { Button } from "@/components/ui/button"
import { X, TicketCheck, Calendar, MoreHorizontal, Pencil, Building, User, Check, Loader2, MessageSquare, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { ticketsService } from "@/services/tickets"
import { authService } from "@/services/auth"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

interface PreviewSheetProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TicketPreviewSheet({ ticket: initialTicket, open, onOpenChange, onSuccess }: PreviewSheetProps) {
  const [ticket, setTicket] = useState<Ticket | null>(initialTicket)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const { canEditTicket, canDeleteTicket } = usePermissions()
  const { workspaceId, user } = useAuth()
  
  // Form state
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    status: "open",
    priority: "medium",
    owner_id: ""
  })

  useEffect(() => {
    setTicket(initialTicket)
    if (initialTicket) {
      setFormData({
        subject: initialTicket.subject ?? "",
        description: initialTicket.description ?? "",
        status: initialTicket.status ?? "open",
        priority: initialTicket.priority ?? "medium",
        owner_id: initialTicket.owner_id ?? ""
      })
    }
  }, [initialTicket])

  useEffect(() => {
    if (isEditing) {
      authService.listProfiles(workspaceId!).then(({ data }) => {
        if (data) setProfiles(data)
      }).catch(err => console.error("[preview]", err))
    }
  }, [isEditing])

  if (!ticket) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: any = {
        ...formData,
        owner_id: (formData.owner_id === "" || formData.owner_id === "unassigned") ? null : formData.owner_id
      }

      const { data, error } = await ticketsService.update(ticket.id, updates, workspaceId!)
      if (error) throw error
      
      setTicket(data as unknown as Ticket)
      setIsEditing(false)
      toast.success("Ticket updated successfully")
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update ticket")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!ticket) return
    if (!window.confirm(`Are you sure you want to delete ticket: ${ticket.subject}?`)) return

    setIsSaving(true)
    try {
      const { error } = await ticketsService.delete(ticket.id, ticket.workspace_id!)
      if (error) throw error
      
      toast.success("Ticket deleted successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete ticket")
    } finally {
      setIsSaving(false)
    }
  }

  const ownerName = ticket.owner ? `${ticket.owner.first_name} ${ticket.owner.last_name}` : "Unassigned";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        style={{ top: '56px', height: 'calc(100vh - 56px)' }}
        className="w-[500px] sm:w-[540px] p-0 max-w-[90vw] flex flex-col hide-scrollbar border-t border-border shadow-2xl"
        side="right"
      >
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Ticket Details</SheetTitle>
            <SheetDescription>Details for ticket {ticket.subject}</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        {/* Header Section */}
        <div className="bg-muted/30 border-b border-border/60 px-6 py-6 sticky top-0 z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className={`h-16 w-16 rounded-md border-2 border-[var(--color-hs-card-bg)] shadow-sm flex items-center justify-center overflow-hidden shrink-0 bg-status-warning/10`}>
                <TicketCheck className="h-8 w-8 text-status-warning" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-heading font-medium text-foreground pb-0">
                  {ticket.subject}
                </span>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="font-medium text-foreground capitalize">{ticket.status}</span>
                  <span>•</span>
                  <span className={`font-semibold uppercase tracking-wider text-[11px] ${
                    ticket.priority === 'urgent' ? 'text-destructive' : 
                    ticket.priority === 'high' ? 'text-status-warning' : 
                    'text-status-warning'
                  }`}>{ticket.priority}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canDeleteTicket && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={handleDelete}
                    >
                      Delete ticket
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="px-6 py-5 flex flex-col gap-8">

            {/* About Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[15px] flex items-center gap-2 text-foreground">
                  <AlertCircle className="h-4 w-4 text-muted-foreground/70" />
                  Ticket Details
                </h3>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-muted-foreground px-2"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8 bg-[var(--color-hs-teal)] hover:bg-[var(--color-hs-teal)]/90 text-[var(--color-hs-card-bg)] gap-1.5"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  canEditTicket && (
                    <Pencil 
                      className="h-[14px] w-[14px] text-muted-foreground/70 cursor-pointer hover:text-muted-foreground" 
                      onClick={() => setIsEditing(true)}
                    />
                  )
                )}
              </div>
              
              <div className="flex flex-col gap-4 text-[13px]">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Subject</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-start gap-2">
                      <span className="text-muted-foreground pt-2">Description</span>
                      <Textarea 
                        className="col-span-2 min-h-[80px] text-[13px]" 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Status</span>
                      <div className="col-span-2">
                        <Select 
                          value={formData.status} 
                          onValueChange={(v) => setFormData({ ...formData, status: v })}
                        >
                          <SelectTrigger className="h-8 text-[13px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Priority</span>
                      <div className="col-span-2">
                        <Select 
                          value={formData.priority} 
                          onValueChange={(v) => setFormData({ ...formData, priority: v })}
                        >
                          <SelectTrigger className="h-8 text-[13px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Owner</span>
                      <div className="col-span-2">
                        <Select 
                          value={formData.owner_id || "unassigned"} 
                          onValueChange={(v) => setFormData({ ...formData, owner_id: v as string })}
                        >
                          <SelectTrigger className="h-8 text-[13px]">
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {profiles.map(p => (
                              <SelectItem key={p.id} value={p.clerk_user_id || p.id}>
                                {p.first_name} {p.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 items-start">
                      <span className="text-muted-foreground">Description</span>
                      <span className="col-span-2 text-foreground font-medium leading-relaxed">{ticket.description || "No description provided."}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Status</span>
                      <span className="col-span-2 text-foreground font-medium capitalize">{ticket.status}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Priority</span>
                      <span className={`col-span-2 font-bold capitalize ${
                        ticket.priority === 'urgent' ? 'text-destructive' : 
                        ticket.priority === 'high' ? 'text-status-warning' : 
                        'text-status-warning'
                      }`}>{ticket.priority}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Ticket owner</span>
                      <div className="col-span-2 flex items-center gap-2 text-foreground font-medium">
                        <div className="h-5 w-5 bg-muted rounded-full flex items-center justify-center text-[10px] bg-status-info-light text-primary">
                          {ownerName.charAt(0)}
                        </div>
                        {ownerName}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-border/60" />
            
            {/* Associated Records */}
            <div className="flex flex-col gap-4">
               <h3 className="font-semibold text-[15px] flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground/70" />
                  Associated Records
               </h3>
               {ticket.contact && (
                 <div className="p-4 bg-muted/30 border rounded-md flex items-center gap-3 mt-2">
                    <div className="h-10 w-10 bg-background border rounded-full flex items-center justify-center font-bold text-muted-foreground/70">
                      {ticket.contact.first_name.substring(0, 1)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-primary hover:underline cursor-pointer">{ticket.contact.first_name} {ticket.contact.last_name}</span>
                      <span className="text-xs text-muted-foreground">Contact</span>
                    </div>
                 </div>
               )}
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
