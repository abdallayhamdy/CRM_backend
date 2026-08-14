"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { laravelApi } from '@/lib/laravel-api';
import { useAuth } from '@/hooks/use-auth';
import {
  Info,
  ExternalLink,
  Camera,
  User,
  Globe,
  Settings2,
  Trash2,
  Loader2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const InfoTooltip = ({ content }: { content: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help inline-block" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{content}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface UserProfileResponse {
  data: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    language: string;
    date_format: string;
    phone_country: string;
    phone_number: string;
    default_landing_page: string;
    work_start_day: string;
    work_end_day: string;
    work_start_time: string;
    work_end_time: string;
    avatar_url: string | null;
  };
}

export default function ProfileSettingsPage() {
  const { workspaceId, user: authUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(authUser?.firstName || '');
  const [lastName, setLastName] = useState(authUser?.lastName || '');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  const [format, setFormat] = useState('us');
  const [phoneCountry, setPhoneCountry] = useState('us');
  const [defaultLanding, setDefaultLanding] = useState('dashboard');
  const [startDay, setStartDay] = useState('Saturday');
  const [endDay, setEndDay] = useState('Thursday');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('19:00');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.firstName || '');
      setLastName(authUser.lastName || '');
    }
  }, [authUser?.id]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!authUser?.profileId || !workspaceId) return;
      setLoading(true);

      try {
        const { data: response, error } = await laravelApi.get<UserProfileResponse>('/user/profile');

        if (!error && response?.data) {
          const d = response.data;
          setFirstName(d.first_name || authUser?.firstName || '');
          setLastName(d.last_name || authUser?.lastName || '');
          setLanguage(d.language || 'en');
          setFormat(d.date_format || 'us');
          setPhoneCountry(d.phone_country || 'us');
          setPhone(d.phone_number || '');
          setDefaultLanding(d.default_landing_page || 'dashboard');
          setStartDay(d.work_start_day || 'Monday');
          setEndDay(d.work_end_day || 'Friday');
          setStartTime(d.work_start_time || '09:00');
          setEndTime(d.work_end_time || '17:00');
          setAvatarUrl(d.avatar_url || null);
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [authUser?.profileId, workspaceId]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data, error } = await laravelApi.upload<{ data: { avatar_url: string; avatar_path: string } }>(
        '/user/profile/avatar',
        formData
      );

      if (error) {
        toast.error('Failed to upload avatar.');
      } else if (data?.data?.avatar_url) {
        setAvatarUrl(data.data.avatar_url);
        toast.success('Avatar uploaded successfully.');
      }
    } catch {
      toast.error('Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
      e.target.value = '';
    }
  }, [handleAvatarUpload]);

  const handleAvatarDelete = useCallback(async () => {
    try {
      const { error } = await laravelApi.delete('/user/profile/avatar');
      if (error) {
        toast.error('Failed to remove avatar.');
      } else {
        setAvatarUrl(null);
        toast.success('Avatar removed.');
      }
    } catch {
      toast.error('Failed to remove avatar.');
    }
  }, []);

  const handleSave = async () => {
    if (!authUser?.profileId || !workspaceId) return;
    setIsSaving(true);
    try {
      const { data: response, error } = await laravelApi.put<UserProfileResponse>('/user/profile', {
        first_name: firstName,
        last_name: lastName || null,
        language,
        date_format: format,
        phone_country: phoneCountry,
        phone_number: phone || null,
        default_landing_page: defaultLanding,
        work_start_day: startDay,
        work_end_day: endDay,
        work_start_time: startTime,
        work_end_time: endTime,
      });

      if (error) {
        toast.error('Failed to save preferences.');
      } else {
        if (response?.data) {
          const newName = [response.data.first_name, response.data.last_name].filter(Boolean).join(' ');
          if (newName && typeof window !== 'undefined') {
            const event = new CustomEvent('profile-updated', { detail: { name: newName, avatarUrl: response.data.avatar_url } });
            window.dispatchEvent(event);
          }
        }
        toast.success('Profile updated successfully.');
      }
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const user = authUser;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Personal Preferences</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Manage your profile, security settings, and notification preferences.
        </p>
      </div>

      <div className="space-y-10">
        {/* ── GLOBAL SECTION ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">Global Settings</h2>
          </div>
          <p className="text-[13px] text-muted-foreground mb-6">
            This information applies across any LeadSwift CRM accounts you have.
          </p>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-6 border-b border-border">
              <CardTitle className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-[13px]">Update your name, profile image, and regional settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-foreground">Profile Image</Label>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Avatar
                      className="w-24 h-24 ring-2 ring-hs-border ring-offset-4 ring-background shadow-sm cursor-pointer"
                      onClick={handleAvatarClick}
                    >
                      <AvatarImage src={avatarUrl || user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={handleAvatarClick}
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[14px] font-bold text-foreground">Public Avatar</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      Click the image to upload a new profile photo.
                      <br />
                      JPG, GIF or PNG. Max size 2MB.
                    </p>
                    {avatarUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-7 px-2 text-[12px]"
                        onClick={handleAvatarDelete}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-[13px] font-bold text-foreground">First Name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    disabled={loading}
                    className="border-border focus-visible:ring-[var(--color-hs-blue)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-[13px] font-bold text-foreground">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    disabled={loading}
                    className="border-border focus-visible:ring-[var(--color-hs-blue)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-foreground">Language</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={loading}>
                    <SelectTrigger className="border-border focus:ring-[var(--color-hs-blue)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-foreground">Date & Number Format</Label>
                  <p className="text-[12px] text-muted-foreground mb-1">
                    Format: April 21, 2026 · 04/21/2026 · 11:24 AM · 1,234.56
                  </p>
                  <Select value={format} onValueChange={setFormat} disabled={loading}>
                    <SelectTrigger className="border-border focus:ring-[var(--color-hs-blue)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="gb">United Kingdom</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                      <SelectItem value="fr">France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <Label htmlFor="phone" className="text-[13px] font-bold text-foreground">Phone Number</Label>
                <p className="text-[12px] text-muted-foreground mb-1">
                  We may use this to contact you about security events.{' '}
                  <a href="#" className="text-primary hover:underline inline-flex items-center gap-0.5 font-semibold">
                    Privacy policy <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <div className="flex gap-2">
                  <Select value={phoneCountry} onValueChange={setPhoneCountry} disabled={loading}>
                    <SelectTrigger className="w-28 border-border focus:ring-[var(--color-hs-blue)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">🇺🇸 +1</SelectItem>
                      <SelectItem value="gb">🇬🇧 +44</SelectItem>
                      <SelectItem value="de">🇩🇪 +49</SelectItem>
                      <SelectItem value="fr">🇫🇷 +33</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="flex-1 border-border focus-visible:ring-[var(--color-hs-blue)]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── DEFAULTS SECTION ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="w-4 h-4 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">Account Defaults</h2>
          </div>
          <p className="text-[13px] text-muted-foreground mb-6">
            These settings only apply to this LeadSwift CRM account.
          </p>

          <Card className="border-border shadow-sm">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2 max-w-md">
                <Label className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
                  Default Landing Page{' '}
                  <InfoTooltip content="Choose which page you see when you first log in to LeadSwift CRM." />
                </Label>
                <Select value={defaultLanding} onValueChange={setDefaultLanding} disabled={loading}>
                  <SelectTrigger className="border-border focus:ring-[var(--color-hs-blue)]">
                    <SelectValue placeholder="Pick a default home page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="contacts">Contacts</SelectItem>
                    <SelectItem value="deals">Deals</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-3">
                <Label className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
                  Work Schedule{' '}
                  <InfoTooltip content="Set your working days and hours. This is used for scheduling and availability." />
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="space-y-2">
                    <p className="text-[12px] text-muted-foreground">Start Day</p>
                    <Select value={startDay} onValueChange={setStartDay} disabled={loading}>
                      <SelectTrigger className="border-border focus:ring-[var(--color-hs-blue)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] text-muted-foreground">End Day</p>
                    <Select value={endDay} onValueChange={setEndDay} disabled={loading}>
                      <SelectTrigger className="border-border focus:ring-[var(--color-hs-blue)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] text-muted-foreground">Start Time</p>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={loading}
                      className="border-border focus-visible:ring-[var(--color-hs-blue)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] text-muted-foreground">End Time</p>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={loading}
                      className="border-border focus-visible:ring-[var(--color-hs-blue)]"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── SAVE BUTTON ── */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-[var(--color-hs-blue-hover)] text-primary-foreground font-bold"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save All Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
