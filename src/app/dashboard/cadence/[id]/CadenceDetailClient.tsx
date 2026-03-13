"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckIn {
  id: string;
  status: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  summary: string;
  keyUpdates?: string;
  blockers?: string;
  occurredAt: string;
  createdBy: { id: string; firstName?: string; lastName?: string };
}

const STATUS_LABELS = {
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  OFF_TRACK: "Off track",
} as const;

const STATUS_CLASSES = {
  ON_TRACK: "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10",
  AT_RISK: "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10",
  OFF_TRACK: "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10",
} as const;

type Status = keyof typeof STATUS_LABELS;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface NextMilestone {
  id: string;
  title: string;
  dueDate: string;
  targetValue: number | null;
}

export function CadenceDetailClient({
  orgId,
  cadenceId,
  initialCheckIns,
  currentUserId,
  participantIds,
  ownerId,
  nextMilestone,
  goalUnit,
}: {
  orgId: string;
  cadenceId: string;
  initialCheckIns: CheckIn[];
  currentUserId: string;
  participantIds: string[];
  ownerId: string;
  nextMilestone: NextMilestone | null;
  goalUnit?: string;
}) {
  const [checkIns, setCheckIns] = useState(initialCheckIns);
  const [form, setForm] = useState({
    status: "ON_TRACK" as Status,
    summary: "",
    keyUpdates: "",
    blockers: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCheckIn = currentUserId === ownerId || participantIds.includes(currentUserId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}/rituals/${cadenceId}/check-ins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: form.status,
          summary: form.summary,
          keyUpdates: form.keyUpdates || undefined,
          blockers: form.blockers || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCheckIns((prev) => [created, ...prev]);
        setForm({ status: "ON_TRACK", summary: "", keyUpdates: "", blockers: "" });
      } else {
        const text = await res.text();
        setError(text || "Failed to submit check-in.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {canCheckIn && (
        <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">Log a check-in</h2>

          {nextMilestone && (
            <div className="rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-3">
              <p className="text-sm text-[#a5b4fc] font-medium">
                Are you on track to hit{" "}
                {nextMilestone.targetValue != null
                  ? <span className="text-[#fafafa] font-bold">{nextMilestone.targetValue.toLocaleString()}{goalUnit ? ` ${goalUnit}` : ""}</span>
                  : <span className="text-[#fafafa] font-bold">{nextMilestone.title}</span>
                }{" "}
                by{" "}
                <span className="text-[#fafafa] font-bold">
                  {new Date(nextMilestone.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                ?
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
              <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
              <p className="text-sm text-[#ef4444]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(["ON_TRACK", "AT_RISK", "OFF_TRACK"] as Status[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, status }))}
                  className={[
                    "rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                    form.status === status
                      ? STATUS_CLASSES[status]
                      : "border-[#3f3f46] bg-[#27272a] text-[#71717a] hover:text-[#a1a1aa]",
                  ].join(" ")}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>

            <textarea
              required
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              rows={3}
              placeholder="Summary — what happened this period?"
              className="w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors resize-vertical"
            />

            <textarea
              value={form.keyUpdates}
              onChange={(e) => setForm((prev) => ({ ...prev, keyUpdates: e.target.value }))}
              rows={2}
              placeholder="Key updates (optional)"
              className="w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors resize-vertical"
            />

            <textarea
              value={form.blockers}
              onChange={(e) => setForm((prev) => ({ ...prev, blockers: e.target.value }))}
              rows={2}
              placeholder="Blockers (optional)"
              className="w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors resize-vertical"
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit check-in"}
            </Button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">Check-in history ({checkIns.length})</h2>

        {checkIns.length === 0 ? (
          <p className="text-sm text-[#71717a]">No check-ins yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="rounded-lg border border-[#27272a] bg-[#18181b] p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={["text-[11px] font-semibold px-2 py-0.5 rounded-full border", STATUS_CLASSES[checkIn.status]].join(" ")}>
                    {STATUS_LABELS[checkIn.status]}
                  </span>
                  <span className="text-xs text-[#71717a]">
                    {checkIn.createdBy.firstName} {checkIn.createdBy.lastName} · {formatDate(checkIn.occurredAt)}
                  </span>
                </div>
                <p className="text-sm text-[#fafafa]">{checkIn.summary}</p>
                {checkIn.keyUpdates && (
                  <p className="text-xs text-[#a1a1aa] mt-1"><span className="font-medium text-[#71717a]">Updates:</span> {checkIn.keyUpdates}</p>
                )}
                {checkIn.blockers && (
                  <p className="text-xs text-[#fca5a5] mt-1"><span className="font-medium text-[#f87171]">Blockers:</span> {checkIn.blockers}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
