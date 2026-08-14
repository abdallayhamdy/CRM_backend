"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  VisuallyHidden,
} from "@/components/ui/sheet"
import { Deal, Profile } from "@/lib/types/crm"
import { Button } from "@/components/ui/button"
import { X, Handshake, Calendar, MoreHorizontal, Pencil, Building, User, Check, Loader2, DollarSign, Target } from "lucide-react"
import { useState, useEffect } from "react"
import { dealsService } from "@/services/deals"
import { pipelinesService, Pipeline, PipelineStage } from "@/services/pipelines"
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


interface PreviewSheetProps {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DealPreviewSheet({ deal: initialDeal, open, onOpenChange, onSuccess }: PreviewSheetProps) {
  const [deal, setDeal] = useState<Deal | null>(initialDeal)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const { canEditDeal, canDeleteDeal } = usePermissions()
  const { workspaceId, user } = useAuth()
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    pipeline_stage_id: "",
    owner_id: "",
    close_date: ""
  })

  useEffect(() => {
    setDeal(initialDeal)
    if (initialDeal) {
      setFormData({
        title: initialDeal.title ?? "",
        amount: initialDeal.amount ?? 0,
        pipeline_stage_id: initialDeal.pipeline_stage_id ?? "",
        owner_id: initialDeal.owner_id ?? "",
        close_date: initialDeal.close_date ? new Date(initialDeal.close_date).toISOString().split('T')[0] : ""
      })
    }
  }, [initialDeal])

  useEffect(() => {
    if (isEditing) {
      authService.listProfiles(workspaceId!).then(({ data }) => {
        if (data) setProfiles(data)
      }).catch(err => console.error("[preview]", err))
    }
  }, [isEditing])

  // Fetch pipeline stages for the stage dropdown
  useEffect(() => {
    if (!open || !workspaceId || !deal?.pipeline_id) return
    pipelinesService.getAll(workspaceId).then(({ data }) => {
      if (data) {
        const pipeline = data.find(p => p.id === deal.pipeline_id) || data.find(p => p.is_default) || data[0]
        if (pipeline?.stages) setPipelineStages(pipeline.stages)
      }
    }).catch(err => console.error("[preview] failed to load stages:", err))
  }, [open, workspaceId, deal?.pipeline_id])

  if (!deal) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: any = {
        ...formData,
        pipeline_stage_id: formData.pipeline_stage_id || undefined,
        owner_id: (formData.owner_id === "" || formData.owner_id === "unassigned") ? null : formData.owner_id,
        amount: Number(formData.amount)
      }

      const { data, error } = await dealsService.update(deal.id, updates, workspaceId!)
      if (error) throw error
      
      setDeal(data as unknown as Deal)
      setIsEditing(false)
      toast.success("Deal updated successfully")
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update deal")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deal) return
    if (!window.confirm(`Are you sure you want to delete ${deal.title}?`)) return

    setIsSaving(true)
    try {
      const { error } = await dealsService.delete(deal.id, workspaceId!)
      if (error) throw error
      
      toast.success("Deal deleted successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete deal")
    } finally {
      setIsSaving(false)
    }
  }

  const ownerName = deal.owner ? `${deal.owner.first_name} ${deal.owner.last_name}` : "Unassigned";
  const stageLabel = (deal.stage ?? 'discovery').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        style={{ top: '56px', height: 'calc(100vh - 56px)' }}
        className="w-[500px] sm:w-[540px] p-0 flex flex-col hide-scrollbar border-t border-border shadow-2xl"
        side="right"
      >
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Deal Details</SheetTitle>
            <SheetDescription>Details for deal {deal.title}</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        {/* Header Section */}
        <div className="bg-[color:var(--color-slate-50)] border-b border-border/60 px-6 py-6 sticky top-0 z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className={`h-16 w-16 rounded-md border-2 border-primary-foreground shadow-sm flex items-center justify-center overflow-hidden shrink-0 bg-status-success/10`}>
                <Handshake className="h-8 w-8 text-status-success" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-heading font-medium text-foreground pb-0">
                  {deal.title}
                </span>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="font-bold text-foreground">${deal.amount.toLocaleString()}</span>
                  <span>•</span>
                  <span className="font-medium text-status-success uppercase tracking-wider text-[11px]">{stageLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canDeleteDeal && (
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
                      Delete deal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center gap-2 mt-2">
            <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-sm tracking-wide px-4 h-8 flex-1">
              Create note
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-sm bg-background flex-1 text-muted-foreground gap-1.5 font-medium">
              <Target className="h-[14px] w-[14px]" />
              Update stage
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="px-6 py-5 flex flex-col gap-8">

            {/* About Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[15px] flex items-center gap-2 text-foreground">
                  <Handshake className="h-4 w-4 text-muted-foreground/70" />
                  Deal Details
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
                      className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  canEditDeal && (
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
                      <span className="text-muted-foreground">Title</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Amount ($)</span>
                      <Input 
                        type="number"
                        min="0"
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Stage</span>
                      <div className="col-span-2">
                        <Select 
                          value={formData.pipeline_stage_id} 
                          onValueChange={(v) => setFormData({ ...formData, pipeline_stage_id: v })}
                        >
                          <SelectTrigger className="h-8 text-[13px]">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {(pipelineStages.length > 0 ? pipelineStages : []).map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Close date</span>
                      <Input 
                        type="date"
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.close_date}
                        onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                      />
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
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="col-span-2 text-foreground font-bold">${deal.amount.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Deal stage</span>
                      <span className="col-span-2 text-foreground font-medium capitalize">{stageLabel}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Close date</span>
                      <span className="col-span-2 text-foreground font-medium">{deal.close_date ? new Date(deal.close_date).toLocaleDateString() : "--"}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Deal owner</span>
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
                  <Building className="h-4 w-4 text-muted-foreground/70" />
                  Associated Records
               </h3>
               {deal.company && (
                 <div className="p-4 bg-[color:var(--color-slate-50)] border rounded-md flex items-center gap-3">
                    <div className="h-10 w-10 bg-background border rounded flex items-center justify-center font-bold text-muted-foreground/70">
                      {deal.company.name.substring(0, 1)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-primary hover:underline cursor-pointer">{deal.company.name}</span>
                      <span className="text-xs text-muted-foreground">Company</span>
                    </div>
                 </div>
               )}
               {deal.contact && (
                 <div className="p-4 bg-[color:var(--color-slate-50)] border rounded-md flex items-center gap-3 mt-2">
                    <div className="h-10 w-10 bg-background border rounded-full flex items-center justify-center font-bold text-muted-foreground/70">
                      {deal.contact.first_name.substring(0, 1)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-primary hover:underline cursor-pointer">{deal.contact.first_name} {deal.contact.last_name}</span>
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
