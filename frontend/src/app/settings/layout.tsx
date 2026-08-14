"use client";

import React from 'react';
import { SecondarySidebarLayout } from '@/components/layout/SecondarySidebarLayout';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard requireAuth={true}>
      <SecondarySidebarLayout sidebar={<SettingsSidebar />}>
        {children}
      </SecondarySidebarLayout>
    </RouteGuard>
  );
}
