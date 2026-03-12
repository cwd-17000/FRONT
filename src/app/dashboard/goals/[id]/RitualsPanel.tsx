"use client";

import Link from "next/link";

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
          Rituals ({rituals.length})
        </h2>
        <Link
          href={`/dashboard/rituals/new?goalId=${goalId}`}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            textDecoration: "none",
            color: "#111827",
          }}
        >
          + Schedule ritual
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rituals.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/rituals/${r.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                border: "1px solid #f3f4f6",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <span style={{ flex: 1, fontWeight: 500 }}>{r.name}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  background: "#f3f4f6",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {RECURRENCE_LABELS[r.recurrence] ?? r.recurrence}
              </span>
              {r.nextOccurrence && (
                <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                  Next {formatDate(r.nextOccurrence)}
                </span>
              )}
              {r._count && (
                <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                  {r._count.checkIns} check-in{r._count.checkIns !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </Link>
        ))}
        {rituals.length === 0 && (
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            No rituals linked to this goal yet.
          </p>
        )}
      </div>
    </section>
  );
}
