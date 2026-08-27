"use client";

import React, { useEffect, useState } from 'react';
import {
  Info, ChevronDown, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { laravelApi } from '@/lib/laravel-api';
import { useAuth } from '@/hooks/use-auth';

interface UserSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: number;
  is_current: boolean;
}

const PAGE_SIZE = 3;

function parseUserAgent(ua: string | null): { type: 'desktop' | 'mobile'; browser: string } {
  const u = ua || '';
  const isMobile = /Mobile|Android|iPhone|iPad|Linux;.*Android/i.test(u);
  let browser = 'Unknown browser';
  if (/Edg\//i.test(u)) browser = 'Edge';
  else if (/Firefox\//i.test(u)) browser = 'Firefox';
  else if (/Chrome\//i.test(u)) browser = 'Chrome';
  else if (/Safari\//i.test(u)) browser = 'Safari';
  return { type: isMobile ? 'mobile' : 'desktop', browser };
}

function formatLastActive(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function PersonalSecurityContent() {
  const { user, signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionPage, setSessionPage] = useState(0);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const totalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const pageSessions = sessions.slice(sessionPage * PAGE_SIZE, (sessionPage + 1) * PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    const loadSessions = async () => {
      setLoadingSessions(true);
      const { data, error } = await laravelApi.get<{ data: UserSession[] }>('/user/sessions');
      if (cancelled) return;
      if (error) {
        toast.error('Failed to load sessions');
      } else {
        setSessions(data?.data || []);
      }
      setLoadingSessions(false);
    };
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const { data, error, validationErrors } = await laravelApi.put<{ message: string }>('/user/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      if (error) {
        const firstError = validationErrors
          ? Object.values(validationErrors).flat()[0]
          : null;
        toast.error(firstError || error);
        return;
      }
      toast.success(data?.message || 'Password changed successfully. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await signOut();
    } catch {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('This will log you out of all devices and sessions, including this one. Continue?')) {
      return;
    }
    setLoggingOutAll(true);
    try {
      const { data, error } = await laravelApi.post<{ message: string }>('/user/logout-all');
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(data?.message || 'Logged out of all sessions.');
      await signOut();
    } catch {
      toast.error('Failed to log out of all sessions');
    } finally {
      setLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <p className="text-[14px] text-foreground mb-8">
          These preferences will only be applied to you.
        </p>

        <h2 className="text-[18px] font-bold text-foreground mb-1">Security</h2>
        <p className="text-[13px] text-muted-foreground mb-8">
          Set preferences related to login and your personal account security.
        </p>

        {/* Email address */}
        <div className="mb-10">
          <label className="block text-[13px] font-bold text-foreground mb-2">Email address</label>
          <div className="bg-muted/50 border border-border rounded-xs px-3 py-2 text-[13px] text-foreground w-full max-w-[400px] mb-3">
            {user?.email || '—'}
          </div>
        </div>

        {/* Change Password */}
        <Card className="border-border shadow-sm mb-10">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-bold text-foreground">Change Password</CardTitle>
            <CardDescription className="text-[13px]">We recommend using a strong password that you don&apos;t use elsewhere.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-md">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground">Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border-status-warning focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground">New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-status-warning focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-status-warning focus-visible:ring-primary"
              />
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Session Management */}
        <div className="mb-10 pt-8 border-t border-border">
          <h2 className="text-[18px] font-bold text-foreground mb-1">Session Management</h2>
          <p className="text-[13px] text-muted-foreground mb-6">Manage your active and inactive sessions across devices.</p>

          <div className="bg-background border border-border rounded-xs overflow-x-auto mb-4">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th scope="col" className="px-6 py-3 text-[12px] font-bold text-foreground w-[350px]">Device</th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-bold text-foreground">Browser</th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-bold text-foreground">
                    <div className="flex items-center gap-1.5">
                      IP Address
                      <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-bold text-foreground">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {loadingSessions ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-[13px] text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                        Loading sessions...
                      </div>
                    </td>
                  </tr>
                ) : pageSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-[13px] text-muted-foreground">
                      No active sessions found.
                    </td>
                  </tr>
                ) : (
                  pageSessions.map((session, idx) => {
                    const { type, browser } = parseUserAgent(session.user_agent);
                    return (
                      <tr key={session.id || idx} className="border-b border-border last:border-b-0 hover:bg-accent transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-foreground">
                                {type === 'desktop' ? (
                                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                    <line x1="12" y1="18" x2="12" y2="18" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-[14px] text-foreground font-medium">{type === 'mobile' ? 'Mobile device' : 'Desktop device'}</span>
                            </div>
                            {session.is_current && (
                              <span className="px-3 py-1 bg-background border border-border rounded-full text-[11px] font-bold text-foreground">
                                Current
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-[14px] text-foreground">{browser}</td>
                        <td className="px-4 py-5 text-[14px] text-foreground">{session.ip_address || '—'}</td>
                        <td className="px-4 py-5">
                          <div className="text-[13px] text-foreground">{formatLastActive(session.last_activity)}</div>
                          <div className="flex items-center gap-2 text-[12px] text-muted-foreground mt-1">
                            <div className="w-2.5 h-2.5 bg-[var(--color-hs-success-green)] rounded-full"></div>
                            {timeAgo(session.last_activity)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loadingSessions && sessions.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-4 mt-8 mb-8">
              <button
                className="flex items-center gap-1 text-[13px] text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setSessionPage((p) => Math.max(0, p - 1))}
                disabled={sessionPage === 0}
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                Prev
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setSessionPage(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xs text-[13px] ${
                      sessionPage === i
                        ? 'bg-muted/50 border border-border font-bold text-foreground'
                        : 'font-medium text-foreground hover:bg-accent'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                className="flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setSessionPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={sessionPage >= totalPages - 1}
              >
                Next
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          )}

          <div>
            <button
              className="text-primary text-[13px] font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
            >
              {loggingOutAll ? 'Logging out...' : 'Log Out of All Sessions'}
            </button>
            <p className="text-[11px] text-muted-foreground mt-1">This will log you out of all devices and sessions, including this active one.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
