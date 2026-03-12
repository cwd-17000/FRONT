"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GoalType = "OBJECTIVE" | "KEY_RESULT";
type GoalTimeframe = "ANNUAL" | "QUARTERLY" | "MONTHLY" | "WEEKLY";

interface ParentGoal {
  id: string;
  title: string;
  type: string;
  timeframe: string;
}

interface Member {
  userId: string;
  name: string;
}

interface Props {
  activeOrgId: string;
  parentGoals: ParentGoal[];
  members: Member[];
}

const TIMEFRAME_OPTIONS: { value: GoalTimeframe; label: string }[] = [
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
];

const selectClass =
  "w-full h-10 rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

export default function NewGoalForm({ activeOrgId, parentGoals, members }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<GoalType | null>(null);
  const [title, setTitle] = useState("");
  const [timeframe, setTimeframe] = useState<GoalTimeframe | "">("");
  const [ownerId, setOwnerId] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [parentGoalId, setParentGoalId] = useState("");

  const objectives = parentGoals.filter((g) => g.type === "OBJECTIVE");

  const canSubmit =
    selectedType !== null &&
    title.trim().length > 0 &&
    timeframe !== "" &&
    (selectedType !== "KEY_RESULT" || parentGoalId !== "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || !selectedType) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type: selectedType,
        timeframe,
        status: "ACTIVE",
      };
      if (ownerId) body.ownerId = ownerId;
      if (targetValue) body.targetValue = parseFloat(targetValue);
      if (unit.trim()) body.unit = unit.trim();
      if (parentGoalId) body.parentGoalId = parentGoalId;

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
      setError(text || `Failed to create goal (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">

      {/* ── Step 1: Objective or Key Result ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#fafafa]">New Goal</h1>
            <p className="mt-1 text-sm text-[#71717a]">What type of goal are you creating?</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => { setSelectedType("OBJECTIVE"); setStep(2); }}
              className="text-left p-5 rounded-xl border-2 border-[#3f3f46] bg-[#18181b] hover:border-[#6366f1] hover:bg-[#1e1e2e] transition-all duration-150 group"
            >
              <div className="font-semibold text-[#fafafa] mb-1 group-hover:text-[#818cf8] transition-colors">
                Objective
              </div>
              <div className="text-sm text-[#71717a]">
                A qualitative, inspiring goal that sets direction. Objectives can roll up to other Objectives.
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedType("KEY_RESULT"); setStep(2); }}
              className="text-left p-5 rounded-xl border-2 border-[#3f3f46] bg-[#18181b] hover:border-[#6366f1] hover:bg-[#1e1e2e] transition-all duration-150 group"
            >
              <div className="font-semibold text-[#fafafa] mb-1 group-hover:text-[#818cf8] transition-colors">
                Key Result
              </div>
              <div className="text-sm text-[#71717a]">
                A measurable outcome linked to an Objective. Progress rolls up automatically.
              </div>
            </button>
          </div>

          <div>
            <Button variant="ghost" onClick={() => router.push("/dashboard/goals")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Goal details ── */}
      {step === 2 && selectedType && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#71717a] hover:text-[#fafafa] transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold text-[#fafafa]">
              New {selectedType === "OBJECTIVE" ? "Objective" : "Key Result"}
            </h1>
          </div>

          <div className="flex flex-col gap-5">
            {/* Title */}
            <Input
              label="Title *"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                selectedType === "OBJECTIVE"
                  ? "e.g. Become the undisputed market leader"
                  : "e.g. Increase MQL volume to 500"
              }
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

            {/* Key Result-only fields */}
            {selectedType === "KEY_RESULT" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Target Value"
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 500"
                  min="0"
                />
                <Input
                  label="Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder='e.g. "%", "calls", "$"'
                />
              </div>
            )}

            {/* Parent objective */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">
                {selectedType === "OBJECTIVE" ? "Parent Objective (optional)" : "Parent Objective *"}
              </label>
              {objectives.length === 0 ? (
                <p className="text-sm text-[#52525b]">
                  {selectedType === "KEY_RESULT"
                    ? "No Objectives exist yet. Create an Objective first."
                    : "No existing Objectives to link to."}
                </p>
              ) : (
                <select
                  value={parentGoalId}
                  onChange={(e) => setParentGoalId(e.target.value)}
                  className={selectClass}
                  required={selectedType === "KEY_RESULT"}
                >
                  <option value="">— None —</option>
                  {objectives.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.timeframe})
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
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating..." : `Create ${selectedType === "OBJECTIVE" ? "Objective" : "Key Result"}`}
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
      )}
    </div>
  );
}
