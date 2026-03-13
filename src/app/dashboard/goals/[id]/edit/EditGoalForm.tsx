"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  status: string;
  visibility: string;
  timeframe: string;
  startDate?: string;
  dueDate?: string;
  targetValue?: number;
  unit?: string;
  confidenceScore: number;
  parentGoalId?: string | null;
  teamId?: string | null;
  ownerId: string;
}

interface Props {
  goal: Goal;
  orgId: string;
  teams: { id: string; name: string }[];
  members: { id: string; firstName?: string; lastName?: string; email: string }[];
  objectives: { id: string; title: string }[];
}

const CATEGORIES = [
  { value: "FINANCIAL", label: "Financial" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "INTERNAL_PROCESS", label: "Internal Process" },
  { value: "LEARNING_GROWTH", label: "Learning & Growth" },
  { value: "CULTURE", label: "Culture" },
];

const TIMEFRAMES = [
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
];

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const VISIBILITIES = [
  { value: "PUBLIC", label: "Public" },
  { value: "TEAM", label: "Team" },
  { value: "PRIVATE", label: "Private" },
];

function toDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type ArchiveStep = "idle" | "confirm1" | "confirm2";

const inputCls =
  "w-full rounded-lg border border-[#3f3f46] bg-[#18181b] text-[#fafafa] text-sm px-3 py-2 outline-none focus:border-[#6366f1] placeholder:text-[#52525b] transition-colors";

const selectCls =
  "w-full rounded-lg border border-[#3f3f46] bg-[#18181b] text-[#fafafa] text-sm px-3 py-2 outline-none focus:border-[#6366f1] transition-colors";

export function EditGoalForm({ goal, orgId, teams, members, objectives }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [category, setCategory] = useState(goal.category);
  const [status, setStatus] = useState(goal.status);
  const [visibility, setVisibility] = useState(goal.visibility);
  const [timeframe, setTimeframe] = useState(goal.timeframe);
  const [startDate, setStartDate] = useState(toDateInput(goal.startDate));
  const [dueDate, setDueDate] = useState(toDateInput(goal.dueDate));
  const [targetValue, setTargetValue] = useState(
    goal.targetValue !== undefined ? String(goal.targetValue) : ""
  );
  const [unit, setUnit] = useState(goal.unit ?? "");
  const [confidenceScore, setConfidenceScore] = useState(goal.confidenceScore);
  const [ownerId, setOwnerId] = useState(goal.ownerId);
  const [teamId, setTeamId] = useState(goal.teamId ?? "");
  const [parentGoalId, setParentGoalId] = useState(goal.parentGoalId ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [archiveStep, setArchiveStep] = useState<ArchiveStep>("idle");
  const [archiving, setArchiving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      title,
      description: description || undefined,
      category,
      status,
      visibility,
      timeframe,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      targetValue: targetValue !== "" ? Number(targetValue) : undefined,
      unit: unit || undefined,
      confidenceScore,
      ownerId: ownerId || undefined,
      teamId: teamId || undefined,
      parentGoalId: parentGoalId || undefined,
    };

    try {
      const res = await fetch(`/api/organizations/${orgId}/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to save changes.");
        return;
      }

      router.push(`/dashboard/goals/${goal.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveConfirmed() {
    setArchiving(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${orgId}/goals/${goal.id}/archive`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to archive goal.");
        setArchiveStep("idle");
        return;
      }

      router.push("/dashboard/goals");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setArchiveStep("idle");
    } finally {
      setArchiving(false);
    }
  }

  const isArchived = goal.status === "ARCHIVED";

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Core fields */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">Goal Details</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-[#71717a]">Title</label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Goal title"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#71717a]">Description</label>
            <textarea
              className={inputCls + " resize-none"}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Category</label>
              <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Status</label>
              <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Timeframe</label>
              <select className={selectCls} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                {TIMEFRAMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Visibility</label>
              <select className={selectCls} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                {VISIBILITIES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates & target */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">Timeline & Target</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Start Date</label>
              <input
                type="date"
                className={inputCls}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Due Date</label>
              <input
                type="date"
                className={inputCls}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Target Value</label>
              <input
                type="number"
                min={0}
                step="any"
                className={inputCls}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Unit</label>
              <input
                className={inputCls}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder='e.g. %, $, calls'
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-[#71717a]">Confidence Score</label>
              <span
                className="text-xs font-semibold"
                style={{
                  color:
                    confidenceScore < 40
                      ? "#ef4444"
                      : confidenceScore <= 70
                      ? "#f59e0b"
                      : "#22c55e",
                }}
              >
                {confidenceScore}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={confidenceScore}
              onChange={(e) => setConfidenceScore(Number(e.target.value))}
              className="w-full accent-[#6366f1]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ownership */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">Ownership</h2>

          <div className="grid grid-cols-2 gap-4">
            {members.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-[#71717a]">Owner</label>
                <select
                  className={selectCls}
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName && m.lastName
                        ? `${m.firstName} ${m.lastName}`
                        : m.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {teams.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-[#71717a]">Team</label>
                <select
                  className={selectCls}
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  <option value="">No team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {goal.type === "KEY_RESULT" && objectives.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs text-[#71717a]">Parent Objective</label>
              <select
                className={selectCls}
                value={parentGoalId}
                onChange={(e) => setParentGoalId(e.target.value)}
              >
                <option value="">None</option>
                {objectives.map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-[#ef4444] px-1">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Archive section */}
        {!isArchived && (
          <div className="flex items-center gap-3">
            {archiveStep === "idle" && (
              <button
                type="button"
                onClick={() => setArchiveStep("confirm1")}
                className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#f59e0b] transition-colors"
              >
                <Archive size={14} />
                Archive Goal
              </button>
            )}

            {archiveStep === "confirm1" && (
              <div className="flex items-center gap-2 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-2">
                <span className="text-sm text-[#fbbf24]">Archive this goal?</span>
                <button
                  type="button"
                  onClick={() => setArchiveStep("confirm2")}
                  className="text-sm font-semibold text-[#f59e0b] hover:text-[#fbbf24] transition-colors"
                >
                  Yes, archive
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveStep("idle")}
                  className="text-sm text-[#71717a] hover:text-[#fafafa] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {archiveStep === "confirm2" && (
              <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2">
                <span className="text-sm text-[#f87171]">Are you sure? This cannot be undone easily.</span>
                <button
                  type="button"
                  disabled={archiving}
                  onClick={handleArchiveConfirmed}
                  className="text-sm font-semibold text-[#ef4444] hover:text-[#f87171] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {archiving && <Loader2 size={12} className="animate-spin" />}
                  Confirm Archive
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveStep("idle")}
                  className="text-sm text-[#71717a] hover:text-[#fafafa] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {isArchived && (
          <p className="text-sm text-[#52525b] italic">This goal is archived.</p>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || isArchived}>
            {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
