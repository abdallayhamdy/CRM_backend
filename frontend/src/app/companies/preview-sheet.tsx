"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  VisuallyHidden,
} from "@/components/ui/sheet"
import { Company, Profile } from "@/lib/types/crm"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Calendar, MoreHorizontal, Pencil, Building, User, Check, Loader2, Mail } from "lucide-react"
import { useState, useEffect } from "react"
import { companiesService } from "@/services/companies"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/auth"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
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
import { LifecycleBadge } from "@/components/crm/LifecycleBadge"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LifecycleDropdown } from "@/components/crm/LifecycleDropdown"

interface PreviewSheetProps {
  company: Company | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CompanyPreviewSheet({ company: initialCompany, open, onOpenChange, onSuccess }: PreviewSheetProps) {
  const { workspaceId, user } = useAuth()
  const [company, setCompany] = useState<Company | null>(initialCompany)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const { canEditCompany, canDeleteCompany } = usePermissions()
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    industry: "",
    phone: "",
    owner_id: "",
    lifecycle_stage: "lead"
  })

  useEffect(() => {
    setCompany(initialCompany)
    if (initialCompany) {
      setFormData({
        name: initialCompany.name ?? "",
        domain: initialCompany.domain ?? "",
        industry: initialCompany.industry ?? "",
        phone: initialCompany.phone ?? "",
        owner_id: initialCompany.owner_id ?? "",
        lifecycle_stage: initialCompany.lifecycle_stage ?? "lead"
      })
    }
  }, [initialCompany])

  useEffect(() => {
    if (isEditing) {
      authService.listProfiles(workspaceId!).then(({ data }) => {
        if (data) setProfiles(data)
      }).catch(err => console.error("[preview]", err))
    }
  }, [isEditing])

  if (!company) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: Partial<Company> = {
        ...formData,
        lifecycle_stage: formData.lifecycle_stage,
        owner_id: (formData.owner_id === "" || formData.owner_id === "unassigned") ? null : formData.owner_id
      }

      const { data, error } = await companiesService.update(company.id, updates, workspaceId!)
      if (error) throw error
      
      setCompany(data as unknown as Company)
      setIsEditing(false)
      toast.success("Company updated successfully")
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update company"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!company) return
    if (!window.confirm(`Are you sure you want to delete ${company.name}?`)) return

    setIsSaving(true)
    try {
      const { error } = await companiesService.delete(company.id, workspaceId!)
      if (error) throw error
      
      toast.success("Company deleted successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete company"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const initials = company.name.substring(0, 2).toUpperCase() || "??";
  const ownerName = company.owner ? `${company.owner.first_name} ${company.owner.last_name}` : "Unassigned";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        style={{ top: '56px', height: 'calc(100vh - 56px)' }}
        className="w-[500px] sm:w-[540px] p-0 flex flex-col hide-scrollbar border-t border-border shadow-2xl"
        side="right"
      >
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Company Details</SheetTitle>
            <SheetDescription>Details for company {company.name}</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        {/* Header Section */}
        <div className="bg-muted/30 border-b border-border/60 px-6 py-6 sticky top-0 z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className={`h-16 w-16 rounded-sm border-2 border-primary-foreground shadow-sm flex items-center justify-center overflow-hidden shrink-0 bg-status-info-light`}>
                <span className="text-xl font-semibold text-status-info">
                  {initials}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-heading font-medium text-foreground pb-0">
                  {company.name}
                </span>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="font-medium text-primary hover:underline cursor-pointer">{company.domain || "no domain"}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canDeleteCompany && (
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
                      Delete company
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
                  <Building className="h-4 w-4 text-muted-foreground/70" />
                  About {company.name}
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
                  canEditCompany && (
                    <Pencil 
                      className="h-[14px] w-[14px] text-muted-foreground/70 cursor-pointer hover:text-foreground" 
                      onClick={() => setIsEditing(true)}
                    />
                  )
                )}
              </div>
              
              <div className="flex flex-col gap-4 text-[13px]">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Name</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Domain</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Industry</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Phone</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Lifecycle</span>
                      <div className="col-span-2">
                        <LifecycleDropdown
                          value={formData.lifecycle_stage}
                          onChange={(v) => setFormData({ ...formData, lifecycle_stage: v })}
                          size="sm"
                          objectType="company"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Lifecycle stage</span>
                      <div className="col-span-2">
                        <LifecycleBadge stageId={company.lifecycle_stage} objectType="company" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Domain</span>
                      <span className="col-span-2 text-primary hover:underline cursor-pointer font-medium">{company.domain || "--"}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="col-span-2 text-foreground font-medium">{company.industry || "--"}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Phone number</span>
                      <span className="col-span-2 text-foreground font-medium">{company.phone || "--"}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Company owner</span>
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
            
            {/* Contacts and Deals counts */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-muted/30 border rounded-md">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Contacts</span>
                  <div className="text-2xl font-bold text-foreground mt-1">{(company.contacts as unknown as { count: number }[])?.[0]?.count || 0}</div>
               </div>
               <div className="p-4 bg-muted/30 border rounded-md">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Deals</span>
                  <div className="text-2xl font-bold text-foreground mt-1">{(company.deals as unknown as { count: number }[])?.[0]?.count || 0}</div>
               </div>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
