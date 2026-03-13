"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GoalTimeframe = "ANNUAL" | "QUARTERLY" | "MONTHLY" | "WEEKLY";
type GoalCategory = "FINANCIAL" | "CUSTOMER" | "INTERNAL_PROCESS" | "LEARNING_GROWTH" | "CULTURE";

interface Team {
  id: string;
  name: string;
}

interface Props {
  activeOrgId: string;
  teams: Team[];
}

const TIMEFRAME_OPTIONS: { value: GoalTimeframe; label: string }[] = [
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
];

/** Compute the default due date for a given timeframe (mirrors backend logic) */
function computeDefaultDueDate(timeframe: GoalTimeframe): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const minMs = 30 * 24 * 60 * 60 * 1000;

  if (timeframe === "ANNUAL") {
    const thisYearEnd = new Date(year, 11, 31);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const d = thisYearEnd > ninetyDays ? thisYearEnd : new Date(year + 1, 11, 31);
    return d.toISOString().slice(0, 10);
  }

  if (timeframe === "QUARTERLY") {
    const qem = Math.floor(month / 3) * 3 + 2;
    const thisQEnd = new Date(year, qem + 1, 0);
    if (thisQEnd.getTime() - now.getTime() > minMs) return thisQEnd.toISOString().slice(0, 10);
    const nextQEM = qem + 3;
    const nextQYear = nextQEM > 11 ? year + 1 : year;
    return new Date(nextQYear, (nextQEM % 12) + 1, 0).toISOString().slice(0, 10);
  }

  if (timeframe === "MONTHLY") {
    const thisMonthEnd = new Date(year, month + 1, 0);
    if (thisMonthEnd.getTime() - now.getTime() > minMs) return thisMonthEnd.toISOString().slice(0, 10);
    return new Date(year, month + 2, 0).toISOString().slice(0, 10);
  }

  // WEEKLY
  const dayOfWeek = now.getDay();
  const daysToSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  const thisSunday = new Date(year, month, now.getDate() + daysToSunday);
  const d = daysToSunday >= 2 ? thisSunday : new Date(thisSunday.getTime() + 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const CATEGORY_OPTIONS: { value: GoalCategory; label: string }[] = [
  { value: "FINANCIAL", label: "Financial" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "INTERNAL_PROCESS", label: "Internal Process" },
  { value: "LEARNING_GROWTH", label: "Learning & Growth" },
  { value: "CULTURE", label: "Culture" },
];

const selectClass =
  "w-full h-10 rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

export default function NewGoalForm({ activeOrgId, teams }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [timeframe, setTimeframe] = useState<GoalTimeframe | "">("");
  const [dueDate, setDueDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [category, setCategory] = useState<GoalCategory>("FINANCIAL");
  const [teamId, setTeamId] = useState("");

  function handleTimeframeSelect(tf: GoalTimeframe) {
    setTimeframe(tf);
    setDueDate(computeDefaultDueDate(tf));
    setEditingDate(false);
  }

  const canSubmit = title.trim().length > 0 && timeframe !== "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type: "OBJECTIVE",
        category,
        timeframe,
        status: "ACTIVE",
        ...(dueDate ? { dueDate } : {}),
      };
      if (teamId) body.teamId = teamId;

      const res = await fetch(`/api/organizations/${activeOrgId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/dashboard/goals/${created.id}`);
        return;
      }

      const text = await res.text();
      setError(text || `Failed to create objective (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">New Objective</h1>
          <p className="mt-1 text-sm text-[#71717a]">
            Set a qualitative, inspiring goal that gives your team direction. You&apos;ll add Key Results after.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Title */}
          <Input
            label="Title *"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Become the undisputed market leader"
          />

          {/* Timeframe */}
          <div>
            <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Timeframe *</label>
            <div className="flex gap-2">
              {TIMEFRAME_OPTIONS.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => handleTimeframeSelect(tf.value)}
                  className={[
                    "flex-1 py-2 px-1 rounded-lg border-2 text-sm font-medium transition-all duration-150",
                    timeframe === tf.value
                      ? "border-[#6366f1] bg-[#312e81] text-[#818cf8]"
                      : "border-[#3f3f46] bg-[#27272a] text-[#71717a] hover:border-[#52525b] hover:text-[#a1a1aa]",
                  ].join(" ")}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Target date banner — shown after timeframe is selected */}
            {timeframe && dueDate && (
              <div className="mt-3 rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-3">
                {!editingDate ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[#a5b4fc]">
                      This goal is scheduled to be hit by{" "}
                      <span className="font-bold text-[#fafafa]">{formatDisplayDate(dueDate)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingDate(true)}
                      className="text-xs text-[#818cf8] hover:text-[#a5b4fc] whitespace-nowrap transition-colors"
                    >
                      Edit date
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-[#a5b4fc]">Choose target date</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="h-9 rounded-lg border border-[#6366f1]/40 bg-[#27272a] px-3 text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingDate(false)}
                        className="text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategory)}
              className={selectClass}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div>
            <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Team</label>
            {teams.length === 0 ? (
              <p className="text-sm text-[#52525b]">
                No teams yet.{" "}
                <a href="/dashboard/my-organization" className="text-[#818cf8] hover:text-[#6366f1] transition-colors">
                  Create a team first →
                </a>
              </p>
            ) : (
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className={selectClass}
              >
                <option value="">— No team —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
            <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
            <p className="text-sm text-[#ef4444]">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Objective"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/goals")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
