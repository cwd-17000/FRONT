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
  const [category, setCategory] = useState<GoalCategory>("FINANCIAL");
  const [teamId, setTeamId] = useState("");

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
                  onClick={() => setTimeframe(tf.value)}
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
