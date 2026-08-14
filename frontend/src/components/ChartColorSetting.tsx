import * as React from "react"
import { CHART_COLOR_MAP, CHART_COLORS, type ChartColor } from "./theme-switcher-constants"
import { SettingCard, DropdownMenu, DropdownItem } from "./theme-switcher-ui"

export function ChartColorSetting({
  label,
  value,
  onSelect,
  dropdownId,
  openDropdown,
  onOpenDropdown,
}: {
  label: string
  value: ChartColor
  onSelect: (c: ChartColor) => void
  dropdownId: string
  openDropdown: string | null
  onOpenDropdown: (id: string | null) => void
}) {
  return (
    <div className="relative" data-dropdown>
      <SettingCard
        label={label}
        value={value}
        icon={
          <span
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor: CHART_COLOR_MAP[value] }}
          />
        }
        onClick={() => onOpenDropdown(openDropdown === dropdownId ? null : dropdownId)}
      />
      {openDropdown === dropdownId && (
        <DropdownMenu>
          {CHART_COLORS.map((c) => (
            <DropdownItem
              key={c}
              active={value === c}
              onClick={() => { onSelect(c); onOpenDropdown(null) }}
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLOR_MAP[c] }}
              />
              <span className="capitalize">{c}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </div>
  )
}
