"use client";

import React from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReportsMultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ReportsMultiSelect({
  label,
  options,
  selected,
  onChange,
}: ReportsMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-[13px] font-normal text-muted-foreground"
        >
          <span className="truncate">
            {selected.length === 0
              ? `Select ${label}...`
              : `${selected.length} selected`}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {selected.length > 0 && (
              <X
                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                onClick={clearAll}
              />
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="max-h-60 overflow-auto p-2">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] cursor-pointer hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => toggleOption(option)}
              />
              <span className="text-foreground">{option}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}