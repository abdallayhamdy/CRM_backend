"use client"

import { Contact, Profile } from "@/lib/types/crm"
import { Button } from "@/components/ui/button"
import { X, MoreHorizontal, Pencil, Building, User, Check, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { contactsService } from "@/services/contacts"
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
import { LifecycleBadge } from "@/components/crm/LifecycleBadge"
import { LifecycleDropdown } from "@/components/crm/LifecycleDropdown"

interface ContactPreviewPanelProps {
  contact: Contact
  onClose: () => void
  onSuccess?: () => void
}

export function ContactPreviewPanel({ contact: initialContact, onClose, onSuccess }: ContactPreviewPanelProps) {
  const [contact, setContact] = useState<Contact>(initialContact)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])

  const { canEditContact, canDeleteContact } = usePermissions()
  const { workspaceId, user } = useAuth()

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
    setFormData({
      first_name: initialContact.first_name ?? "",
      last_name: initialContact.last_name ?? "",
      email: initialContact.email ?? "",
      phone: initialContact.phone ?? "",
      lifecycle_stage: initialContact.lifecycle_stage ?? "lead",
      owner_id: initialContact.owner_id ?? ""
    })
    setIsEditing(false)
  }, [initialContact])

  useEffect(() => {
    if (isEditing) {
      authService.listProfiles(workspaceId!).then(({ data }) => {
        if (data) setProfiles(data)
      }).catch(() => {})
    }
  }, [isEditing])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: Record<string, unknown> = {
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
      const message = err instanceof Error ? err.message : "Failed to update contact"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${fullName}?`)) return
    setIsSaving(true)
    try {
      const { error } = await contactsService.delete(contact.id, workspaceId!)
      if (error) throw error
      toast.success("Contact deleted successfully")
      onClose()
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete contact"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const firstName = contact.first_name || ""
  const lastName = contact.last_name || ""
  const fullName = `${firstName} ${lastName}`.trim()
  const initial1 = firstName.charAt(0) || ""
  const initial2 = lastName.charAt(0) || ""
  const initials = `${initial1}${initial2}`.toUpperCase() || "?"
  const company = contact.company?.name || "Example Corp"
  const jobTitle = "Manager"
  const ownerName = contact.owner ? `${contact.owner.first_name} ${contact.owner.last_name}` : "Unassigned"

  return (
    <>
      {/* Header */}
      <div className="border-b border-border px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-status-info-light flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-status-info">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-foreground truncate">{fullName}</div>
            <div className="text-[12px] text-muted-foreground truncate">{company} • {jobTitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canDeleteContact && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleDelete}>
                  Delete contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 flex flex-col gap-6">
          {/* About Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[13px] flex items-center gap-2 text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                About {firstName}
              </h3>
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-muted-foreground px-2 text-[12px]" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-7 bg-primary text-primary-foreground gap-1 text-[12px]" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </Button>
                </div>
              ) : canEditContact ? (
                <Pencil className="h-3.5 w-3.5 text-muted-foreground/70 cursor-pointer hover:text-foreground" onClick={() => setIsEditing(true)} />
              ) : null}
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-muted-foreground">First name</span>
                    <Input className="col-span-2 h-7 text-[12px]" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-muted-foreground">Last name</span>
                    <Input className="col-span-2 h-7 text-[12px]" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-muted-foreground">Email</span>
                    <Input className="col-span-2 h-7 text-[12px]" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-muted-foreground">Phone</span>
                    <Input className="col-span-2 h-7 text-[12px]" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-muted-foreground">Owner</span>
                    <div className="col-span-2">
                      <Select value={formData.owner_id || "unassigned"} onValueChange={(v) => setFormData({ ...formData, owner_id: v as string })}>
                        <SelectTrigger className="h-7 text-[12px]">
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {profiles.map(p => (
                            <SelectItem key={p.id} value={p.clerk_user_id || p.id}>{p.first_name} {p.last_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-muted-foreground">Lifecycle</span>
                    <div className="col-span-2">
                      <LifecycleDropdown value={formData.lifecycle_stage} onChange={(v) => setFormData({ ...formData, lifecycle_stage: v })} size="sm" objectType="contact" />
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
                    <span className="text-muted-foreground">Phone</span>
                    <span className="col-span-2 text-foreground font-medium">{contact.phone || "—"}</span>
                  </div>
                  <div className="grid grid-cols-3 items-center">
                    <span className="text-muted-foreground">Owner</span>
                    <div className="col-span-2 flex items-center gap-2 text-foreground font-medium">
                      <div className="h-5 w-5 bg-status-info-light rounded-full flex items-center justify-center text-[10px] text-primary">
                        {ownerName.charAt(0)}
                      </div>
                      {ownerName}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center">
                    <span className="text-muted-foreground">Lifecycle</span>
                    <div className="col-span-2">
                      <LifecycleBadge stageId={contact.lifecycle_stage} objectType="contact" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-border/40" />

          {/* Company Section */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-[13px] flex items-center gap-2 text-foreground">
              <Building className="h-3.5 w-3.5 text-muted-foreground/70" />
              Company
            </h3>
            <div className="p-3 bg-muted/30 border border-border rounded-md flex items-center gap-3">
              <div className="h-9 w-9 bg-background border shadow-sm rounded-sm flex items-center justify-center font-bold text-muted-foreground/70 text-[11px]">
                {company.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[13px] text-primary hover:underline cursor-pointer">{company}</span>
                <span className="text-muted-foreground text-[11px]">example.com</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-border/40" />

          {/* Timeline */}
          <div className="flex flex-col gap-3 pb-4">
            <h3 className="font-semibold text-[13px] text-foreground">Timeline</h3>
            <div className="flex flex-col gap-4 ml-1 relative">
              <div className="absolute left-[7px] top-3 bottom-0 w-[2px] bg-border/40" />
              <div className="flex gap-3 relative">
                <div className="h-3.5 w-3.5 rounded-full bg-status-info-light border-2 border-card z-10 shrink-0 flex items-center justify-center mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div className="flex flex-col text-[12px]">
                  <span className="font-semibold text-foreground">Note created</span>
                  <span className="text-muted-foreground">Today at 10:24 AM by {ownerName}</span>
                   <div className="mt-1.5 text-foreground bg-muted/30 p-2 rounded-md border border-border text-[12px] italic">
                    &quot;Left a voicemail to introduce our new enterprise features. Will follow up next week.&quot;
                  </div>
                </div>
              </div>
              <div className="flex gap-3 relative">
                <div className="h-3.5 w-3.5 rounded-full bg-muted border-2 border-card z-10 shrink-0 flex items-center justify-center mt-0.5" />
                <div className="flex flex-col text-[12px]">
                  <span className="font-semibold text-foreground">Contact created</span>
                  <span className="text-muted-foreground">Yesterday at 3:12 PM via Offline Sources</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
