import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type NativeInputProps = React.ComponentProps<"input">

interface SearchInputProps extends Omit<NativeInputProps, 'onChange'> {
  onChange?: (value: string) => void
  debounceMs?: number
}

export function SearchInput({ className, onChange, debounceMs = 300, ...props }: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(
    (props.value as string) ?? (props.defaultValue as string) ?? ""
  )
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalValue(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (onChange) {
      timerRef.current = setTimeout(() => onChange(val), debounceMs)
    }
  }

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
        value={localValue}
        onChange={handleChange}
        {...props}
      />
    </div>
  )
}
