"use client"

import * as React from "react"
import { columns } from "@/app/deals/columns"
import { CrmPropertyGroup } from "@/lib/crm-properties"

interface ColumnOption {
  id: string
  label: string
  visible: boolean
}

interface UseDealsColumnOptionsParams {
  visibleColumnIds: string[]
  propertyGroups: CrmPropertyGroup[]
}

export function useDealsColumnOptions({
  visibleColumnIds,
  propertyGroups,
}: UseDealsColumnOptionsParams): ColumnOption[] {
  return React.useMemo(() => {
    const seen = new Set<string>()
    const allPotential: ColumnOption[] = []

    columns.forEach(col => {
      const id = (col.id || (col as any).accessorKey) as string
      if (id === 'select' || seen.has(id)) return
      seen.add(id)
      allPotential.push({
        id,
        label: typeof col.header === 'string' ? col.header : id || "Column",
        visible: visibleColumnIds.includes(id)
      })
    })

    propertyGroups.forEach(group => {
      group.items.forEach(prop => {
        if (!seen.has(prop.id)) {
          seen.add(prop.id)
          allPotential.push({
            id: prop.id,
            label: prop.label,
            visible: visibleColumnIds.includes(prop.id)
          })
        }
      })
    })

    const visibleColumns = visibleColumnIds
      .filter(id => id !== 'select')
      .map(id => allPotential.find(c => c.id === id))
      .filter((c): c is ColumnOption => !!c)

    const hiddenColumns = allPotential.filter(c => !visibleColumnIds.includes(c.id))

    return [...visibleColumns, ...hiddenColumns]
  }, [visibleColumnIds, propertyGroups])
}
