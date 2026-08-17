"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { laravelApi } from "@/lib/laravel-api"
import { useAuth } from "@/hooks/use-auth"

export type ObjectType =
  | "call" | "cart" | "company" | "contact" | "credit_memo"
  | "deal" | "invoice" | "line_item" | "marketing_email"
  | "marketing_event" | "meeting" | "order" | "payment"
  | "product" | "quote" | "segment" | "subscription"
  | "ticket" | "workflow"

export interface PropertyFromDB {
  id: string
  name: string
  label: string
  field_type: string
  group_name: string | null
  object_type: ObjectType
  display_order: number | null
  is_archived: boolean
  is_required?: boolean
  show_in_forms?: boolean
  description?: string | null
  options?: Array<{ label?: string; value?: string; internal_name?: string; name?: string; color?: string } | string>
  settings?: Record<string, any>
}

const propertiesCache: Record<string, PropertyFromDB[]> = {}
const pendingPromises: Record<string, Promise<PropertyFromDB[]> | null> = {}

let _cacheVersion = 0
let _listeners: Array<() => void> = []

function getCacheVersion() {
  return _cacheVersion
}

function subscribeCacheVersion(callback: () => void) {
  _listeners.push(callback)
  return () => {
    _listeners = _listeners.filter(l => l !== callback)
  }
}

function emitCacheVersionChange() {
  _cacheVersion++
  for (const listener of _listeners) {
    listener()
  }
}

export function useProperties(objectType: ObjectType) {
  const [properties, setProperties] = useState<PropertyFromDB[]>([])
  const [loading, setLoading] = useState(true)
  const { workspaceId } = useAuth()
  const cacheVersion = useSyncExternalStore(subscribeCacheVersion, getCacheVersion, getCacheVersion)

  useEffect(() => {
    if (!workspaceId) return

    let cancelled = false
    const cacheKey = `${workspaceId}:${objectType}`

    if (propertiesCache[cacheKey]) {
      setProperties(propertiesCache[cacheKey])
      setLoading(false)
      return
    }

    async function fetchProperties() {
      if (!pendingPromises[cacheKey]) {
        pendingPromises[cacheKey] = laravelApi.get<{ data: { properties: PropertyFromDB[] } }>('/properties', { object_type: objectType })
          .then(res => {
            const props = res.data?.data?.properties ?? []
            propertiesCache[cacheKey] = props
            pendingPromises[cacheKey] = null
            return props
          })
          .catch(err => {
            pendingPromises[cacheKey] = null
            throw err
          })
      }

      try {
        const props = await pendingPromises[cacheKey]!
        if (!cancelled) {
          setProperties(props)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchProperties()
    return () => { cancelled = true }
  }, [objectType, workspaceId, cacheVersion])

  return { properties, loading }
}

export function clearPropertiesCache() {
  for (const key in propertiesCache) {
    delete propertiesCache[key]
  }
  for (const key in pendingPromises) {
    delete pendingPromises[key]
  }
  emitCacheVersionChange()
}
