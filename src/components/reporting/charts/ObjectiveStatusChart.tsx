"use client";

interface Props {
  /** e.g. { ACTIVE: 8, COMPLETED: 3, DRAFT: 2 } */
  data: Record<string, number>;
  total: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Active",    color: "#6366f1" },
  COMPLETED: { label: "Completed", color: "#22c55e" },
  DRAFT:     { label: "Draft",     color: "#71717a" },
  CANCELLED: { label: "Cancelled", color: "#ef4444" },
  ARCHIVED:  { label: "Archived",  color: "#3f3f46" },
};

// Preferred display order
const DISPLAY_ORDER = ["ACTIVE", "COMPLETED", "DRAFT", "CANCELLED", "ARCHIVED"];

export default function ObjectiveStatusChart({ data, total }: Props) {
  const rows = DISPLAY_ORDER.filter((s) => (data[s] ?? 0) > 0).map((s) => ({
    status: s,
    count: data[s] ?? 0,
    ...STATUS_CONFIG[s],
    pct: total > 0 ? Math.round(((data[s] ?? 0) / total) * 100) : 0,
  }));

  // Also include any statuses not in DISPLAY_ORDER
  for (const [s, count] of Object.entries(data)) {
    if (!DISPLAY_ORDER.includes(s) && count > 0) {
      rows.push({
        status: s,
        count,
        label: s,
        color: "#52525b",
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      });
    }
  }

  if (rows.length === 0) {
    return (
      <div style={{ height: 80, display: "flex", alignItems: "center", color: "#3f3f46", fontSize: 13 }}>
        No objectives
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((row) => (
        <div key={row.status}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            <span style={{ color: "#a1a1aa" }}>{row.label}</span>
            <span style={{ color: "#fafafa", fontWeight: 500 }}>
              {row.count}
              <span style={{ color: "#52525b", fontWeight: 400, marginLeft: 4 }}>({row.pct}%)</span>
            </span>
          </div>
          <div
            style={{
              height: 7,
              background: "#27272a",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${row.pct}%`,
                height: "100%",
                background: row.color,
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
