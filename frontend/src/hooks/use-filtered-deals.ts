"use client"

import * as React from "react"
import { Deal } from "@/lib/types/crm"
import { GenericCrmFilters } from "@/hooks/use-crm-filters"

interface UseFilteredDealsParams {
  dealData: Deal[]
  filters: GenericCrmFilters
}

export function useFilteredDeals({ dealData, filters }: UseFilteredDealsParams): Deal[] {
  return React.useMemo(() => {
    return dealData.filter((deal: Deal) => {
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const ownerName = deal.owner ? `${deal.owner.first_name} ${deal.owner.last_name || ''}`.toLowerCase() : ""
        if (
          !deal.title?.toLowerCase().includes(q) &&
          !ownerName.includes(q) &&
          !deal.stage?.toLowerCase().includes(q)
        ) {
          return false
        }
      }

      // Properties (Owner, Stage)
      const selectedOwners = filters.properties["owner"] || []
      const currOwnerName = deal.owner ? `${deal.owner.first_name} ${deal.owner.last_name || ''}`.trim() : "Unassigned"
      if (selectedOwners.length > 0 && !selectedOwners.includes(currOwnerName)) return false

      const selectedStages = filters.properties["stage"] || []
      if (selectedStages.length > 0 && !selectedStages.includes(deal.stage ?? 'discovery')) return false

      // Numbers (Amount)
      const amo = filters.numbers["amount"]
      if (amo) {
        if (amo.min) {
          const minVal = parseFloat(amo.min.replace(/,/g, ""))
          if (!isNaN(minVal) && deal.amount < minVal) return false
        }
        if (amo.max) {
          const maxVal = parseFloat(amo.max.replace(/,/g, ""))
          if (!isNaN(maxVal) && deal.amount > maxVal) return false
        }
      }

      return true
    })
  }, [dealData, filters])
}
