"use client"

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LAYOUT_CONSTANTS } from '@/lib/layout-constants';
import { NAVIGATION_DATA, NavigationGroup, NavigationItem } from '@/lib/navigation-data';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, VisuallyHidden } from './ui/sheet';
import { useSidebar } from './layout/SidebarContext';

interface SidebarItemProps {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarItem({ item, isActive, isCollapsed }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <li>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start mx-0 h-10 px-3 transition-colors rounded-none",
          isCollapsed && "justify-center px-0",
          isActive
            ? "bg-primary/10 hover:bg-primary/15 !text-sidebar-foreground font-semibold"
            : "!text-sidebar-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:!text-sidebar-foreground"
        )}
        asChild
      >
        <Link href={item.href} title={isCollapsed ? item.name : undefined}>
          <Icon className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="truncate text-sm ml-2">{item.name}</span>}
        </Link>
      </Button>
    </li>
  );
}

interface SidebarGroupProps {
  group: NavigationGroup;
  pathname: string;
  isCollapsed: boolean;
}

function SidebarGroup({ group, pathname, isCollapsed }: SidebarGroupProps) {
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col gap-0.5">
        {group.items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return <SidebarItem key={item.name} item={item} isActive={isActive} isCollapsed={isCollapsed} />;
        })}
      </ul>
    </div>
  );
}

export function SidebarContent({ pathname }: { pathname: string }) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <>
      {/* Top Spacer area */}
      <div
        style={{ height: `${LAYOUT_CONSTANTS.TOPNAV_HEIGHT}px` }}
        className="shrink-0 hidden md:block"
      />

      {/* Navigation */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full pb-12">
          <div className="flex flex-col gap-1 pt-4">
            {NAVIGATION_DATA.map((group) => (
              <SidebarGroup key={group.group} group={group} pathname={pathname} isCollapsed={isCollapsed} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Settings + Collapse toggle at bottom */}
      <div className="shrink-0 pb-6 pt-3 px-2 bg-sidebar">
        <div className={cn("flex items-center gap-1", isCollapsed ? "flex-col" : "")}>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 justify-start mx-0 h-9 rounded-lg px-4 transition-colors",
              isCollapsed && "justify-center px-0",
              pathname === '/settings'
                ? "bg-primary/10 hover:bg-primary/15 !text-sidebar-foreground font-semibold"
                : "!text-sidebar-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:!text-sidebar-foreground"
            )}
            asChild
          >
            <Link href="/settings" title={isCollapsed ? "Settings" : undefined}>
              <Settings className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="font-semibold ml-2">Settings</span>}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0 !text-sidebar-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:!text-sidebar-foreground transition-colors",
              isCollapsed && "mx-0"
            )}
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <aside
      style={{ width: isCollapsed ? '64px' : `${LAYOUT_CONSTANTS.SIDEBAR_WIDTH}px` }}
      className="fixed inset-y-0 left-0 bg-sidebar text-sidebar-foreground flex flex-col z-overlay h-screen hidden md:flex transition-[width] duration-200 ease-in-out"
    >
      <SidebarContent pathname={pathname} />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  React.useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="left" className="p-0 flex flex-col w-[280px] bg-sidebar text-white shadow-[8px_0_32px_-8px_rgba(0,0,0,0.2),2px_0_12px_-2px_rgba(0,0,0,0.1)]">
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <VisuallyHidden>
            <SheetDescription>Access different sections of the CRM</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        <div className="flex-1 flex flex-col mt-4 overflow-y-auto">
          <SidebarContent pathname={pathname} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
