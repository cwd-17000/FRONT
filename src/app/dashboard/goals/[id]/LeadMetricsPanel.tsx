"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MetricEntry {
  id: string;
  value: number;
  note?: string;
  recordedAt: string;
}

interface LeadMetric {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  targetValue?: number;
  currentValue: number;
  entries: MetricEntry[];
}

const inputClass =
  "w-full h-9 rounded-lg border border-[#3f3f46] bg-[#09090b] px-3 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

export function LeadMetricsPanel({
  goalId,
  orgId,
  initialData,
}: {
  goalId: string;
  orgId: string;
  initialData: LeadMetric[];
}) {
  const [metrics, setMetrics] = useState(initialData);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", unit: "", targetValue: "" });
  const [entryValues, setEntryValues] = useState<Record<string, { value: string; note: string }>>({});
  const [saving, setSaving] = useState(false);

  async function handleAddMetric(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(
      `/api/organizations/${orgId}/goals/${goalId}/lead-metrics`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newForm.name,
          unit: newForm.unit || undefined,
          targetValue: newForm.targetValue ? parseFloat(newForm.targetValue) : undefined,
        }),
      }
    );
    if (res.ok) {
      const created = await res.json();
      setMetrics((m) => [...m, { ...created, entries: [] }]);
      setNewForm({ name: "", unit: "", targetValue: "" });
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleLogEntry(metricId: string) {
    const ev = entryValues[metricId];
    if (!ev?.value) return;
    const res = await fetch(
      `/api/organizations/${orgId}/goals/${goalId}/lead-metrics/${metricId}/entries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: parseFloat(ev.value), note: ev.note || undefined }),
      }
    );
    if (res.ok) {
      setMetrics((ms) =>
        ms.map((m) =>
          m.id === metricId ? { ...m, currentValue: parseFloat(ev.value) } : m
        )
      );
      setEntryValues((v) => ({ ...v, [metricId]: { value: "", note: "" } }));
    }
  }

  return (
    <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">
          Lead Metrics ({metrics.length}/3)
        </h2>
        {metrics.length < 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding((a) => !a)}
            className="gap-1 text-xs"
          >
            {adding ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
          </Button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAddMetric}
          className="mb-4 flex flex-col gap-2 p-3 rounded-lg bg-[#09090b] border border-[#27272a]"
        >
          <input
            required
            placeholder="Metric name (e.g. Weekly outbound emails)"
            value={newForm.name}
            onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
          <div className="flex gap-2">
            <input
              placeholder="Unit (e.g. emails)"
              value={newForm.unit}
              onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value }))}
              className={inputClass}
            />
            <input
              type="number"
              min="0"
              placeholder="Weekly target"
              value={newForm.targetValue}
              onChange={(e) => setNewForm((f) => ({ ...f, targetValue: e.target.value }))}
              className={inputClass}
            />
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save metric"}
          </Button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {metrics.map((m) => {
          const pct =
            m.targetValue && m.targetValue > 0
              ? Math.min(100, Math.round((m.currentValue / m.targetValue) * 100))
              : null;
          const ev = entryValues[m.id] ?? { value: "", note: "" };

          return (
            <div key={m.id}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-[#fafafa]">{m.name}</span>
                <span className="text-sm text-[#a1a1aa]">
                  {m.currentValue}{m.unit ? ` ${m.unit}` : ""}
                  {m.targetValue ? ` / ${m.targetValue}` : ""}
                </span>
              </div>

              {pct !== null && (
                <div className="h-1.5 rounded-full bg-[#27272a] mb-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={`Log this week's value${m.unit ? ` (${m.unit})` : ""}`}
                  value={ev.value}
                  onChange={(e) =>
                    setEntryValues((v) => ({
                      ...v,
                      [m.id]: { ...ev, value: e.target.value },
                    }))
                  }
                  className={inputClass + " flex-1"}
                />
                <input
                  placeholder="Note (optional)"
                  value={ev.note}
                  onChange={(e) =>
                    setEntryValues((v) => ({
                      ...v,
                      [m.id]: { ...ev, note: e.target.value },
                    }))
                  }
                  className={inputClass + " flex-1"}
                />
                <Button
                  size="sm"
                  onClick={() => handleLogEntry(m.id)}
                  disabled={!ev.value}
                  className="shrink-0"
                >
                  Log
                </Button>
              </div>
            </div>
          );
        })}
        {metrics.length === 0 && !adding && (
          <p className="text-sm text-[#52525b]">
            No lead metrics yet. Add 1–3 measurable inputs that drive this goal.
          </p>
        )}
      </div>
    </section>
  );
}
