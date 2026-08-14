"use client";

import React from 'react';

export default function PersonalSecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-full">
      {/* Top Header */}
      <div className="px-4 sm:px-8 pt-8 pb-0 bg-background border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6">Security</h1>
      </div>

      <div className="max-w-[1100px] px-4 sm:px-8 py-8 bg-muted/50 min-h-full">
        {children}
      </div>
    </div>
  );
}
