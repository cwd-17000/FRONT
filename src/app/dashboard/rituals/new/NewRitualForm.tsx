"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Member {
  userId: string;
  user: { id: string; firstName?: string; lastName?: string; email: string };
}

interface Goal {
  id: string;
  title: string;
  type: string;
}

const RECURRENCES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
];

export function NewRitualForm({
  orgId,
  members,
  goals,
  defaultGoalId,
}: {
  orgId: string;
  members: Member[];
  goals: Goal[];
  defaultGoalId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    recurrence: "WEEKLY",
    goalId: defaultGoalId ?? "",
    nextOccurrence: "",
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleParticipant(userId: string) {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const body = {
      name: form.name,
      description: form.description || undefined,
      recurrence: form.recurrence,
      goalId: form.goalId || undefined,
      participantIds: selectedParticipants,
      nextOccurrence: form.nextOccurrence || undefined,
    };

    const res = await fetch(`/api/organizations/${orgId}/rituals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const created = await res.json();
      router.push(`/dashboard/rituals/${created.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to create ritual. Please try again.");
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            fontSize: 13,
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Ritual name *</label>
        <input
          required
          placeholder="e.g. Weekly growth review"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          placeholder="What happens in this meeting?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>Recurrence *</label>
        <div style={{ display: "flex", gap: 8 }}>
          {RECURRENCES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, recurrence: r.value }))}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: "2px solid",
                borderColor: form.recurrence === r.value ? "#111827" : "#e5e7eb",
                background: form.recurrence === r.value ? "#111827" : "#fff",
                color: form.recurrence === r.value ? "#fff" : "#374151",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Next occurrence</label>
        <input
          type="datetime-local"
          value={form.nextOccurrence}
          onChange={(e) => setForm((f) => ({ ...f, nextOccurrence: e.target.value }))}
          style={inputStyle}
        />
      </div>

      {goals.length > 0 && (
        <div>
          <label style={labelStyle}>Link to goal (optional)</label>
          <select
            value={form.goalId}
            onChange={(e) => setForm((f) => ({ ...f, goalId: e.target.value }))}
            style={{ ...inputStyle, background: "#fff" }}
          >
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
        <label style={labelStyle}>
          Participants ({selectedParticipants.length} selected)
        </label>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {members.map((m) => {
            const uid = m.user?.id ?? m.userId;
            const selected = selectedParticipants.includes(uid);
            const name =
              m.user?.firstName
                ? `${m.user.firstName} ${m.user.lastName ?? ""}`.trim()
                : m.user?.email ?? uid;
            return (
              <label
                key={uid}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f3f4f6",
                  background: selected ? "#f0fdf4" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleParticipant(uid)}
                  style={{ accentColor: "#111827" }}
                />
                <span style={{ fontSize: 13 }}>{name}</span>
              </label>
            );
          })}
          {members.length === 0 && (
            <p style={{ fontSize: 13, color: "#9ca3af", padding: "12px 14px", margin: 0 }}>
              No members found.
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 24px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Scheduling…" : "Schedule ritual"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/rituals")}
          style={{
            padding: "10px 20px",
            background: "#fff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
