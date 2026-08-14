"use client"

import * as React from "react"
import { Search, Loader2, Users, Building2, DollarSign, Package, ClipboardCheck, Activity, StickyNote, Ticket } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { laravelApi } from "@/lib/laravel-api"

interface SearchResult {
  contacts: Array<{ id: string; first_name: string; last_name: string; email?: string; company?: { id: string; name: string } }>
  companies: Array<{ id: string; name: string; website?: string }>
  deals: Array<{ id: string; title: string; amount?: number }>
  products: Array<{ id: string; name: string; sku?: string }>
  tasks: Array<{ id: string; title: string; status?: string; due_date?: string }>
  activities: Array<{ id: string; title?: string; type?: string; entity_route?: string; entity_type?: string }>
  notes: Array<{ id: string; content: string; type?: string; notable_id?: string }>
  tickets: Array<{ id: string; subject: string; status?: string; priority?: string }>
}

type SectionKey = keyof SearchResult

const SECTION_CONFIG: Record<SectionKey, { label: string; icon: React.ElementType; linkPrefix: string }> = {
  contacts: { label: "Contacts", icon: Users, linkPrefix: "/contacts" },
  companies: { label: "Companies", icon: Building2, linkPrefix: "/companies" },
  deals: { label: "Deals", icon: DollarSign, linkPrefix: "/deals" },
  tasks: { label: "Tasks", icon: ClipboardCheck, linkPrefix: "/tasks" },
  activities: { label: "Activities", icon: Activity, linkPrefix: "/activity-feed" },
  tickets: { label: "Tickets", icon: Ticket, linkPrefix: "/tickets" },
  notes: { label: "Notes", icon: StickyNote, linkPrefix: "/notes" },
  products: { label: "Products", icon: Package, linkPrefix: "/products" },
}

const SECTION_ORDER: SectionKey[] = ['contacts', 'companies', 'deals', 'tasks', 'activities', 'tickets', 'notes', 'products']

export default function SearchPage() {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debounced, setDebounced] = React.useState("")

  const loading = query.trim() !== debounced.trim() && query.trim().length > 0

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  React.useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) return

    timerRef.current = setTimeout(() => {
      setDebounced(query)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  React.useEffect(() => {
    if (!debounced.trim()) return

    let cancelled = false

    ;(async () => {
      const { data, error: apiError } = await laravelApi.get<SearchResult>("/search", { q: debounced })
      if (cancelled) return
      if (apiError) {
        setError(apiError)
        setResults(null)
      } else if (data) {
        setResults(data)
        setError(null)
      }
    })()

    return () => { cancelled = true }
  }, [debounced])

  const getHref = (item: Record<string, unknown>, key: SectionKey): string => {
    if (key === "activities") {
      const a = item as SearchResult['activities'][0]
      if (a.entity_route) return a.entity_route
      return SECTION_CONFIG.activities.linkPrefix
    }
    if (key === "notes") {
      const n = item as SearchResult['notes'][0]
      if (n.type && n.notable_id) {
        const typeMap: Record<string, string> = { Contact: "/contacts", Company: "/companies", Deal: "/deals", Ticket: "/tickets" }
        const prefix = typeMap[n.type]
        if (prefix) return `${prefix}/${n.notable_id}`
      }
      return SECTION_CONFIG.notes.linkPrefix
    }
    return `${SECTION_CONFIG[key].linkPrefix}/${(item as { id: string }).id}`
  }

  const getTitle = (item: Record<string, unknown>, key: SectionKey): string => {
    if (key === "contacts") {
      const c = item as SearchResult['contacts'][0]
      return `${c.first_name} ${c.last_name}`.trim()
    }
    if (key === "deals") return (item as SearchResult['deals'][0]).title
    if (key === "tasks") return (item as SearchResult['tasks'][0]).title
    if (key === "activities") return (item as SearchResult['activities'][0]).title || (item as SearchResult['activities'][0]).type || ""
    if (key === "notes") return (item as SearchResult['notes'][0]).content?.substring(0, 80) || ""
    if (key === "tickets") return (item as SearchResult['tickets'][0]).subject
    if (key === "companies") return (item as SearchResult['companies'][0]).name
    if (key === "products") return (item as SearchResult['products'][0]).name
    return ""
  }

  const getSubtitle = (item: Record<string, unknown>, key: SectionKey): string => {
    if (key === "contacts") {
      const c = item as SearchResult['contacts'][0]
      return c.email || c.company?.name || ""
    }
    if (key === "companies") return (item as SearchResult['companies'][0]).website || ""
    if (key === "deals") { const amt = (item as SearchResult['deals'][0]).amount; return amt ? `$${Number(amt).toLocaleString()}` : "" }
    if (key === "tasks") return (item as SearchResult['tasks'][0]).status || ""
    if (key === "activities") return (item as SearchResult['activities'][0]).type || ""
    if (key === "notes") return ""
    if (key === "tickets") return (item as SearchResult['tickets'][0]).status || ""
    if (key === "products") { const sku = (item as SearchResult['products'][0]).sku; return sku ? `SKU: ${sku}` : "" }
    return ""
  }

  const hasAnyResults = results && SECTION_ORDER.some((key) => {
    const arr = results[key]
    return Array.isArray(arr) && arr.length > 0
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search contacts, companies, deals, tasks, activities, notes, tickets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-10 pr-4 text-base"
        />
      </div>

      <div className="mt-6 space-y-6">
        {error && (
          <div className="py-12 text-center text-destructive text-sm">
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching...</span>
          </div>
        )}

        {!loading && !query.trim() && (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>Type to search</p>
          </div>
        )}

        {!loading && query.trim() && results && !hasAnyResults && (
          <div className="py-12 text-center text-muted-foreground">
            <p>No results found for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!loading && hasAnyResults && (
          SECTION_ORDER.map((key) => {
            const items = results![key]
            if (!Array.isArray(items) || items.length === 0) return null

            const config = SECTION_CONFIG[key]
            const Icon = config.icon

            return (
              <section key={key}>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                  <span className="text-xs font-normal text-muted-foreground/60">({items.length})</span>
                </div>
                <div className="divide-y rounded-lg border">
                  {items.map((item) => {
                    const title = getTitle(item as Record<string, unknown>, key)
                    const subtitle = getSubtitle(item as Record<string, unknown>, key)
                    const href = getHref(item as Record<string, unknown>, key)

                    return (
                      <Link
                        key={(item as { id: string }).id}
                        href={href}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
