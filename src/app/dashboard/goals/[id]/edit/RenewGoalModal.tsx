"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyResult {
  id: string;
  title: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  category: string;
  visibility: string;
}

interface SourceGoal {
  id: string;
  title: string;
  description?: string;
  category: string;
  visibility: string;
  timeframe: string;
  type: string;
  ownerId: string;
  teamId?: string | null;
}

interface Props {
  goal: SourceGoal;
  orgId: string;
  onDismiss: () => void;
}

const TIMEFRAMES = [
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
];

const inputCls =
  "w-full rounded-lg border border-[#3f3f46] bg-[#18181b] text-[#fafafa] text-sm px-3 py-2 outline-none focus:border-[#6366f1] placeholder:text-[#52525b] transition-colors";

const selectCls =
  "w-full rounded-lg border border-[#3f3f46] bg-[#18181b] text-[#fafafa] text-sm px-3 py-2 outline-none focus:border-[#6366f1] transition-colors";

function nextPeriodStart(timeframe: string): string {
  const now = new Date();
  if (timeframe === "ANNUAL") {
    return `${now.getFullYear() + 1}-01-01`;
  }
  if (timeframe === "QUARTERLY") {
    const q = Math.floor(now.getMonth() / 3);
    const nextQ = q + 1;
    const year = nextQ > 3 ? now.getFullYear() + 1 : now.getFullYear();
    const month = (nextQ % 4) * 3;
    return `${year}-${String(month + 1).padStart(2, "0")}-01`;
  }
  if (timeframe === "MONTHLY") {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return d.toISOString().slice(0, 10);
  }
  // WEEKLY
  const d = new Date(now);
  d.setDate(d.getDate() + (7 - d.getDay() + 1) % 7 || 7);
  return d.toISOString().slice(0, 10);
}

export function RenewGoalModal({ goal, orgId, onDismiss }: Props) {
  const router = useRouter();

  const [timeframe, setTimeframe] = useState(goal.timeframe);
  const [startDate, setStartDate] = useState(nextPeriodStart(goal.timeframe));
  const [copyKRs, setCopyKRs] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update default start date when timeframe changes
  function handleTimeframeChange(val: string) {
    setTimeframe(val);
    setStartDate(nextPeriodStart(val));
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);

    try {
      // 1. Create the new goal
      const res = await fetch(`/api/organizations/${orgId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          type: goal.type,
          category: goal.category,
          visibility: goal.visibility,
          timeframe,
          startDate,
          status: "DRAFT",
          ownerId: goal.ownerId,
          teamId: goal.teamId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to create goal.");
        return;
      }

      const newGoal = await res.json();

      // 2. Copy key results if requested and this is an OBJECTIVE
      if (copyKRs && goal.type === "OBJECTIVE") {
        // Fetch existing key results from the source goal
        const krRes = await fetch(
          `/api/organizations/${orgId}/goals?type=KEY_RESULT&parentGoalId=${goal.id}&limit=10`
        );

        if (krRes.ok) {
          const krData = await krRes.json();
          const keyResults: KeyResult[] = krData.items ?? [];

          await Promise.all(
            keyResults.map((kr) =>
              fetch(`/api/organizations/${orgId}/goals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: kr.title,
                  description: kr.description,
                  type: "KEY_RESULT",
                  category: kr.category,
                  visibility: kr.visibility,
                  timeframe,
                  startDate,
                  status: "DRAFT",
                  targetValue: kr.targetValue,
                  unit: kr.unit,
                  parentGoalId: newGoal.id,
                  ownerId: goal.ownerId,
                  teamId: goal.teamId || undefined,
                }),
              })
            )
          );
        }
      }

      router.push(`/dashboard/goals/${newGoal.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#3f3f46] bg-[#09090b] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#6366f1]/15">
              <RotateCcw size={15} className="text-[#6366f1]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#fafafa]">Renew this goal?</h2>
              <p className="text-xs text-[#71717a]">Create a fresh version for the next period</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2.5">
            <p className="text-xs text-[#71717a] mb-0.5">Renewing</p>
            <p className="text-sm text-[#fafafa] font-medium truncate">{goal.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Timeframe</label>
              <select
                className={selectCls}
                value={timeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
              >
                {TIMEFRAMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Start Date</label>
              <input
                type="date"
                className={inputCls}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {goal.type === "OBJECTIVE" && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={copyKRs}
                onChange={(e) => setCopyKRs(e.target.checked)}
                className="mt-0.5 accent-[#6366f1]"
              />
              <div>
                <p className="text-sm text-[#fafafa] group-hover:text-white transition-colors">
                  Copy key results
                </p>
                <p className="text-xs text-[#71717a]">
                  Duplicate all key results into the new objective (starting at 0)
                </p>
              </div>
            </label>
          )}

          {error && <p className="text-sm text-[#ef4444]">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <Button variant="outline" onClick={onDismiss} disabled={creating}>
            Skip for now
          </Button>
          <Button onClick={handleCreate} disabled={creating || !startDate}>
            {creating && <Loader2 size={13} className="animate-spin mr-1.5" />}
            Create new goal
          </Button>
        </div>
      </div>
    </div>
  );
}
