"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { laravelApi } from "@/lib/laravel-api"
import { TableSettings, loadTableSettings } from "@/components/crm/TableSettingsDialog"

export type ConditionalLogic = {
  property: string
  operator: string
  compareProperty?: string
  values?: any[]
  display: "show" | "hide"
}

export type PanelCard = {
  id: string
  label: string
  icon: string
  type: "default" | "custom"
  visible: boolean
  enabled?: boolean
  properties?: Array<Record<string, unknown>>
  conditionalLogic?: unknown
}

export type CustomLeftCard = {
  id: string
  label: string
  type?: "custom"
  visible?: boolean
  properties?: Array<Record<string, unknown>>
}

export type CustomRightCard = {
  id: string
  label: string
  type?: "custom" | "association" | "workflow"
  visible?: boolean
  properties?: Array<Record<string, unknown>>
}

const DEFAULT_CARDS: PanelCard[] = [
  { id: "about", label: "About", icon: "User", type: "default", visible: true },
  { id: "keyinfo", label: "Key Info", icon: "Key", type: "default", visible: true },
  { id: "activity", label: "Activity", icon: "Activity", type: "default", visible: true },
  { id: "notes", label: "Notes", icon: "FileText", type: "default", visible: true },
  { id: "tasks", label: "Tasks", icon: "CheckSquare", type: "default", visible: true },
  { id: "emails", label: "Emails", icon: "Mail", type: "default", visible: true },
  { id: "calls", label: "Calls", icon: "Phone", type: "default", visible: true },
  { id: "meetings", label: "Meetings", icon: "Calendar", type: "default", visible: true },
  { id: "deals", label: "Deals", icon: "DollarSign", type: "default", visible: true },
  { id: "companies", label: "Companies", icon: "Building", type: "default", visible: true },
  { id: "contacts", label: "Contacts", icon: "Users", type: "default", visible: true },
  { id: "documents", label: "Documents", icon: "File", type: "default", visible: true },
  { id: "tickets", label: "Tickets", icon: "Ticket", type: "default", visible: true },
  { id: "quotes", label: "Quotes", icon: "FileText", type: "default", visible: true },
  { id: "orders", label: "Orders", icon: "ShoppingCart", type: "default", visible: true },
  { id: "products", label: "Products", icon: "Package", type: "default", visible: true },
  { id: "custom_fields", label: "Custom Fields", icon: "Settings", type: "default", visible: true },
]

function storageKey(type: string) {
  return `crm_panel_cards_${type}`
}

function readLocal(type: string) {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(type))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeLocal(type: string, payload: {
  cards: PanelCard[]
  customLeftCards: CustomLeftCard[]
  leftAddedIds: string[]
  customRightCards: CustomRightCard[]
  tableSettings?: TableSettings
}) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(type), JSON.stringify(payload))
  } catch { /* localStorage may be full or unavailable */ }
}

