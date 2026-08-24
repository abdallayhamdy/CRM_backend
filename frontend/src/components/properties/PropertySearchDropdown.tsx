import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CALC_DATE_PROPERTIES } from "./CreatePropertyConstants";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full border rounded-md px-3 py-2 flex justify-between items-center text-sm bg-background"
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search for a property"
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>No properties found</CommandEmpty>
            <CommandGroup>
              {filtered.map(p => (
                <CommandItem
                  key={p}
                  value={p}
                  onSelect={() => { onChange(p); setOpen(false); onSearchChange(''); }}
                >
                  {p}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
