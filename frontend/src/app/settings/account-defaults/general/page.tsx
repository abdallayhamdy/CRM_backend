"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { laravelApi } from '@/lib/laravel-api';
import { useAuth } from '@/hooks/use-auth';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TIMEZONES = [
  'UTC -12:00 International Date Line West',
  'UTC -11:00 Coordinated Universal Time -11',
  'UTC -10:00 Hawaii',
  'UTC -09:00 Alaska',
  'UTC -08:00 Pacific Standard Time',
  'UTC -07:00 Mountain Standard Time',
  'UTC -06:00 Central Standard Time',
  'UTC -05:00 Eastern Standard Time',
  'UTC -04:00 Atlantic Standard Time',
  'UTC -03:00 Argentina Standard Time',
  'UTC -02:00 Coordinated Universal Time -02',
  'UTC -01:00 Azores Standard Time',
  'UTC +00:00 Greenwich Mean Time',
  'UTC +01:00 Central European Time',
  'UTC +02:00 Eastern European Time',
  'UTC +03:00 Moscow Standard Time',
  'UTC +04:00 Gulf Standard Time',
  'UTC +05:00 Pakistan Standard Time',
  'UTC +05:30 India Standard Time',
  'UTC +06:00 Bangladesh Standard Time',
  'UTC +07:00 Indochina Time',
  'UTC +08:00 China Standard Time',
  'UTC +09:00 Japan Standard Time',
  'UTC +10:00 Australian Eastern Standard Time',
  'UTC +11:00 Solomon Islands Time',
  'UTC +12:00 New Zealand Standard Time',
  'UTC +13:00 Samoa Standard Time',
];

const FISCAL_MONTHS = [
  { value: 'jan-dec', label: 'January - December', start: 'jan', end: 'dec' },
  { value: 'feb-jan', label: 'February - January', start: 'feb', end: 'jan' },
  { value: 'mar-feb', label: 'March - February', start: 'mar', end: 'feb' },
  { value: 'apr-mar', label: 'April - March', start: 'apr', end: 'mar' },
  { value: 'may-apr', label: 'May - April', start: 'may', end: 'apr' },
  { value: 'jun-may', label: 'June - May', start: 'jun', end: 'may' },
  { value: 'jul-jun', label: 'July - June', start: 'jul', end: 'jun' },
  { value: 'aug-jul', label: 'August - July', start: 'aug', end: 'jul' },
  { value: 'sep-aug', label: 'September - August', start: 'sep', end: 'aug' },
  { value: 'oct-sep', label: 'October - September', start: 'oct', end: 'sep' },
  { value: 'nov-oct', label: 'November - October', start: 'nov', end: 'oct' },
  { value: 'dec-nov', label: 'December - November', start: 'dec', end: 'nov' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
];

const InfoTip = ({ content }: { content: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block ml-1.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs bg-[var(--color-hs-text-primary)] text-[var(--color-hs-card-bg)] border-none">
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface WorkspaceSettingsResponse {
  data: {
    name: string;
    timezone: string;
    fiscal_year_start: string;
    company_name: string;
    company_domain: string;
    company_address: string;
    company_address2: string;
    company_city: string;
    company_state: string;
    company_zip: string;
    company_country: string;
    industry: string;
  };
}

export default function GeneralDefaultsPage() {
  const { workspaceId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [timezone, setTimezone] = useState('UTC -05:00 Eastern Standard Time');
  const [fiscalYear, setFiscalYear] = useState('jan-dec');

  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyAddress2, setCompanyAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!workspaceId) return;
      setLoading(true);
      const { data, error } = await laravelApi.get<WorkspaceSettingsResponse>('/workspace/settings');
      if (!error && data?.data) {
        const d = data.data;
        setAccountName(d.name || '');
        setTimezone(d.timezone || 'UTC -05:00 Eastern Standard Time');
        const fyStart = d.fiscal_year_start || 'jan';
        const fyMatch = FISCAL_MONTHS.find(m => m.start === fyStart);
        setFiscalYear(fyMatch?.value || 'jan-dec');
        setCompanyName(d.company_name || '');
        setCompanyDomain(d.company_domain || '');
        setCompanyAddress(d.company_address || '');
        setCompanyAddress2(d.company_address2 || '');
        setCity(d.company_city || '');
        setState(d.company_state || '');
        setZip(d.company_zip || '');
        setCountry(d.company_country || '');
        setIndustry(d.industry || '');
      }
      setLoading(false);
    }
    load();
  }, [workspaceId]);

  const handleSave = async () => {
    if (!workspaceId) return;
    setIsSaving(true);
    const { error } = await laravelApi.patch('/workspace/settings', {
      name: accountName,
      timezone: timezone,
      fiscal_year_start: FISCAL_MONTHS.find(m => m.value === fiscalYear)?.start || 'jan',
      company_name: companyName,
      company_domain: companyDomain,
      company_address: companyAddress,
      company_address2: companyAddress2,
      company_city: city,
      company_state: state,
      company_zip: zip,
      company_country: country,
      industry: industry,
    });

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Account defaults updated successfully.');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-10 pb-32">
      {/* ── Account Settings ── */}
      <section className="space-y-6">
        <div className="space-y-1">
          <Label className="text-[18px] font-bold text-foreground">Account Settings</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[700px]">
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground flex items-center">
              Account name
              <InfoTip content="The name that appears in your portal and email notifications." />
            </Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground flex items-center">
              Time zone
              <InfoTip content="Used for all activity logging and automation scheduling." />
            </Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={loading}>
              <SelectTrigger className="border-border h-10 focus:ring-[var(--color-hs-blue)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground flex items-center">
              Fiscal year
              <InfoTip content="Determines the beginning of your financial reporting period." />
            </Label>
            <Select value={fiscalYear} onValueChange={setFiscalYear} disabled={loading}>
              <SelectTrigger className="border-border h-10 focus:ring-[var(--color-hs-blue)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FISCAL_MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator className="bg-[var(--color-hs-border)]" />

      {/* ── Company Information ── */}
      <section className="space-y-6">
        <div className="space-y-1">
          <Label className="text-[18px] font-bold text-foreground">Company Information</Label>
          <p className="text-[13px] text-muted-foreground">
            This information will be used as a default where needed. If you&apos;re looking to update
            your company information for billing, visit{' '}
            <Link href="/settings/account-defaults" className="text-[var(--color-hs-blue)] font-bold hover:underline">
              Account &amp; Billing
            </Link>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[700px]">
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">Company name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">Company domain</Label>
            <Input
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">Company address</Label>
            <Input
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Enter street address"
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">Company address line 2</Label>
            <Input
              value={companyAddress2}
              onChange={(e) => setCompanyAddress2(e.target.value)}
              placeholder="Apt, suite, unit, etc."
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">City</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city"
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">State</Label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Enter state"
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">Zip</Label>
            <Input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Enter zip code"
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-foreground">Country</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Enter country"
              disabled={loading}
              className="border-border h-10 focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-[13px] font-bold text-foreground flex items-center">
              Industry
              <InfoTip content="Used to tailor default templates and suggestions for your business." />
            </Label>
            <Select value={industry} onValueChange={setIndustry} disabled={loading}>
              <SelectTrigger className="w-full border-border h-10 focus:ring-[var(--color-hs-blue)]">
                <SelectValue placeholder="Choose your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Save ── */}
      <div className="flex justify-start pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold px-8 h-11"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-[var(--color-hs-card-bg)]/30 border-t-white rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
