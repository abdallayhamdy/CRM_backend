import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SettingsInfoTipProps {
  content: string
}

export function SettingsInfoTip({ content }: SettingsInfoTipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block ms-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs bg-foreground text-primary-foreground border-none">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
