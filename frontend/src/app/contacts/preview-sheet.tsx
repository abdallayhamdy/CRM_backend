"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  VisuallyHidden,
} from "@/components/ui/sheet"
import { Contact } from "@/lib/types/crm"
import { Button } from "@/components/ui/button"
import { X, MoreHorizontal, Pencil, Building, User, Check, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { contactsService } from "@/services/contacts"
import { authService } from "@/services/auth"
import { Profile } from "@/lib/types/crm"
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
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LifecycleBadge } from "@/components/crm/LifecycleBadge"
import { LifecycleDropdown } from "@/components/crm/LifecycleDropdown"

interface PreviewSheetProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ContactPreviewSheet({ contact: initialContact, open, onOpenChange, onSuccess }: PreviewSheetProps) {
  const [contact, setContact] = useState<Contact | null>(initialContact)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  
  const { canEditContact, canDeleteContact } = usePermissions()
  const { workspaceId, user } = useAuth()
  
  // Form state
  interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    lifecycle_stage: string | null;
    owner_id: string;
  }
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    lifecycle_stage: "lead",
    owner_id: ""
  })

  useEffect(() => {
    setContact(initialContact)
    if (initialContact) {
      setFormData({
        first_name: initialContact.first_name ?? "",
        last_name: initialContact.last_name ?? "",
        email: initialContact.email ?? "",
        phone: initialContact.phone ?? "",
        lifecycle_stage: initialContact.lifecycle_stage ?? "lead",
        owner_id: initialContact.owner_id ?? ""
      })
    }
  }, [initialContact])

  useEffect(() => {
    if (isEditing) {
      authService.listProfiles(workspaceId!).then(({ data }) => {
        if (data) setProfiles(data)
      }).catch(err => console.error("[preview]", err))
    }
  }, [isEditing])

  if (!contact) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Sanitise data for API (UUID fields must be valid UUID or null, not empty string)
      const updates: any = {
        ...formData,
        owner_id: (formData.owner_id === "" || formData.owner_id === "unassigned") ? null : formData.owner_id
      }

      const { data, error } = await contactsService.update(contact.id, updates, workspaceId!)
      if (error) throw error
      
      setContact(data as unknown as Contact)
      setIsEditing(false)
      toast.success("Contact updated successfully")
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update contact")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contact) return
    if (!window.confirm(`Are you sure you want to delete ${fullName}?`)) return

    setIsSaving(true)
    try {
      const { error } = await contactsService.delete(contact.id, workspaceId!)
      if (error) throw error
      
      toast.success("Contact deleted successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contact")
    } finally {
      setIsSaving(false)
    }
  }

  // Derive some basic display properties from the simplified mocked Contact model.
  const firstName = contact.first_name || "";
  const lastName = contact.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initial1 = firstName.charAt(0) || "";
  const initial2 = lastName.charAt(0) || "";
  const initials = `${initial1}${initial2}`.toUpperCase() || "?";
  
  const company = contact.company?.name || "Example Corp";
  const jobTitle = "Manager";
  const ownerName = contact.owner ? `${contact.owner.first_name} ${contact.owner.last_name}` : "Unassigned";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        style={{ top: '56px', height: 'calc(100vh - 56px)' }}
        className="w-[500px] sm:w-[540px] p-0 flex flex-col hide-scrollbar border-t border-border shadow-2xl"
        side="right"
      >
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Contact Details</SheetTitle>
            <SheetDescription>Previewing details for {fullName}</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>

        {/* Header Section */}
        <div className="bg-muted/30 border-b border-border/60 px-6 py-6 sticky top-0 z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className={`h-16 w-16 rounded-full border-2 border-[var(--color-hs-card-bg)] shadow-sm flex items-center justify-center overflow-hidden shrink-0 bg-status-info-light`}>
                <span className="text-xl font-semibold text-status-info">
                  {initials}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-heading font-medium text-foreground pb-0">
                  {fullName}
                </span>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="font-medium text-primary hover:underline cursor-pointer">{company}</span>
                  <span>•</span>
                  <span>{jobTitle}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canDeleteContact && (
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
                      Delete contact
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
                  <User className="h-4 w-4 text-muted-foreground/70" />
                  About {firstName}
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
                ) : canEditContact ? (
                  <Pencil 
                    className="h-[14px] w-[14px] text-muted-foreground/70 cursor-pointer hover:text-foreground" 
                    onClick={() => setIsEditing(true)}
                  />
                ) : null}
              </div>
              
              <div className="flex flex-col gap-4 text-[13px]">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">First name</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Last name</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <span className="text-muted-foreground">Email</span>
                      <Input 
                        className="col-span-2 h-8 text-[13px]" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                          objectType="contact"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Email</span>
                      <span className="col-span-2 text-primary hover:underline cursor-pointer font-medium">{contact.email}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Phone number</span>
                      <span className="col-span-2 text-foreground font-medium">{contact.phone || "--"}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Contact owner</span>
                      <div className="col-span-2 flex items-center gap-2 text-foreground font-medium">
                        <div className="h-5 w-5 bg-muted rounded-full flex items-center justify-center text-[10px] bg-status-info-light text-primary">
                          {ownerName.charAt(0)}
                        </div>
                        {ownerName}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <span className="text-muted-foreground">Lifecycle stage</span>
                      <div className="col-span-2">
                        <LifecycleBadge stageId={contact.lifecycle_stage} objectType="contact" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-border/60" />

            {/* Company Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[15px] flex items-center gap-2 text-foreground">
                  <Building className="h-4 w-4 text-muted-foreground/70" />
                  Company
                </h3>
              </div>
              <div className="p-4 bg-muted/30 border rounded-md flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-background border shadow-sm rounded-sm flex items-center justify-center font-bold text-muted-foreground/70 text-sm">
                      {company.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-primary hover:underline cursor-pointer">{company}</span>
                      <span className="text-muted-foreground text-[12px]">example.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-border/60" />

            {/* Mock Timeline */}
            <div className="flex flex-col gap-4 pb-12">
              <h3 className="font-semibold text-[15px] text-foreground">Timeline</h3>
              <div className="flex flex-col gap-6 ml-2 relative">
                <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-muted" />

                <div className="flex gap-4 relative">
                  <div className="h-4 w-4 rounded-full bg-status-info-light border-2 border-[var(--color-hs-card-bg)] z-10 shrink-0 flex items-center justify-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex flex-col text-[13px]">
                    <span className="font-semibold text-foreground">Note created</span>
                    <span className="text-muted-foreground">Today at 10:24 AM by {ownerName}</span>
                    <div className="mt-2 text-foreground bg-muted/30 p-3 rounded-md border text-[13px] italic">
                      &quot;Left a voicemail to introduce our new enterprise features. Will follow up next week.&quot;
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="h-4 w-4 rounded-full bg-muted border-2 border-[var(--color-hs-card-bg)] z-10 shrink-0 flex items-center justify-center mt-1" />
                  <div className="flex flex-col text-[13px]">
                    <span className="font-semibold text-foreground">Contact created</span>
                    <span className="text-muted-foreground">Yesterday at 3:12 PM via Offline Sources</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </SheetContent>
    </Sheet>
  )
}
