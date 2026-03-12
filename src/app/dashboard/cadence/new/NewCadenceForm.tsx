"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Member {
  userId: string;
  name: string;
}

interface GoalOption {
  id: string;
  title: string;
}

const RECURRENCES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
];

const fieldClass =
  "w-full h-10 rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

export default function NewCadenceForm({
  orgId,
  members,
  goals,
  defaultGoalId,
}: {
  orgId: string;
  members: Member[];
  goals: GoalOption[];
  defaultGoalId?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState("WEEKLY");
  const [goalId, setGoalId] = useState(defaultGoalId ?? "");
  const [nextOccurrence, setNextOccurrence] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const canSubmit = name.trim().length > 0;

  function toggleParticipant(userId: string) {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}/rituals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          recurrence,
          goalId: goalId || undefined,
          participantIds,
          nextOccurrence: nextOccurrence || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/dashboard/cadence/${created.id}`);
        return;
      }

      const text = await res.text();
      setError(text || `Failed to create cadence (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Cadence name *"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="e.g. Weekly growth review"
      />

      <div>
        <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What happens in this cadence?"
          className="w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors resize-vertical"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Recurrence *</label>
        <div className="grid grid-cols-2 gap-2">
          {RECURRENCES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRecurrence(r.value)}
              className={[
                "py-2 px-2 rounded-lg border-2 text-sm font-medium transition-all duration-150",
                recurrence === r.value
                  ? "border-[#6366f1] bg-[#312e81] text-[#818cf8]"
                  : "border-[#3f3f46] bg-[#27272a] text-[#71717a] hover:border-[#52525b] hover:text-[#a1a1aa]",
              ].join(" ")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Next occurrence</label>
        <input type="datetime-local" value={nextOccurrence} onChange={(e) => setNextOccurrence(e.target.value)} className={fieldClass} />
      </div>

      {goals.length > 0 && (
        <div>
          <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Link to goal (optional)</label>
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={fieldClass}>
            <option value="">— No goal —</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Participants ({participantIds.length} selected)</label>
        <div className="rounded-lg border border-[#3f3f46] bg-[#18181b] max-h-56 overflow-y-auto">
          {members.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[#71717a]">No members found.</p>
          ) : (
            members.map((member) => {
              const selected = participantIds.includes(member.userId);
              return (
                <label
                  key={member.userId}
                  className="flex items-center gap-2 px-3 py-2 border-b border-[#27272a] last:border-b-0 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleParticipant(member.userId)}
                    className="accent-[#6366f1]"
                  />
                  <span className="text-sm text-[#fafafa]">{member.name}</span>
                </label>
              );
            })
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
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? "Scheduling..." : "Schedule cadence"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/cadence")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
