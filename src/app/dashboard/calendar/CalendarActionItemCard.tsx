"use client";

import Link from "next/link";
import { MilestoneStatusActions } from "@/components/goals/MilestoneStatusActions";

export interface CalendarDisplayItem {
  id: string;
  title: string;
  startDate: string;
  subtitle?: string;
  kind: "EVENT" | "CADENCE" | "MILESTONE";
  cadenceId?: string;
  goalId?: string;
  milestoneId?: string;
  milestoneStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
}

const MILESTONE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Hit",
  MISSED: "Missed",
};

export function CalendarActionItemCard({
  item,
  orgId,
}: {
  item: CalendarDisplayItem;
  orgId: string;
}) {
  if (item.kind === "CADENCE" && item.cadenceId) {
    return (
      <Link
        href={`/dashboard/cadence/${item.cadenceId}`}
        className="text-[10px] px-1.5 py-0.5 rounded border overflow-hidden bg-[#052e16] border-[#22c55e]/30 block hover:border-[#22c55e]/60 transition-colors"
      >
        <div className="font-medium text-[#86efac] truncate">{item.title}</div>
        {item.subtitle && <div className="text-[#71717a] truncate">{item.subtitle}</div>}
        <div className="text-[#4ade80] mt-0.5">Check in →</div>
      </Link>
    );
  }

  if (item.kind === "MILESTONE" && item.goalId && item.milestoneId) {
    return (
      <div className="text-[10px] px-1.5 py-1 rounded border overflow-hidden bg-[#3f1d0d] border-[#f59e0b]/30 space-y-1">
        <div className="font-medium text-[#fdba74] truncate">{item.title}</div>
        {item.subtitle && <div className="text-[#71717a] truncate">{item.subtitle}</div>}
        <div className="flex items-center justify-between gap-1">
          <Link href={`/dashboard/goals/${item.goalId}`} className="text-[#fbbf24] hover:text-[#fcd34d] truncate">
            Open
          </Link>
          {(item.milestoneStatus === "PENDING" || item.milestoneStatus === "IN_PROGRESS") ? (
            <MilestoneStatusActions
              orgId={orgId}
              goalId={item.goalId}
              milestoneId={item.milestoneId}
              compact
            />
          ) : (
            <span className="text-[#fbbf24]">{MILESTONE_STATUS_LABELS[item.milestoneStatus ?? "PENDING"]}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-[10px] px-1.5 py-0.5 rounded border overflow-hidden bg-[#312e81] border-[#6366f1]/20">
      <div className="font-medium text-[#818cf8] truncate">{item.title}</div>
      {item.subtitle && <div className="text-[#71717a] truncate">{item.subtitle}</div>}
    </div>
  );
}
