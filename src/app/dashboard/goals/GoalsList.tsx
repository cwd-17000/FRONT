"use client";

import { useState } from "react";
import Link from "next/link";

interface CheckIn {
  statusColor: string;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  type: string;
  category: string;
  status: string;
  timeframe: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  confidenceScore: number;
  parentGoalId?: string | null;
  owner: { id: string; firstName?: string; lastName?: string };
  checkIns: CheckIn[];
  _count: { checkIns: number; childGoals: number };
}

interface OrgDashboard {
  activeGoals: number;
  avgConfidenceScore: number;
  ragCounts: { RED: number; YELLOW: number; GREEN: number };
  byCategory: Record<string, number>;
}

interface Props {
  goals: Goal[];
  dashboard: OrgDashboard | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  FINANCIAL: "#10b981",
  CUSTOMER: "#3b82f6",
  INTERNAL_PROCESS: "#8b5cf6",
  LEARNING_GROWTH: "#f59e0b",
  CULTURE: "#ec4899",
};

const CATEGORY_LABELS: Record<string, string> = {
  FINANCIAL: "Financial",
  CUSTOMER: "Customer",
  INTERNAL_PROCESS: "Internal Process",
  LEARNING_GROWTH: "Learning & Growth",
  CULTURE: "Culture",
};

const TIMEFRAME_LABELS: Record<string, string> = {
  ANNUAL: "Annual",
  QUARTERLY: "Quarterly",
  MONTHLY: "Monthly",
  WEEKLY: "Weekly",
};

function confidenceColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#10b981";
}

