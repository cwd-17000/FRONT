"use client";

import { useState } from "react";
import Link from "next/link";
import { MilestoneCalendarModal } from "./MilestoneCalendarModal";

export interface CalendarDisplayItem {
  id: string;
  title: string;
  startDate: string;
  subtitle?: string;
  kind: "EVENT" | "CADENCE" | "MILESTONE";
  cadenceId?: string;
  goalId?: string;
  goalType?: string;
  milestoneId?: string;
  milestoneStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
}

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  PENDING: "#71717a",
  IN_PROGRESS: "#6366f1",
  COMPLETED: "#22c55e",
  MISSED: "#ef4444",
};

function MilestoneCard({
  item,
  orgId,
}: {
  item: CalendarDisplayItem;
  orgId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!item.goalId || !item.milestoneId) return null;

  const statusColor = MILESTONE_STATUS_COLORS[item.milestoneStatus ?? "PENDING"];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left text-[10px] px-1.5 py-1 rounded border overflow-hidden bg-[#3f1d0d] border-[#f59e0b]/30 hover:border-[#f59e0b]/60 transition-colors"
      >
        <div className="flex items-center gap-1 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
          <span className="font-medium text-[#fdba74] truncate">{item.title}</span>
        </div>
        {item.subtitle && <div className="text-[#71717a] truncate">{item.subtitle}</div>}
        <div className="text-[#f59e0b]/60 mt-0.5">Tap to review →</div>
      </button>

      {open && (
        <MilestoneCalendarModal
          orgId={orgId}
          goalId={item.goalId!}
          milestoneId={item.milestoneId!}
          milestoneTitle={item.title}
          milestoneDueDate={item.startDate}
          milestoneStatus={item.milestoneStatus ?? "PENDING"}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function CalendarActionItemCard({
  item,
  orgId,
}: {
  item: CalendarDisplayItem;
  orgId: string;
}) {
  if (item.kind === "CADENCE" && item.cadenceId) {
    const href =
      item.goalType === "KEY_RESULT" && item.goalId
        ? `/dashboard/goals/${item.goalId}/check-in`
        : `/dashboard/cadence/${item.cadenceId}`;

    return (
      <Link
        href={href}
        className="text-[10px] px-1.5 py-0.5 rounded border overflow-hidden bg-[#052e16] border-[#22c55e]/30 block hover:border-[#22c55e]/60 transition-colors"
      >
        <div className="font-medium text-[#86efac] truncate">{item.title}</div>
        {item.subtitle && <div className="text-[#71717a] truncate">{item.subtitle}</div>}
        <div className="text-[#4ade80] mt-0.5">Check in →</div>
      </Link>
    );
  }

  if (item.kind === "MILESTONE" && item.goalId && item.milestoneId) {
    return <MilestoneCard item={item} orgId={orgId} />;
  }

  return (
    <div className="text-[10px] px-1.5 py-0.5 rounded border overflow-hidden bg-[#312e81] border-[#6366f1]/20">
      <div className="font-medium text-[#818cf8] truncate">{item.title}</div>
      {item.subtitle && <div className="text-[#71717a] truncate">{item.subtitle}</div>}
    </div>
  );
}
