"use client";

import * as React from "react";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface SearchablePropertyFilterProps {
  label: string;
  options: (string | { value: string, label: string, color?: string, badgeColor?: string })[];
  selected: string[];
  onToggle: (values: string[]) => void;
  children: React.ReactNode;
}

export function SearchablePropertyFilter({
  label,
  options,
  selected,
  onToggle,
  children,
}: SearchablePropertyFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === "string" ? opt : opt.label;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const toggleOption = (opt: string) => {
    const newSelected = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onToggle(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch("") }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${label}...`}
                className="pl-8 h-9 text-sm border-none focus-visible:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px]">
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const val = typeof opt === "string" ? opt : opt.value;
                  const labelStr = typeof opt === "string" ? opt : opt.label;
                  const badgeColor = typeof opt === "string" ? undefined : opt.badgeColor;
                  const optColor = typeof opt === "string" ? undefined : opt.color;
                  const isSelected = selected.includes(val);

                  return (
                    <div
                      key={val}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted text-[13px] group",
                        isSelected && "bg-muted"
                      )}
                      onClick={() => toggleOption(val)}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="h-3.5 w-3.5 border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex items-center gap-2 flex-1 truncate">
                        {optColor ? (
                          <Badge className="font-bold rounded-full px-3 py-0.5 border-0 shadow-sm whitespace-nowrap" style={{ backgroundColor: optColor, color: "#fff" }}>
                            {labelStr}
                          </Badge>
                        ) : badgeColor ? (
                          <Badge className={cn("font-bold rounded-full px-3 py-0.5 border-0 shadow-sm whitespace-nowrap", badgeColor)}>
                            {labelStr}
                          </Badge>
                        ) : (
                          <span className={cn(
                            "truncate",
                            isSelected ? "font-medium text-foreground" : "text-foreground/80"
                          )}>
                            {labelStr}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t bg-muted/50 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">
                {selected.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-primary hover:text-primary/80 hover:bg-transparent p-0"
                onClick={() => onToggle([])}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SimplePropertyFilterProps {
  label: string;
  options: (string | { value: string, label: string, color?: string, badgeColor?: string })[];
  selected: string[];
  onToggle: (values: string[]) => void;
  children: React.ReactNode;
}

export function SimplePropertyFilter({
  options,
  selected,
  onToggle,
  children,
}: SimplePropertyFilterProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (opt: string) => {
    const newSelected = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onToggle(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="flex flex-col flex-1 overflow-y-auto py-1">
          {options.map((opt, idx) => {
            const val = typeof opt === "string" ? opt : opt.value;
            const labelStr = typeof opt === "string" ? opt : opt.label;
            const badgeColor = typeof opt === "string" ? undefined : opt.badgeColor;
            const optColor = typeof opt === "string" ? undefined : opt.color;
            const isSelected = selected.includes(val);

            return (
              <label
                key={`${val}-${idx}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted text-[13px]",
                  isSelected && "bg-muted"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleOption(val)}
                  className="h-3.5 w-3.5 border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="flex items-center gap-2 flex-1 truncate text-left">
                  {optColor ? (
                    <Badge className="font-bold rounded-full px-3 py-0.5 border-0 shadow-sm whitespace-nowrap" style={{ backgroundColor: optColor, color: "#fff" }}>
                      {labelStr}
                    </Badge>
                  ) : badgeColor ? (
                    <Badge className={cn("font-bold rounded-full px-3 py-0.5 border-0 shadow-sm whitespace-nowrap", badgeColor)}>
                      {labelStr}
                    </Badge>
                  ) : (
                    <span className="text-foreground/80 truncate">{labelStr}</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="p-2 border-t bg-muted/50 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">
              {selected.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2 text-primary hover:text-primary/80 hover:bg-transparent p-0"
              onClick={() => onToggle([])}
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface TextPropertyFilterProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  children: React.ReactNode;
}

export function TextPropertyFilter({
  label,
  value,
  onChange,
  children,
}: TextPropertyFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleApply = () => {
    onChange(localValue);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <h4 className="text-[13px] font-semibold text-foreground">{label}</h4>
            <div className="relative">
              <Input
                placeholder={`Filter by ${label.toLowerCase()}...`}
                className="h-9 text-[13px] pr-8"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApply();
                }}
              />
              {localValue && (
                <button
                  onClick={() => setLocalValue("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[12px] px-2 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="h-8 text-[12px] px-3 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DateQuickFilterProps {
  selected: string;
  onSelect: (val: string) => void;
  children: React.ReactNode;
}

export function DateQuickFilter({
  selected,
  onSelect,
  children,
}: DateQuickFilterProps) {
  const [open, setOpen] = React.useState(false);

  const dateOptions = [
    { label: "All time", value: "" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "last_7_days" },
    { label: "Last 30 days", value: "last_30_days" },
    { label: "Last 90 days", value: "last_90_days" },
    { label: "This month", value: "this_month" },
    { label: "Last month", value: "last_month" },
    { label: "Custom range...", value: "custom" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="py-1">
          {dateOptions.map((opt) => (
            <div
              key={opt.value}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-muted text-[13px]",
                selected === opt.value && "bg-muted"
              )}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              <span className={cn(
                selected === opt.value ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {opt.label}
              </span>
              {selected === opt.value && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NumberPropertyFilterProps {
  label: string;
  value: string | { min?: number; max?: number };
  onChange: (val: { min?: number; max?: number } | undefined) => void;
  children: React.ReactNode;
}

export function NumberPropertyFilter({
  label,
  value,
  onChange,
  children,
}: NumberPropertyFilterProps) {
  const [open, setOpen] = React.useState(false);
  const min = typeof value === 'object' ? value.min : undefined;
  const max = typeof value === 'object' ? value.max : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="space-y-3">
          <h4 className="text-[13px] font-semibold text-foreground">{label}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase font-bold">Min</label>
              <Input
                type="number"
                placeholder="Min"
                className="h-9 text-[13px]"
                value={min ?? ""}
                onChange={(e) => onChange({ ... (typeof value === 'object' ? value : {}), min: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase font-bold">Max</label>
              <Input
                type="number"
                placeholder="Max"
                className="h-9 text-[13px]"
                value={max ?? ""}
                onChange={(e) => onChange({ ... (typeof value === 'object' ? value : {}), max: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[12px] text-muted-foreground hover:text-foreground"
              onClick={() => onChange(undefined)}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="h-8 text-[12px] bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
