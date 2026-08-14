"use client"

import React from "react"
import { X, Search, CheckSquare, Square, ChevronDown, ChevronUp, User, Mail, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { contactsService } from "@/services/contacts"
import { companiesService } from "@/services/companies"
import { Company } from "@/lib/types/crm"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Tab = "create" | "existing"

interface ContactResult {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

interface AddContactSheetProps {
  open: boolean
  onClose: () => void
  companyId: string
  companyName?: string
  workspaceId?: string
  onSuccess: () => void
}

export function AddContactSheet({
  open,
  onClose,
  companyId,
  companyName,
  workspaceId,
  onSuccess,
}: AddContactSheetProps) {
  const [tab, setTab] = React.useState<Tab>("create")
  const [search, setSearch] = React.useState("")
  const [contacts, setContacts] = React.useState<ContactResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)

  // Fetch contacts when on "existing" tab
  React.useEffect(() => {
    if (tab !== "existing" || !open) return
    const load = async () => {
      if (!workspaceId) return
      setLoading(true)
      const { data } = await contactsService.getAll({
        search: "",
        workspace_id: workspaceId,
        limit: 100
      })
      setContacts((data as ContactResult[]) || [])
      setLoading(false)
    }
    load()
  }, [tab, open, workspaceId])

  // Live search filter
  const filtered = React.useMemo(() => {
    if (!search.trim()) return contacts
    return contacts.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
  }, [contacts, search])

  const visibleContacts = showAll ? filtered : filtered.slice(0, 10)

  const handleSaveExisting = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await companiesService.update(companyId, { contacts: [{ id: selectedId }] } as any, workspaceId!)
      if (error) throw error
      toast.success("Contact associated successfully")
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to associate contact")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-[16px] font-bold text-foreground">
                {tab === "create" ? "Create Contact" : "Add existing Contact"}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab("create")}
                className={cn(
                  "flex-1 py-3 text-[13px] font-semibold border-b-2 transition-colors",
                  tab === "create"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground/60 hover:text-foreground"
                )}
              >
                Create new
              </button>
              <button
                onClick={() => setTab("existing")}
                className={cn(
                  "flex-1 py-3 text-[13px] font-semibold border-b-2 transition-colors",
                  tab === "existing"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground/60 hover:text-foreground"
                )}
              >
                Add existing
              </button>
            </div>

            {tab === "create" ? (
              <div className="flex-1 overflow-auto">
                <InlineCreateContactForm
                  companyId={companyId}
                  workspaceId={workspaceId}
                  onSuccess={() => { onSuccess(); onClose() }}
                  onCancel={onClose}
                />
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="px-5 pt-4 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search Contacts"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-border rounded-full bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-5 pb-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2 mt-2">
                          {search ? "Results" : "Recent Contacts"}
                        </p>
                        {visibleContacts.map(contact => (
                          <ContactRow
                            key={contact.id}
                            contact={contact}
                            selected={selectedId === contact.id}
                            onToggle={() => setSelectedId(contact.id)}
                          />
                        ))}

                        {filtered.length > 10 && (
                          <button
                            onClick={() => setShowAll(v => !v)}
                            className="mt-2 flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary transition-colors"
                          >
                            {showAll ? (
                              <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                            ) : (
                              <><ChevronDown className="w-3.5 h-3.5" /> {filtered.length} items</>
                            )}
                          </button>
                        )}
                      </div>

                      {!loading && filtered.length === 0 && (
                        <p className="text-[13px] text-muted-foreground text-center py-10">
                          {search ? "No contacts match your search." : "No contacts found."}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-border flex items-center gap-3">
                  <button
                    onClick={handleSaveExisting}
                    disabled={!selectedId || saving}
                    className={cn(
                      "px-5 py-2 rounded text-[13px] font-semibold transition-colors",
                      selectedId && !saving
                        ? "bg-accent text-primary-foreground hover:bg-destructive"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded text-[13px] font-semibold border border-border text-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ContactRow({
  contact,
  selected,
  onToggle,
}: {
  contact: ContactResult
  selected: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 py-2.5 px-2 rounded-md cursor-pointer transition-colors hover:bg-accent",
        selected && "bg-muted/50"
      )}
    >
      <div className="shrink-0 text-muted-foreground/60">
        {selected ? (
          <CheckSquare className="w-4 h-4 text-primary" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">{contact.first_name} {contact.last_name}</p>
        {contact.email && (
          <p className="text-[11px] text-muted-foreground truncate">{contact.email}</p>
        )}
      </div>
    </div>
  )
}

function InlineCreateContactForm({
  companyId,
  workspaceId,
  onSuccess,
  onCancel,
}: {
  companyId: string
  workspaceId?: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleCreate = async () => {
    if (!firstName.trim()) { toast.error("First name is required"); return }
    setSaving(true)

    // 1. Create the contact
    const { data: contact, error: createError } = await contactsService.create({
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      workspace_id: workspaceId,
    }) as any

    if (createError || !contact) {
      setSaving(false)
      toast.error("Failed to create contact")
      return
    }

    // 2. Associate with company
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await companiesService.update(companyId, { contacts: [{ id: contact.id }] } as any, workspaceId!)

    setSaving(false)
    if (updateError) {
      toast.error("Contact created but failed to associate with company")
      return
    }

    toast.success("Contact created and associated")
    onSuccess()
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          First name <span className="text-destructive">*</span>
        </label>
        <input
          autoFocus
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
          placeholder="e.g. John"
        />
      </div>

      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Last name
        </label>
        <input
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
          placeholder="e.g. Doe"
        />
      </div>

      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
            placeholder="john@acme.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Phone
        </label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
          placeholder="e.g. +1 234 567 890"
        />
      </div>

      <div className="pt-2 flex items-center gap-3 border-t border-border">
        <button
          onClick={handleCreate}
          disabled={saving || !firstName.trim()}
          className={cn(
            "px-4 py-2 rounded text-[13px] font-semibold transition-colors",
            !saving && firstName.trim()
              ? "bg-accent text-primary-foreground hover:bg-destructive"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {saving ? "Creating…" : "Create"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded text-[13px] font-semibold border border-border text-foreground hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
