"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { activitiesService } from "@/services/activities"
import { Activity } from "@/lib/types/crm"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Phone as PhoneIcon, Phone, AlignLeft, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBadgeClasses } from "@/lib/badge-colors"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import dynamic from "next/dynamic"
const NoteEditorSheet = dynamic(() => import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet })), { ssr: false })
const CallEditorSheet = dynamic(() => import("@/components/activities/CallEditorSheet").then(m => ({ default: m.CallEditorSheet })), { ssr: false })
const EmailEditorSheet = dynamic(() => import("@/components/activities/EmailEditorSheet").then(m => ({ default: m.EmailEditorSheet })), { ssr: false })
const TaskEditorSheet = dynamic(() => import("@/components/activities/TaskEditorSheet").then(m => ({ default: m.TaskEditorSheet })), { ssr: false })
const MeetingEditorSheet = dynamic(() => import("@/components/activities/MeetingEditorSheet").then(m => ({ default: m.MeetingEditorSheet })), { ssr: false })

export default function CallDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { workspaceId } = useAuth()
  const [call, setCall] = React.useState<Activity | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'call' | 'email' | 'task' | 'meeting' | null>(null)

  const fetchCall = React.useCallback(async () => {
    try {
      const { data, error } = await activitiesService.getAll({ workspace_id: workspaceId ?? "", type: "call" })
      if (error) throw error
      const found = data?.find((a: Activity) => a.id === id)
      if (found) {
        setCall(found)
      } else {
        toast.error("Call not found")
      }
    } catch (err) {
      toast.error("Failed to load call details")
    }
  }, [id, workspaceId])

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      await fetchCall()
      setIsLoading(false)
    }
    loadData()
  }, [fetchCall])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!call) {
    return (
      <CrmDetailLayout backLine="Calls" backHref="/calls">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Call not found</h2>
          <p>The call you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  const ownerName = call.owner ? `${call.owner.first_name} ${call.owner.last_name}` : "Unassigned"

  const getDirectionIcon = (direction: string | null | undefined) => {
    return direction === "Inbound"
      ? <ArrowDownLeft className="w-4 h-4 text-status-success" />
      : <ArrowUpRight className="w-4 h-4 text-status-info" />
  }

  const getOutcomeColor = (outcome: string | null | undefined) => {
    return getBadgeClasses('call_outcome', outcome || '')
  }

  return (
    <CrmDetailLayout backLine="Calls" backHref="/calls">
      <CrmDetailLeftPanel>
        <div className="p-6 border-b border-border flex flex-col items-center text-center relative">
          <div className="w-20 h-20 bg-muted/50 border border-border rounded mb-4 flex items-center justify-center shadow-sm">
            <PhoneIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2 px-4 leading-tight">{call.title}</h1>
          <div className="flex items-center gap-2">
            {getDirectionIcon(call.call_direction)}
            <Badge className="capitalize">
              {call.call_direction || "Outbound"}
            </Badge>
          </div>

          <div className="flex w-full items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border bg-background text-muted-foreground hover:bg-accent flex-1"
              onClick={() => setActiveEditor('note')}
            >
              <AlignLeft className="h-3.5 w-3.5 mr-1.5 text-primary" /> Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border bg-background text-muted-foreground hover:bg-accent flex-1"
              onClick={() => setActiveEditor('call')}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5 text-primary" /> Call
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4 group">
            <h3 className="font-semibold text-sm text-foreground tracking-wide">About this call</h3>
          </div>

          <div className="space-y-4">
            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Title</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {call.title}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Direction</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center gap-2">
                {getDirectionIcon(call.call_direction)}
                {call.call_direction || "Outbound"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Duration</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {call.call_duration || "—"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Outcome</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                <Badge className={cn("capitalize text-xs", getOutcomeColor(call.call_outcome))}>
                  {call.call_outcome || "Unknown"}
                </Badge>
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Assigned to</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {ownerName}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Created</label>
              <div className="text-sm font-medium text-foreground border border-transparent group-hover:bg-accent group-hover:border-border rounded px-2 -mx-2 py-1 min-h-[30px] flex items-center">
                {new Date(call.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CrmDetailLeftPanel>

      <CrmDetailCenterPanel>
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
          <PhoneIcon className="w-12 h-12 mb-4 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground mb-1">Call Activity</p>
          <p className="text-xs text-muted-foreground text-center">Activity feed for this call will appear here.</p>
        </div>
      </CrmDetailCenterPanel>

      <CrmDetailRightPanel>
        <div className="p-6">
          <h3 className="font-semibold text-sm text-foreground tracking-wide mb-4">Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {call.description || "No description provided."}
          </p>

          {call.call_transcript && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm text-foreground tracking-wide mb-4">Transcript</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {call.call_transcript}
              </p>
            </div>
          )}
        </div>
      </CrmDetailRightPanel>

      <NoteEditorSheet open={activeEditor === 'note'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={call.contact_id ?? id} workspaceId={workspaceId} />
      <CallEditorSheet open={activeEditor === 'call'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={call.contact_id ?? id} workspaceId={workspaceId} />
      <EmailEditorSheet open={activeEditor === 'email'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={call.contact_id ?? id} workspaceId={workspaceId} />
      <TaskEditorSheet open={activeEditor === 'task'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={call.contact_id ?? id} workspaceId={workspaceId} />
      <MeetingEditorSheet open={activeEditor === 'meeting'} onClose={() => setActiveEditor(null)} onSaved={() => {}} entityType="contact" entityId={call.contact_id ?? id} workspaceId={workspaceId} />
    </CrmDetailLayout>
  )
}
