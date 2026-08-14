"use client"

import { RecordPageLayoutEditor } from "@/components/crm/RecordPageLayoutEditor"

const DEFAULT_LEFT = [
  { id: "about", label: "About this deal", enabled: true, type: "property" as const },
  { id: "pipeline", label: "Pipeline & stage", enabled: true, type: "property" as const },
]

const DEFAULT_RIGHT = [
  { id: "notes", label: "Notes", enabled: true, type: "activity" as const },
  { id: "contacts", label: "Contacts", enabled: true, type: "association" as const },
  { id: "companies", label: "Companies", enabled: true, type: "association" as const },
  { id: "line-items", label: "Line items", enabled: true, type: "property" as const },
]

const LIBRARY = [
  { id: "about", label: "About this deal", enabled: true, type: "property" as const },
  { id: "pipeline", label: "Pipeline & stage", enabled: true, type: "property" as const },
  { id: "activity", label: "Activity timeline", enabled: false, type: "activity" as const },
  { id: "tasks", label: "Tasks", enabled: false, type: "association" as const },
  { id: "forecast", label: "Forecast details", enabled: false, type: "property" as const },
]

export default function DealsRecordPageSettings() {
  return (
    <RecordPageLayoutEditor
      moduleName="Deal"
      moduleSlug="deals"
      backHref="/deals"
      defaultLeftCards={DEFAULT_LEFT}
      defaultRightCards={DEFAULT_RIGHT}
      libraryCards={LIBRARY}
    />
  )
}
