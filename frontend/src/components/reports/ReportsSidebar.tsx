"use client";

import React from "react";
import {
  BarChart2,
  TrendingUp,
  Users,
  ShoppingCart,
  LifeBuoy,
  UserCheck,
  Phone,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { value: "executive", label: "Executive Summary", icon: BarChart2 },
  { value: "sales", label: "Sales", icon: TrendingUp },
  { value: "customers", label: "Customers", icon: Users },
  { value: "orders", label: "Orders & Products", icon: ShoppingCart },
  { value: "support", label: "Support", icon: LifeBuoy },
  { value: "productivity", label: "Productivity", icon: UserCheck },
  { value: "calls-log", label: "Calls Log", icon: Phone },
];

export function ReportsSidebar({ activeTab, onTabChange }: ReportsSidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const sidebarContent = (
    <div className="flex-none w-[260px] max-w-[85vw] h-full bg-background border-r border-border shadow-[var(--shadow-sidebar)] overflow-y-auto crm-scrollbar">
      <div className="p-5 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Reports</h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="pb-8">
        <div className="px-5 py-2 font-bold text-foreground text-[11px] uppercase tracking-wider opacity-60">
          Analytics
        </div>
        <div className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.value;
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => {
                  onTabChange(item.value);
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 py-2 px-3 rounded-md text-[13px] transition-all group w-full text-left",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/60 group-hover:text-muted-foreground"
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open reports menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
