import * as React from "react"
import { X, ChevronDown } from "lucide-react"

type PropertyItem = {
  id: string
  label: string
  value?: string
  isBadge?: boolean
  isTag?: boolean
}

export function CardPreview({ title, properties }: { title: string; properties: PropertyItem[] }) {
  return (
    <div className="flex-1 bg-muted/50 overflow-y-auto p-6 flex flex-col gap-4">
      <h3 className="text-[12px] font-bold text-muted-foreground/60 uppercase tracking-wider">Preview</h3>

      <div className="bg-background border border-border rounded px-3 py-1.5 flex items-center justify-between cursor-pointer hover:border-muted-foreground transition-colors w-full">
        <span className="text-[14px] text-foreground">asdas dasdas</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Simulated Card Preview */}
      <div className="bg-background border border-border rounded-md shadow-sm p-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[14px] font-bold text-foreground">{title}</h4>
          <button className="flex items-center gap-1 text-[12px] border border-border rounded px-2 py-0.5 text-muted-foreground hover:bg-accent">
            Actions <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {properties.map(prop => (
            <div key={prop.id} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground/60">{prop.label}</span>
              {prop.isBadge ? (
                <div>
                  <span className="inline-block bg-primary/10 text-primary text-[12px] font-bold px-2 py-0.5 rounded-sm">
                    {prop.value}
                  </span>
                </div>
              ) : prop.isTag ? (
                <div>
                  <span className="inline-flex items-center gap-1 border border-border rounded-full px-2 py-0.5 text-[12px] text-foreground">
                    {prop.value} <X className="w-3 h-3 text-muted-foreground" />
                  </span>
                </div>
              ) : (
                <span className="text-[13px] text-foreground">{prop.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
