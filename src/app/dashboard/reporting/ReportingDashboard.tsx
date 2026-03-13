"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ReportingFilters,
  ReportingSummary,
  ProgressOverTimeData,
  TeamComparisonItem,
  ObjectiveDetail,
  Team,
} from "@/types/reporting";
import ObjectiveStatusChart from "@/components/reporting/charts/ObjectiveStatusChart";
import ProgressOverTimeChart from "@/components/reporting/charts/ProgressOverTimeChart";
import TeamComparisonChart from "@/components/reporting/charts/TeamComparisonChart";
import ObjectiveDetailDrawer from "@/components/reporting/ObjectiveDetailDrawer";

// ── Timeframe helpers ────────────────────────────────────────────────────────

function getQuarterRange(year: number, quarter: 0 | 1 | 2 | 3) {
  const from = new Date(year, quarter * 3, 1);
  const to = new Date(year, quarter * 3 + 3, 0);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

const PRESETS = [
  { label: "This Quarter", getValue: () => getQuarterRange(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) as 0 | 1 | 2 | 3) },
  {
    label: "Last Quarter",
    getValue: () => {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      return q === 0
        ? getQuarterRange(now.getFullYear() - 1, 3)
        : getQuarterRange(now.getFullYear(), (q - 1) as 0 | 1 | 2 | 3);
    },
  },
  {
    label: "This Year",
    getValue: () => ({
      from: `${new Date().getFullYear()}-01-01`,
      to: `${new Date().getFullYear()}-12-31`,
    }),
  },
];

function defaultFilters(): ReportingFilters {
  return { teamId: null, ...PRESETS[0].getValue() };
}

// ── API helpers ──────────────────────────────────────────────────────────────

function buildParams(filters: ReportingFilters): string {
  const p = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.teamId) p.set("teamId", filters.teamId);
  return p.toString();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Objective list (reuses existing goals endpoint) ──────────────────────────

interface GoalListItem {
  id: string;
  title: string;
  status: string;
  category: string | null;
  timeframe: string | null;
  currentValue: number;
  targetValue: number | null;
  dueDate: string | null;
  team?: { id: string; name: string } | null;
  owner?: { firstName: string | null; lastName: string | null; email: string } | null;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  orgId: string;
  teams: Team[];
}

