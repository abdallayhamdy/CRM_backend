"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { LoginForm } from "@/components/login-form"
import { SyncedTypewriter } from "@/components/ui/synced-typewriter"
import { useAuth } from "@/hooks/use-auth"

import LiquidEther from "@/components/ui/LiquidEther"

const ShootingStarsGrid = dynamic(
  () => import("@/components/ui/shooting-stars-grid").then((m) => ({ default: m.ShootingStarsGrid })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 min-h-svh" />,
  }
)

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, isSuperAdmin } = useAuth()

  useEffect(() => {
    document.documentElement.classList.add("dark")
    return () => document.documentElement.classList.remove("dark")
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.replace(isSuperAdmin ? "/super-admin" : "/dashboard")
    }
  }, [user, loading, router, isSuperAdmin])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative min-h-svh bg-neutral-900 overflow-hidden flex flex-col">
        <div className="absolute inset-0 z-0">
          <LiquidEther
            colors={['#00d4ff', '#00eaff', '#02869b']}
            mouseForce={20}
            cursorSize={30}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>
        <div className="relative z-10 p-6 md:p-10 flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium text-white">
            <img src="/logo-vector-white-2.png" alt="Rootline CRM" className="h-12 w-auto" />
            <span>Rootline CRM</span>
          </a>
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-[#0a1628] lg:flex flex-col items-center justify-end pb-16">
        <ShootingStarsGrid
          starCount={50}
          shootingStarCount={8}
          gridSize={44}
          speed="normal"
          glow
          className="absolute inset-0 min-h-svh"
        />
        <div className="relative z-10 text-center px-8">
          <SyncedTypewriter
            lines={[
              { text: "Start Your Journey with Rootline CRM", className: "text-4xl font-bold text-white" },
              { text: "Sign in now and start running your business smarter", className: "text-xl text-white/70" },
            ]}
            speed={60}
            delayBetweenWords={3000}
            cursor={true}
            cursorChar="|"
          />
        </div>
      </div>
    </div>
  )
}
