"use client";

import * as React from "react";
import Image from "next/image";

import {
  Search, Phone,
  Bell, Menu
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LAYOUT_CONSTANTS } from '@/lib/layout-constants';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/use-auth';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ProfileSlider } from './ProfileSlider';

function GlobalSearch() {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[480px] px-2 animate-in fade-in slide-in-from-top-1 duration-500">
      <div className="relative flex-1 group min-w-0">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40 group-hover:text-white/60 transition-colors pointer-events-none" />
        <input
          type="text"
          placeholder="Find or Ask"
          aria-label="Global search"
          className="h-[34px] w-full min-w-0 rounded-full bg-white/[0.07] border border-white/[0.08] pl-9 pr-14 text-[13px] text-white placeholder:text-white/40 hover:bg-white/[0.1] hover:border-white/[0.12] focus:outline-none focus:bg-white/[0.12] focus:border-white/[0.18] transition-all duration-200"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/30 leading-none pointer-events-none">
          ⌘K
        </kbd>
      </div>
    </div>
  );
}

function UtilityIcons() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Calls"
        title="Calls"
        onClick={() => router.push('/calls')}
        className="h-[32px] w-[32px] text-white/70 hover:text-white hover:bg-black/20"
      >
        <Phone className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            title="Notifications"
            className="h-[32px] w-[32px] text-white/70 hover:text-white hover:bg-black/20"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Notifications</span>
            <span className="text-[13px] text-muted-foreground">No new notifications</span>
          </div>
        </PopoverContent>
      </Popover>

      <ThemeToggle />
    </div>
  );
}

export function TopNav({ onMobileMenuOpen }: { onMobileMenuOpen?: () => void }) {
  const { signOut, activeWorkspace, user } = useAuth();
  const [profileOpen, setProfileOpen] = React.useState(false);

  const userInitials = user?.firstName
    ? `${user.firstName}${user.lastName || ""}`.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <header
        style={{ height: `${LAYOUT_CONSTANTS.TOPNAV_HEIGHT}px` }}
        className="fixed top-0 left-0 right-0 z-[60] flex items-center bg-sidebar px-0"
      >
        <div
          style={{ width: `${LAYOUT_CONSTANTS.SIDEBAR_WIDTH}px` }}
          className="shrink-0 h-full hidden md:flex items-center border-r border-white/10"
        >
          <Link href="/" className="flex items-center gap-3 px-5 h-full">
            <Image src="/logo-vector-white-2.png" alt="Rootline CRM" width={56} height={56} className="h-[42px] w-auto" priority />
            <span className="text-[15px] font-semibold text-white whitespace-nowrap tracking-tight">Rootline CRM</span>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 h-[32px] w-[32px] ml-2"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <GlobalSearch />

        <div className="flex items-center gap-0 ml-auto pr-3 shrink-0">
          <UtilityIcons />

          <div className="mx-2 h-4 w-px bg-white/20 hidden xl:block" />

          {activeWorkspace && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 text-white text-sm font-medium">
              {activeWorkspace.name}
            </div>
          )}

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors"
            title="Open profile"
          >
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white">
              {userInitials}
            </div>
            <span className="hidden lg:inline text-sm text-white/80">{user?.firstName || "User"}</span>
          </button>
        </div>
      </header>

      <ProfileSlider open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
