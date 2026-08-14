"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  ChevronDown,
  Plus,
  History,
  Edit3,
  Search,
  DollarSign,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { laravelApi } from "@/lib/laravel-api";

interface WorkspaceSettingsResponse {
  data: {
    currency: string;
    currency_symbol: string;
  };
}

const currencies = [
  { name: 'US Dollar (USD) $', code: 'USD', symbol: '$' },
  { name: 'Euro (EUR) €', code: 'EUR', symbol: '€' },
  { name: 'British Pound (GBP) £', code: 'GBP', symbol: '£' },
  { name: 'Australian Dollar (AUD) AU$', code: 'AUD', symbol: 'AU$' },
  { name: 'Canadian Dollar (CAD) $', code: 'CAD', symbol: '$' },
  { name: 'Japanese Yen (JPY) ¥', code: 'JPY', symbol: '¥' },
  { name: 'Chinese Yuan (CNY) CN¥', code: 'CNY', symbol: 'CN¥' },
  { name: 'Indian Rupee (INR) ₹', code: 'INR', symbol: '₹' },
];

export default function CurrencyPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('US Dollar (USD) $');
  const [companyCurrency, setCompanyCurrency] = useState('US Dollar (USD) $');
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await laravelApi.get<WorkspaceSettingsResponse>('/workspace/settings')
        if (!error && data?.data) {
          const code = data.data.currency || 'USD'
          const found = currencies.find(c => c.code === code)
          const name = found?.name ?? 'US Dollar (USD) $'
          setCompanyCurrency(name)
          setSelectedCurrency(name)
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentCurrencyData = currencies.find(c => c.name === companyCurrency) || currencies[0];

  const filteredCurrencies = currencies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMenu = () => {
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const menuContent = menuOpen && (
    <div 
      ref={menuRef}
      style={{ 
        position: 'fixed', 
        top: menuPos.top + 4, 
        left: menuPos.left,
        zIndex: 99999 
      }}
      className="w-[220px] bg-background border border-border rounded-lg shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150"
    >
      <button
        onClick={() => { setHistoryOpen(true); setMenuOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-foreground hover:bg-[var(--color-hs-light-bg)] transition-colors"
      >
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        View currency history
      </button>
      <button
        onClick={() => { setEditOpen(true); setMenuOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-foreground hover:bg-[var(--color-hs-light-bg)] transition-colors"
      >
        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
        Edit company currency
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <p className="text-[14px] text-muted-foreground">
          Define the primary currency for your organization. This will be the base for all deal values and financial reporting.
        </p>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-[var(--color-hs-page-bg)] border-b border-border py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--color-hs-blue)]" />
              <CardTitle className="text-[15px] font-bold text-foreground">Available Currencies</CardTitle>
            </div>
            <Button size="sm" className="h-8 bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold text-[12px] gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Currency
              <Lock className="h-3 w-3 ml-1 opacity-70" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-foreground">
              <thead>
                <tr className="bg-[var(--table-header-bg)]/75 backdrop-blur-sm border-b border-border-light">
                  <th scope="col" className="py-4 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-[40%]">Currency Name</th>
                   <th scope="col" className="py-4 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Rate</th>
                   <th scope="col" className="py-4 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Example Format</th>
                   <th scope="col" className="py-4 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border-light hover:bg-[var(--color-hs-light-bg)] transition-colors">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-hs-border-light)] flex items-center justify-center text-[var(--color-hs-blue)]">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-foreground">{loading ? '...' : companyCurrency}</span>
                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">System Default</span>
                      </div>
                      <Button
                        ref={buttonRef}
                        variant="outline"
                        size="sm"
                        onClick={toggleMenu}
                        disabled={loading}
                        className={`h-8 px-3 text-[12px] font-bold border-border gap-1.5 ml-2 ${menuOpen ? 'bg-[var(--color-hs-page-bg)] border-[var(--color-hs-blue)] text-[var(--color-hs-blue)]' : ''}`}
                      >
                        Actions <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className="text-[13px] font-mono font-bold text-foreground">1.0000</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-[13px] font-medium text-foreground bg-[var(--color-hs-page-bg)] px-3 py-1 rounded border border-border-light">
                      {currentCurrencyData.symbol}123,456.78
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <Badge className="bg-status-success-light text-status-success border-status-success/20 text-[10px] h-6 flex items-center gap-1.5 w-fit">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-[var(--color-hs-page-bg)] rounded-lg border border-border">
        <AlertCircle className="h-5 w-5 text-[var(--color-hs-blue)]" />
        <p className="text-[13px] text-foreground leading-relaxed">
          Changing the company currency will update the display value for all historical records and reports based on today&apos;s exchange rates. 
          <button className="ml-1 font-bold text-[var(--color-hs-blue)] hover:underline">Learn more about multi-currency.</button>
        </p>
      </div>

      {/* Currency History Panel */}
      {historyOpen && (
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent side="right" className="w-full max-w-[600px] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">{companyCurrency} History</SheetTitle>
            <div className="flex items-center justify-between p-8 border-b border-border-light">
              <div>
                <h2 className="text-[20px] font-bold text-foreground">{companyCurrency} History</h2>
                <p className="text-[13px] text-muted-foreground mt-1">Audit log of currency changes and rate updates.</p>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="h-10 w-10 flex items-center justify-center hover:bg-[var(--color-hs-light-bg)] rounded-full transition-colors text-muted-foreground">
                <span className="text-[28px] leading-none">×</span>
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-foreground">
                  <thead>
                    <tr className="bg-[var(--table-header-bg)]/75 backdrop-blur-sm border-b border-border">
                      <th scope="col" className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Change Details</th>
                      <th scope="col" className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((item, idx) => (
                        <tr key={idx} className="border-b border-border-light last:border-b-0 hover:bg-[var(--color-hs-light-bg)]">
                          <td className="py-4 px-4 text-[13px] text-foreground font-medium">{item.status}</td>
                          <td className="py-4 px-4 text-[13px] text-muted-foreground">{item.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-16 text-center text-[13px] text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-3 opacity-20" />
                          No audit history available for this currency.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Edit Company Currency Modal */}
      {editOpen && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px] p-0" showCloseButton={false}>
            <DialogTitle className="sr-only">Edit Company Currency</DialogTitle>
            <div className="flex items-center justify-between p-6 border-b border-border-light">
              <h2 className="text-[18px] font-bold text-foreground">Edit Company Currency</h2>
              <button onClick={() => setEditOpen(false)} className="h-8 w-8 flex items-center justify-center hover:bg-[var(--color-hs-light-bg)] rounded-full transition-colors text-muted-foreground">
                <span className="text-[24px] leading-none">×</span>
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-visible">
              <div className="space-y-3 overflow-visible">
                <Label className="text-[14px] font-bold text-foreground">Select Primary Currency</Label>
                
                <div className="relative overflow-visible">
                  <Button
                    variant="outline"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full flex items-center justify-between h-11 px-4 bg-background border text-[14px] font-medium text-foreground ${
                      dropdownOpen ? 'border-[var(--color-hs-blue)] ring-2 ring-[var(--color-hs-blue)]/10' : 'border-border'
                    }`}
                  >
                    <span>{selectedCurrency}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-lg shadow-2xl z-[100002] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-border-light">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            autoFocus
                            placeholder="Search currencies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 border-border focus:ring-[var(--color-hs-blue)] rounded-full"
                          />
                        </div>
                      </div>

                      <div className="max-h-[250px] overflow-y-auto py-1 custom-scrollbar">
                        {filteredCurrencies.length > 0 ? (
                          filteredCurrencies.map((c) => (
                            <button
                              key={c.code}
                              onClick={() => {
                                setSelectedCurrency(c.name);
                                setDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              className={`w-full text-left px-5 py-3 text-[14px] hover:bg-[var(--color-hs-light-bg)] transition-colors ${
                                selectedCurrency === c.name ? 'bg-[var(--color-hs-page-bg)] font-bold text-[var(--color-hs-blue)]' : 'text-foreground'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-5 py-8 text-[13px] text-muted-foreground text-center italic">
                            No results for &quot;{searchQuery}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-border-light">
                <Button
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const found = currencies.find(c => c.name === selectedCurrency)
                      const { error } = await laravelApi.patch('/workspace/settings', {
                        currency: found?.code ?? 'USD',
                        currency_symbol: found?.symbol ?? '$',
                      })
                      if (error) throw new Error(error)
                      const newEntry = {
                        status: `Changed to ${selectedCurrency}`,
                        date: new Date().toLocaleString()
                      };
                      setHistory(prev => [newEntry, ...prev]);
                      setCompanyCurrency(selectedCurrency);
                      toast.success('Company currency updated');
                      setEditOpen(false);
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Unknown error');
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="flex-1 bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold h-11"
                >
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 h-11 border-border text-foreground font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {mounted && typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
