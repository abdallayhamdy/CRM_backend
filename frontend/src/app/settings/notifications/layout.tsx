"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Email & Desktop', href: '/settings/notifications' },
    { name: 'Other apps', href: '/settings/notifications/other-apps' },
    { name: 'Mobile app', href: '/settings/notifications/mobile-app' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-8 pb-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6">Notifications</h1>
        
        {/* Navigation Tabs */}
        <div className="flex border border-border rounded-xs w-full sm:w-fit overflow-x-auto bg-muted/50 min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                  className={`px-6 py-2 text-[13px] font-bold transition-colors border-r border-border last:border-r-0 whitespace-nowrap ${
                  isActive 
                    ? 'bg-background text-foreground' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 sm:px-8 py-8 max-w-[1200px]">
        {children}
      </div>
    </div>
  );
}
