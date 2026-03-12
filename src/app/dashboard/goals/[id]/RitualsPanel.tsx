"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Ritual {
  id: string;
  name: string;
  recurrence: string;
  nextOccurrence?: string;
  owner: { id: string; firstName?: string; lastName?: string };
  _count?: { checkIns: number };
}

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

const RECURRENCE_VARIANT: Record<string, "default" | "accent" | "info" | "success"> = {
  WEEKLY: "info",
  BIWEEKLY: "accent",
  MONTHLY: "success",
  QUARTERLY: "default",
};

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RitualsPanel({
  rituals,
  orgId,
  goalId,
}: {
  rituals: Ritual[];
  orgId: string;
  goalId: string;
}) {
  return (
    <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">
          Cadence ({rituals.length})
        </h2>
        <Link href={`/dashboard/cadence/new?goalId=${goalId}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <Plus size={12} /> Schedule cadence
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {rituals.map((r) => (
          <Link key={r.id} href={`/dashboard/cadence/${r.id}`}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#27272a] bg-[#09090b] hover:border-[#3f3f46] hover:bg-[#18181b] transition-all duration-150">
              <span className="flex-1 text-sm font-medium text-[#fafafa] truncate">{r.name}</span>
              <Badge variant={RECURRENCE_VARIANT[r.recurrence] ?? "default"} className="text-[10px] shrink-0">
                {RECURRENCE_LABELS[r.recurrence] ?? r.recurrence}
              </Badge>
              {r.nextOccurrence && (
                <span className="text-xs text-[#52525b] whitespace-nowrap">
                  Next {formatDate(r.nextOccurrence)}
                </span>
              )}
              {r._count && (
                <span className="text-xs text-[#52525b] whitespace-nowrap">
                  {r._count.checkIns} check-in{r._count.checkIns !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </Link>
        ))}
        {rituals.length === 0 && (
          <p className="text-sm text-[#52525b]">No cadence linked to this goal yet.</p>
        )}
      </div>
    </section>
  );
}
