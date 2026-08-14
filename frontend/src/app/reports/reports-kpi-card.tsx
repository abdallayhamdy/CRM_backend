"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportsKpiCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
  className?: string;
}

export function ReportsKpiCard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  className,
}: ReportsKpiCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-muted-foreground">
          {title}
        </span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted/50">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="text-[26px] font-bold text-foreground leading-none mb-2">
        {value}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-[12px] font-bold",
          trendUp ? "text-status-success" : "text-destructive/70"
        )}
      >
        {trendUp ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        {trend}
      </div>
    </div>
  );
}
