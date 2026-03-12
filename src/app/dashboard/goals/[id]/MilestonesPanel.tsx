"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
}

const STATUS_DOT: Record<string, string> = {
  PENDING: "#52525b",
  IN_PROGRESS: "#6366f1",
  COMPLETED: "#22c55e",
  MISSED: "#ef4444",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const inputClass =
  "w-full h-9 rounded-lg border border-[#3f3f46] bg-[#09090b] px-3 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

export function MilestonesPanel({
  goalId,
  orgId,
  initialData,
}: {
  goalId: string;
  orgId: string;
  initialData: Milestone[];
}) {
  const [milestones, setMilestones] = useState(initialData);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", dueDate: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(
      `/api/organizations/${orgId}/goals/${goalId}/milestones`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, dueDate: form.dueDate, description: form.description || undefined }),
      }
    );
    if (res.ok) {
      const created = await res.json();
      setMilestones((m) => [...m, created]);
      setForm({ title: "", dueDate: "", description: "" });
      setAdding(false);
    }
    setSaving(false);
  }

  async function markStatus(id: string, status: string) {
    const res = await fetch(
      `/api/organizations/${orgId}/goals/${goalId}/milestones/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    if (res.ok) {
      const updated = await res.json();
      setMilestones((ms) => ms.map((m) => (m.id === id ? updated : m)));
    }
  }

  return (
    <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">
          Milestones ({milestones.length})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding((a) => !a)}
          className="gap-1 text-xs"
        >
          {adding ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
        </Button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="mb-4 flex flex-col gap-2 p-3 rounded-lg bg-[#09090b] border border-[#27272a]"
        >
          <input
            required
            placeholder="Milestone title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputClass}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#71717a] whitespace-nowrap">Due date</label>
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className={inputClass + " flex-1"}
            />
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save milestone"}
          </Button>
        </form>
      )}

      <ul className="flex flex-col gap-2">
        {milestones.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 py-2 border-b border-[#27272a] last:border-0"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: STATUS_DOT[m.status] }}
            />
            <div className="flex-1 min-w-0">
              <div
                className={[
                  "text-sm font-medium",
                  m.status === "COMPLETED" ? "line-through text-[#52525b]" : "text-[#fafafa]",
                ].join(" ")}
              >
                {m.title}
              </div>
              {m.description && (
                <div className="text-xs text-[#71717a] mt-0.5 truncate">{m.description}</div>
              )}
            </div>
            <span className="text-xs text-[#52525b] whitespace-nowrap">{formatDate(m.dueDate)}</span>
            {m.status === "PENDING" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markStatus(m.id, "IN_PROGRESS")}
                className="text-xs shrink-0"
              >
                Start
              </Button>
            )}
            {m.status === "IN_PROGRESS" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markStatus(m.id, "COMPLETED")}
                className="text-xs shrink-0 text-[#22c55e] border-[#22c55e]/30 hover:border-[#22c55e]/60"
              >
                ✓ Done
              </Button>
            )}
          </li>
        ))}
        {milestones.length === 0 && !adding && (
          <li className="text-sm text-[#52525b] py-2">
            No milestones yet. Add time-bounded checkpoints to this goal.
          </li>
        )}
      </ul>
    </section>
  );
}
