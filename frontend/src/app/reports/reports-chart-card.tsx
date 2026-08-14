"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ReportsChartCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ReportsChartCard({
  title,
  action,
  children,
  className,
}: ReportsChartCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-[14px] font-bold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
