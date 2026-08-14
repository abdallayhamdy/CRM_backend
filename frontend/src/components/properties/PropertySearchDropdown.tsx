import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CALC_DATE_PROPERTIES } from "./CreatePropertyConstants";

export interface PropertySearchDropdownProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  search: string;
  onSearchChange: (val: string) => void;
}

export function PropertySearchDropdown({ value, onChange, placeholder, search, onSearchChange }: PropertySearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const filtered = CALC_DATE_PROPERTIES.filter(p => p.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border rounded-md px-3 py-2 flex justify-between items-center text-sm bg-background"
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
        <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 w-full border rounded-md bg-background shadow-md mt-1">
          <div className="p-2 border-b">
            <input
              autoFocus
              placeholder="Search for a property"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full outline-none text-sm px-2 py-1 border rounded"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No properties found</div>
            ) : filtered.map(p => (
              <div
                key={p}
                onClick={() => { onChange(p); setOpen(false); onSearchChange(''); }}
                className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
              >
                {p}
              </div>
            ))}
          </div>
                              </div>
                            )};
    </div>
  );
}
