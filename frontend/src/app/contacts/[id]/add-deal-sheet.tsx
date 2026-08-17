"use client"

import React from "react"
import { X, Search, CheckSquare, Square, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { dealsService } from "@/services/deals"
import { CreateDealSheet } from "@/app/deals/create-deal-sheet"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { CustomFieldsForm } from "@/components/properties/CustomFieldsForm"
import type { CustomFieldError } from "@/components/properties/CustomFieldsForm"

type Tab = "create" | "existing"

interface DealResult {
  id: string
  title: string
  stage: string | null
  amount: number | null
  contact_id: string | null
}

interface AddDealSheetProps {
  open: boolean
  onClose: () => void
  contactId?: string
  contactName?: string
  companyId?: string
  companyName?: string
  workspaceId?: string
  onSuccess: () => void
}

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  appointment_scheduled: "Appointment Scheduled",
}

const STAGE_COLORS: Record<string, string> = {
  new: "bg-status-info-light text-status-info",
  qualified: "bg-status-info-light text-status-info",
  proposal: "bg-status-warning-light text-status-warning",
  negotiation: "bg-status-warning-light text-status-warning",
  closed_won: "bg-status-success-light text-status-success",
  closed_lost: "bg-status-danger-light text-status-danger",
  appointment_scheduled: "bg-status-purple-light text-status-purple",
}

