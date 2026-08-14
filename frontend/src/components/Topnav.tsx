"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Phone,
  Bell, Clock, Menu, Shield,
  Loader2, Users, Building2, DollarSign, Package,
  ClipboardCheck, Activity, StickyNote, Ticket, AlertCircle,
  ShoppingCart, FileText
} from 'lucide-react';
import { LAYOUT_CONSTANTS } from '@/lib/layout-constants';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { laravelApi } from '@/lib/laravel-api';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from './ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ProfileSlider } from './ProfileSlider';
import { useSidebar } from '@/components/layout/SidebarContext';

interface SearchResults {
  contacts: Array<{ id: string; first_name: string; last_name: string; email?: string; company?: { id: string; name: string } }>;
  companies: Array<{ id: string; name: string; website?: string }>;
  deals: Array<{ id: string; title: string; amount?: number }>;
  products: Array<{ id: string; name: string; sku?: string }>;
  tasks: Array<{ id: string; title: string; status?: string; due_date?: string }>;
  activities: Array<{ id: string; title?: string; type?: string; entity_route?: string; entity_type?: string }>;
  notes: Array<{ id: string; content: string; type?: string; notable_id?: string }>;
  tickets: Array<{ id: string; subject: string; status?: string; priority?: string }>;
  orders: Array<{ id: string; order_number?: string; title?: string; status?: string; total?: number }>;
  documents: Array<{ id: string; name: string; document_type?: string; mime_type?: string }>;
}

type SectionKey = keyof SearchResults;

const SECTION_CONFIG: Record<SectionKey, { label: string; icon: React.ElementType; linkPrefix: string; subtitle?: (item: Record<string, unknown>) => string | null }> = {
  contacts: { label: "Contacts", icon: Users, linkPrefix: "/contacts", subtitle: (item) => (item as SearchResults['contacts'][0]).email || (item as SearchResults['contacts'][0]).company?.name || null },
  companies: { label: "Companies", icon: Building2, linkPrefix: "/companies", subtitle: (item) => (item as SearchResults['companies'][0]).website || null },
  deals: { label: "Deals", icon: DollarSign, linkPrefix: "/deals", subtitle: (item) => { const amt = (item as SearchResults['deals'][0]).amount; return amt ? `$${Number(amt).toLocaleString()}` : null; } },
  tasks: { label: "Tasks", icon: ClipboardCheck, linkPrefix: "/tasks", subtitle: (item) => { const t = item as SearchResults['tasks'][0]; return t.status || null; } },
  activities: { label: "Activities", icon: Activity, linkPrefix: "/activity-feed", subtitle: (item) => { const a = item as SearchResults['activities'][0]; return a.type || null; } },
  notes: { label: "Notes", icon: StickyNote, linkPrefix: "/notes", subtitle: (item) => { const n = item as SearchResults['notes'][0]; return n.content ? n.content.substring(0, 60) : null; } },
  tickets: { label: "Tickets", icon: Ticket, linkPrefix: "/tickets", subtitle: (item) => { const t = item as SearchResults['tickets'][0]; return t.status || null; } },
  products: { label: "Products", icon: Package, linkPrefix: "/products", subtitle: (item) => { const p = item as SearchResults['products'][0]; return p.sku ? `SKU: ${p.sku}` : null; } },
  orders: { label: "Orders", icon: ShoppingCart, linkPrefix: "/orders", subtitle: (item) => { const o = item as SearchResults['orders'][0]; return o.order_number || o.status || null; } },
  documents: { label: "Documents", icon: FileText, linkPrefix: "/documents", subtitle: (item) => { const d = item as SearchResults['documents'][0]; return d.document_type || d.mime_type || null; } },
};

const SECTION_ORDER: SectionKey[] = ['contacts', 'companies', 'deals', 'tasks', 'activities', 'tickets', 'orders', 'notes', 'products', 'documents'];

