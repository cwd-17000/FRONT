"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Member {
  userId: string;
  name: string;
}

interface Props {
  activeOrgId: string;
  parentGoalId: string;
  parentGoalTitle: string;
  members: Member[];
}

const selectClass =
  "w-full h-10 rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

export default function AddKeyResultForm({
  activeOrgId,
  parentGoalId,
  parentGoalTitle,
  members,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [metricName, setMetricName] = useState("");
  const [unit, setUnit] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const canSubmit = title.trim().length > 0 && targetValue !== "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type: "KEY_RESULT",
        timeframe: "QUARTERLY", // inherits from parent; backend can validate
        status: "ACTIVE",
        parentGoalId,
        targetValue: parseFloat(targetValue),
      };
      if (unit.trim()) body.unit = unit.trim();
      if (metricName.trim()) body.description = metricName.trim();
      if (ownerId) body.ownerId = ownerId;

      const res = await fetch(`/api/organizations/${activeOrgId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(`/dashboard/goals/${parentGoalId}`);
        return;
      }

      const text = await res.text();
      setError(text || `Failed to create key result (${res.status})`);
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
          <p className="text-xs text-[#71717a] mb-1">Adding Key Result to</p>
          <p className="text-sm font-semibold text-[#818cf8] mb-4">{parentGoalTitle}</p>
          <h1 className="text-2xl font-bold text-[#fafafa]">New Key Result</h1>
          <p className="mt-1 text-sm text-[#71717a]">
            A measurable outcome with a clear target. Progress will roll up to the Objective.
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
            placeholder="e.g. Increase MQL volume to 500"
          />

          {/* Metric name / unit */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Metric name"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder='e.g. "MQLs", "Revenue"'
            />
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder='e.g. "%", "calls", "$"'
            />
          </div>

          <Input
            label="Target value *"
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="Goal to hit"
            min="0"
            required
          />

          {/* Owner */}
          {members.length > 0 && (
            <div>
              <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Owner</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className={selectClass}
              >
                <option value="">— Assign to me —</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
            <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
            <p className="text-sm text-[#ef4444]">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Key Result"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/dashboard/goals/${parentGoalId}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
