import { Badge } from "@/components/ui/badge"

const TYPE_LABEL_MAP: Record<string, string> = {
  text: "Text",
  number: "Number",
  email: "Email",
  tel: "Phone",
  url: "URL",
  textarea: "Textarea",
  select: "Dropdown",
  enumeration: "Dropdown",
  lifecycle: "Dropdown",
  date: "Date",
}

export function TypeBadge({ type }: { type?: string }) {
  if (!type) return null
  return (
    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
      {TYPE_LABEL_MAP[type] ?? "Text"}
    </Badge>
  )
}
