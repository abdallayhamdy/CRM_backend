"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.replace("/dashboard")
      } else {
        setError(result.error || "Invalid email or password")
      }
    } catch {
      setError("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full h-11 pl-10 rounded-xl border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/20 transition-all duration-200"
  const inputClassPassword = "w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/20 transition-all duration-200"
  const inputStyle = { backgroundColor: "#1e1e24", WebkitBoxShadow: "0 0 0 1000px #1e1e24 inset", WebkitTextFillColor: "#fff" as const }

  return (
    <form onSubmit={handleSubmit} className="login-form space-y-5">
      <style>{`
        .login-form input:-webkit-autofill,
        .login-form input:-webkit-autofill:hover,
        .login-form input:-webkit-autofill:focus,
        .login-form input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #1e1e24 inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .login-form input::placeholder {
          -webkit-text-fill-color: rgba(255, 255, 255, 0.4) !important;
        }
      `}</style>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white text-sm font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            style={inputStyle}
            required
            dir="ltr"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-white text-sm font-medium">
            Password
          </Label>
          <a href="#" className="text-xs text-white/50 hover:text-white/70 transition-colors">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassPassword}
            style={inputStyle}
            required
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRemember(!remember)}
          className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
            remember
              ? "bg-blue-500 border-blue-500"
              : "border-white/20 bg-transparent"
          }`}
        >
          {remember && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className="text-sm text-white/70">Remember me for 30 days</span>
      </div>

      <Button type="submit" className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 font-semibold transition-all duration-200" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          <>
            Sign in
            <LogIn className="w-4 h-4 ml-1" />
          </>
        )}
      </Button>
    </form>
  )
}