export function usePanelCards(type: 'contacts' | 'companies' | 'deals' | 'tickets' | 'orders' | 'documents' = 'contacts') {
  const { user, workspaceId } = useAuth()
  const userId = user?.id ?? null

  const [cards, setCards] = useState<PanelCard[]>(DEFAULT_CARDS)
  const [customLeftCards, setCustomLeftCards] = useState<CustomLeftCard[]>([])
  const [customRightCards, setCustomRightCards] = useState<CustomRightCard[]>([])
  const [leftAddedIds, setLeftAddedIds] = useState<string[]>(["about", "keyinfo"])
  const [tableSettings, setTableSettingsState] = useState<TableSettings>(loadTableSettings)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId || !workspaceId) {
      const cached = readLocal(type)
      if (cached) {
        if (cached.cards) setCards(cached.cards)
        if (cached.customLeftCards) setCustomLeftCards(cached.customLeftCards)
        if (cached.leftAddedIds) setLeftAddedIds(cached.leftAddedIds)
        if (cached.customRightCards) setCustomRightCards(cached.customRightCards)
      }
      setReady(true)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const { data, error } = await laravelApi.get<{ data: { config: any } }>('/panel-configs/' + type)

        if (cancelled) return

        if (error) {
          // Expected in standalone mode — panel-configs endpoint doesn't exist in mock API
        }

        const cfg = data?.data?.config

        if (cfg?.cards) {
          setCards(cfg.cards)
          if (cfg.customLeftCards) setCustomLeftCards(cfg.customLeftCards)
          if (cfg.leftAddedIds) setLeftAddedIds(cfg.leftAddedIds)
          if (cfg.customRightCards) setCustomRightCards(cfg.customRightCards)
          if (cfg.tableSettings) {
            setTableSettingsState(cfg.tableSettings)
            try { localStorage.setItem(`crm_table_settings`, JSON.stringify(cfg.tableSettings)) } catch {}
          }
        } else {
          const cached = readLocal(type)
          if (cached) {
            if (cached.cards) setCards(cached.cards)
            if (cached.customLeftCards) setCustomLeftCards(cached.customLeftCards)
            if (cached.leftAddedIds) setLeftAddedIds(cached.leftAddedIds)
            if (cached.customRightCards) setCustomRightCards(cached.customRightCards)
            if (cached.tableSettings) setTableSettingsState(cached.tableSettings)

            await laravelApi.put('/panel-configs/' + type, {
              config: {
                cards: cached.cards ?? DEFAULT_CARDS,
                customLeftCards: cached.customLeftCards ?? [],
                leftAddedIds: cached.leftAddedIds ?? ["about", "keyinfo"],
                customRightCards: cached.customRightCards ?? [],
                tableSettings: cached.tableSettings ?? loadTableSettings(),
              },
            })
          }
        }
      } catch (err) {
        if (!cancelled) console.error('usePanelCards load exception:', { message: (err as Error)?.message })
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId, workspaceId, type])

  const save = useCallback(async (
    cardsOverride?: PanelCard[],
    customLeftOverride?: CustomLeftCard[],
    leftAddedOverride?: string[],
    customRightOverride?: CustomRightCard[]
  ) => {
    const c = cardsOverride ?? cards
    const cl = customLeftOverride ?? customLeftCards
    const la = leftAddedOverride ?? leftAddedIds
    const cr = customRightOverride ?? customRightCards

    if (!userId || !workspaceId) {
      writeLocal(type, { cards: c, customLeftCards: cl, leftAddedIds: la, customRightCards: cr, tableSettings })
      return
    }

    setSaving(true)
    try {
      const { error } = await laravelApi.put('/panel-configs/' + type, {
        config: {
          cards: c,
          customLeftCards: cl,
          leftAddedIds: la,
          customRightCards: cr,
          tableSettings,
        },
      })

      if (error) throw new Error(error)
      writeLocal(type, { cards: c, customLeftCards: cl, leftAddedIds: la, customRightCards: cr, tableSettings })
    } catch (err) {
      console.error('usePanelCards save error:', { message: (err as Error)?.message })
    } finally {
      setSaving(false)
    }
  }, [userId, workspaceId, type, cards, customLeftCards, leftAddedIds, customRightCards, tableSettings])

  const saveTableSettings = useCallback(async (newSettings: TableSettings) => {
    setTableSettingsState(newSettings)
    try { localStorage.setItem(`crm_table_settings`, JSON.stringify(newSettings)) } catch {}

    if (!userId || !workspaceId) return

    try {
      // Read current config first to avoid overwriting other fields
      const { data } = await laravelApi.get<{ data: { config: any } }>('/panel-configs/' + type)

      const currentConfig = data?.data?.config || {}

      const { error } = await laravelApi.put('/panel-configs/' + type, {
        config: {
          ...currentConfig,
          tableSettings: newSettings,
        },
      })

      if (error) throw new Error(error)
    } catch (err) {
      console.error('saveTableSettings error:', { message: (err as Error)?.message })
    }
  }, [userId, workspaceId, type])

  const isEnabled = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    return card?.enabled ?? card?.visible ?? true
  }, [cards])

  return {
    cards,
    setCards,
    customLeftCards,
    setCustomLeftCards,
    customRightCards,
    setCustomRightCards,
    leftAddedIds,
    setLeftAddedIds,
    tableSettings,
    saveTableSettings,
    ready,
    saving,
    save,
    isEnabled,
  }
}
