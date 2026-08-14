'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Mail, Lock, Zap, CheckCircle2, XCircle } from 'lucide-react'
import { laravelApi, removeToken, clearImpersonationToken } from '@/lib/laravel-api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsLoading(true)

    try {
      const { data, error: apiError, validationErrors } = await laravelApi.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      })

      if (apiError || !data) {
        setFieldErrors(validationErrors || {})
        setError(
          validationErrors?.email?.[0] ||
          apiError ||
          'تعذر إعادة تعيين كلمة المرور',
        )
        return
      }

      setDone(true)
      clearImpersonationToken()
      removeToken()
      localStorage.removeItem('active_workspace_id')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch {
      setError('حدث خطأ أثناء إعادة تعيين كلمة المرور')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">تم تعيين كلمة المرور</h2>
        <p className="text-muted-foreground text-sm">جاري تحويلك إلى صفحة تسجيل الدخول...</p>
      </div>
    )
  }

  if (!token || !email) {
    return (
      <div className="text-center space-y-3">
        <XCircle className="w-14 h-14 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">رابط غير صالح</h2>
        <p className="text-muted-foreground text-sm">
          رابط إعادة التعيين غير مكتمل أو منتهي. يرجى فتح الرابط الوارد في البريد الإلكتروني مرة أخرى.
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تعيين كلمة المرور</CardTitle>
        <CardDescription>أدخل كلمة المرور الجديدة لتفعيل حسابك</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm space-y-1">
              <p>{error}</p>
              {fieldErrors.email?.length ? (
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-destructive underline"
                >
                  طلب رابط جديد لإعادة التعيين
                </button>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} disabled className="pl-10" dir="ltr" />
            </div>
            {fieldErrors.email?.map((msg) => (
              <p key={msg} className="text-[12px] text-destructive">{msg}</p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="8 أحرف على الأقل"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
                dir="ltr"
              />
            </div>
            {fieldErrors.password?.map((msg) => (
              <p key={msg} className="text-[12px] text-destructive">{msg}</p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
                dir="ltr"
              />
            </div>
            {fieldErrors.password_confirmation?.map((msg) => (
              <p key={msg} className="text-[12px] text-destructive">{msg}</p>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <>
                <Zap className="w-4 h-4" />
                تعيين كلمة المرور وتفعيل الحساب
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-4">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SalesHub</h1>
          <p className="text-muted-foreground mt-1">تفعيل حسابك</p>
        </div>

        <Suspense fallback={<div className="h-40" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