function ragDotColor(c: string) {
  if (c === "GREEN") return "#10b981";
  if (c === "YELLOW") return "#f59e0b";
  return "#ef4444";
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function KRRow({ kr }: { kr: Goal }) {
  const progress =
    kr.targetValue && kr.targetValue > 0
      ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
      : null;
  const lastRag = kr.checkIns[0]?.statusColor;
  const daysSinceCheckIn = kr.checkIns[0] ? daysSince(kr.checkIns[0].createdAt) : null;
  const isDue = kr.status === "ACTIVE" && (daysSinceCheckIn === null || daysSinceCheckIn >= 7);

  return (
    <Link href={`/dashboard/goals/${kr.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px 10px 20px",
          borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
          cursor: "pointer",
        }}
      >
        {/* Indent line */}
        <div style={{ width: 2, alignSelf: "stretch", background: "#e5e7eb", borderRadius: 1, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: progress !== null ? 5 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{kr.title}</span>
            {isDue && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 99, background: "#fef3c7", color: "#d97706", flexShrink: 0 }}>
                Check in
              </span>
            )}
          </div>
          {progress !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: confidenceColor(kr.confidenceScore),
                    borderRadius: 99,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                {kr.currentValue}{kr.unit ? ` ${kr.unit}` : ""} / {kr.targetValue}{kr.unit ? ` ${kr.unit}` : ""}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {lastRag && (
            <div
              style={{ width: 8, height: 8, borderRadius: "50%", background: ragDotColor(lastRag) }}
              title={lastRag}
            />
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: confidenceColor(kr.confidenceScore) }}>
            {kr.confidenceScore}%
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {kr.owner.firstName} {kr.owner.lastName}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ObjectiveCard({ objective, keyResults }: { objective: Goal; keyResults: Goal[] }) {
  const [expanded, setExpanded] = useState(false);

  // Objective health = average confidence of its KRs (or own score if no KRs)
  const health =
    keyResults.length > 0
      ? Math.round(keyResults.reduce((s, kr) => s + kr.confidenceScore, 0) / keyResults.length)
      : objective.confidenceScore;

  const lastRag = keyResults.length > 0
    ? keyResults[0].checkIns[0]?.statusColor
    : objective.checkIns[0]?.statusColor;

  // Overall KR progress
  const krsWithTarget = keyResults.filter((kr) => kr.targetValue && kr.targetValue > 0);
  const avgKrProgress =
    krsWithTarget.length > 0
      ? Math.round(
          krsWithTarget.reduce((s, kr) => s + Math.min(100, (kr.currentValue / kr.targetValue!) * 100), 0) /
            krsWithTarget.length
        )
      : null;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      {/* Objective header row */}
      <div
        style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Chevron */}
        <span
          style={{
            fontSize: 12,
            color: "#9ca3af",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          ▶
        </span>

        {/* Title + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 99,
                background: (CATEGORY_COLORS[objective.category] ?? "#6b7280") + "20",
                color: CATEGORY_COLORS[objective.category] ?? "#6b7280",
              }}
            >
              {CATEGORY_LABELS[objective.category] ?? objective.category}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              {TIMEFRAME_LABELS[objective.timeframe] ?? objective.timeframe}
            </span>
          </div>
          <Link
            href={`/dashboard/goals/${objective.id}`}
            style={{ textDecoration: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{objective.title}</span>
          </Link>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {objective.owner.firstName} {objective.owner.lastName}
            {keyResults.length > 0 && ` · ${keyResults.length} key result${keyResults.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Health indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {avgKrProgress !== null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>Avg progress</div>
              <div style={{ width: 64, height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${avgKrProgress}%`,
                    background: confidenceColor(health),
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          )}
          {lastRag && (
            <div
              style={{ width: 10, height: 10, borderRadius: "50%", background: ragDotColor(lastRag) }}
              title={`Latest: ${lastRag}`}
            />
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: confidenceColor(health) }}>{health}%</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>confidence</div>
          </div>
        </div>
      </div>

      {/* Collapsed KR count hint */}
      {!expanded && keyResults.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #f3f4f6",
            padding: "6px 20px 6px 36px",
            fontSize: 12,
            color: "#9ca3af",
            background: "#fafafa",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(true)}
        >
          {keyResults.length} key result{keyResults.length !== 1 ? "s" : ""} — click to expand
        </div>
      )}

      {/* Expanded KR rows */}
      {expanded && keyResults.length > 0 && (
        <div>
          {keyResults.map((kr) => (
            <KRRow key={kr.id} kr={kr} />
          ))}
        </div>
      )}

      {/* No KRs yet */}
      {expanded && keyResults.length === 0 && (
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "10px 20px 10px 36px", fontSize: 13, color: "#9ca3af", background: "#fafafa" }}>
          No Key Results yet.{" "}
          <Link href={`/dashboard/goals/new`} style={{ color: "#3b82f6", textDecoration: "none" }}>
            Add one →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function GoalsList({ goals, dashboard }: Props) {
  const objectives = goals.filter((g) => g.type === "OBJECTIVE");
  const krsByParent = new Map<string, Goal[]>();
  goals
    .filter((g) => g.type === "KEY_RESULT" && g.parentGoalId)
    .forEach((kr) => {
      const list = krsByParent.get(kr.parentGoalId!) ?? [];
      list.push(kr);
      krsByParent.set(kr.parentGoalId!, list);
    });

  const ragTotal = dashboard
    ? dashboard.ragCounts.RED + dashboard.ragCounts.YELLOW + dashboard.ragCounts.GREEN
    : 0;

  return (
    <div>
      {/* Org health stats */}
      {dashboard && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{dashboard.activeGoals}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Active Objectives</div>
          </div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: confidenceColor(dashboard.avgConfidenceScore) }}>
              {dashboard.avgConfidenceScore}%
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Avg Confidence</div>
          </div>
          {ragTotal > 0 && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {[
                  { label: "On Track", count: dashboard.ragCounts.GREEN, color: "#10b981" },
                  { label: "At Risk", count: dashboard.ragCounts.YELLOW, color: "#f59e0b" },
                  { label: "Off Track", count: dashboard.ragCounts.RED, color: "#ef4444" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color }}>{count}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Last 30 days</div>
            </div>
          )}
        </div>
      )}

      {/* Objective list */}
      {objectives.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#6b7280",
            border: "2px dashed #e5e7eb",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 16, marginBottom: 16 }}>
            No objectives yet. Create your first to drive alignment.
          </p>
          <Link href="/dashboard/goals/new">
            <button
              style={{
                padding: "10px 24px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Create Your First Objective
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {objectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              keyResults={krsByParent.get(obj.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
