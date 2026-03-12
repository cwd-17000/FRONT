"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MilestoneStatusActions({
  orgId,
  goalId,
  milestoneId,
  compact = false,
}: {
  orgId: string;
  goalId: string;
  milestoneId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function updateMilestone(status: "COMPLETED" | "MISSED") {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const res = await fetch(
        `/api/organizations/${orgId}/goals/${goalId}/milestones/${milestoneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  const size = compact ? "sm" : "md";
  const baseClass = compact ? "h-7 text-[11px] px-2" : "text-xs";

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size={size}
        variant="secondary"
        disabled={isSaving}
        onClick={() => updateMilestone("COMPLETED")}
        className={`${baseClass} text-[#22c55e] border-[#22c55e]/30 hover:border-[#22c55e]/60`}
      >
        Hit
      </Button>
      <Button
        type="button"
        size={size}
        variant="secondary"
        disabled={isSaving}
        onClick={() => updateMilestone("MISSED")}
        className={`${baseClass} text-[#ef4444] border-[#ef4444]/30 hover:border-[#ef4444]/60`}
      >
        Missed
      </Button>
    </div>
  );
}
