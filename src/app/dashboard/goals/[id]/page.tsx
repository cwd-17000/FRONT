import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MilestonesPanel } from "./MilestonesPanel";
import { LeadMetricsPanel } from "./LeadMetricsPanel";
import { ExternalCampaignsPanel } from "./ExternalCampaignsPanel";
import { RitualsPanel } from "./RitualsPanel";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
}

interface CheckIn {
  id: string;
  progress: number;
  confidenceScore: number;
  statusColor: "RED" | "YELLOW" | "GREEN";
  note?: string;
  createdAt: string;
  author: { id: string; firstName?: string; lastName?: string };
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName?: string; lastName?: string };
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  status: string;
  timeframe: string;
  dueDate?: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  confidenceScore: number;
  owner: { id: string; firstName?: string; lastName?: string; email: string };
  parentGoal?: { id: string; title: string; type: string; category: string };
  childGoals: {
    id: string;
    title: string;
    type: string;
    status: string;
    currentValue: number;
    targetValue?: number;
    confidenceScore: number;
    owner: { id: string; firstName?: string; lastName?: string };
  }[];
  checkIns: CheckIn[];
  comments: Comment[];
  _count: { checkIns: number; comments: number; childGoals: number };
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
const TYPE_LABELS: Record<string, string> = {
  OBJECTIVE: "Objective",
  KEY_RESULT: "Key Result",
};
const STATUS_COLORS_MAP: Record<string, string> = {
  DRAFT: "#9ca3af",
  ACTIVE: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

function confidenceColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#10b981";
}

