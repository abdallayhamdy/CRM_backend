"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const tabs = [
  { name: 'General',          href: '/settings/account-defaults/general' },
  { name: 'User Defaults',    href: '/settings/account-defaults/user-defaults' },
  { name: 'Currency',         href: '/settings/account-defaults/currency' },
];

export default function AccountDefaultsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-muted/50 min-h-screen">
      {/* ── Page Header ── */}
      <div className="bg-background border-b border-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-4">
            <Link href="/settings" className="hover:text-primary transition-colors">Settings</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Account Defaults</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Account Defaults</h1>
              <p className="text-[14px] text-muted-foreground mt-1">These defaults will be applied to the entire account.</p>
            </div>
          </div>

          {/* Tab Strip - Refined Rootline Style */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`px-6 py-3 text-[13px] font-semibold transition-all relative rounded-t-[4px] border-t-2 whitespace-nowrap ${
                    isActive
                      ? 'text-foreground bg-muted/50 border-t-primary border-x border-border -mb-[1px] z-10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent border-t-transparent border-x border-border'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
        {children}
      </div>
    </div>
  );
}

