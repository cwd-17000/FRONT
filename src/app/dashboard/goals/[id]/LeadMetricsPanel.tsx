"use client";

import { useState } from "react";

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
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "16px 20px",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          Lead Metrics ({metrics.length}/3)
        </h2>
        {metrics.length < 3 && (
          <button
            onClick={() => setAdding((a) => !a)}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {adding ? "Cancel" : "+ Add"}
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAddMetric}
          style={{
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px",
            background: "#f9fafb",
            borderRadius: 8,
          }}
        >
          <input
            required
            placeholder="Metric name (e.g. Weekly outbound emails)"
            value={newForm.name}
            onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            style={{
              padding: "7px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Unit (e.g. emails)"
              value={newForm.unit}
              onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value }))}
              style={{
                flex: 1,
                padding: "7px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <input
              type="number"
              min="0"
              placeholder="Weekly target"
              value={newForm.targetValue}
              onChange={(e) => setNewForm((f) => ({ ...f, targetValue: e.target.value }))}
              style={{
                flex: 1,
                padding: "7px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              padding: "6px 14px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving…" : "Save metric"}
          </button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {metrics.map((m) => {
          const pct =
            m.targetValue && m.targetValue > 0
              ? Math.min(100, Math.round((m.currentValue / m.targetValue) * 100))
              : null;
          const ev = entryValues[m.id] ?? { value: "", note: "" };

          return (
            <div key={m.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                <span style={{ fontSize: 13, color: "#374151" }}>
                  {m.currentValue}
                  {m.unit ? ` ${m.unit}` : ""}
                  {m.targetValue ? ` / ${m.targetValue}` : ""}
                </span>
              </div>

              {pct !== null && (
                <div
                  style={{
                    height: 5,
                    background: "#f3f4f6",
                    borderRadius: 99,
                    marginBottom: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: pct >= 70 ? "#34d399" : pct >= 40 ? "#fbbf24" : "#f87171",
                      borderRadius: 99,
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 6 }}>
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
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
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
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <button
                  onClick={() => handleLogEntry(m.id)}
                  disabled={!ev.value}
                  style={{
                    padding: "6px 12px",
                    background: "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                    opacity: ev.value ? 1 : 0.4,
                  }}
                >
                  Log
                </button>
              </div>
            </div>
          );
        })}
        {metrics.length === 0 && !adding && (
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            No lead metrics yet. Add 1–3 measurable inputs that drive this goal.
          </p>
        )}
      </div>
    </section>
  );
}
