'use client'

import { useState, useEffect, useCallback } from "react"
import { laravelApi } from "@/lib/laravel-api"
import { DEFAULT_STAGES_MAP, ObjectType, StageConfig } from "@/lib/default-object-configs"

export type DisplayStyle = 'no_color' | 'colored_dot' | 'colored_badge' | 'alert'

interface CachedConfig {
  lifecycle_stages: StageConfig[]
  display_style: DisplayStyle
}

const configsCache: Record<string, CachedConfig> = {}
const pendingPromises: Record<string, Promise<CachedConfig> | null> = {}

export function useObjectConfig(objectType: ObjectType) {
  const [stages, setStages] = useState<StageConfig[]>(DEFAULT_STAGES_MAP[objectType])
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('colored_badge')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    let cancelled = false
    const cacheKey = objectType

    if (configsCache[cacheKey]) {
      const cached = configsCache[cacheKey]
      setStages(cached.lifecycle_stages)
      setDisplayStyle(cached.display_style)
      setLoading(false)
      setHasChanges(false)
      return
    }

    async function load() {
      setLoading(true)
      if (!pendingPromises[cacheKey]) {
        pendingPromises[cacheKey] = laravelApi.get<{ lifecycle_stages: StageConfig[]; display_style: DisplayStyle }>('/settings/object-configs', { object_type: objectType })
          .then(res => {
            const rawStages = res.data?.lifecycle_stages?.length
              ? res.data.lifecycle_stages
              : DEFAULT_STAGES_MAP[objectType]
            const rawStyle = res.data?.display_style || 'colored_badge'
            const result = { lifecycle_stages: rawStages, display_style: rawStyle }
            configsCache[cacheKey] = result
            pendingPromises[cacheKey] = null
            return result
          })
          .catch(err => {
            pendingPromises[cacheKey] = null
            throw err
          })
      }

      try {
        const cached = await pendingPromises[cacheKey]!
        if (!cancelled) {
          setStages(cached.lifecycle_stages)
          setDisplayStyle(cached.display_style)
        }
      } catch {
        if (!cancelled) {
          setStages(DEFAULT_STAGES_MAP[objectType])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHasChanges(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [objectType])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { error } = await laravelApi.put("/settings/object-configs", {
        object_type: objectType,
        lifecycle_stages: stages,
        display_style: displayStyle,
      })
      if (error) throw new Error(error)

      // Invalidate cache
      delete configsCache[objectType]
      if (objectType === 'contact') {
        delete configsCache['company']
        await laravelApi.put("/settings/object-configs", {
          object_type: 'company',
          lifecycle_stages: stages,
          display_style: displayStyle,
        })
      }

      setHasChanges(false)
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [objectType, stages, displayStyle])

  const addStage = useCallback((name: string, color: string = "#6b7280") => {
    const stageId = name.toLowerCase().replace(/\s+/g, '')
    const newStage: StageConfig = {
      id: stageId,
      name,
      color,
      order: stages.length,
      is_default: false,
      is_active: true,
      calculated_props: true,
      used_in: 0,
    }
    setStages(prev => [...prev, newStage])
    setHasChanges(true)
  }, [stages.length])

  const updateStage = useCallback((id: string, updates: Partial<StageConfig>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    setHasChanges(true)
  }, [])

  const deleteStage = useCallback((id: string) => {
    setStages(prev => prev.filter(s => s.id !== id))
    setHasChanges(true)
  }, [])

  const setDefaultStage = useCallback((id: string) => {
    setStages(prev => prev.map(s => ({ ...s, is_default: s.id === id })))
    setHasChanges(true)
  }, [])

  const reorderStages = useCallback((newStages: StageConfig[]) => {
    setStages(newStages.map((s, i) => ({ ...s, order: i })))
    setHasChanges(true)
  }, [])

  const resetToDefaults = useCallback(() => {
    setStages(DEFAULT_STAGES_MAP[objectType])
    setHasChanges(true)
  }, [objectType])

  const updateDisplayStyle = useCallback((style: DisplayStyle) => {
    setDisplayStyle(style)
    setHasChanges(true)
  }, [])

  return {
    stages, displayStyle, loading, saving, hasChanges,
    save, addStage, updateStage, deleteStage, setDefaultStage,
    reorderStages, resetToDefaults, updateDisplayStyle
  }
}

export function clearObjectConfigCache() {
  for (const key in configsCache) {
    delete configsCache[key]
  }
  for (const key in pendingPromises) {
    delete pendingPromises[key]
  }
}
