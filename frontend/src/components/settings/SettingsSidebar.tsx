"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  Bell, 
  Building2, 
  Settings2, 
  History, 
  Users2, 
  Shield,
  Search,
  Database,
  Box,
  ChevronDown,
  RotateCcw,
  Palette,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SettingsItem {
  label: string;
  href: string;
  icon: any;
  requiredPermissions?: string[];
}

export function SettingsSidebar() {
  const pathname = usePathname();
  const { permissions, isSuperAdmin } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const hasPermission = (requiredPermissions?: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some(p => permissions.includes(p));
  };

  const navGroups: { title: string; items: SettingsItem[] }[] = useMemo(() => [
    {
      title: "Your Preferences",
      items: [
        { label: "General", href: "/settings/general", icon: User },
        { label: "Security", href: "/settings/personal-security", icon: Shield },
        { label: "Notifications", href: "/settings/notifications", icon: Bell },
        { label: "Appearance", href: "/settings/appearance", icon: Palette },
      ]
    },
    {
      title: "Account Management",
      items: [
        { label: "Workspace", href: "/settings/workspace", icon: Building2, requiredPermissions: ['manage_settings'] },
        { label: "Account Defaults", href: "/settings/account-defaults", icon: Settings2, requiredPermissions: ['manage_settings'] },
        { label: "Audit Log", href: "/settings/audit-log", icon: History, requiredPermissions: ['manage_audit_log'] },
        { label: "Users & Teams", href: "/settings/users-teams", icon: Users2, requiredPermissions: ['manage_workspace_members', 'invite_users'] },
      ]
    },
    {
      title: "Data Management",
      items: [
        { label: "Custom Properties", href: "/settings/properties", icon: Database, requiredPermissions: ['manage_properties'] },
        { label: "Objects", href: "/settings/objects", icon: Box, requiredPermissions: ['manage_settings'] },
        { label: "Backup & Restore", href: "/settings/backup-restore", icon: RotateCcw, requiredPermissions: ['manage_backup'] },
      ]
    }
  ], []);

  const filteredNavGroups = useMemo(() => {
    return navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => hasPermission(item.requiredPermissions)),
      }))
      .filter(group => group.items.length > 0);
  }, [navGroups, permissions, isSuperAdmin]);

  const renderItem = (item: any, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = !hasChildren && pathname.startsWith(item.href);
    const isSectionOpen = openSections[item.label] ?? item.children?.some((c: any) => pathname.startsWith(c.href));
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleSection(item.label)}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-md text-[13px] transition-all group text-left ${
              isSectionOpen
                ? 'text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 transition-colors ${isSectionOpen ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-muted-foreground'}`} />}
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-status-purple text-primary-foreground font-medium">
                {item.badge}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSectionOpen ? 'rotate-0' : '-rotate-90'}`} />
          </button>
          {isSectionOpen && (
            <div className="ml-4 space-y-0.5">
              {item.children.map((child: any) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 py-2 px-3 rounded-md text-[13px] transition-all group ${depth > 0 ? 'text-[12px]' : ''} ${
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
      >
        {Icon && depth === 0 && <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-muted-foreground'}`} />}
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-status-purple text-primary-foreground font-medium">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex-none w-[260px] max-w-[85vw] h-full bg-background border-r border-border shadow-[var(--shadow-sidebar)] overflow-y-auto crm-scrollbar">
      <div className="p-5 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Settings</h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search Settings"
            className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px] placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      <div className="pb-8">
        {filteredNavGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-5 py-2 font-bold text-foreground text-[11px] uppercase tracking-wider opacity-60">
              {group.title}
            </div>
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => renderItem(item))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open settings menu"
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
