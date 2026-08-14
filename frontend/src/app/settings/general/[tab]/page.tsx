"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { PersonalSecurityContent } from '@/components/settings/PersonalSecurityContent';

export default function GeneralSettingsTabContent() {
  const params = useParams();
  const rawTab = params.tab as string;
  // Normalize tab name
  const activeTab = rawTab.charAt(0).toUpperCase() + rawTab.slice(1);

  if (activeTab === 'Security') {
    return <PersonalSecurityContent />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="text-[18px] font-bold text-foreground mb-2">{activeTab} settings coming soon</h3>
      <p className="text-[14px] text-muted-foreground">This tab is currently under development.</p>
    </div>
  );
}
