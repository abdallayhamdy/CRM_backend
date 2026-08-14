"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import {
  LogOut,
  Phone,
  MessageSquare,
  MessageCircle,
  HelpCircle,
} from "lucide-react"
import { THEMES, applyColorTheme, type ThemeId } from "@/components/ThemeProvider"
import { FeedbackDialog } from "@/components/FeedbackDialog"

interface ProfileSliderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSlider({ open, onOpenChange }: ProfileSliderProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [feedbackOpen, setFeedbackOpen] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState<string>(() => {
    if (typeof window === "undefined") return "rootline"
    return localStorage.getItem("app-color-theme") || "rootline"
  })

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "User"
  const userEmail = user?.email || "user@example.com"
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="p-0 gap-0 bg-card overflow-y-auto"
        style={{ width: "340px", maxWidth: "85vw" }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-b from-primary/10 to-card px-5 pt-5 pb-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </Button>

          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="font-semibold text-foreground truncate">{userName}</h2>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              {user?.profileId && (
                <p className="text-xs text-muted-foreground mt-0.5">{user.profileId}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <span>My Profile</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Help */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="space-y-1">
              <span className="text-xs text-primary font-medium">Need Help?</span>
              <p className="text-[11px] text-muted-foreground">
                For more info, check FAQs or browse articles
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => router.push("/contact")}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-1.5"
              >
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Contact Us</span>
              </button>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-1.5"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>Send Feedback</span>
              </button>
              <button className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-1.5">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span>Live Chat</span>
              </button>
              <button
                onClick={() => router.push("/about")}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-1.5"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span>About Us</span>
              </button>
            </div>
          </div>

          {/* Color Theme */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <span className="text-xs text-primary font-medium">Color</span>
            <div className="overflow-x-auto pb-1">
              <div className="flex flex-col gap-2" style={{ width: "max-content" }}>
                <div className="flex gap-2">
                  {THEMES.slice(0, Math.ceil(THEMES.length / 2)).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setColorTheme(t.id)
                        applyColorTheme(t.id as ThemeId)
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all shrink-0",
                        colorTheme === t.id
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: `hsl(${t.color})` }}
                      title={t.name}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {THEMES.slice(Math.ceil(THEMES.length / 2)).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setColorTheme(t.id)
                        applyColorTheme(t.id as ThemeId)
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all shrink-0",
                        colorTheme === t.id
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: `hsl(${t.color})` }}
                      title={t.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
      </Sheet>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