export default function ReportingDashboard({ orgId, teams }: Props) {
  const [filters, setFilters] = useState<ReportingFilters>(defaultFilters);
  const [activePreset, setActivePreset] = useState(0);

  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [progressOverTime, setProgressOverTime] = useState<ProgressOverTimeData | null>(null);
  const [teamComparison, setTeamComparison] = useState<TeamComparisonItem[]>([]);
  const [objectives, setObjectives] = useState<GoalListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<ObjectiveDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // ── Fetch all reporting data whenever filters change ─────────────────────

  const loadData = useCallback(
    async (f: ReportingFilters) => {
      setLoading(true);
      const qs = buildParams(f);
      const base = `/api/organizations/${orgId}`;

      const [s, p, t, g] = await Promise.all([
        fetchJson<ReportingSummary>(`${base}/reporting/summary?${qs}`),
        fetchJson<ProgressOverTimeData>(`${base}/reporting/progress-over-time?${qs}`),
        fetchJson<TeamComparisonItem[]>(`${base}/reporting/team-comparison?${qs}`),
        fetchJson<{ data: GoalListItem[] } | GoalListItem[]>(
          `${base}/goals?type=OBJECTIVE&limit=50${f.teamId ? `&teamId=${f.teamId}` : ""}`,
        ),
      ]);

      setSummary(s);
      setProgressOverTime(p);
      setTeamComparison(t ?? []);
      // Handle both paginated and plain array responses
      const goalList = g ? (Array.isArray(g) ? g : g.data ?? []) : [];
      setObjectives(goalList);
      setLoading(false);
    },
    [orgId],
  );

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  // ── Drill-down drawer ────────────────────────────────────────────────────

  const openDrawer = useCallback(
    async (id: string) => {
      setSelectedObjectiveId(id);
      setDrawerData(null);
      setDrawerLoading(true);
      const data = await fetchJson<ObjectiveDetail>(
        `/api/organizations/${orgId}/reporting/objective/${id}`,
      );
      setDrawerData(data);
      setDrawerLoading(false);
    },
    [orgId],
  );

  const closeDrawer = () => {
    setSelectedObjectiveId(null);
    setDrawerData(null);
  };

  // ── Filter handlers ──────────────────────────────────────────────────────

  function applyPreset(idx: number) {
    setActivePreset(idx);
    setFilters((f) => ({ ...f, ...PRESETS[idx].getValue() }));
  }

  function setTeam(teamId: string | null) {
    setFilters((f) => ({ ...f, teamId }));
  }

  // ── Derived KPIs ─────────────────────────────────────────────────────────

  const atRiskCount = teamComparison.reduce((n, t) => n + t.atRiskObjectivesCount, 0);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#fafafa", margin: 0 }}>Reporting</h1>
        <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
          OKR progress and team health for{" "}
          <span style={{ color: "#a1a1aa" }}>
            {filters.from} → {filters.to}
          </span>
        </p>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {/* Timeframe presets */}
        <div style={{ display: "flex", gap: 4 }}>
          {PRESETS.map((preset, idx) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(idx)}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border: "1px solid",
                borderColor: activePreset === idx ? "#6366f1" : "#27272a",
                background: activePreset === idx ? "#312e81" : "transparent",
                color: activePreset === idx ? "#818cf8" : "#71717a",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Team selector */}
        {teams.length > 0 && (
          <select
            value={filters.teamId ?? ""}
            onChange={(e) => setTeam(e.target.value || null)}
            style={{
              padding: "5px 10px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid #27272a",
              background: "#18181b",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ color: "#71717a", fontSize: 14, paddingTop: 48, textAlign: "center" }}>
          Loading…
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <KpiCard
              label="Total Objectives"
              value={String(summary?.totalObjectives ?? 0)}
              sub="in period"
            />
            <KpiCard
              label="Completion Rate"
              value={`${summary?.overallObjectiveCompletionPercent ?? 0}%`}
              sub="objectives completed"
              accent="#22c55e"
            />
            <KpiCard
              label="Avg KR Progress"
              value={`${summary?.averageKeyResultProgressPercent ?? 0}%`}
              sub="active key results"
              accent="#6366f1"
            />
            <KpiCard
              label="At Risk"
              value={String(atRiskCount)}
              sub="last check-in RED / YELLOW"
              accent={atRiskCount > 0 ? "#f59e0b" : undefined}
            />
          </div>

          {/* Charts row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Status distribution */}
            <Card title="Objectives by Status">
              {summary ? (
                <ObjectiveStatusChart
                  data={summary.objectiveCountsByStatus}
                  total={summary.totalObjectives}
                />
              ) : (
                <Empty />
              )}
            </Card>

            {/* Progress over time */}
            <Card title="KR Progress Over Time" subtitle="Avg % completion per week">
              {progressOverTime && progressOverTime.buckets.length > 0 ? (
                <ProgressOverTimeChart data={progressOverTime} />
              ) : (
                <Empty message="No check-ins in this period" />
              )}
            </Card>
          </div>

          {/* Team comparison */}
          {teamComparison.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Card title="Team Comparison" subtitle="Active objectives and KR health by team">
                <TeamComparisonChart
                  data={teamComparison}
                  onTeamClick={(teamId) => setTeam(teamId === filters.teamId ? null : teamId)}
                  activeTeamId={filters.teamId}
                />
              </Card>
            </div>
          )}

          {/* Objectives list */}
          {objectives.length > 0 && (
            <Card
              title="Objectives"
              subtitle="Click any row to see key results and check-in history"
            >
              <div style={{ marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #27272a" }}>
                      <Th>Title</Th>
                      <Th>Team</Th>
                      <Th>Status</Th>
                      <Th>Progress</Th>
                      <Th>Due</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {objectives.map((obj) => {
                      const pct =
                        obj.targetValue && obj.targetValue > 0
                          ? Math.min(Math.round((obj.currentValue / obj.targetValue) * 100), 100)
                          : null;
                      const isSelected = obj.id === selectedObjectiveId;

                      return (
                        <tr
                          key={obj.id}
                          onClick={() => openDrawer(obj.id)}
                          style={{
                            borderBottom: "1px solid #1c1c1e",
                            cursor: "pointer",
                            background: isSelected ? "#1e1b4b" : "transparent",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "#18181b";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? "#1e1b4b" : "transparent";
                          }}
                        >
                          <td style={{ padding: "10px 8px", color: "#fafafa", maxWidth: 300 }}>
                            {obj.title}
                          </td>
                          <td style={{ padding: "10px 8px", color: "#71717a" }}>
                            {obj.team?.name ?? <span style={{ color: "#3f3f46" }}>—</span>}
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <StatusBadge status={obj.status} />
                          </td>
                          <td style={{ padding: "10px 8px", minWidth: 120 }}>
                            {pct !== null ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div
                                  style={{
                                    flex: 1,
                                    height: 5,
                                    background: "#27272a",
                                    borderRadius: 3,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: "100%",
                                      background: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444",
                                      borderRadius: 3,
                                    }}
                                  />
                                </div>
                                <span style={{ color: "#a1a1aa", fontSize: 11, width: 32 }}>
                                  {pct}%
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: "#3f3f46" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "10px 8px", color: "#71717a", whiteSpace: "nowrap" }}>
                            {obj.dueDate ? obj.dueDate.slice(0, 10) : <span style={{ color: "#3f3f46" }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Drill-down drawer */}
      {selectedObjectiveId && (
        <ObjectiveDetailDrawer
          data={drawerData}
          loading={drawerLoading}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}

// ── Small shared UI pieces ───────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 10,
        padding: "16px 20px",
      }}
    >
      <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ?? "#fafafa", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#52525b", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 10,
        padding: "20px 20px 16px",
      }}
    >
      <div style={{ marginBottom: subtitle ? 2 : 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fafafa" }}>{title}</span>
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: "#52525b", marginBottom: 16 }}>{subtitle}</div>
      )}
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "8px 8px 10px",
        textAlign: "left",
        fontSize: 11,
        color: "#52525b",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:    { label: "Active",    color: "#818cf8", bg: "#1e1b4b" },
    COMPLETED: { label: "Completed", color: "#22c55e", bg: "#14532d" },
    DRAFT:     { label: "Draft",     color: "#71717a", bg: "#27272a" },
    CANCELLED: { label: "Cancelled", color: "#ef4444", bg: "#450a0a" },
    ARCHIVED:  { label: "Archived",  color: "#52525b", bg: "#1c1c1e" },
  };
  const c = config[status] ?? { label: status, color: "#71717a", bg: "#27272a" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: c.color,
        background: c.bg,
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {c.label}
    </span>
  );
}

function Empty({ message = "No data" }: { message?: string }) {
  return (
    <div
      style={{
        height: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#3f3f46",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}
