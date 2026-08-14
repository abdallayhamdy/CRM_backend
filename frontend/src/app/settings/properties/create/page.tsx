"use client";

import React, { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreatePropertyForm, { CreatePropertyFormRef, STEPS } from "@/components/properties/CreatePropertyForm";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreatePropertyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("details");
  const [isLastStep, setIsLastStep] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const searchParams = useSearchParams();
  const formRef = useRef<CreatePropertyFormRef>(null);

  const objectType = searchParams.get("objectType") || "contact";
  const objectLabel = objectType.charAt(0).toUpperCase() + objectType.slice(1);
  const initialData = { object_type: objectType };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    // Fixed overlay — breaks fully out of the settings layout
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-[var(--color-hs-page-bg)]">

      {/* ── Left sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col h-full bg-[var(--color-hs-card-bg)] border-r border-border">
        {/* Logo / breadcrumb area */}
        <div className="px-5 py-5 border-b border-border">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
            Properties
          </p>
          <h2 className="font-bold text-[15px] text-foreground">
            Create property
          </h2>
          <p className="text-[12px] text-muted-foreground/60 mt-0.5">
            {objectLabel}
          </p>
        </div>

        {/* Step navigator */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {STEPS.map((s, index) => {
            const isDone = index < currentStepIndex;
            const isActive = s.id === currentStep;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-2.5 py-2 px-2.5 rounded-md transition-colors text-[13px] font-medium",
                  isActive
                    ? "bg-[var(--color-hs-blue)]/10 text-[var(--color-hs-blue)]"
                    : isDone
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60"
                )}
              >
                {/* Step dot / check */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border",
                    isActive
                      ? "bg-[var(--color-hs-blue)] border-[var(--color-hs-blue)] text-white"
                      : isDone
                      ? "bg-[var(--color-hs-success)] border-[var(--color-hs-success)] text-white"
                      : "border-border text-muted-foreground/60"
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </div>
                <span>{s.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                )}
              </div>
            );
          })}
        </nav>

        {/* AI Data Agent panel */}
        <div className="mx-3 mb-4 p-3 rounded-lg bg-[var(--color-hs-blue)]/5 border border-[var(--color-hs-blue)]/20">
          <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--color-hs-teal)]" />
            Data Agent
          </h3>
          <div className="space-y-1">
            <button className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--color-hs-blue)]/10 text-[11px] transition-colors text-muted-foreground/60 hover:text-[var(--color-hs-blue)]">
              Smart property prompt
            </button>
            <button className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--color-hs-blue)]/10 text-[11px] transition-colors text-muted-foreground/60 hover:text-[var(--color-hs-blue)]">
              Auto-fill fields
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top header bar — uses the navy brand color */}
        <header className="h-14 shrink-0 flex items-center justify-between px-6 shadow-sm z-10
          bg-[var(--color-hs-navy)] text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="hover:bg-white/10 p-1.5 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <div className="w-px h-5 bg-white/20" />
            <span className="font-semibold text-[14px] tracking-tight">
              Create new property
            </span>
            <span className="text-white/40 text-[13px]">·</span>
            <span className="text-white/60 text-[13px]">{objectLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Back button (only shown when not on first step) */}
            {canGoBack && (
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 text-[13px] font-medium"
                onClick={() => formRef.current?.back()}
              >
                Back
              </Button>
            )}

            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 h-8 text-[13px] font-medium"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            {/* Primary action — project blue */}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 border-none h-8 px-5 text-[13px] font-bold transition-all shadow-sm active:scale-95"
              disabled={isSaving}
              onClick={() => {
                if (isLastStep) {
                  formRef.current?.submit();
                } else {
                  formRef.current?.next();
                }
              }}
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </span>
              ) : isLastStep ? (
                "Create property"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </header>

        {/* Progress bar */}
        <div className="h-0.5 bg-[var(--color-hs-border)] shrink-0">
          <div
            className="h-full bg-[var(--color-hs-blue)] transition-all duration-500"
            style={{
              width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-auto bg-[var(--color-hs-page-bg)]">
          <div className="w-full py-10 px-6">
            <CreatePropertyForm
              ref={formRef}
              initialData={initialData}
              onSuccess={() => router.push("/settings/properties?object_type=" + objectType)}
              onCancel={() => router.back()}
              isFullPage={true}
              onStateChange={(state) => {
                setCurrentStep(state.step);
                setIsLastStep(state.isLastStep);
                setCanGoBack(state.canGoBack);
                setIsSaving(state.isSaving);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
