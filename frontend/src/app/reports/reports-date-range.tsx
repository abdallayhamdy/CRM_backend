"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ReportsDateRangeProps {
  from?: Date;
  to?: Date;
  onChange: (range: { from?: Date; to?: Date }) => void;
}

export function ReportsDateRange({ from, to, onChange }: ReportsDateRangeProps) {
  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[130px] sm:w-[140px] justify-start h-9 text-[13px] font-normal text-left",
                !from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {from ? format(from, "MMM d, yyyy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={from}
              onSelect={(date) => {
                onChange({ from: date || undefined, to });
                setFromOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <span className="text-muted-foreground text-[12px]">to</span>
      <div className="relative">
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[130px] sm:w-[140px] justify-start h-9 text-[13px] font-normal text-left",
                !to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {to ? format(to, "MMM d, yyyy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={to}
              onSelect={(date) => {
                onChange({ from, to: date || undefined });
                setToOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {(from || to) && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange({ from: undefined, to: undefined })}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}