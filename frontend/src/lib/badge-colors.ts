/**
 * Single source of truth for all badge/status color mappings.
 *
 * Every status type + value maps to one canonical set of Tailwind classes.
 * Uses the existing CSS variable system in globals.css (--status-*, --stage-*, --badge-*).
 *
 * CONFLICT RESOLUTION NOTES (review before merging):
 * - lifecycle "lead": crm-constants.ts used --stage-blue, default-object-configs used --stage-red,
 *   status-badge used stage-cyan. Chose stage-blue (most common semantic: new lead = blue).
 * - deal "qualified": crm-constants.ts used stage-indigo, Badge.tsx/deals detail used status-purple.
 *   Chose stage-indigo (more distinctive; purple was used for both qualified + proposal).
 * - deal "negotiation": crm-constants.ts used stage-pink, Badge.tsx used primary/20, deals detail
 *   used status-warning. Chose stage-pink (most distinctive).
 * - ticket priority "high": was same as "urgent" (danger) in some files. Now uses status-orange
 *   (new CSS variable) for clear visual progression: low→muted, medium→warning, high→orange, urgent→danger.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeStyle = "tinted" | "solid" | "bordered"

interface BadgeConfig {
  /** Tailwind classes for a light-tint background badge (bg-*-light text-*) */
  tinted: string
  /** Tailwind classes for a solid colored background badge (bg-* text-white) */
  solid: string
  /** Tailwind classes for a bordered/outlined badge (border-* bg-star/10 text-*) */
  bordered: string
  /** CSS variable value for inline style (e.g. "var(--stage-blue)") */
  cssVar: string
}

// ---------------------------------------------------------------------------
// Canonical color map — keyed by lowercase values
// ---------------------------------------------------------------------------

