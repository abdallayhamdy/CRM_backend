"use client"

import React from "react"
import { X, Search, CheckSquare, Square, ChevronDown, ChevronUp, Building2, Globe, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { companiesService } from "@/services/companies"
import { contactsService } from "@/services/contacts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Tab = "create" | "existing"

interface CompanyResult {
  id: string
  name: string
  domain: string | null
}

interface AddCompanySheetProps {
  open: boolean
  onClose: () => void
  contactId: string
  contactName?: string
  workspaceId?: string
  onSuccess: () => void
}

export function AddCompanySheet({
  open,
  onClose,
  contactId,
  contactName,
  workspaceId,
  onSuccess,
}: AddCompanySheetProps) {
  const [tab, setTab] = React.useState<Tab>("create")
  const [search, setSearch] = React.useState("")
  const [companies, setCompanies] = React.useState<CompanyResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)

  // Fetch companies when on "existing" tab
  React.useEffect(() => {
    if (tab !== "existing" || !open) return
    const load = async () => {
      if (!workspaceId) return
      setLoading(true)
      const { data } = await companiesService.getAll({ 
        search: "", 
        workspace_id: workspaceId,
        limit: 100 
      })
      setCompanies((data as CompanyResult[]) || [])
      setLoading(false)
    }
    load()
  }, [tab, open, workspaceId])

  // Live search filter
  const filtered = React.useMemo(() => {
    if (!search.trim()) return companies
    return companies.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.domain?.toLowerCase().includes(search.toLowerCase())
    )
  }, [companies, search])

  const visibleCompanies = showAll ? filtered : filtered.slice(0, 10)

  const handleSaveExisting = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      const { error } = await contactsService.update(contactId, {
        company_id: selectedId
      }, workspaceId!)
      if (error) throw error
      toast.success("Company associated successfully")
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to associate company")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
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
                {tab === "create" ? "Create Company" : "Add existing Company"}
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
                <InlineCreateCompanyForm
                  contactId={contactId}
                  workspaceId={workspaceId}
                  onSuccess={() => {
                    onSuccess()
                    onClose()
                  }}
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
                      placeholder="Search Companies"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
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
                          {search ? "Results" : "Recent Companies"}
                        </p>
                        {visibleCompanies.map((company) => (
                          <CompanyRow
                            key={company.id}
                            company={company}
                            selected={selectedId === company.id}
                            onToggle={() => setSelectedId(company.id)}
                          />
                        ))}

                        {filtered.length > 10 && (
                          <button
                            onClick={() => setShowAll((v) => !v)}
                            className="mt-2 flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary transition-colors"
                          >
                            {showAll ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" /> Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" /> {filtered.length} items
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {!loading && filtered.length === 0 && (
                        <p className="text-[13px] text-muted-foreground text-center py-10">
                          {search ? "No companies match your search." : "No companies found."}
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

function CompanyRow({
  company,
  selected,
  onToggle,
}: {
  company: CompanyResult
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
        <p className="text-[13px] font-semibold text-foreground truncate">{company.name}</p>
        {company.domain && (
          <p className="text-[11px] text-muted-foreground truncate">{company.domain}</p>
        )}
      </div>
    </div>
  )
}

function InlineCreateCompanyForm({
  contactId,
  workspaceId,
  onSuccess,
  onCancel,
}: {
  contactId: string
  workspaceId?: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name, setName] = React.useState("")
  const [domain, setDomain] = React.useState("")
  const [industry, setIndustry] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Company name is required"); return }
    setSaving(true)
    
    // 1. Create the company
    const { data: company, error: createError } = await companiesService.create({
      name: name.trim(),
      domain: domain.trim() || undefined,
      industry: industry.trim() || undefined,
      workspace_id: workspaceId,
    })

    if (createError || !company) {
      setSaving(false)
      toast.error("Failed to create company")
      return
    }

    // 2. Associate with contact
    const { error: updateError } = await contactsService.update(contactId, {
      company_id: (company as any)?.id
    }, workspaceId!)

    setSaving(false)
    if (updateError) {
      toast.error("Company created but failed to associate with contact")
      return
    }

    toast.success("Company created and associated")
    onSuccess()
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Company name <span className="text-destructive">*</span>
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
          placeholder="e.g. Acme Corp"
        />
      </div>

      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Company domain name
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
            placeholder="acme.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Industry
        </label>
        <input
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
          placeholder="e.g. Technology"
        />
      </div>

      <div className="pt-2 flex items-center gap-3 border-t border-border">
        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className={cn(
            "px-4 py-2 rounded text-[13px] font-semibold transition-colors",
            !saving && name.trim()
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
