"use client"

import { RecordPageLayoutEditor } from "@/components/crm/RecordPageLayoutEditor"

const DEFAULT_LEFT = [
  { id: "about", label: "About this contact", enabled: true, type: "property" as const },
  { id: "keyinfo", label: "Key information", enabled: true, type: "property" as const },
]

const DEFAULT_RIGHT = [
  { id: "notes", label: "Notes", enabled: true, type: "activity" as const },
  { id: "companies", label: "Companies", enabled: true, type: "association" as const },
  { id: "deals", label: "Deals", enabled: true, type: "association" as const },
  { id: "tickets", label: "Tickets", enabled: true, type: "association" as const },
]

const LIBRARY = [
  { id: "about", label: "About this contact", enabled: true, type: "property" as const },
  { id: "keyinfo", label: "Key information", enabled: true, type: "property" as const },
  { id: "activity", label: "Activity timeline", enabled: false, type: "activity" as const },
  { id: "tasks", label: "Tasks", enabled: false, type: "association" as const },
  { id: "calls", label: "Calls", enabled: false, type: "association" as const },
  { id: "emails", label: "Emails", enabled: false, type: "association" as const },
]

export default function ContactsRecordPageSettings() {
  return (
    <RecordPageLayoutEditor
      moduleName="Contact"
      moduleSlug="contacts"
      backHref="/contacts"
      defaultLeftCards={DEFAULT_LEFT}
      defaultRightCards={DEFAULT_RIGHT}
      libraryCards={LIBRARY}
    />
  )
}
