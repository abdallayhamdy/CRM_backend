import { useState, useEffect, useCallback } from "react"
import { laravelApi } from "@/lib/laravel-api"

export type FormFieldGroup = {
  id: string;
  label: string;
  selected?: boolean;
  [key: string]: any;
}

export function useFormLayout(objectType: 'company' | 'deal' | 'ticket' | 'contact' | 'order' | 'product' | 'task', defaultFields: FormFieldGroup[]) {
  const [formFields, setFormFields] = useState<FormFieldGroup[]>(defaultFields)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await laravelApi.get<{ groups: FormFieldGroup[] }>('/settings/form-layouts', { object_type: objectType })
        if (data?.groups && Array.isArray(data.groups)) {
          setFormFields(data.groups)
        }
      } catch {
        // use defaultFields
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [objectType])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { error } = await laravelApi.put('/settings/form-layouts', { object_type: objectType, groups: formFields })
      if (error) throw new Error(error)
      setHasChanges(false)
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [objectType, formFields])

  const reset = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await laravelApi.get<{ groups: FormFieldGroup[] }>('/settings/form-layouts', { object_type: objectType })
      if (data?.groups && Array.isArray(data.groups)) {
        setFormFields(data.groups)
      } else {
        setFormFields(defaultFields)
      }
    } catch {
      setFormFields(defaultFields)
    }
    setHasChanges(false)
    setLoading(false)
  }, [objectType, defaultFields])

  const updateFormField = useCallback((updater: (prev: FormFieldGroup[]) => FormFieldGroup[]) => {
    setFormFields(prev => {
      const next = updater(prev)
      return next
    })
    setHasChanges(true)
  }, [])

  return { formFields, setFormFields, loading, saving, hasChanges, save, reset, updateFormField }
}
