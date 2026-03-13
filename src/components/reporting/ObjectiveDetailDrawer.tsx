"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ObjectiveDetail, KeyResultDetail } from "@/types/reporting";

interface Props {
  data: ObjectiveDetail | null;
  loading: boolean;
  onClose: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    "#818cf8",
  COMPLETED: "#22c55e",
  DRAFT:     "#71717a",
  CANCELLED: "#ef4444",
};

const CATEGORY_COLOR: Record<string, string> = {
  FINANCIAL:        "#22c55e",
  CUSTOMER:         "#3b82f6",
  INTERNAL_PROCESS: "#8b5cf6",
  LEARNING_GROWTH:  "#f59e0b",
  CULTURE:          "#ec4899",
};

const RAG_COLOR: Record<string, string> = {
  GREEN:  "#22c55e",
  YELLOW: "#f59e0b",
  RED:    "#ef4444",
};

export default function ObjectiveDetailDrawer({ data, loading, onClose }: Props) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 49,
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: 480,
          maxWidth: "100vw",
          background: "#09090b",
          borderLeft: "1px solid #27272a",
          zIndex: 50,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #27272a",
            position: "sticky",
            top: 0,
            background: "#09090b",
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>Objective Detail</span>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "#71717a",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#27272a")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px" }}>
          {loading && (
            <div style={{ color: "#71717a", fontSize: 13, paddingTop: 32, textAlign: "center" }}>
              Loading…
            </div>
          )}

          {!loading && !data && (
            <div style={{ color: "#71717a", fontSize: 13, paddingTop: 32, textAlign: "center" }}>
              Could not load objective data.
            </div>
          )}

          {!loading && data && <DrawerContent data={data} />}
        </div>
      </div>
    </>
  );
}

function DrawerContent({ data }: { data: ObjectiveDetail }) {
  const ownerName =
    data.owner?.firstName || data.owner?.lastName
      ? [data.owner.firstName, data.owner.lastName].filter(Boolean).join(" ")
      : (data.owner?.email ?? "—");

  const overallPct =
    data.targetValue && data.targetValue > 0
      ? Math.min(Math.round((data.currentValue / data.targetValue) * 100), 100)
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Title + meta */}
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <Chip label={data.status} color={STATUS_COLOR[data.status] ?? "#71717a"} />
          {data.category && (
            <Chip label={data.category.replace("_", " ")} color={CATEGORY_COLOR[data.category] ?? "#71717a"} />
          )}
          {data.timeframe && (
            <Chip label={data.timeframe} color="#52525b" />
          )}
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "#fafafa", margin: 0, lineHeight: 1.4 }}>
          {data.title}
        </h2>
        {data.description && (
          <p style={{ fontSize: 13, color: "#71717a", marginTop: 8, lineHeight: 1.6 }}>
            {data.description}
          </p>
        )}
      </div>

      {/* Meta grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
        <MetaRow label="Owner" value={ownerName} />
        <MetaRow label="Team" value={data.team?.name ?? "No team"} />
        {data.startDate && <MetaRow label="Start" value={data.startDate.slice(0, 10)} />}
        {data.dueDate && <MetaRow label="Due" value={data.dueDate.slice(0, 10)} />}
        {data.completedAt && <MetaRow label="Completed" value={data.completedAt.slice(0, 10)} />}
        <MetaRow label="Confidence" value={`${data.confidenceScore}%`} />
      </div>

      {/* Overall progress */}
      {overallPct !== null && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#71717a",
              marginBottom: 6,
            }}
          >
            <span>Overall progress</span>
            <span style={{ color: "#fafafa" }}>
              {data.currentValue}
              {data.unit ? ` ${data.unit}` : ""} / {data.targetValue}
              {data.unit ? ` ${data.unit}` : ""} ({overallPct}%)
            </span>
          </div>
          <div style={{ height: 6, background: "#27272a", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                width: `${overallPct}%`,
                height: "100%",
                background: overallPct >= 70 ? "#22c55e" : overallPct >= 40 ? "#f59e0b" : "#ef4444",
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      )}

      {/* Key results */}
      {data.childGoals.length > 0 && (
        <div>
          <SectionLabel>Key Results ({data.childGoals.length})</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
            {data.childGoals.map((kr) => (
              <KrCard key={kr.id} kr={kr} />
            ))}
          </div>
        </div>
      )}

      {data.childGoals.length === 0 && (
        <div style={{ color: "#52525b", fontSize: 13 }}>No key results yet.</div>
      )}
    </div>
  );
}

function KrCard({ kr }: { kr: KeyResultDetail }) {
  const pct =
    kr.targetValue && kr.targetValue > 0
      ? Math.min(Math.round((kr.currentValue / kr.targetValue) * 100), 100)
      : null;

  const latestCheckIn = kr.checkIns[0];

  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      {/* KR title + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: "#fafafa", lineHeight: 1.4, flex: 1 }}>{kr.title}</span>
        {latestCheckIn && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: RAG_COLOR[latestCheckIn.statusColor] ?? "#52525b",
              flexShrink: 0,
              marginTop: 4,
            }}
            title={latestCheckIn.statusColor}
          />
        )}
      </div>

      {/* Progress bar */}
      {pct !== null && (
        <div>
          <div
            style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#52525b", marginBottom: 4 }}
          >
            <span>
              {kr.currentValue}
              {kr.unit ? ` ${kr.unit}` : ""} / {kr.targetValue}
              {kr.unit ? ` ${kr.unit}` : ""}
            </span>
            <span style={{ color: "#a1a1aa" }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: "#27272a", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444",
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      )}

      {/* Recent check-ins */}
      {kr.checkIns.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Recent check-ins
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {kr.checkIns.slice(0, 3).map((ci, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                  fontSize: 11,
                  borderLeft: `2px solid ${RAG_COLOR[ci.statusColor] ?? "#27272a"}`,
                  paddingLeft: 8,
                }}
              >
                <span style={{ color: "#71717a", whiteSpace: "nowrap" }}>
                  {new Date(ci.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span style={{ color: "#a1a1aa" }}>{ci.progress}{kr.unit ? ` ${kr.unit}` : ""}</span>
                {ci.note && (
                  <span style={{ color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {ci.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        color,
        background: `${color}22`,
        padding: "2px 7px",
        borderRadius: 4,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#52525b", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#a1a1aa" }}>{value}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#52525b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        paddingBottom: 6,
        borderBottom: "1px solid #27272a",
      }}
    >
      {children}
    </div>
  );
}
