"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoTour } from "./DemoTour";

const TOUR_STORAGE_KEY = "demo-tour-state-v1";

interface DemoBannerProps {
  orgId: string;
  objectiveCount: number;
  hasDemoData: boolean;
  enableDemo: boolean;
  canLaunchDemo: boolean;
}

type Action = "launch" | "wipe" | null;

export default function DemoBanner({
  orgId,
  objectiveCount,
  hasDemoData,
  enableDemo,
  canLaunchDemo,
}: DemoBannerProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [resumeTour, setResumeTour] = useState(false);
  const [confettiTick, setConfettiTick] = useState(0);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: `${confettiTick}-${index}`,
        left: `${5 + ((index * 13) % 90)}%`,
        delay: `${(index % 7) * 60}ms`,
        color: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899"][index % 4],
      })),
    [confettiTick],
  );

  useEffect(() => {
    try {
      const rawState = window.localStorage.getItem(TOUR_STORAGE_KEY);
      if (!rawState) return;
      const parsed = JSON.parse(rawState) as {
        inProgress?: boolean;
        completed?: boolean;
        stepIndex?: number;
      };
      setResumeTour(Boolean(parsed.inProgress && !parsed.completed && typeof parsed.stepIndex === "number"));
    } catch {
      setResumeTour(false);
    }
  }, [showTour]);

  if ((!enableDemo && !hasDemoData) || (!hasDemoData && !canLaunchDemo)) {
    return null;
  }

  const launchDisabled = !canLaunchDemo || activeAction !== null;

  async function runAction(action: Exclude<Action, null>) {
    setActiveAction(action);
    setError(null);

    const config: Record<Exclude<Action, null>, { method: "POST" | "DELETE"; path: string; success: string }> = {
      launch: {
        method: "POST",
        path: `/api/organizations/${orgId}/demo/launch`,
        success: "Demo loaded! Follow the tour.",
      },
      wipe: {
        method: "DELETE",
        path: `/api/organizations/${orgId}/demo/wipe`,
        success: "Demo data wiped.",
      },
    };

    try {
      const response = await fetch(config[action].path, {
        method: config[action].method,
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
      }

      setToast(config[action].success);
      if (action === "launch") {
        setConfettiTick((tick) => tick + 1);
        setShowTour(true);
      }
      setTimeout(() => setToast(null), 2800);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong while updating demo data.");
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <>
      <Card id="tour-demo-banner" className="border-[#312e81]/60 bg-[#111128]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#818cf8]" />
                <h2 className="text-sm font-semibold text-[#fafafa]">Interactive Demo Environment</h2>
                <span className="group relative inline-flex items-center text-[10px] text-[#818cf8] cursor-help">
                  ⓘ
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#3f3f46] bg-[#09090b] px-2 py-1 text-[10px] text-[#a1a1aa] opacity-0 transition-opacity group-hover:opacity-100">
                    This is sample data—replace with yours!
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs text-[#a1a1aa]">
                {objectiveCount === 0
                  ? "Your org is empty. Launch a fully-populated demo workspace to explore objectives, key results, check-ins, milestones, and cadence."
                  : "Use demo controls to walkthrough or wipe sample objectives scoped to your organization."}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowTour(true)}>
              {resumeTour ? "Resume Tour" : "Open Tour"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => runAction("launch")}
              disabled={launchDisabled}
              className="gap-1.5"
            >
              <PlayCircle size={14} />
              {activeAction === "launch" ? "Launching..." : "Launch Interactive Demo"}
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={() => runAction("wipe")}
              disabled={!hasDemoData || activeAction !== null}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              {activeAction === "wipe" ? "Wiping..." : "Wipe Demo Data"}
            </Button>
          </div>

          {!enableDemo && (
            <p className="text-xs text-[#fbbf24]">Demo mode is disabled in organization settings.</p>
          )}
          {error && <p className="text-xs text-[#f87171]">{error}</p>}
        </CardContent>
      </Card>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-[#3f3f46] bg-[#111827] px-3 py-2 text-xs text-[#d1fae5] shadow-lg">
          {toast}
        </div>
      )}

      {confettiTick > 0 && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-[-10px] h-2 w-2 rounded-sm animate-[demoConfetti_1200ms_ease-out_forwards]"
              style={{ left: piece.left, animationDelay: piece.delay, backgroundColor: piece.color }}
            />
          ))}
          <style jsx>{`
            @keyframes demoConfetti {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(520deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <DemoTour
        open={showTour}
        onClose={() => setShowTour(false)}
        onStateChange={(state) => {
          setResumeTour(state.inProgress && !state.completed);
        }}
      />
    </>
  );
}
