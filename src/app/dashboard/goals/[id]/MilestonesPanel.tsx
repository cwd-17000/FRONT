"use client";

import { useState } from "react";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
}

const STATUS_DOT: Record<string, string> = {
  PENDING: "#d1d5db",
  IN_PROGRESS: "#60a5fa",
  COMPLETED: "#34d399",
  MISSED: "#f87171",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  MISSED: "Missed",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
          Milestones ({milestones.length})
        </h2>
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
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          style={{
            marginBottom: 14,
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
            placeholder="Milestone title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{
              padding: "7px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
            }}
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{
              padding: "7px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
            }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Due date</label>
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
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
            {saving ? "Saving…" : "Save milestone"}
          </button>
        </form>
      )}

      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {milestones.map((m) => (
          <li
            key={m.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: STATUS_DOT[m.status],
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: m.status === "COMPLETED" ? "line-through" : undefined,
                  color: m.status === "COMPLETED" ? "#9ca3af" : "#111827",
                }}
              >
                {m.title}
              </div>
              {m.description && (
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{m.description}</div>
              )}
            </div>
            <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
              {formatDate(m.dueDate)}
            </span>
            {m.status === "PENDING" && (
              <button
                onClick={() => markStatus(m.id, "IN_PROGRESS")}
                title="Mark in progress"
                style={{ fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 6px", cursor: "pointer", background: "#fff" }}
              >
                Start
              </button>
            )}
            {m.status === "IN_PROGRESS" && (
              <button
                onClick={() => markStatus(m.id, "COMPLETED")}
                title="Mark complete"
                style={{ fontSize: 11, border: "1px solid #34d399", borderRadius: 4, padding: "2px 6px", cursor: "pointer", background: "#f0fdf4", color: "#15803d" }}
              >
                ✓ Done
              </button>
            )}
          </li>
        ))}
        {milestones.length === 0 && !adding && (
          <li style={{ fontSize: 13, color: "#9ca3af", padding: "8px 0" }}>
            No milestones yet. Add time-bounded checkpoints to this goal.
          </li>
        )}
      </ul>
    </section>
  );
}
