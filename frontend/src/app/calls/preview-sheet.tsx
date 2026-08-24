"use client"

import * as React from "react"
import { useContentReady } from "@/hooks/use-content-ready"
import { PreviewSheetSkeleton } from "@/components/crm/Skeletons"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, VisuallyHidden } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Activity } from "@/lib/types/crm"
import { activitiesService } from "@/services/activities"
import { toast } from "sonner"
import { 
  Loader2, 
  Trash2, 
  Phone, 
  Clock, 
  Calendar, 
  User, 
  FileText,
  PlayCircle
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"

interface CallPreviewSheetProps {
  call: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CallPreviewSheet({
  call,
  open,
  onOpenChange,
  onSuccess,
}: CallPreviewSheetProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const isContentReady = useContentReady(open, !!call)
  const { workspaceId } = useAuth()
  const { canDeleteActivity } = usePermissions()

  if (!call) return null

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this call record?")) return
    if (!workspaceId) return
    
    setIsDeleting(true)
    try {
      const { error } = await activitiesService.delete(call.id, workspaceId)
      if (error) throw error
      toast.success("Call record deleted")
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete call")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        style={{ top: '56px', height: 'calc(100vh - 56px)' }}
        className="w-[500px] sm:w-[540px] p-0 flex flex-col hide-scrollbar border-t border-border shadow-2xl"
        side="right"
      >
        {!isContentReady ? (
          <PreviewSheetSkeleton />
        ) : (
          <>
            <SheetHeader>
              <VisuallyHidden>
                <SheetTitle>Call Details</SheetTitle>
                <SheetDescription>Previewing call records and associations.</SheetDescription>
              </VisuallyHidden>
            </SheetHeader>

            {/* Header Section */}
            <div className="bg-muted/30 border-b border-border/60 px-6 py-6 sticky top-0 z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-status-success-light text-status-success border-status-success/20">
              {call.call_direction || "Call"}
            </Badge>
            {canDeleteActivity && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <div className="text-xl font-bold text-foreground">
            {call.title || "Call with Contact"}
          </div>
            </div>

        <div className="flex-1 overflow-y-auto w-full">
          <div className="px-6 py-5 flex flex-col gap-6">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label label="Date" icon={<Calendar className="h-3 w-3" />} />
              <div className="text-sm font-medium text-foreground">
                {format(new Date(call.created_at), "MMM d, yyyy h:mm a")}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label label="Duration" icon={<Clock className="h-3 w-3" />} />
              <div className="text-sm font-medium text-foreground">
                {call.call_duration || "0:00"}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label label="Outcome" icon={<Phone className="h-3 w-3" />} />
              <div className="text-sm font-medium text-foreground">
                {call.call_outcome || "Connected"}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label label="Assigned To" icon={<User className="h-3 w-3" />} />
              <div className="text-sm font-medium text-foreground">
                {call.owner ? `${call.owner.first_name} ${call.owner.last_name}` : "System"}
              </div>
            </div>
          </div>

          {/* Recording Placeholder */}
          {call.call_recording_url && (
            <div className="p-4 rounded-lg bg-foreground text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlayCircle className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-sm font-bold">Call Recording</div>
                  <div className="text-[11px] text-muted-foreground">Click to play recording</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8">
                Listen
              </Button>
            </div>
          )}

          {/* Transcript / Notes */}
          <div className="space-y-2">
            <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Call Transcript / Notes
            </h3>
            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border border-border min-h-[120px] leading-relaxed">
              {call.description || call.call_transcript || "No transcript or notes available for this call."}
            </div>
          </div>

          {/* Associations */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wider">Associations</h3>
            
            <div className="space-y-3">
              {call.contact && (
                <AssociationItem 
                  title={`${call.contact.first_name} ${call.contact.last_name}`}
                  subtitle="Contact"
                  initials={call.contact.first_name?.[0] + (call.contact.last_name?.[0] || '')}
                />
              )}
              {call.company && (
                <AssociationItem 
                  title={call.company.name}
                  subtitle="Company"
                  initials={call.company.name[0]}
                  type="company"
                />
              )}
            </div>
          </div>
          </div>
        </div>
          </>
        )}

      </SheetContent>
    </Sheet>
  )
}

function Label({ label, icon }: { label: string, icon: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
      {icon} {label}
    </div>
  )
}

function AssociationItem({ title, subtitle, initials, type = "contact" }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-${type === 'contact' ? 'full' : 'lg'} ${type === 'contact' ? 'bg-status-info-light text-status-info' : 'bg-muted text-foreground'} flex items-center justify-center text-[11px] font-bold`}>
          {initials}
        </div>
        <div>
          <div className="text-[13px] font-bold text-foreground">{title}</div>
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}