const BADGE_MAP: Record<string, Record<string, BadgeConfig>> = {
  // ── Lifecycle stages ──────────────────────────────────────────────────
  lifecycle: {
    subscriber: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate)",
    },
    lead: {
      tinted: "bg-status-info-light text-status-info",
      solid: "bg-stage-blue text-white",
      bordered: "border-status-info/30 text-status-info bg-status-info/10",
      cssVar: "var(--stage-blue)",
    },
    marketing_qualified_lead: {
      tinted: "bg-[hsl(var(--stage-cyan)/0.1)] text-[hsl(var(--stage-cyan)/0.85)]",
      solid: "bg-stage-cyan text-white",
      bordered: "border-[hsl(var(--stage-cyan)/0.3)] text-[hsl(var(--stage-cyan)/0.85)] bg-[hsl(var(--stage-cyan)/0.1)]",
      cssVar: "var(--stage-cyan)",
    },
    sales_qualified_lead: {
      tinted: "bg-[hsl(var(--stage-emerald)/0.1)] text-[hsl(var(--stage-emerald)/0.85)]",
      solid: "bg-stage-emerald text-white",
      bordered: "border-[hsl(var(--stage-emerald)/0.3)] text-[hsl(var(--stage-emerald)/0.85)] bg-[hsl(var(--stage-emerald)/0.1)]",
      cssVar: "var(--stage-emerald)",
    },
    opportunity: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    customer: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-green text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-green)",
    },
    evangelist: {
      tinted: "bg-[hsl(var(--stage-violet)/0.1)] text-[hsl(var(--stage-violet)/0.85)]",
      solid: "bg-stage-violet text-white",
      bordered: "border-[hsl(var(--stage-violet)/0.3)] text-[hsl(var(--stage-violet)/0.85)] bg-[hsl(var(--stage-violet)/0.1)]",
      cssVar: "var(--stage-violet)",
    },
    other: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-gray text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-gray)",
    },
  },

  // ── Lead statuses ─────────────────────────────────────────────────────
  lead_status: {
    new: {
      tinted: "bg-status-info-light text-status-info",
      solid: "bg-stage-blue text-white",
      bordered: "border-status-info/30 text-status-info bg-status-info/10",
      cssVar: "var(--stage-blue)",
    },
    open: {
      tinted: "bg-[hsl(var(--stage-cyan)/0.1)] text-[hsl(var(--stage-cyan)/0.85)]",
      solid: "bg-stage-cyan text-white",
      bordered: "border-[hsl(var(--stage-cyan)/0.3)] text-[hsl(var(--stage-cyan)/0.85)] bg-[hsl(var(--stage-cyan)/0.1)]",
      cssVar: "var(--stage-cyan)",
    },
    "in progress": {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    "open deal": {
      tinted: "bg-[hsl(var(--stage-emerald)/0.1)] text-[hsl(var(--stage-emerald)/0.85)]",
      solid: "bg-stage-emerald text-white",
      bordered: "border-[hsl(var(--stage-emerald)/0.3)] text-[hsl(var(--stage-emerald)/0.85)] bg-[hsl(var(--stage-emerald)/0.1)]",
      cssVar: "var(--stage-emerald)",
    },
    unqualified: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate-dark text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate-dark)",
    },
    "attempted to contact": {
      tinted: "bg-[hsl(var(--stage-indigo)/0.1)] text-[hsl(var(--stage-indigo)/0.85)]",
      solid: "bg-stage-indigo text-white",
      bordered: "border-[hsl(var(--stage-indigo)/0.3)] text-[hsl(var(--stage-indigo)/0.85)] bg-[hsl(var(--stage-indigo)/0.1)]",
      cssVar: "var(--stage-indigo)",
    },
    connected: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-green text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-green)",
    },
    "bad timing": {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-orange text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-orange)",
    },
  },

  // ── Deal stages ───────────────────────────────────────────────────────
  deal_stage: {
    new: {
      tinted: "bg-status-info-light text-status-info",
      solid: "bg-stage-blue text-white",
      bordered: "border-status-info/30 text-status-info bg-status-info/10",
      cssVar: "var(--stage-blue)",
    },
    qualified: {
      tinted: "bg-[hsl(var(--stage-indigo)/0.1)] text-[hsl(var(--stage-indigo)/0.85)]",
      solid: "bg-stage-indigo text-white",
      bordered: "border-[hsl(var(--stage-indigo)/0.3)] text-[hsl(var(--stage-indigo)/0.85)] bg-[hsl(var(--stage-indigo)/0.1)]",
      cssVar: "var(--stage-indigo)",
    },
    proposal: {
      tinted: "bg-status-purple-light text-status-purple",
      solid: "bg-stage-purple text-white",
      bordered: "border-status-purple/30 text-status-purple bg-status-purple/10",
      cssVar: "var(--stage-purple)",
    },
    negotiation: {
      tinted: "bg-[hsl(var(--stage-pink)/0.1)] text-[hsl(var(--stage-pink)/0.85)]",
      solid: "bg-stage-pink text-white",
      bordered: "border-[hsl(var(--stage-pink)/0.3)] text-[hsl(var(--stage-pink)/0.85)] bg-[hsl(var(--stage-pink)/0.1)]",
      cssVar: "var(--stage-pink)",
    },
    appointment_scheduled: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    closed_won: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-emerald text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-emerald)",
    },
    closed_lost: {
      tinted: "bg-status-danger-light text-status-danger",
      solid: "bg-stage-red text-white",
      bordered: "border-status-danger/30 text-status-danger bg-status-danger/10",
      cssVar: "var(--stage-red)",
    },
  },

  // ── Ticket statuses ───────────────────────────────────────────────────
  ticket_status: {
    open: {
      tinted: "bg-status-info-light text-status-info",
      solid: "bg-stage-blue text-white",
      bordered: "border-status-info/30 text-status-info bg-status-info/10",
      cssVar: "var(--stage-blue)",
    },
    pending: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    resolved: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-green text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-green)",
    },
    closed: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate)",
    },
  },

  // ── Ticket priorities ─────────────────────────────────────────────────
  // CONFLICT FIX: "high" was previously same as "urgent" (danger/red).
  // Now uses --status-orange for clear progression: low→muted, medium→warning, high→orange, urgent→danger
  ticket_priority: {
    low: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate)",
    },
    medium: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    high: {
      tinted: "bg-status-orange-light text-status-orange",
      solid: "bg-stage-orange text-white",
      bordered: "border-status-orange/30 text-status-orange bg-status-orange/10",
      cssVar: "var(--stage-orange)",
    },
    urgent: {
      tinted: "bg-status-danger-light text-status-danger",
      solid: "bg-stage-red text-white",
      bordered: "border-status-danger/30 text-status-danger bg-status-danger/10",
      cssVar: "var(--stage-red)",
    },
  },

  // ── Task statuses ─────────────────────────────────────────────────────
  task_status: {
    pending: {
      tinted: "bg-status-info-light text-status-info",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-info/30 text-status-info bg-status-info/10",
      cssVar: "var(--stage-amber)",
    },
    completed: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-green text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-green)",
    },
    cancelled: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-red text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-red)",
    },
  },

  // ── Task priorities ───────────────────────────────────────────────────
  task_priority: {
    low: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate)",
    },
    medium: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    high: {
      tinted: "bg-status-orange-light text-status-orange",
      solid: "bg-stage-orange text-white",
      bordered: "border-status-orange/30 text-status-orange bg-status-orange/10",
      cssVar: "var(--stage-orange)",
    },
    urgent: {
      tinted: "bg-status-danger-light text-status-danger",
      solid: "bg-stage-red text-white",
      bordered: "border-status-danger/30 text-status-danger bg-status-danger/10",
      cssVar: "var(--stage-red)",
    },
  },

  // ── Order statuses ────────────────────────────────────────────────────
  order_status: {
    open: {
      tinted: "bg-status-info-light text-status-info",
      solid: "bg-stage-blue text-white",
      bordered: "border-status-info/30 text-status-info bg-status-info/10",
      cssVar: "var(--stage-blue)",
    },
    paid: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-emerald text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-emerald)",
    },
    refunded: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
  },

  // ── Product statuses ──────────────────────────────────────────────────
  product_status: {
    active: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-green text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-green)",
    },
    archived: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate)",
    },
  },

  // ── Call outcomes ─────────────────────────────────────────────────────
  call_outcome: {
    connected: {
      tinted: "bg-status-success-light text-status-success",
      solid: "bg-stage-green text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-green)",
    },
    busy: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    "no-answer": {
      tinted: "bg-status-danger-light text-status-danger",
      solid: "bg-stage-red text-white",
      bordered: "border-status-danger/30 text-status-danger bg-status-danger/10",
      cssVar: "var(--stage-red)",
    },
    "left-voicemail": {
      tinted: "bg-status-purple-light text-status-purple",
      solid: "bg-stage-purple text-white",
      bordered: "border-status-purple/30 text-status-purple bg-status-purple/10",
      cssVar: "var(--stage-purple)",
    },
    "wrong-number": {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate)",
    },
  },

  // ── Activity feed types ───────────────────────────────────────────────
  activity_type: {
    email: {
      tinted: "text-primary bg-primary/10 border-primary/20",
      solid: "bg-primary text-primary-foreground",
      bordered: "border-primary/30 text-primary bg-primary/10",
      cssVar: "var(--primary)",
    },
    note: {
      tinted: "text-status-warning bg-status-warning/10 border-status-warning/20",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    task: {
      tinted: "text-status-purple bg-status-purple/10 border-status-purple/20",
      solid: "bg-stage-purple text-white",
      bordered: "border-status-purple/30 text-status-purple bg-status-purple/10",
      cssVar: "var(--stage-purple)",
    },
    call: {
      tinted: "text-status-success bg-status-success/10 border-status-success/20",
      solid: "bg-stage-green text-white",
      bordered: "border-status-success/30 text-status-success bg-status-success/10",
      cssVar: "var(--stage-green)",
    },
    meeting: {
      tinted: "text-status-purple bg-status-purple/10 border-status-purple/20",
      solid: "bg-stage-purple text-white",
      bordered: "border-status-purple/30 text-status-purple bg-status-purple/10",
      cssVar: "var(--stage-purple)",
    },
    system: {
      tinted: "text-status-danger bg-status-danger/10 border-status-danger/20",
      solid: "bg-stage-red text-white",
      bordered: "border-status-danger/30 text-status-danger bg-status-danger/10",
      cssVar: "var(--stage-red)",
    },
  },

  // ── Document types ────────────────────────────────────────────────────
  document_type: {
    proposal: {
      tinted: "bg-status-info-light text-status-info",
      solid: "bg-stage-blue text-white",
      bordered: "border-status-info/30 text-status-info bg-status-info/10",
      cssVar: "var(--stage-blue)",
    },
    contract: {
      tinted: "bg-status-purple-light text-status-purple",
      solid: "bg-stage-purple text-white",
      bordered: "border-status-purple/30 text-status-purple bg-status-purple/10",
      cssVar: "var(--stage-purple)",
    },
    invoice: {
      tinted: "bg-status-warning-light text-status-warning",
      solid: "bg-stage-amber text-white",
      bordered: "border-status-warning/30 text-status-warning bg-status-warning/10",
      cssVar: "var(--stage-amber)",
    },
    general: {
      tinted: "bg-muted text-muted-foreground",
      solid: "bg-stage-slate text-white",
      bordered: "border-border text-muted-foreground bg-muted/50",
      cssVar: "var(--stage-slate)",
    },
  },

  // ── Super-admin: user status ──────────────────────────────────────────
  "sa:user_status": {
    active: {
      tinted: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      solid: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      bordered: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      cssVar: "var(--badge-success-bg)",
    },
    deactivated: {
      tinted: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      solid: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      bordered: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      cssVar: "var(--badge-danger-bg)",
    },
  },

  // ── Super-admin: invoice status ───────────────────────────────────────
  "sa:invoice_status": {
    paid: {
      tinted: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      solid: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      bordered: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      cssVar: "var(--badge-success-bg)",
    },
    pending: {
      tinted: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      solid: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      bordered: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      cssVar: "var(--badge-warning-bg)",
    },
    overdue: {
      tinted: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      solid: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      bordered: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      cssVar: "var(--badge-danger-bg)",
    },
  },

  // ── Super-admin: support priority ─────────────────────────────────────
  "sa:support_priority": {
    low: {
      tinted: "bg-badge-neutral-bg text-badge-neutral-text border-badge-neutral-border",
      solid: "bg-badge-neutral-bg text-badge-neutral-text border-badge-neutral-border",
      bordered: "bg-badge-neutral-bg text-badge-neutral-text border-badge-neutral-border",
      cssVar: "var(--badge-neutral-bg)",
    },
    medium: {
      tinted: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      solid: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      bordered: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      cssVar: "var(--badge-info-bg)",
    },
    high: {
      tinted: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      solid: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      bordered: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      cssVar: "var(--badge-warning-bg)",
    },
    urgent: {
      tinted: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      solid: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      bordered: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      cssVar: "var(--badge-danger-bg)",
    },
  },

  // ── Super-admin: support status ───────────────────────────────────────
  "sa:support_status": {
    open: {
      tinted: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      solid: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      bordered: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      cssVar: "var(--badge-info-bg)",
    },
    "in progress": {
      tinted: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      solid: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      bordered: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      cssVar: "var(--badge-warning-bg)",
    },
    resolved: {
      tinted: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      solid: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      bordered: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      cssVar: "var(--badge-success-bg)",
    },
    closed: {
      tinted: "bg-badge-neutral-bg text-badge-neutral-text border-badge-neutral-border",
      solid: "bg-badge-neutral-bg text-badge-neutral-text border-badge-neutral-border",
      bordered: "bg-badge-neutral-bg text-badge-neutral-text border-badge-neutral-border",
      cssVar: "var(--badge-neutral-bg)",
    },
  },

  // ── Super-admin: broadcast audience ───────────────────────────────────
  "sa:broadcast_audience": {
    "all tenants": {
      tinted: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      solid: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      bordered: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      cssVar: "var(--badge-info-bg)",
    },
    "active only": {
      tinted: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      solid: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      bordered: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      cssVar: "var(--badge-success-bg)",
    },
    "trial only": {
      tinted: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      solid: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      bordered: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      cssVar: "var(--badge-warning-bg)",
    },
  },

  // ── Super-admin: log level ────────────────────────────────────────────
  "sa:log_level": {
    error: {
      tinted: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      solid: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      bordered: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      cssVar: "var(--badge-danger-bg)",
    },
    warning: {
      tinted: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      solid: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      bordered: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      cssVar: "var(--badge-warning-bg)",
    },
    info: {
      tinted: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      solid: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      bordered: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      cssVar: "var(--badge-info-bg)",
    },
  },

  // ── Super-admin: queue status ─────────────────────────────────────────
  "sa:queue_status": {
    healthy: {
      tinted: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      solid: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      bordered: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      cssVar: "var(--badge-success-bg)",
    },
    delayed: {
      tinted: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      solid: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      bordered: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      cssVar: "var(--badge-warning-bg)",
    },
    failing: {
      tinted: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      solid: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      bordered: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      cssVar: "var(--badge-danger-bg)",
    },
  },

  // ── Super-admin: tenant status ────────────────────────────────────────
  "sa:tenant_status": {
    active: {
      tinted: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      solid: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      bordered: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      cssVar: "var(--badge-success-bg)",
    },
    trial: {
      tinted: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      solid: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      bordered: "bg-badge-info-bg text-badge-info-text border-badge-info-border",
      cssVar: "var(--badge-info-bg)",
    },
    suspended: {
      tinted: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      solid: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      bordered: "bg-badge-warning-bg text-badge-warning-text border-badge-warning-border",
      cssVar: "var(--badge-warning-bg)",
    },
    churned: {
      tinted: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      solid: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      bordered: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      cssVar: "var(--badge-danger-bg)",
    },
  },

  // ── Super-admin: API key status ───────────────────────────────────────
  "sa:api_key_status": {
    active: {
      tinted: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      solid: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      bordered: "bg-badge-success-bg text-badge-success-text border-badge-success-border",
      cssVar: "var(--badge-success-bg)",
    },
    inactive: {
      tinted: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      solid: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      bordered: "bg-badge-danger-bg text-badge-danger-text border-badge-danger-border",
      cssVar: "var(--badge-danger-bg)",
    },
  },
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the canonical Tailwind class string for a status type + value.
 *
 * @param type   Status type key (e.g. "ticket_priority", "deal_stage", "sa:tenant_status")
 * @param value  Status value (case-insensitive, e.g. "High", "closed_won", "active")
 * @param style  Which badge style to return (default: "tinted")
 * @returns      Tailwind classes, or a muted fallback if not found
 */
export function getBadgeClasses(
  type: string,
  value: string,
  style: BadgeStyle = "tinted"
): string {
  const typeMap = BADGE_MAP[type]
  if (!typeMap) return "bg-muted text-muted-foreground"

  const config = typeMap[value.toLowerCase()]
  if (!config) return "bg-muted text-muted-foreground"

  return config[style]
}

/**
 * Returns the CSS variable value for inline style usage.
 * Useful for components that render badges with dynamic inline styles
 * (e.g. LifecycleBadge, LeadStatusBadge, LifecycleDropdown).
 */
export function getBadgeCssVar(type: string, value: string): string {
  const typeMap = BADGE_MAP[type]
  if (!typeMap) return "hsl(var(--stage-slate))"

  const config = typeMap[value.toLowerCase()]
  if (!config) return "hsl(var(--stage-slate))"

  return `hsl(${config.cssVar})`
}

/**
 * Returns all available values for a given status type.
 */
export function getBadgeValues(type: string): string[] {
  const typeMap = BADGE_MAP[type]
  if (!typeMap) return []
  return Object.keys(typeMap)
}

/**
 * For super-admin pages: returns the className string for a badge
 * matching the shape { className: string } used in STATUS_BADGE, PRIORITY_BADGE, etc.
 */
export function getSaBadgeClassName(type: string, value: string): string {
  return getBadgeClasses(type, value, "tinted")
}

// ---------------------------------------------------------------------------
// Re-export type for consumers
// ---------------------------------------------------------------------------
export type { BadgeConfig, BadgeStyle }
