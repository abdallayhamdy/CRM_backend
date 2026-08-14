"use client";

import React from "react";

interface SecondarySidebarLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function SecondarySidebarLayout({
  sidebar,
  children,
}: SecondarySidebarLayoutProps) {
  return (
    <div className="flex h-full bg-background text-foreground font-['Lexend_Deca',_sans-serif]">
      {sidebar}
      <div className="flex-1 overflow-y-auto h-full crm-scrollbar p-4 w-full min-w-0">
        {children}
      </div>
    </div>
  );
}
