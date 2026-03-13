"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue?: number;
  unit?: string;
  status: string;
}

type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";

const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Hit",
  MISSED: "Missed",
};

interface Props {
  orgId: string;
  goalId: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDueDate: string;
  milestoneStatus: MilestoneStatus;
  onClose: () => void;
}

export function MilestoneCalendarModal({
  orgId,
  goalId,
  milestoneId,
  milestoneTitle,
  milestoneDueDate,
  milestoneStatus: initialStatus,
  onClose,
}: Props) {
  const [milestoneStatus, setMilestoneStatus] = useState<MilestoneStatus>(initialStatus);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [loadingKRs, setLoadingKRs] = useState(true);
  const [savingMilestone, setSavingMilestone] = useState(false);
  // Per-KR RAG status picked in this modal (does not auto-save — user clicks Submit)
  const [krStatuses, setKrStatuses] = useState<Record<string, "GREEN" | "YELLOW" | "RED">>({});
  const [savingKRs, setSavingKRs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/organizations/${orgId}/goals/${goalId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((goal) => {
        if (goal?.childGoals) {
          setKeyResults(
            goal.childGoals.map((kr: KeyResult) => ({
              id: kr.id,
              title: kr.title,
              currentValue: kr.currentValue,
              targetValue: kr.targetValue,
              unit: kr.unit,
              status: kr.status,
            }))
          );
        }
      })
      .finally(() => setLoadingKRs(false));
  }, [orgId, goalId]);

  async function updateMilestoneStatus(status: "COMPLETED" | "MISSED") {
    setSavingMilestone(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/goals/${goalId}/milestones/${milestoneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) setMilestoneStatus(status);
      else setError("Failed to update milestone status.");
    } finally {
      setSavingMilestone(false);
    }
  }

  async function submitKRCheckIns() {
    const entries = Object.entries(krStatuses);
    if (entries.length === 0) return;
    setSavingKRs(true);
    setError(null);
    try {
      await Promise.all(
        entries.map(([krId, statusColor]) =>
          fetch(`/api/organizations/${orgId}/goals/${krId}/check-ins`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              progress: keyResults.find((kr) => kr.id === krId)?.currentValue ?? 0,
              statusColor,
              confidenceScore: 50,
            }),
          })
        )
      );
      setKrStatuses({});
    } catch {
      setError("Failed to save one or more key result statuses.");
    } finally {
      setSavingKRs(false);
    }
  }

  const dueFormatted = new Date(milestoneDueDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const statusColors: Record<MilestoneStatus, string> = {
    PENDING: "#71717a",
    IN_PROGRESS: "#6366f1",
    COMPLETED: "#22c55e",
    MISSED: "#ef4444",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#27272a]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: statusColors[milestoneStatus] }}
              />
              <span className="text-xs font-semibold text-[#f59e0b]">Milestone</span>
            </div>
            <h2 className="text-base font-bold text-[#fafafa] leading-snug">{milestoneTitle}</h2>
            <p className="text-xs text-[#71717a] mt-0.5">Due {dueFormatted} · {MILESTONE_STATUS_LABELS[milestoneStatus]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717a] hover:text-[#fafafa] transition-colors mt-0.5 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <p className="text-xs text-[#ef4444] rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2">
              {error}
            </p>
          )}

          {/* Milestone Hit / Missed */}
          {(milestoneStatus === "PENDING" || milestoneStatus === "IN_PROGRESS") && (
            <div>
              <p className="text-xs font-semibold text-[#a1a1aa] mb-2">Was this milestone hit?</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={savingMilestone}
                  onClick={() => updateMilestoneStatus("COMPLETED")}
                  className="flex-1 text-[#22c55e] border-[#22c55e]/30 hover:border-[#22c55e]/60"
                >
                  Yes — Hit ✓
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={savingMilestone}
                  onClick={() => updateMilestoneStatus("MISSED")}
                  className="flex-1 text-[#ef4444] border-[#ef4444]/30 hover:border-[#ef4444]/60"
                >
                  No — Missed ✗
                </Button>
              </div>
            </div>
          )}

          {(milestoneStatus === "COMPLETED" || milestoneStatus === "MISSED") && (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
              style={{
                borderColor: milestoneStatus === "COMPLETED" ? "#22c55e40" : "#ef444440",
                background: milestoneStatus === "COMPLETED" ? "#052e1620" : "#1c0a0a20",
              }}>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: statusColors[milestoneStatus] }}
              />
              <span className="text-sm font-semibold" style={{ color: statusColors[milestoneStatus] }}>
                {MILESTONE_STATUS_LABELS[milestoneStatus]}
              </span>
            </div>
          )}

          {/* Key Results */}
          {loadingKRs ? (
            <p className="text-xs text-[#71717a]">Loading key results…</p>
          ) : keyResults.length === 0 ? (
            <p className="text-xs text-[#52525b]">No key results attached to this objective.</p>
          ) : (
            <div>
              <p className="text-xs font-semibold text-[#a1a1aa] mb-2">Key Results</p>
              <div className="space-y-3">
                {keyResults.map((kr) => {
                  const picked = krStatuses[kr.id];
                  return (
                    <div key={kr.id} className="rounded-lg border border-[#27272a] bg-[#09090b] p-3 space-y-2">
                      <p className="text-sm text-[#fafafa] font-medium">{kr.title}</p>
                      {kr.targetValue != null && kr.targetValue > 0 && (
                        <p className="text-xs text-[#71717a]">
                          {kr.currentValue} / {kr.targetValue}{kr.unit ? ` ${kr.unit}` : ""}
                        </p>
                      )}
                      <div className="flex gap-1.5">
                        {(["GREEN", "YELLOW", "RED"] as const).map((color) => {
                          const labels = { GREEN: "On Track", YELLOW: "At Risk", RED: "Off Track" };
                          const colors = {
                            GREEN: { text: "#22c55e", border: "#22c55e", bg: "#052e16" },
                            YELLOW: { text: "#fbbf24", border: "#f59e0b", bg: "#1c1400" },
                            RED: { text: "#f87171", border: "#ef4444", bg: "#1c0a0a" },
                          };
                          const c = colors[color];
                          const active = picked === color;
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() =>
                                setKrStatuses((prev) =>
                                  active ? { ...prev, [kr.id]: undefined as never } : { ...prev, [kr.id]: color }
                                )
                              }
                              className="flex-1 rounded-md border px-1.5 py-1 text-[11px] font-semibold transition-colors"
                              style={{
                                borderColor: active ? c.border : "#3f3f46",
                                background: active ? c.bg : "#27272a",
                                color: active ? c.text : "#71717a",
                              }}
                            >
                              {labels[color]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(krStatuses).length > 0 && (
                <Button
                  type="button"
                  className="mt-3 w-full"
                  disabled={savingKRs}
                  onClick={submitKRCheckIns}
                >
                  {savingKRs ? "Saving…" : "Save Key Result Statuses"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
