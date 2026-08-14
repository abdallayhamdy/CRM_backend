import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const INPUT_CLASS = "h-[42px] w-full rounded-xs border border-border bg-background px-4 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:border-border"

export function FormFieldInput({ type }: { type?: string }) {
  if (type === "textarea") {
    return <Textarea className="min-h-[42px] w-full resize-none rounded-xs border border-border bg-background px-4 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:border-border" />
  }

  if (type === "select" || type === "enumeration" || type === "lifecycle") {
    return (
      <Select>
        <SelectTrigger className="h-[42px] w-full rounded-xs border border-border bg-background px-4 transition-all group-hover:border-border">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (type === "checkbox") {
    return (
      <div className="h-[42px] flex items-center">
        <Checkbox className="h-4 w-4" />
      </div>
    )
  }

  return <Input type={type === "number" || type === "email" || type === "tel" || type === "date" ? type : undefined} className={INPUT_CLASS} />
}
