"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Mail, Globe, Monitor, Volume2, Search,
  ChevronDown, ChevronRight, Info, Play, ExternalLink, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { laravelApi } from '@/lib/laravel-api';

interface NotificationPreferencesResponse {
  data: {
    topic_preferences: any[] | null;
    channels?: { email: boolean; bell: boolean; browser: boolean; popup: boolean } | null;
    new_leads: boolean;
    task_reminders: boolean;
    weekly_digest: boolean;
    browser_alerts: boolean;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverSnapshot, setServerSnapshot] = useState<{ topics: string; notifications: string; channels: string }>({ topics: '', notifications: '', channels: '' });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    bell: true,
    browser: true,
    popup: true
  });

  const [notifications, setNotifications] = useState({
    newLeads: true,
    taskReminders: true,
    weeklyDigest: false,
    browserAlerts: true
  });

  const [expandedTopics, setExpandedTopics] = useState<string[]>(['Blog', 'CRM', 'Calling']);
  const [searchTerm, setSearchTerm] = useState('');

  const [topics, setTopics] = useState<any[]>([
    { 
      name: 'Audit Logs', 
      channels: { popup: null, browser: null, bell: null, email: false },
      subTopics: [
        { name: 'Failed logins', desc: "Get notified when there are multiple failed login attempts.", sound: null, channels: { popup: null, browser: null, bell: null, email: false } },
        { name: 'Multiple Exports', desc: "Get notified when there are multiple exports.", sound: null, channels: { popup: null, browser: null, bell: null, email: false } }
      ]
    },
    { 
      name: 'Auth', 
      channels: { popup: false, browser: false, bell: false, email: true },
      subTopics: [
        { name: 'Password Deprecation Alert', desc: "Get notified once your password is deleted", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: true } },
        { name: 'Upcoming Password Deprecation Reminder', desc: "Get notified if your password will be deprecated in 7 days", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: true } }
      ]
    },
    { 
      name: 'Comments', 
      channels: { popup: false, browser: false, bell: null, email: true },
      subTopics: [
        { name: 'Comments on activity you\'re involved in', desc: "Get notified when there's a new comment on an activity you own, commented on, or were mentioned in.", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: true } },
        { name: 'Comments you\'re mentioned in', desc: "Get notified when a teammate @mentions you in a comment.", sound: 'Off', channels: { popup: false, browser: false, bell: true, email: true } }
      ]
    },
    { 
      name: 'Contacts and companies', 
      channels: { popup: null, browser: null, bell: null, email: true },
      subTopics: [
        { name: 'Company assigned to you', desc: "Get notified when a company is assigned to you", sound: 'Off', channels: { popup: false, browser: false, bell: true, email: false } },
        { name: 'Contact assigned to you', desc: "Get notified when a contact is assigned to you", sound: 'Off', channels: { popup: false, browser: false, bell: true, email: false } },
        { name: 'You\'re mentioned on a company record', desc: "Get notified when a teammate @mentions you in a note or logged activity on a company record.", sound: 'Default', channels: { popup: true, browser: true, bell: true, email: true } },
        { name: 'You\'re mentioned on a contact record', desc: "Get notified when a teammate @mentions you in a note or logged activity on a contact record.", sound: 'Default', channels: { popup: true, browser: true, bell: true, email: true } }
      ]
    },
    { 
      name: 'Data Restore', 
      channels: { popup: false, browser: false, bell: true, email: false },
      subTopics: [
        { name: 'Property Revision Status', desc: "Get notified when a property edit restore has completed.", sound: 'Off', channels: { popup: false, browser: false, bell: true, email: false } },
        { name: 'Restore preview failed', desc: "Get notified when your restore preview has failed.", sound: 'Off', channels: { popup: false, browser: false, bell: true, email: false } },
        { name: 'Restore preview ready', desc: "Get notified when your restore preview is ready.", sound: 'Off', channels: { popup: false, browser: false, bell: true, email: false } }
      ]
    },
    { 
      name: 'Deals', 
      channels: { popup: null, browser: null, bell: null, email: null },
      subTopics: [
        { name: 'Deal assigned to you', desc: "Get notified when a deal is assigned to you", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: true } },
        { name: 'Deal stage update', desc: "Get notified when a deal you follow moves to a new stage.", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: false } },
        { name: 'You\'re mentioned on a deal record', desc: "Get notified when a teammate @mentions you in a note or logged activity on a deal record.", sound: 'Default', channels: { popup: true, browser: true, bell: true, email: true } }
      ]
    },
    { 
      name: 'General', 
      channels: { popup: null, browser: null, bell: false, email: null },
      subTopics: [
        { name: 'Activity on record you own or follow', desc: "Get notified when there's new activity on a record you follow.", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: false } },
        { name: 'Association added to record you own or follow', desc: "Get notified when a record you follow is associated with another record.", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: false } },
        { name: 'Document View', desc: "Get notified when someone views a document you sent them.", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: true } },
        { name: 'Document open', desc: "Get notified when someone opens a document you sent them.", sound: 'Off', channels: { popup: false, browser: true, bell: 'none', email: 'none' } }
      ]
    },
    { 
      name: 'Leads', 
      channels: { popup: 'none', browser: 'none', bell: 'none', email: true },
      subTopics: [
        { name: 'Buyer Intent', desc: "Get notified by email when companies enter the buyer intent views you configure.", sound: null, channels: { popup: 'none', browser: 'none', bell: 'none', email: true } }
      ]
    },
    { 
      name: 'Security', 
      channels: { popup: false, browser: false, bell: false, email: null },
      subTopics: [
        { name: 'IP Range Updates', desc: "Get notified when SalesHub IP ranges change", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: false } },
        { name: 'Inactive Users Deactivation Confirmation', desc: "Get notified when inactive users have been deactivated", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: true } },
        { name: 'Login Alert', desc: "Get an alert whenever a suspicious login occurs on your account.", sound: null, channels: { popup: 'none', browser: false, bell: 'none', email: false } },
        { name: 'Restrict Passwords with Portal Security Settings', desc: "Get notified when you should restrict Passwords with Portal Security Settings", sound: 'Off', channels: { popup: false, browser: false, bell: false, email: true } }
      ]
    }
  ]);

  const hasChanges = JSON.stringify(topics) !== serverSnapshot.topics || JSON.stringify(notifications) !== serverSnapshot.notifications || JSON.stringify(notificationSettings) !== serverSnapshot.channels;

  // Load from Supabase on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: json, error } = await laravelApi.get<NotificationPreferencesResponse>('/settings/notifications');
        if (!error && json?.data?.topic_preferences && Array.isArray(json.data.topic_preferences) && json.data.topic_preferences.length > 0) {
          setTopics(json.data.topic_preferences);
        }
        if (json?.data) {
          setNotifications({
            newLeads: json.data.new_leads ?? true,
            taskReminders: json.data.task_reminders ?? true,
            weeklyDigest: json.data.weekly_digest ?? false,
            browserAlerts: json.data.browser_alerts ?? true,
          });
          if (json.data.channels) {
            setNotificationSettings({
              email: json.data.channels.email ?? true,
              bell: json.data.channels.bell ?? true,
              browser: json.data.channels.browser ?? true,
              popup: json.data.channels.popup ?? true,
            });
          }
        }
        setServerSnapshot({
          topics: JSON.stringify(json?.data?.topic_preferences ?? topics),
          notifications: JSON.stringify({
            newLeads: json?.data?.new_leads ?? true,
            taskReminders: json?.data?.task_reminders ?? true,
            weeklyDigest: json?.data?.weekly_digest ?? false,
            browserAlerts: json?.data?.browser_alerts ?? true,
          }),
          channels: JSON.stringify({
            email: json?.data?.channels?.email ?? true,
            bell: json?.data?.channels?.bell ?? true,
            browser: json?.data?.channels?.browser ?? true,
            popup: json?.data?.channels?.popup ?? true,
          }),
        });
      } catch {
        setServerSnapshot({ topics: JSON.stringify(topics), notifications: JSON.stringify(notifications), channels: JSON.stringify(notificationSettings) });
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const savePreferences = useCallback(async () => {
    setSaving(true);
    try {
      const { error } = await laravelApi.put('/settings/notifications', {
        topic_preferences: topics,
        channels: notificationSettings,
        new_leads: notifications.newLeads,
        task_reminders: notifications.taskReminders,
        weekly_digest: notifications.weeklyDigest,
        browser_alerts: notifications.browserAlerts,
      });
      if (error) {
        toast.error(error || 'Failed to save notification preferences');
        return;
      }
      setServerSnapshot({
        topics: JSON.stringify(topics),
        notifications: JSON.stringify(notifications),
        channels: JSON.stringify(notificationSettings),
      });
      toast.success('Notification preferences saved successfully!');
    } catch {
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  }, [topics, notifications, notificationSettings]);

  const handleCheckboxChange = (topicName: string, channel: string, subTopicName?: string) => {
    setTopics(prevTopics => prevTopics.map(topic => {
      if (topic.name !== topicName) return topic;

      const newTopic = { ...topic };

      if (subTopicName) {
        // Update specific sub-topic
        newTopic.subTopics = topic.subTopics?.map((sub: any) => {
          if (sub.name !== subTopicName) return sub;
          const currentVal = sub.channels[channel as keyof typeof sub.channels];
          if (currentVal === null || currentVal === 'none') return sub;
          return {
            ...sub,
            channels: {
              ...sub.channels,
              [channel]: !currentVal
            }
          };
        }) as any;

        // Sync parent topic state based on all sub-topics
        const subChannels = newTopic.subTopics?.map((s: any) => s.channels[channel as keyof typeof s.channels]).filter((v: any) => v !== null && v !== 'none');
        if (subChannels && subChannels.length > 0) {
          const allChecked = subChannels.every((v: any) => v === true);
          const allUnchecked = subChannels.every((v: any) => v === false);
          
          newTopic.channels = {
            ...newTopic.channels,
            [channel]: allChecked ? true : allUnchecked ? false : 'none' // 'none' represents the Indeterminate dash
          };
        }
      } else {
        // Update parent topic and propagate to all sub-topics
        const currentVal = topic.channels[channel as keyof typeof topic.channels];
        if (currentVal === null || currentVal === 'none') return topic;
        const newVal = currentVal === true ? false : true; // Toggle between true/false, ignoring mixed 'none' state
        
        newTopic.channels = {
          ...topic.channels,
          [channel]: newVal
        };
        newTopic.subTopics = topic.subTopics?.map((sub: any) => {
          const subVal = sub.channels[channel as keyof typeof sub.channels];
          if (subVal === null || subVal === 'none') return sub;
          return {
            ...sub,
            channels: {
              ...sub.channels,
              [channel]: newVal
            }
          };
        }) as any;
      }
      return newTopic;
    }));
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-status-warning/10 text-foreground p-0">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const toggleTopic = (name: string) => {
    setExpandedTopics(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const handleNotificationSave = () => {
    savePreferences();
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="h-4 bg-border rounded w-1/2 -mt-4"></div>
        <section>
          <div className="h-6 bg-border rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-border rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-border rounded"></div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <p className="text-[14px] text-foreground -mt-4">These preferences will only be applied to you.</p>

      {/* How you get notified */}
      <section>
        <h2 className="text-[18px] font-bold text-foreground mb-1">How you get notified</h2>
        <p className="text-[13px] text-muted-foreground mb-6">Choose where you want to see your notifications.</p>

        {/* Browser Alert */}
        <div className="bg-status-warning/10 border border-status-warning/30 p-4 rounded-xs flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="text-[14px] font-bold text-foreground">Allow browser notifications</span>
            <span className="text-[14px] text-foreground">Give SalesHub permission to send notifications to this browser</span>
          </div>
          <button className="px-4 py-1.5 bg-background border border-border rounded-xs text-[13px] font-bold text-foreground hover:bg-accent">
            Allow notifications
          </button>
        </div>

        {/* Notification Channels */}
        <div className="space-y-6 mb-8">
          {[
            { id: 'email', title: 'Email', desc: 'Sent to your email address.' },
            { id: 'bell', title: 'Bell', desc: 'Show up in the bell icon in the SalesHub navigation bar. Click on the bell to see your most recent notifications.' },
            { id: 'browser', title: 'Browser', desc: 'Appear in your screen when you\'re not active in SalesHub but the site is open in a browser tab.' },
            { id: 'popup', title: 'Pop-up', desc: 'Appear on your screen for a few seconds when you\'re active in SalesHub. They\'ll play a sound based on your preferences.' }
          ].map((channel) => (
            <div key={channel.id} className="flex items-start gap-4">
              <Switch 
                checked={notificationSettings[channel.id as keyof typeof notificationSettings]} 
                onCheckedChange={() => setNotificationSettings(prev => ({ ...prev, [channel.id]: !prev[channel.id as keyof typeof notificationSettings] }))} 
              />
              <div>
                <div className="text-[14px] font-bold text-foreground">{channel.title}</div>
                <p className="text-[12px] text-muted-foreground mt-0.5">{channel.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pop-up Sound Settings */}
        <div className="flex items-center gap-3 ml-16">
          <Volume2 className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-[13px] font-bold text-foreground">Only applicable to pop-ups</span>
          <div className="flex gap-2">
            <div className="relative">
              <select className="appearance-none bg-background border border-border rounded-xs px-3 py-1.5 pr-8 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary">
                <option>Chime (1 sec.)</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-xs text-[13px] font-bold text-foreground hover:bg-accent">
              <Play className="w-3.5 h-3.5 fill-current" />
              Play
            </button>
          </div>
        </div>
</section>

      {/* Email Notifications */}
      <section className="pt-8 border-t border-border">
        <h2 className="text-[18px] font-bold text-foreground mb-1">Email Notifications</h2>
        <p className="text-[13px] text-muted-foreground mb-6">Decide which updates you'd like to receive via email.</p>

        <Card className="border-border shadow-sm">
          <CardContent className="space-y-0">
            <div className="flex items-center justify-between py-5 border-b border-border">
              <div className="space-y-0.5">
                <p className="text-[14px] font-bold text-foreground">New Leads</p>
                <p className="text-[12px] text-muted-foreground">Notify me when a new lead is assigned to me.</p>
              </div>
              <Switch 
                checked={notifications.newLeads}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newLeads: checked }))}
                className="data-[state=checked]:bg-primary" 
              />
            </div>
            <div className="flex items-center justify-between py-5 border-b border-border">
              <div className="space-y-0.5">
                <p className="text-[14px] font-bold text-foreground">Task Reminders</p>
                <p className="text-[12px] text-muted-foreground">Receive reminders for upcoming tasks.</p>
              </div>
              <Switch 
                checked={notifications.taskReminders}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, taskReminders: checked }))}
                className="data-[state=checked]:bg-primary" 
              />
            </div>
            <div className="flex items-center justify-between py-5">
              <div className="space-y-0.5">
                <p className="text-[14px] font-bold text-foreground">Weekly Digest</p>
                <p className="text-[12px] text-muted-foreground">A weekly summary of your performance and team activity.</p>
              </div>
              <Switch 
                checked={notifications.weeklyDigest}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyDigest: checked }))}
                className="data-[state=checked]:bg-primary" 
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Desktop Notifications */}
      <section className="pt-8 border-t border-border">
        <h2 className="text-[18px] font-bold text-foreground mb-1">Desktop Notifications</h2>
        <p className="text-[13px] text-muted-foreground mb-6">Manage browser and desktop alerts.</p>

        <Card className="border-border shadow-sm">
          <CardContent>
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <p className="text-[14px] font-bold text-foreground">Browser Alerts</p>
                <p className="text-[12px] text-muted-foreground">Show popup notifications in your web browser.</p>
              </div>
              <Switch 
                checked={notifications.browserAlerts}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, browserAlerts: checked }))}
                className="data-[state=checked]:bg-primary" 
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* What you get notified about */}
      <section className="pt-8 border-t border-border">
        <h2 className="text-[18px] font-bold text-foreground mb-1">What you get notified about</h2>
        <p className="text-[13px] text-muted-foreground mb-6">Choose what topics matter to you and how you get notified about them.</p>

        {/* Search Bar */}
        <div className="bg-muted/50 p-6 rounded-xs mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground/60" />
            <input 
              type="text" 
              placeholder="Search for notification topics"
              aria-label="Search notification topics"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xs text-[14px] focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Topic Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <button 
              onClick={() => setExpandedTopics([])}
              className="text-primary text-[13px] font-bold hover:underline"
            >
              Collapse all topics
            </button>
            <button 
              onClick={() => setTopics((prev: any[]) => prev.map(t => ({
                ...t,
                channels: Object.fromEntries(Object.entries(t.channels).map(([k, v]) => [k, v === true ? false : v])) as any,
                subTopics: t.subTopics?.map((s: any) => ({
                  ...s,
                  channels: Object.fromEntries(Object.entries(s.channels).map(([k, v]) => [k, v === true ? false : v])) as any
                }))
              })) as any)}
              className="text-primary text-[13px] font-bold hover:underline inline-flex items-center gap-1"
            >
              Turn off all topics
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-6 pr-8">
            <div className="flex flex-col items-center gap-1 group">
              <Monitor className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              <span className="text-[11px] font-bold text-foreground">Pop-up</span>
              <div className="mt-1">
                <Checkbox 
                  value={
                    topics.every(t => t.channels.popup === true || t.channels.popup === null || t.channels.popup === 'none') 
                      ? true 
                      : topics.every(t => t.channels.popup === false || t.channels.popup === null || t.channels.popup === 'none') 
                        ? false 
                        : 'none' // Use 'none' as indeterminate visual
                  } 
                  onChange={() => {
                    const allEnabled = topics.every(t => t.channels.popup === true || t.channels.popup === null || t.channels.popup === 'none');
                    setTopics((prev: any[]) => prev.map(t => ({
                      ...t,
                      channels: { ...t.channels, popup: t.channels.popup === null || t.channels.popup === 'none' ? t.channels.popup : !allEnabled } as any,
                      subTopics: t.subTopics?.map((s: any) => ({
                        ...s,
                        channels: { ...s.channels, popup: s.channels.popup === null || s.channels.popup === 'none' ? s.channels.popup : !allEnabled } as any
                      }))
                    })) as any);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 group">
              <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              <span className="text-[11px] font-bold text-foreground">Browser</span>
              <div className="mt-1">
                <Checkbox 
                  value={
                    topics.every(t => t.channels.browser === true || t.channels.browser === null || t.channels.browser === 'none') 
                      ? true 
                      : topics.every(t => t.channels.browser === false || t.channels.browser === null || t.channels.browser === 'none') 
                        ? false 
                        : 'none'
                  } 
                  onChange={() => {
                    const allEnabled = topics.every(t => t.channels.browser === true || t.channels.browser === null || t.channels.browser === 'none');
                    setTopics((prev: any[]) => prev.map(t => ({
                      ...t,
                      channels: { ...t.channels, browser: t.channels.browser === null || t.channels.browser === 'none' ? t.channels.browser : !allEnabled } as any,
                      subTopics: t.subTopics?.map((s: any) => ({
                        ...s,
                        channels: { ...s.channels, browser: s.channels.browser === null || s.channels.browser === 'none' ? s.channels.browser : !allEnabled } as any
                      }))
                    })) as any);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 group">
              <Bell className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              <span className="text-[11px] font-bold text-foreground">Bell</span>
              <div className="mt-1">
                <Checkbox 
                  value={
                    topics.every(t => t.channels.bell === true || t.channels.bell === null || t.channels.bell === 'none') 
                      ? true 
                      : topics.every(t => t.channels.bell === false || t.channels.bell === null || t.channels.bell === 'none') 
                        ? false 
                        : 'none'
                  } 
                  onChange={() => {
                    const allEnabled = topics.every(t => t.channels.bell === true || t.channels.bell === null || t.channels.bell === 'none');
                    setTopics((prev: any[]) => prev.map(t => ({
                      ...t,
                      channels: { ...t.channels, bell: t.channels.bell === null || t.channels.bell === 'none' ? t.channels.bell : !allEnabled } as any,
                      subTopics: t.subTopics?.map((s: any) => ({
                        ...s,
                        channels: { ...s.channels, bell: s.channels.bell === null || s.channels.bell === 'none' ? s.channels.bell : !allEnabled } as any
                      }))
                    })) as any);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 group">
              <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              <span className="text-[11px] font-bold text-foreground">Email</span>
              <div className="mt-1">
                <Checkbox 
                  value={
                    topics.every(t => t.channels.email === true || t.channels.email === null || t.channels.email === 'none') 
                      ? true 
                      : topics.every(t => t.channels.email === false || t.channels.email === null || t.channels.email === 'none') 
                        ? false 
                        : 'none'
                  } 
                  onChange={() => {
                    const allEnabled = topics.every(t => t.channels.email === true || t.channels.email === null || t.channels.email === 'none');
                    setTopics((prev: any[]) => prev.map(t => ({
                      ...t,
                      channels: { ...t.channels, email: t.channels.email === null || t.channels.email === 'none' ? t.channels.email : !allEnabled } as any,
                      subTopics: t.subTopics?.map((s: any) => ({
                        ...s,
                        channels: { ...s.channels, email: s.channels.email === null || s.channels.email === 'none' ? s.channels.email : !allEnabled } as any
                      }))
                    })) as any);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Topics Matrix */}
        <div className="space-y-2 pb-20">
          {topics.filter(t => 
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.subTopics?.some((st: any) => st.name.toLowerCase().includes(searchTerm.toLowerCase()))
          ).map((topic) => (
            <div key={topic.name} className="border border-border rounded-xs overflow-hidden">
              <div 
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-accent transition-colors ${
                  expandedTopics.includes(topic.name) ? 'bg-muted/50' : 'bg-background'
                }`}
                onClick={() => toggleTopic(topic.name)}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className={`w-4 h-4 text-muted-foreground/60 transition-transform ${
                    expandedTopics.includes(topic.name) ? 'rotate-90' : ''
                  }`} />
                  <span className="text-[14px] font-bold text-foreground">{highlightText(topic.name, searchTerm)}</span>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-[11px] font-bold text-foreground mr-8">POP-UP SOUND</span>
                  <div className="flex gap-10 pr-4">
                     <Checkbox value={topic.channels.popup} onChange={() => handleCheckboxChange(topic.name, 'popup')} />
                     <Checkbox value={topic.channels.browser} onChange={() => handleCheckboxChange(topic.name, 'browser')} />
                     <Checkbox value={topic.channels.bell} onChange={() => handleCheckboxChange(topic.name, 'bell')} />
                     <Checkbox value={topic.channels.email} onChange={() => handleCheckboxChange(topic.name, 'email')} />
                  </div>
                </div>
              </div>
              {expandedTopics.includes(topic.name) && (
                <div className="bg-background border-t border-border">
                  {topic.subTopics?.map((sub: any, sIdx: number) => (
                    <div key={sIdx} className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-accent transition-colors pl-12">
                      <div className="max-w-[400px]">
                        <div className="text-[14px] font-medium text-foreground">{highlightText(sub.name, searchTerm)}</div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{sub.desc}</p>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="w-[100px] flex justify-end">
                          {sub.sound && (
                            <div className="flex items-center gap-2 text-[13px] font-medium text-foreground cursor-pointer hover:text-primary">
                              <Play className="w-3 h-3 fill-current" />
                              {sub.sound}
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </div>
                          )}
                          {sub.sound === null && (
                            <div className="w-8 h-0.5 bg-border mx-auto"></div>
                          )}
                        </div>
                        <div className="flex gap-10 pr-4">
                          <Checkbox value={sub.channels.popup} onChange={() => handleCheckboxChange(topic.name, 'popup', sub.name)} />
                          <Checkbox value={sub.channels.browser} onChange={() => handleCheckboxChange(topic.name, 'browser', sub.name)} />
                          <Checkbox value={sub.channels.bell} onChange={() => handleCheckboxChange(topic.name, 'bell', sub.name)} />
                          <Checkbox value={sub.channels.email} onChange={() => handleCheckboxChange(topic.name, 'email', sub.name)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-foreground py-4 px-8 flex items-center justify-between z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-4">
            <Info className="w-5 h-5 text-primary-foreground" />
            <span className="text-primary-foreground text-[14px] font-medium">You have unsaved changes.</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                try {
                  const { data: json, error } = await laravelApi.get<NotificationPreferencesResponse>('/settings/notifications');
                  if (!error && json?.data?.topic_preferences && Array.isArray(json.data.topic_preferences) && json.data.topic_preferences.length > 0) {
                    setTopics(json.data.topic_preferences);
                  } else {
                    setTopics(JSON.parse(serverSnapshot.topics));
                  }
                  if (json?.data) {
                    setNotifications({
                      newLeads: json.data.new_leads ?? true,
                      taskReminders: json.data.task_reminders ?? true,
                      weeklyDigest: json.data.weekly_digest ?? false,
                      browserAlerts: json.data.browser_alerts ?? true,
                    });
                    if (json.data.channels) {
                      setNotificationSettings({
                        email: json.data.channels.email ?? true,
                        bell: json.data.channels.bell ?? true,
                        browser: json.data.channels.browser ?? true,
                        popup: json.data.channels.popup ?? true,
                      });
                    }
                  } else {
                    setNotifications(JSON.parse(serverSnapshot.notifications));
                    setNotificationSettings(JSON.parse(serverSnapshot.channels));
                  }
                } catch {
                  setTopics(JSON.parse(serverSnapshot.topics));
                  setNotifications(JSON.parse(serverSnapshot.notifications));
                  setNotificationSettings(JSON.parse(serverSnapshot.channels));
                }
              }}
              className="px-4 py-2 text-primary-foreground text-[14px] font-bold hover:underline"
            >
              Discard
            </button>
            <button
              onClick={handleNotificationSave}
              disabled={saving}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs text-[14px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Checkbox = ({ value, onChange }: { value: boolean | null | 'none'; onChange?: () => void }) => {
  const isEditable = value !== null;
  
  if (!isEditable) {
    return (
      <div className="w-10 h-8 flex items-center justify-center text-border font-medium tracking-tighter">
        --
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        if (onChange) {
          onChange();
        }
      }}
      className="w-10 h-8 flex items-center justify-center cursor-pointer group/cb"
    >
      <div 
        className={`w-4 h-4 border rounded-[2px] flex items-center justify-center transition-all duration-200 ${
          value === 'none'
            ? 'bg-background border-muted-foreground group-hover/cb:border-foreground group-hover/cb:bg-muted/50'
            : value 
              ? 'bg-background border-foreground shadow-sm' 
              : 'bg-background border-muted-foreground group-hover/cb:border-foreground group-hover/cb:bg-muted/50'
        }`}
      >
        {value === true && (
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-foreground" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
        {value === 'none' && (
          <div className="w-2.5 h-0.5 bg-foreground rounded-full"></div>
        )}
      </div>
    </div>
  );
};
