"use client";

import Link from "next/link";
import { MilestoneStatusActions } from "@/components/goals/MilestoneStatusActions";

export interface UpcomingMilestone {
  id: string;
  title: string;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
  goalId: string;
  goalTitle: string;
}

export interface UpcomingCadence {
  id: string;
  name: string;
  occurrenceDate: string;
  goalId?: string;
  goalTitle?: string;
  goalType?: string;
}

interface Props {
  orgId: string;
  nextMilestone: UpcomingMilestone | null;
  nextCadence: UpcomingCadence | null;
  pastWeekMilestones: UpcomingMilestone[];
  pastWeekCadences: UpcomingCadence[];
}

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  PENDING: "#52525b",
  IN_PROGRESS: "#6366f1",
  COMPLETED: "#22c55e",
  MISSED: "#ef4444",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function CadenceCheckInLink({ cadence }: { cadence: UpcomingCadence }) {
  if (cadence.goalType === "KEY_RESULT" && cadence.goalId) {
    return (
      <Link
        href={`/dashboard/goals/${cadence.goalId}/check-in`}
        className="text-xs text-[#22c55e] hover:text-[#4ade80] whitespace-nowrap shrink-0 transition-colors"
      >
        Check In →
      </Link>
    );
  }
  if (cadence.goalId) {
    return (
      <Link
        href={`/dashboard/goals/${cadence.goalId}`}
        className="text-xs text-[#818cf8] hover:text-[#6366f1] whitespace-nowrap shrink-0 transition-colors"
      >
        Open →
      </Link>
    );
  }
  return (
    <Link
      href={`/dashboard/cadence/${cadence.id}`}
      className="text-xs text-[#818cf8] hover:text-[#6366f1] whitespace-nowrap shrink-0 transition-colors"
    >
      Open →
    </Link>
  );
}

export default function UpcomingPanel({
  orgId,
  nextMilestone,
  nextCadence,
  pastWeekMilestones,
  pastWeekCadences,
}: Props) {
  const hasUpcoming = nextMilestone || nextCadence;
  const hasPastWeek = pastWeekMilestones.length > 0 || pastWeekCadences.length > 0;

  if (!hasUpcoming && !hasPastWeek) return null;

  return (
    <div className="space-y-4">
      {hasUpcoming && (
        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
          <h2 className="text-sm font-semibold text-[#a1a1aa] mb-4">Coming Up</h2>
          <div className="space-y-4">
            {nextMilestone && (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-semibold shrink-0">
                      Milestone
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: MILESTONE_STATUS_COLORS[nextMilestone.status] }}
                    />
                    <span className="text-sm font-medium text-[#fafafa] truncate">
                      {nextMilestone.title}
                    </span>
                  </div>
                  <div className="text-xs text-[#71717a] pl-0.5">
                    {nextMilestone.goalTitle} · due {formatDate(nextMilestone.dueDate)}
                  </div>
                </div>
                <Link
                  href={`/dashboard/goals/${nextMilestone.goalId}`}
                  className="text-xs text-[#818cf8] hover:text-[#6366f1] whitespace-nowrap shrink-0 transition-colors"
                >
                  Open →
                </Link>
              </div>
            )}

            {nextCadence && (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-semibold shrink-0">
                      Cadence
                    </span>
                    <span className="text-sm font-medium text-[#fafafa] truncate">
                      {nextCadence.name}
                    </span>
                  </div>
                  {nextCadence.goalTitle && (
                    <div className="text-xs text-[#71717a] pl-0.5">
                      {nextCadence.goalTitle} · {formatDate(nextCadence.occurrenceDate)}
                    </div>
                  )}
                </div>
                <CadenceCheckInLink cadence={nextCadence} />
              </div>
            )}
          </div>
        </div>
      )}

      {hasPastWeek && (
        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
          <h2 className="text-sm font-semibold text-[#a1a1aa] mb-4">Past Week</h2>
          <div className="space-y-4">
            {pastWeekMilestones.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-semibold shrink-0">
                      Milestone
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: MILESTONE_STATUS_COLORS[m.status] }}
                    />
                    <span className="text-sm font-medium text-[#fafafa] truncate">{m.title}</span>
                  </div>
                  <div className="text-xs text-[#71717a] pl-0.5">
                    {m.goalTitle} · was due {formatDate(m.dueDate)}
                  </div>
                </div>
                {m.status === "PENDING" || m.status === "IN_PROGRESS" ? (
                  <MilestoneStatusActions
                    orgId={orgId}
                    goalId={m.goalId}
                    milestoneId={m.id}
                    compact
                  />
                ) : (
                  <span
                    className="text-xs font-semibold whitespace-nowrap shrink-0"
                    style={{ color: m.status === "COMPLETED" ? "#22c55e" : "#ef4444" }}
                  >
                    {m.status === "COMPLETED" ? "Hit ✓" : "Missed ✗"}
                  </span>
                )}
              </div>
            ))}

            {pastWeekCadences.map((c) => (
              <div key={`${c.id}-${c.occurrenceDate}`} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-semibold shrink-0">
                      Cadence
                    </span>
                    <span className="text-sm font-medium text-[#fafafa] truncate">{c.name}</span>
                  </div>
                  {c.goalTitle && (
                    <div className="text-xs text-[#71717a] pl-0.5">
                      {c.goalTitle} · {formatDate(c.occurrenceDate)}
                    </div>
                  )}
                </div>
                <CadenceCheckInLink cadence={c} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
