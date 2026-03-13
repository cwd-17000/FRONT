"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TourStep = {
  title: string;
  description: string;
  selector?: string;
  href?: string;
  ctaLabel?: string;
};

const STEPS: TourStep[] = [
  {
    title: "Step 1: View Objectives",
    description: "Open the Objectives list to see active and archived objectives with confidence and health metrics.",
    selector: "#tour-objectives-list",
    href: "/dashboard/goals",
    ctaLabel: "Open Objectives",
  },
  {
    title: "Step 2: Check KR Progress",
    description: "Pick an objective and review key result progress bars, confidence scores, and status colors.",
    selector: "#tour-kr-details",
    href: "/dashboard/goals",
    ctaLabel: "Open KR Details",
  },
  {
    title: "Step 3: Submit a Check-in",
    description: "Use the check-in form to update progress, RAG status (On Track / At Risk / Off Track), and confidence.",
    selector: "#tour-checkin-form",
    href: "/dashboard/goals",
    ctaLabel: "Open Check-in Form",
  },
  {
    title: "Step 4: Track Milestones",
    description: "Review milestone deadlines and status updates for major objectives.",
    selector: "#tour-milestones",
    href: "/dashboard",
    ctaLabel: "Open Milestones",
  },
  {
    title: "Step 5: Run Weekly Cadence",
    description: "Use recurring cadence rituals for weekly and quarterly progress reviews.",
    selector: "#tour-cadence",
    href: "/dashboard/cadence",
    ctaLabel: "Open Cadence",
  },
];

interface DemoTourProps {
  open: boolean;
  onClose: () => void;
}

export function DemoTour({ open, onClose }: DemoTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = useMemo(() => STEPS[stepIndex], [stepIndex]);

  useEffect(() => {
    if (!open) return;

    let element: Element | null = null;

    if (step.selector) {
      element = document.querySelector(step.selector);
      if (element instanceof HTMLElement) {
        element.classList.add("ring-2", "ring-[#818cf8]", "ring-offset-2", "ring-offset-[#09090b]");
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return () => {
      if (element instanceof HTMLElement) {
        element.classList.remove("ring-2", "ring-[#818cf8]", "ring-offset-2", "ring-offset-[#09090b]");
      }
    };
  }, [open, step.selector]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-xl border-[#3f3f46]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#71717a]">Interactive walkthrough</p>
              <h3 className="text-lg font-semibold text-[#fafafa]">{step.title}</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </div>

          <p className="text-sm text-[#a1a1aa]">{step.description}</p>

          <div className="rounded-lg border border-[#27272a] bg-[#101012] px-3 py-2 text-xs text-[#71717a]">
            {step.selector ? `Target selector: ${step.selector}` : "This step has no in-page target selector."}
          </div>

          {step.href && (
            <Link href={step.href} className="inline-flex text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
              {step.ctaLabel ?? "Open target"} →
            </Link>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#71717a]">Step {stepIndex + 1} of {STEPS.length}</p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              {stepIndex < STEPS.length - 1 ? (
                <Button size="sm" onClick={() => setStepIndex((current) => Math.min(STEPS.length - 1, current + 1))}>
                  Next
                </Button>
              ) : (
                <Button size="sm" onClick={onClose}>Finish</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
