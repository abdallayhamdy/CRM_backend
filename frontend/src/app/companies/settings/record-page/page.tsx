"use client"

import { RecordPageLayoutEditor } from "@/components/crm/RecordPageLayoutEditor"

const DEFAULT_LEFT = [
  { id: "about", label: "About this company", enabled: true, type: "property" as const },
  { id: "keyinfo", label: "Key information", enabled: true, type: "property" as const },
]

const DEFAULT_RIGHT = [
  { id: "notes", label: "Notes", enabled: true, type: "activity" as const },
  { id: "contacts", label: "Contacts", enabled: true, type: "association" as const },
  { id: "deals", label: "Deals", enabled: true, type: "association" as const },
  { id: "tickets", label: "Tickets", enabled: true, type: "association" as const },
]

const LIBRARY = [
  { id: "about", label: "About this company", enabled: true, type: "property" as const },
  { id: "keyinfo", label: "Key information", enabled: true, type: "property" as const },
  { id: "activity", label: "Activity timeline", enabled: false, type: "activity" as const },
  { id: "tasks", label: "Tasks", enabled: false, type: "association" as const },
]

export default function CompaniesRecordPageSettings() {
  return (
    <RecordPageLayoutEditor
      moduleName="Company"
      moduleSlug="companies"
      backHref="/companies"
      defaultLeftCards={DEFAULT_LEFT}
      defaultRightCards={DEFAULT_RIGHT}
      libraryCards={LIBRARY}
    />
  )
}