function ragColor(c: string) {
  if (c === "GREEN") return "#10b981";
  if (c === "YELLOW") return "#f59e0b";
  return "#ef4444";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProgressChart({ checkIns, unit }: { checkIns: CheckIn[]; unit?: string }) {
  if (checkIns.length < 2) return null;
  const sorted = [...checkIns].reverse();
  const maxVal = Math.max(...sorted.map((c) => c.progress), 1);
  const W = 560;
  const H = 120;
  const pad = { top: 10, right: 16, bottom: 20, left: 40 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const xStep = iW / Math.max(sorted.length - 1, 1);

  const pts = sorted.map((c, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + iH - (c.progress / maxVal) * iH,
    c,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {[0, 0.5, 1].map((t) => {
        const y = pad.top + iH - t * iH;
        return (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + iW} y1={y} y2={y} stroke="#f3f4f6" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
              {Math.round(t * maxVal)}{unit ? unit : ""}
            </text>
          </g>
        );
      })}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={ragColor(p.c.statusColor)} stroke="#fff" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals`;

  const goalRes = await fetch(`${base}/${id}`, { headers, cache: "no-store" });
  if (goalRes.status === 404) notFound();
  if (!goalRes.ok) redirect("/dashboard/goals");

  const goal: Goal = await goalRes.json();

  // Fetch workspace data in parallel
  const extBase = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;
  const [milestonesRes, leadMetricsRes, campaignsRes, ritualsRes] = await Promise.all([
    fetch(`${extBase}/goals/${id}/milestones`, { headers, cache: "no-store" }),
    fetch(`${extBase}/goals/${id}/lead-metrics`, { headers, cache: "no-store" }),
    fetch(`${extBase}/external-campaigns/by-goal/${id}`, { headers, cache: "no-store" }),
    fetch(`${extBase}/rituals/by-goal/${id}`, { headers, cache: "no-store" }),
  ]);
  const [milestones, leadMetrics, externalCampaigns, rituals] = await Promise.all([
    milestonesRes.ok ? milestonesRes.json() : [],
    leadMetricsRes.ok ? leadMetricsRes.json() : [],
    campaignsRes.ok ? campaignsRes.json() : [],
    ritualsRes.ok ? ritualsRes.json() : [],
  ]);

  const progress =
    goal.targetValue && goal.targetValue > 0
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;

  const daysSinceCheckIn =
    goal.checkIns.length > 0
      ? Math.floor(
          (Date.now() - new Date(goal.checkIns[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

  const isDueForCheckIn =
    goal.type === "KEY_RESULT" &&
    goal.status === "ACTIVE" &&
    (daysSinceCheckIn === null || daysSinceCheckIn >= 7);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 800, margin: "0 auto" }}>
      {/* Check-in nudge banner */}
      {isDueForCheckIn && (
        <div
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            background: "#fefce8",
            border: "1px solid #fde68a",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>
            ⚠️ No check-in{daysSinceCheckIn !== null ? ` in ${daysSinceCheckIn} days` : " yet"}. Keep the team updated.
          </span>
          <Link href={`/dashboard/goals/${id}/check-in`}>
            <button
              style={{
                padding: "6px 14px",
                background: "#d97706",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Check In Now
            </button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 99,
                background: (CATEGORY_COLORS[goal.category] ?? "#6b7280") + "20",
                color: CATEGORY_COLORS[goal.category] ?? "#6b7280",
              }}
            >
              {CATEGORY_LABELS[goal.category] ?? goal.category}
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {TYPE_LABELS[goal.type] ?? goal.type}
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>· {goal.timeframe}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 99,
                background: "#f3f4f6",
                color: STATUS_COLORS_MAP[goal.status] ?? "#333",
              }}
            >
              {goal.status}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{goal.title}</h1>
          {goal.description && (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280" }}>{goal.description}</p>
          )}
        </div>

        {goal.type === "KEY_RESULT" && goal.status === "ACTIVE" && (
          <Link href={`/dashboard/goals/${id}/check-in`}>
            <button
              style={{
                padding: "9px 18px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              + Check In
            </button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Confidence</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: confidenceColor(goal.confidenceScore),
            }}
          >
            {goal.confidenceScore}%
          </div>
        </div>

        {goal.targetValue !== undefined && (
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Progress</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{progress}%</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {goal.currentValue}
              {goal.unit ? ` ${goal.unit}` : ""} / {goal.targetValue}
              {goal.unit ? ` ${goal.unit}` : ""}
            </div>
          </div>
        )}

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Owner</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {goal.owner.firstName} {goal.owner.lastName}
          </div>
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Due</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(goal.dueDate)}</div>
        </div>
      </div>

      {/* Progress bar */}
      {goal.targetValue !== undefined && goal.targetValue > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            <span>Progress toward target</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: confidenceColor(goal.confidenceScore),
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      )}

      {/* Parent goal */}
      {goal.parentGoal && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>Parent Goal</h2>
          <Link href={`/dashboard/goals/${goal.parentGoal.id}`} style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
                padding: "8px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#fff",
                fontSize: 13,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background:
                    (CATEGORY_COLORS[goal.parentGoal.category] ?? "#6b7280") + "20",
                  color: CATEGORY_COLORS[goal.parentGoal.category] ?? "#6b7280",
                  fontWeight: 600,
                }}
              >
                {TYPE_LABELS[goal.parentGoal.type] ?? goal.parentGoal.type}
              </span>
              <span style={{ fontWeight: 500, color: "#111827" }}>{goal.parentGoal.title}</span>
              <span style={{ color: "#9ca3af" }}>↗</span>
            </div>
          </Link>
        </div>
      )}

      {/* Child goals / Key Results */}
      {goal.childGoals.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
            {goal.type === "OBJECTIVE" ? "Key Results" : "Sub-goals"} ({goal.childGoals.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {goal.childGoals.map((kr) => {
              const krPct =
                kr.targetValue && kr.targetValue > 0
                  ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
                  : 0;
              return (
                <Link
                  key={kr.id}
                  href={`/dashboard/goals/${kr.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      background: "#fff",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                        {kr.title}
                      </div>
                      {kr.targetValue !== undefined && (
                        <div
                          style={{
                            height: 4,
                            background: "#f3f4f6",
                            borderRadius: 99,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${krPct}%`,
                              background: confidenceColor(kr.confidenceScore),
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: confidenceColor(kr.confidenceScore),
                        }}
                      >
                        {kr.confidenceScore}%
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        {kr.owner.firstName} {kr.owner.lastName}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress chart */}
      {goal.checkIns.length >= 2 && (
        <div
          style={{
            marginBottom: 28,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "16px 20px",
            background: "#fff",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
            Progress Over Time
          </h2>
          <ProgressChart checkIns={goal.checkIns} unit={goal.unit} />
          <div
            style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#9ca3af" }}
          >
            <span>
              ●{" "}
              <span style={{ color: "#10b981" }}>On Track</span>
            </span>
            <span>
              ●{" "}
              <span style={{ color: "#f59e0b" }}>At Risk</span>
            </span>
            <span>
              ●{" "}
              <span style={{ color: "#ef4444" }}>Off Track</span>
            </span>
          </div>
        </div>
      )}

      {/* Check-in history */}
      {goal.checkIns.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
            Check-in History ({goal._count.checkIns})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goal.checkIns.map((ci) => (
              <div
                key={ci.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderLeft: `4px solid ${ragColor(ci.statusColor)}`,
                  borderRadius: 8,
                  padding: "12px 16px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: ci.note ? 6 : 0,
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {ci.progress}
                      {goal.unit ? ` ${goal.unit}` : ""}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: confidenceColor(ci.confidenceScore),
                      }}
                    >
                      {ci.confidenceScore}% confidence
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {ci.author.firstName} {ci.author.lastName} ·{" "}
                    {formatDate(ci.createdAt)}
                  </div>
                </div>
                {ci.note && (
                  <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{ci.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
          Comments ({goal._count.comments})
        </h2>
        {goal.comments.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>No comments yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goal.comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "12px 16px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Workspace panels ─────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <MilestonesPanel
          goalId={id}
          orgId={user.activeOrgId!}
          initialData={milestones}
        />
        <LeadMetricsPanel
          goalId={id}
          orgId={user.activeOrgId!}
          initialData={leadMetrics}
        />
      </div>

      <ExternalCampaignsPanel
        goalId={id}
        orgId={user.activeOrgId!}
        initialData={externalCampaigns}
      />

      <div style={{ marginTop: 16, marginBottom: 28 }}>
        <RitualsPanel
          goalId={id}
          orgId={user.activeOrgId!}
          rituals={rituals}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <Link href="/dashboard/goals" style={{ fontSize: 14, color: "#6b7280" }}>
          ← Back to Goals
        </Link>
      </div>
    </div>
  );
}