export function AddDealSheet({
  open,
  onClose,
  contactId,
  contactName,
  companyId,
  workspaceId,
  onSuccess,
}: AddDealSheetProps) {
  const [tab, setTab] = React.useState<Tab>("create")
  const [search, setSearch] = React.useState("")
  const [deals, setDeals] = React.useState<DealResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)

  // Fetch deals when on "existing" tab
  React.useEffect(() => {
    if (tab !== "existing" || !open) return
    const load = async () => {
      setLoading(true)
      const { data } = await dealsService.searchAll("", workspaceId)
      setDeals((data as DealResult[]) || [])
      setLoading(false)
    }
    load()
  }, [tab, open, workspaceId])

  // Live search filter
  const filtered = React.useMemo(() => {
    if (!search.trim()) return deals
    return deals.filter(d =>
      d.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [deals, search])

  // Already-associated deals (already linked to THIS contact)
  const alreadyLinked = filtered.filter(d => d.contact_id === contactId)
  const recommendations = filtered.filter(d => d.contact_id !== contactId)
  const visibleRecommendations = showAll ? recommendations : recommendations.slice(0, 10)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (selectedIds.length === 0) return
    setSaving(true)
    try {
      await Promise.all(
        selectedIds.filter(id => contactId).map(dealId => dealsService.associateContact(dealId, contactId!, workspaceId!))
      )
      toast.success(
        selectedIds.length === 1
          ? "Deal associated successfully"
          : `${selectedIds.length} deals associated`
      )
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to associate deal(s)")
    } finally {
      setSaving(false)
    }
  }

  // For "Create new" tab — delegate entirely to CreateDealSheet
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
            {tab === "create" ? "Create Deal" : "Add existing Deal"}
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
            <InlineCreateDealForm
              contactId={contactId}
              contactName={contactName}
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
                  placeholder="Search Deals"
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
                  {alreadyLinked.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
                        Already associated
                      </p>
                      {alreadyLinked.map(deal => (
                        <DealRow
                          key={deal.id}
                          deal={deal}
                          selected={false}
                          disabled
                          onToggle={() => {}}
                        />
                      ))}
                    </div>
                  )}

                  {recommendations.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
                        {search ? "Results" : "Recommendations"}
                      </p>
                      {visibleRecommendations.map(deal => (
                        <DealRow
                          key={deal.id}
                          deal={deal}
                          selected={selectedIds.includes(deal.id)}
                          disabled={false}
                          onToggle={() => toggleSelect(deal.id)}
                        />
                      ))}

                      {recommendations.length > 10 && (
                        <button
                          onClick={() => setShowAll(v => !v)}
                          className="mt-2 flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {showAll ? (
                            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                          ) : (
                            <><ChevronDown className="w-3.5 h-3.5" /> {recommendations.length} items</>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {!loading && recommendations.length === 0 && alreadyLinked.length === 0 && (
                    <p className="text-[13px] text-muted-foreground text-center py-10">
                      {search ? "No deals match your search." : "No deals found."}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={selectedIds.length === 0 || saving}
                className={cn(
                  "px-5 py-2 rounded text-[13px] font-semibold transition-colors",
                  selectedIds.length > 0 && !saving
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

// ─── Deal row ────────────────────────────────────────────────────────────────
function DealRow({
  deal,
  selected,
  disabled,
  onToggle,
}: {
  deal: DealResult
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const stageKey = deal.stage?.toLowerCase().replace(/ /g, "_") || ""
  const stageLabel = STAGE_LABELS[stageKey] ?? deal.stage ?? "—"
  const stageColor = STAGE_COLORS[stageKey] ?? "bg-muted text-foreground/70"

  return (
    <div
      onClick={disabled ? undefined : onToggle}
      className={cn(
        "flex items-center gap-3 py-2.5 px-2 rounded-md transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-accent"
      )}
    >
      <div className="shrink-0 text-muted-foreground/60">
        {disabled ? (
          <CheckSquare className="w-4 h-4 text-primary" />
        ) : selected ? (
          <CheckSquare className="w-4 h-4 text-primary" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">{deal.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {deal.amount != null && (
            <span className="text-[11px] text-muted-foreground font-bold">
              ${deal.amount.toLocaleString()}
            </span>
          )}
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", stageColor)}>
            {stageLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Inline create form ──────────────────────────────────────────────────────
// Embeds a minimal create-deal form inline (avoids a second Sheet portal)
function InlineCreateDealForm({
  contactId,
  contactName,
  companyId,
  workspaceId,
  onSuccess,
  onCancel,
}: {
  contactId?: string
  contactName?: string
  companyId?: string
  workspaceId?: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = React.useState("")
  const [stage, setStage] = React.useState("new")
  const [amount, setAmount] = React.useState("")
  const [closeDate, setCloseDate] = React.useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [saving, setSaving] = React.useState(false)
  const [customValues, setCustomValues] = React.useState<Record<string, unknown>>({})
  const [customFieldErrors, setCustomFieldErrors] = React.useState<CustomFieldError | null>(null)

  const handleCustomChange = (name: string, value: unknown) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (addAnother = false) => {
    if (!title.trim()) { toast.error("Deal name is required"); return }
    if (customFieldErrors) { toast.error("Please fix custom field errors"); return }
    setSaving(true)
    const { error } = await dealsService.create({
      title: title.trim(),
      stage: stage,
      amount: amount ? parseFloat(amount) : undefined,
      close_date: closeDate || undefined,
      contact_id: contactId,
      company_id: companyId,
      workspace_id: workspaceId,
      custom_fields: Object.keys(customValues).length > 0 ? customValues : undefined,
    })
    setSaving(false)
    if (error) { toast.error("Failed to create deal"); return }
    toast.success("Deal created")
    if (addAnother) {
      setTitle(""); setAmount(""); setCustomValues({})
    } else {
      onSuccess()
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-end">
        <a className="text-[12px] text-primary hover:underline cursor-pointer flex items-center gap-1">
          Edit this form ↗
        </a>
      </div>

      {/* Deal name */}
      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Deal name <span className="text-destructive">*</span>
        </label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border-2 border-primary rounded focus:outline-none"
          placeholder=""
        />
      </div>

      {/* Pipeline */}
      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Pipeline <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
            defaultValue="new"
          >
            <option value="new">new</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Deal stage */}
      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">
          Deal stage <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            className="w-full appearance-none px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
          >
            {Object.entries(STAGE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded focus:outline-none focus:border-primary"
          placeholder=""
        />
      </div>

      {/* Close date */}
      <div>
        <label className="block text-[13px] font-bold text-foreground mb-1">Close date</label>
        <DatePicker value={closeDate} onChange={setCloseDate} />
      </div>

      {/* Associated contact */}
      {contactName && (
        <div>
          <label className="block text-[13px] font-bold text-foreground mb-1">Contact</label>
          <div className="px-3 py-2 text-[13px] border border-border rounded bg-muted/50 text-foreground">
            {contactName}
          </div>
        </div>
      )}

      {/* Custom Fields */}
      <div className="border-t border-border pt-4">
        <CustomFieldsForm
          objectType="deal"
          values={customValues}
          onChange={handleCustomChange}
          onValidationChange={setCustomFieldErrors}
        />
      </div>

      {/* Footer buttons */}
      <div className="pt-2 flex items-center gap-3 border-t border-border">
        <button
          onClick={() => handleCreate(false)}
          disabled={saving}
          className={cn(
            "px-4 py-2 rounded text-[13px] font-semibold transition-colors",
            !saving && title.trim()
              ? "bg-accent text-primary-foreground hover:bg-destructive"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {saving ? "Creating…" : "Create"}
        </button>
        <button
          onClick={() => handleCreate(true)}
          disabled={saving || !title.trim()}
          className="px-4 py-2 rounded text-[13px] font-semibold border border-border text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create and add another
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
