"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StatusColor = "RED" | "YELLOW" | "GREEN";

interface Props {
  activeOrgId: string;
  goalId: string;
  goalTitle: string;
  goalCurrentValue: number;
  goalTargetValue?: number;
  goalUnit?: string;
}

const RAG_OPTIONS: { value: StatusColor; label: string; description: string; color: string; border: string; bg: string }[] = [
  {
    value: "GREEN",
    label: "On Track",
    description: "We are confident this goal will be achieved",
    color: "#22c55e",
    border: "#22c55e",
    bg: "#052e16",
  },
  {
    value: "YELLOW",
    label: "At Risk",
    description: "There are blockers or concerns that need attention",
    color: "#fbbf24",
    border: "#f59e0b",
    bg: "#1c1400",
  },
  {
    value: "RED",
    label: "Off Track",
    description: "This goal is unlikely to be achieved without major intervention",
    color: "#f87171",
    border: "#ef4444",
    bg: "#1c0a0a",
  },
];

function confidenceColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#22c55e";
}

export default function CheckInForm({
  activeOrgId,
  goalId,
  goalTitle,
  goalCurrentValue,
  goalTargetValue,
  goalUnit,
}: Props) {
  const router = useRouter();
  const [progress, setProgress] = useState(String(goalCurrentValue));
  const [confidenceScore, setConfidenceScore] = useState("50");
  const [statusColor, setStatusColor] = useState<StatusColor | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPct =
    goalTargetValue && goalTargetValue > 0
      ? Math.min(100, Math.round((parseFloat(progress || "0") / goalTargetValue) * 100))
      : null;

  const canSubmit = statusColor !== null && progress.trim() !== "" && !isNaN(parseFloat(progress));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !statusColor) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/organizations/${activeOrgId}/goals/${goalId}/check-ins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            progress: parseFloat(progress),
            confidenceScore: parseInt(confidenceScore, 10),
            statusColor,
            note: note.trim() || undefined,
          }),
        }
      );

      if (res.ok) {
        router.push(`/dashboard/goals/${goalId}`);
        return;
      }

      const text = await res.text();
      setError(text || `Failed to submit check-in (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <p className="text-xs text-[#71717a] mb-1">Check-in for</p>
        <h1 className="text-xl font-bold text-[#fafafa]">{goalTitle}</h1>
      </div>

      <form id="tour-checkin-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Progress input */}
        <div>
          <Input
            label={`Current Progress${goalUnit ? ` (${goalUnit})` : ""}`}
            type="number"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder={`e.g. ${goalCurrentValue}`}
            min="0"
            required
          />
          {progressPct !== null && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[#71717a] mb-1.5">
                <span>
                  {parseFloat(progress) || 0}{goalUnit ? ` ${goalUnit}` : ""} / {goalTargetValue}
                  {goalUnit ? ` ${goalUnit}` : ""}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#27272a] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%`, background: "#6366f1" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status color (RAG) */}
        <div>
          <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Status *</label>
          <div className="flex flex-col gap-2">
            {RAG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusColor(opt.value)}
                className="text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3"
                style={{
                  borderColor: statusColor === opt.value ? opt.border : "#3f3f46",
                  background: statusColor === opt.value ? opt.bg : "#18181b",
                }}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: opt.color }}
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: statusColor === opt.value ? opt.color : "#fafafa" }}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-[#71717a]">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Confidence score */}
        <div>
          <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">
            Confidence Score:{" "}
            <strong style={{ color: confidenceColor(parseInt(confidenceScore)) }}>
              {confidenceScore}%
            </strong>
          </label>
          <input
            type="range"
            value={confidenceScore}
            onChange={(e) => setConfidenceScore(e.target.value)}
            min="0"
            max="100"
            className="w-full cursor-pointer accent-[#6366f1]"
          />
          <div className="flex justify-between text-xs text-[#52525b] mt-1">
            <span>Not confident (0)</span>
            <span>Very confident (100)</span>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="What happened this period? Any blockers? What are the next steps?"
            className="w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors resize-vertical"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
            <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
            <p className="text-sm text-[#ef4444]">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Saving..." : "Submit Check-in"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/dashboard/goals/${goalId}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
