"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { documentsService } from "@/services/documents"
import { Document } from "@/lib/types/crm"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Download, ExternalLink, ChevronLeft, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/auth"
import { Profile } from "@/lib/types/crm"
import { useRealtime } from "@/hooks/use-realtime"
import { ActivityFeedCenterPanel } from "@/components/crm/ActivityFeedCenterPanel"
import { ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"
import { DeleteConfirmDialog } from "@/components/crm/detail/DeleteConfirmDialog"
import { CustomCardsRenderer } from "@/components/crm/detail/CustomCardsRenderer"
import dynamic from "next/dynamic"
const NoteEditorSheet = dynamic(() => import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet })), { ssr: false })
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspaceId, loading: authLoading } = useAuth()
  const { customLeftCards, customRightCards, leftAddedIds, ready } = usePanelCards('documents')

  const [document, setDocument] = React.useState<Document | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(ALL_ACTIVITY_TYPES)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'email' | 'task' | 'call' | 'meeting' | 'ticket' | null>(null)
  const [isCollapsedAll, setIsCollapsedAll] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isNoteSheetOpen, setIsNoteSheetOpen] = React.useState(false)

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  const fetchData = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const { data, error } = await documentsService.getById(id, workspaceId)
      if (error) throw error
      if (data) {
        setDocument(data)

        const [userRes, profilesRes] = await Promise.all([
          authService.getCurrentUser(),
          authService.listProfiles(workspaceId),
        ])
        setCurrentUser(userRes.data)
        setProfiles(profilesRes.data || [])
      } else {
        toast.error("Document not found")
      }
    } catch {
      toast.error("Failed to load document details")
    } finally {
      setIsLoading(false)
    }
  }, [id, workspaceId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtime(React.useCallback((_payload: any) => {
    const silentRefresh = async () => {
      if (!workspaceId) return
      try {
        const { data } = await documentsService.getById(id, workspaceId)
        if (data) setDocument(data)
      } catch (err) {
        console.error("Silent refresh failed:", err)
      }
    }
    silentRefresh()
  }, [id, workspaceId]))

  const handleDeleteDocument = React.useCallback(() => {
    if (!document) return
    setDeleteDialogOpen(true)
  }, [document])

  const execDeleteDocument = React.useCallback(async () => {
    if (!document) return
    try {
      const { error } = await documentsService.delete(document.id)
      if (error) throw error
      toast.success("Document deleted")
      router.push("/documents")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document")
    }
  }, [document, router])

  const handleDownload = async () => {
    if (!document) return
    try {
      const blob = await documentsService.download(document.id)
      if (!blob) {
        toast.error("Download URL not available")
        return
      }
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.name || 'document'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Download failed")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getFileIcon = (mime?: string) => {
    if (!mime) return "📁"
    if (mime.includes("pdf")) return "📄"
    if (mime.includes("image")) return "🖼️"
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "📊"
    if (mime.includes("presentation")) return "📽️"
    if (mime.includes("word") || mime.includes("document")) return "📝"
    return "📁"
  }

  const combinedFeed: any[] = React.useMemo(() => {
    if (!document) return []
    return []
  }, [document])

  const feedCounts = React.useMemo(() => {
    return { all: 0, notes: 0, tasks: 0, tickets: 0, calls: 0 }
  }, [])

  const upcomingTasks: any[] = []
  const groupedHistory: Record<string, any[]> = {}

  const getAssociations = React.useCallback(() => {
    if (!document) return []
    return [{ name: document.name, type: 'Document' }]
  }, [document])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!document) {
    return (
      <CrmDetailLayout backLine="Documents" backHref="/documents">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Document not found</h2>
          <p>The document you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  return (
    <CrmDetailLayout backLine="Documents" backHref="/documents">

      {/* LEFT PANEL: Properties */}
      <CrmDetailLeftPanel>

        {/* Profile Card Summary */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/documents" className="flex items-center text-foreground text-[14px] font-bold">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Documents
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[14px] font-bold text-foreground flex items-center gap-1 outline-none">
                  Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] p-1 shadow-lg border-border z-[200]">
                {document.url && (
                  <DropdownMenuItem
                    className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                    onClick={() => window.open(document.url, '_blank')}
                  >
                    Open in new tab
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={handleDownload}
                >
                  Download
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-destructive hover:bg-destructive/10" onClick={handleDeleteDocument}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl shrink-0">
                {getFileIcon(document.mime_type ?? undefined)}
              </div>
              <div className="flex flex-col mt-1 min-w-0 flex-1">
                <div className="flex items-center gap-1 group min-w-0 w-full">
                  <h1 className="text-[20px] font-bold text-foreground leading-tight truncate">
                    {document.name}
                  </h1>
                </div>
                <p className="text-[14px] text-foreground mt-1.5 break-words">
                  {document.type} • {formatFileSize(document.size)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About this document Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[16px] text-foreground">About this document</h3>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Name</label>
              <div className="text-[14px] text-foreground">
                {document.name}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Type</label>
              <div className="text-[14px] text-foreground">
                {document.type}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">File type</label>
              <div className="text-[14px] text-foreground">
                {document.mime_type || "—"}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Size</label>
              <div className="text-[14px] text-foreground">
                {formatFileSize(document.size)}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Views</label>
              <div className="text-[14px] text-foreground">
                {document.views_count ?? 0}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Links</label>
              <div className="text-[14px] text-foreground">
                {document.links_count ?? 0}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Uploaded by</label>
              <div className="text-[14px] text-foreground">
                {document.uploader?.name || "—"}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Created</label>
              <div className="text-[14px] text-foreground">
                {new Date(document.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <CustomCardsRenderer cards={customLeftCards} addedIds={leftAddedIds} basePath={`/documents/${id}/settings`} ready={ready} side="left" />

      </CrmDetailLeftPanel>

      {/* CENTER PANEL: Activity & Feed */}
      <CrmDetailCenterPanel>
        <ActivityFeedCenterPanel
          entityType="document"
          entityId={id}
          workspaceId={document?.workspace_id ?? undefined}
          profiles={profiles}
          currentUser={currentUser}
          showTabs={['notes', 'tasks', 'tickets']}
          showFilterTabs={['all', 'notes', 'tasks', 'tickets', 'calls']}
          feedItems={combinedFeed}
          feedCounts={feedCounts}
          upcomingTasks={upcomingTasks}
          groupedHistory={groupedHistory}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          isCollapsedAll={isCollapsedAll}
          setIsCollapsedAll={setIsCollapsedAll}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          onRefresh={fetchData}
          getAssociations={getAssociations}
        />
      </CrmDetailCenterPanel>

      {/* RIGHT PANEL: Associated Objects */}
      <CrmDetailRightPanel>
        {/* Actions Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[14px] text-foreground">Actions</h3>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {document.url && (
              <Button
                variant="outline"
                className="w-full justify-start h-9 text-[13px]"
                onClick={() => window.open(document.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Open document
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start h-9 text-[13px]"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </div>

        {/* File Info Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[14px] text-foreground">File Info</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[12px] text-muted-foreground block mb-0.5">Type</label>
              <p className="text-[13px] text-foreground font-medium">{document.type}</p>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-0.5">Size</label>
              <p className="text-[13px] text-foreground font-medium">{formatFileSize(document.size)}</p>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-0.5">Views</label>
              <p className="text-[13px] text-foreground font-medium">{document.views_count ?? 0}</p>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-0.5">Links</label>
              <p className="text-[13px] text-foreground font-medium">{document.links_count ?? 0}</p>
            </div>
          </div>
        </div>

        <CustomCardsRenderer cards={customRightCards} addedIds={[]} basePath={`/documents/${id}/settings`} ready={ready} side="right" />
      </CrmDetailRightPanel>

      {/* Activity Editor Sheets */}
      <NoteEditorSheet
        open={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        onSaved={fetchData}
        entityType="document"
        entityId={id as string}
        workspaceId={document?.workspace_id ?? ""}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="document"
        entityDisplayName={document?.name || 'this document'}
        onConfirm={execDeleteDocument}
      />
    </CrmDetailLayout>
  )
}
