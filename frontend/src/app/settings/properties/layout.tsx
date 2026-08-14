"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { laravelApi } from '@/lib/laravel-api';

export default function PropertiesSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getActiveTab = () => {
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'properties') return 'Properties';
    if (lastPart === 'groups') return 'Groups';
    if (lastPart === 'archived') return 'Archived';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  const activeTab = getActiveTab();
  const objectType = searchParams.get('object_type') ||
                     (pathname.includes('/company') ? 'company' :
                     pathname.includes('/deal') ? 'deal' :
                     pathname.includes('/ticket') ? 'ticket' :
                     pathname.includes('/product') ? 'product' : 'contact');

  const objectLabel = objectType.charAt(0).toUpperCase() + objectType.slice(1);

  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [archivedCount, setArchivedCount] = useState<number | null>(null);

  const fetchCounts = async () => {
    try {
      const response = await laravelApi.get<{ activeCount: number; archivedCount: number }>('/properties', {
        object_type: objectType,
        counts_only: 'true',
      });
      if (!response.error && response.data) {
        setActiveCount(response.data.activeCount);
        setArchivedCount(response.data.archivedCount);
      }
    } catch (err) {
      console.error('Failed to fetch property counts:', { message: (err as Error)?.message });
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [objectType]);

  useEffect(() => {
    const handleCountChange = () => {
      fetchCounts();
    };

    const handleCountsFetched = (e: Event) => {
      const customEvent = e as CustomEvent<{ activeCount: number; archivedCount: number }>;
      if (customEvent.detail) {
        setActiveCount(customEvent.detail.activeCount);
        setArchivedCount(customEvent.detail.archivedCount);
      }
    };

    window.addEventListener('properties-count-changed', handleCountChange);
    window.addEventListener('properties-counts', handleCountsFetched);
    return () => {
      window.removeEventListener('properties-count-changed', handleCountChange);
      window.removeEventListener('properties-counts', handleCountsFetched);
    };
  }, [objectType]);

  const tabs = [
    { name: 'Properties', href: `/settings/properties?object_type=${objectType}` },
    { name: 'Groups', href: `/settings/properties/groups?object_type=${objectType}` },
    { name: 'Archived', href: `/settings/properties/archived?object_type=${objectType}` },
  ];

  return (
    <div className="bg-background min-h-full">
      {/* Top Header */}
      <div className="px-8 pt-8 pb-0 bg-background border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-bold text-foreground">Properties</h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">{objectLabel} properties</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex">
          {tabs.map((tab) => {
            const showActiveCount = tab.name === 'Properties' && activeCount !== null;
            const showArchivedCount = tab.name === 'Archived' && archivedCount !== null;
            const count = tab.name === 'Properties' ? activeCount : archivedCount;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`px-5 py-3 text-[14px] font-medium transition-all relative flex items-center ${
                  activeTab === tab.name
                    ? 'text-foreground bg-background border border-border border-b-card -mb-[1px] rounded-t-[3px] shadow-[0_-2px_0_0_hsl(var(--primary))]'
                    : 'text-muted-foreground hover:bg-accent border-b border-border'
                }`}
              >
                <span>{tab.name}</span>
                {(showActiveCount || showArchivedCount) && (
                  <span className="ms-1 px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-normal">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-8 py-8 bg-muted/50 min-h-[calc(100vh-140px)]">
        {children}
      </div>
    </div>
  );
}