function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const loading = query.trim() !== debouncedQuery.trim() && query.trim().length > 0;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults(null);
      setError(null);
    }
  }, []);

  const handleQueryChange = React.useCallback((value: string) => {
    setQuery(value);
    setError(null);
  }, []);

  React.useEffect(() => {
    if (!debouncedQuery.trim()) return;

    let cancelled = false;

    laravelApi.get<SearchResults>("/search", { q: debouncedQuery }).then(({ data, error: apiError }) => {
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setResults(null);
      } else if (data) {
        setResults(data);
        setError(null);
      }
    });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const navigateTo = React.useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const getResultTitle = (item: Record<string, unknown>, key: SectionKey): string => {
    if (key === "contacts") {
      const c = item as SearchResults['contacts'][0];
      return `${c.first_name} ${c.last_name}`.trim();
    }
    if (key === "deals") return (item as SearchResults['deals'][0]).title;
    if (key === "tasks") return (item as SearchResults['tasks'][0]).title;
    if (key === "activities") return (item as SearchResults['activities'][0]).title || (item as SearchResults['activities'][0]).type || "";
    if (key === "notes") return (item as SearchResults['notes'][0]).content?.substring(0, 80) || "";
    if (key === "tickets") return (item as SearchResults['tickets'][0]).subject;
    if (key === "companies") return (item as SearchResults['companies'][0]).name;
    if (key === "products") return (item as SearchResults['products'][0]).name;
    if (key === "orders") return (item as SearchResults['orders'][0]).title || (item as SearchResults['orders'][0]).order_number || "";
    if (key === "documents") return (item as SearchResults['documents'][0]).name;
    return "";
  };

  const getHref = (item: Record<string, unknown>, key: SectionKey): string => {
    if (key === "activities") {
      const a = item as SearchResults['activities'][0];
      if (a.entity_route) return a.entity_route;
      return SECTION_CONFIG.activities.linkPrefix;
    }
    if (key === "notes") {
      const n = item as SearchResults['notes'][0];
      if (n.type && n.notable_id) {
        const typeMap: Record<string, string> = { Contact: "/contacts", Company: "/companies", Deal: "/deals", Ticket: "/tickets" };
        const prefix = typeMap[n.type];
        if (prefix) return `${prefix}/${n.notable_id}`;
      }
      return SECTION_CONFIG.notes.linkPrefix;
    }
    return `${SECTION_CONFIG[key].linkPrefix}/${(item as { id: string }).id}`;
  };

  const hasAnyResults = results && SECTION_ORDER.some((key) => {
    const items = results[key];
    return Array.isArray(items) && items.length > 0;
  });

  return (
    <>
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[480px] px-2 animate-in fade-in slide-in-from-top-1 duration-500">
        <button
          onClick={() => setOpen(true)}
          className="relative flex-1 group min-w-0"
        >
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40 group-hover:text-white/60 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Find or Ask"
            aria-label="Global search"
            readOnly
            className="h-[34px] w-full min-w-0 rounded-full bg-white/[0.07] border border-white/[0.08] pl-9 pr-14 text-[13px] text-white placeholder:text-white/40 hover:bg-white/[0.1] hover:border-white/[0.12] focus:outline-none focus:bg-white/[0.12] focus:border-white/[0.18] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] transition-all duration-200 cursor-pointer"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/30 leading-none pointer-events-none">
            ⌘K
          </kbd>
        </button>
        <Button variant="ghost" size="icon" aria-label="Create new" className="h-[28px] w-[28px] rounded-full text-white/70 hover:text-white hover:bg-sidebar-accent">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={handleOpenChange} title="Global Search" description="Search across your entire CRM">
        <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search contacts, companies, deals, tasks, activities..."
          value={query}
          onValueChange={handleQueryChange}
        />
        <CommandList>
          {error && (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && !results && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {!query.trim() && !loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type to search across the CRM
            </div>
          )}

          {!loading && query.trim() && !error && !hasAnyResults && (
            <CommandEmpty>No results found for &ldquo;{query}&rdquo;</CommandEmpty>
          )}

          {hasAnyResults && SECTION_ORDER.map((key) => {
            const items = results![key];
            if (!Array.isArray(items) || items.length === 0) return null;

            const config = SECTION_CONFIG[key];
            const Icon = config.icon;

            return (
              <React.Fragment key={key}>
                <CommandGroup heading={<span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{config.label} <span className="text-muted-foreground">({items.length})</span></span>}>
                  {items.map((item) => {
                    const title = getResultTitle(item, key);
                    const subtitle = config.subtitle?.(item as Record<string, unknown>);
                    const href = getHref(item as Record<string, unknown>, key);

                    return (
                      <CommandItem
                        key={(item as { id: string }).id}
                        value={`${key}-${(item as { id: string }).id}-${title}`}
                        onSelect={() => navigateTo(href)}
                        className="cursor-pointer"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{title}</p>
                          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            );
          })}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
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
  const { activeWorkspace, user, isSuperAdmin } = useAuth();
  const { isCollapsed } = useSidebar();
  const [profileOpen, setProfileOpen] = React.useState(false);

  const userInitials = user?.firstName
    ? `${user.firstName}${user.lastName || ""}`.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <header
        style={{ height: `${LAYOUT_CONSTANTS.TOPNAV_HEIGHT}px` }}
        className="fixed top-0 left-0 right-0 z-[60] flex items-center bg-sidebar px-0 border-b border-border"
      >
        <div
          style={{ width: isCollapsed ? 64 : `${LAYOUT_CONSTANTS.SIDEBAR_WIDTH}px` }}
          className="shrink-0 h-full hidden md:flex items-center border-r border-white/10 transition-[width] duration-200 ease-in-out"
        >
          <Link href="/" className={cn("flex items-center gap-3 h-full", isCollapsed ? "px-3" : "px-5")}>
            <Image src="/logo-vector-white-2.png" alt="Rootline CRM" width={56} height={56} className="h-[42px] w-auto shrink-0" priority />
            <span className={cn("text-[15px] font-semibold text-white whitespace-nowrap tracking-tight transition-opacity", isCollapsed && "hidden")}>Rootline CRM</span>
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

          <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 hidden md:flex text-white/70 hover:text-white">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="tracking-tight hidden lg:inline">14 days left in trial</span>
          </Button>

          <div className="mx-2 h-4 w-px bg-white/20" />

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <>
                <Link
                  href="/super-admin"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
                  title="Super Admin"
                >
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden lg:inline">Super Admin</span>
                </Link>
                <div className="mx-2 h-4 w-px bg-white/20 hidden lg:block" />
              </>
            )}

            {activeWorkspace && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 text-white text-sm font-medium max-w-[180px]">
                <span className="truncate">{activeWorkspace.name}</span>
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
            </button>
          </div>
        </div>
      </header>

      <ProfileSlider open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
