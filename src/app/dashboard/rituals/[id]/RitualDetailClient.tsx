"use client";

import { useState } from "react";

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

const STATUS_COLOR = {
  ON_TRACK: "#15803d",
  AT_RISK: "#92400e",
  OFF_TRACK: "#b91c1c",
} as const;

const STATUS_BG = {
  ON_TRACK: "#dcfce7",
  AT_RISK: "#fef9c3",
  OFF_TRACK: "#fee2e2",
} as const;

const STATUS_BORDER = {
  ON_TRACK: "#34d399",
  AT_RISK: "#fbbf24",
  OFF_TRACK: "#f87171",
} as const;

type Status = keyof typeof STATUS_LABELS;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RitualDetailClient({
  orgId,
  ritualId,
  initialCheckIns,
  currentUserId,
  participantIds,
  ownerId,
}: {
  orgId: string;
  ritualId: string;
  initialCheckIns: CheckIn[];
  currentUserId: string;
  participantIds: string[];
  ownerId: string;
}) {
  const [checkIns, setCheckIns] = useState(initialCheckIns);
  const [form, setForm] = useState({
    status: "ON_TRACK" as Status,
    summary: "",
    keyUpdates: "",
    blockers: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCheckIn = currentUserId === ownerId || participantIds.includes(currentUserId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/organizations/${orgId}/rituals/${ritualId}/check-ins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        summary: form.summary,
        keyUpdates: form.keyUpdates || undefined,
        blockers: form.blockers || undefined,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setCheckIns((c) => [created, ...c]);
      setForm({ status: "ON_TRACK", summary: "", keyUpdates: "", blockers: "" });
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to submit check-in.");
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* Check-in form */}
      {canCheckIn && (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "20px",
            marginBottom: 28,
            background: "#fff",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>
            Log a check-in
          </h2>

          {error && (
            <div
              style={{
                padding: "8px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                fontSize: 13,
                color: "#b91c1c",
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* RAG status picker */}
            <div style={{ display: "flex", gap: 8 }}>
              {(["ON_TRACK", "AT_RISK", "OFF_TRACK"] as Status[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 8,
                    border: "2px solid",
                    borderColor: form.status === s ? STATUS_COLOR[s] : "#e5e7eb",
                    background: form.status === s ? STATUS_BG[s] : "#fff",
                    color: form.status === s ? STATUS_COLOR[s] : "#6b7280",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <textarea
              required
              placeholder="Summary — what happened this period? *"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              rows={3}
              style={{
                padding: "9px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                resize: "vertical",
              }}
            />

            <textarea
              placeholder="Key updates (optional)"
              value={form.keyUpdates}
              onChange={(e) => setForm((f) => ({ ...f, keyUpdates: e.target.value }))}
              rows={2}
              style={{
                padding: "9px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                resize: "vertical",
              }}
            />

            <textarea
              placeholder="Blockers (optional)"
              value={form.blockers}
              onChange={(e) => setForm((f) => ({ ...f, blockers: e.target.value }))}
              rows={2}
              style={{
                padding: "9px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                resize: "vertical",
              }}
            />

            <button
              type="submit"
              disabled={submitting}
              style={{
                alignSelf: "flex-start",
                padding: "9px 22px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Submit check-in"}
            </button>
          </form>
        </section>
      )}

      {/* Check-in history */}
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>
          Check-in history ({checkIns.length})
        </h2>

        {checkIns.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>No check-ins yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {checkIns.map((ci) => (
              <div
                key={ci.id}
                style={{
                  borderLeft: `3px solid ${STATUS_BORDER[ci.status]}`,
                  paddingLeft: 14,
                  paddingBottom: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: STATUS_COLOR[ci.status],
                      padding: "2px 8px",
                      background: STATUS_BG[ci.status],
                      borderRadius: 4,
                    }}
                  >
                    {STATUS_LABELS[ci.status]}
                  </span>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {ci.createdBy.firstName} {ci.createdBy.lastName} ·{" "}
                    {formatDate(ci.occurredAt)}
                  </div>
                </div>

                <p style={{ margin: "0 0 4px", fontSize: 14, color: "#111827" }}>
                  {ci.summary}
                </p>

                {ci.keyUpdates && (
                  <p style={{ margin: "4px 0", fontSize: 13, color: "#374151" }}>
                    <strong>Updates:</strong> {ci.keyUpdates}
                  </p>
                )}

                {ci.blockers && (
                  <p style={{ margin: "4px 0", fontSize: 13, color: "#b91c1c" }}>
                    <strong>Blockers:</strong> {ci.blockers}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
