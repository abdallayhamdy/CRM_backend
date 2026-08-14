import { useState } from "react"

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(i => i.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectedItems = items.filter(i => selectedIds.has(i.id))
  const isAllSelected = items.length > 0 && selectedIds.size === items.length
  const isPartialSelected = selectedIds.size > 0 && !isAllSelected

  return {
    selectedIds,
    selectedItems,
    toggleOne,
    toggleAll,
    clearSelection,
    isAllSelected,
    isPartialSelected,
    count: selectedIds.size
  }
}
