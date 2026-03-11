import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      sub: string;
      activeOrgId: string | null;
      activeOrgRole: string | null;
    };
  } catch {
    return null;
  }
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  status: string;
  timeframe: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  confidenceScore: number;
  owner: { id: string; firstName?: string; lastName?: string };
  checkIns: { statusColor: string; createdAt: string }[];
  _count: { checkIns: number; childGoals: number };
}

interface OrgDashboard {
  activeGoals: number;
  avgConfidenceScore: number;
  ragCounts: { RED: number; YELLOW: number; GREEN: number };
  byCategory: Record<string, number>;
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

function daysSinceLastCheckIn(checkIns: Goal["checkIns"]): number | null {
  if (!checkIns.length) return null;
  const last = new Date(checkIns[0].createdAt);
  return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
}

function GoalCard({ goal }: { goal: Goal }) {
  const progress =
    goal.targetValue && goal.targetValue > 0
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;
  const days = daysSinceLastCheckIn(goal.checkIns);
  const isDue = days === null || days >= 7;
  const lastRag = goal.checkIns[0]?.statusColor;

  return (
    <Link
      href={`/dashboard/goals/${goal.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "18px 20px",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          cursor: "pointer",
          transition: "box-shadow 0.15s",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: CATEGORY_COLORS[goal.category] + "20",
                  color: CATEGORY_COLORS[goal.category],
                }}
              >
                {CATEGORY_LABELS[goal.category] ?? goal.category}
              </span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                {TYPE_LABELS[goal.type] ?? goal.type}
              </span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                · {TIMEFRAME_LABELS[goal.timeframe] ?? goal.timeframe}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{goal.title}</h3>
            {goal.description && (
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>{goal.description}</p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            {lastRag && (
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: lastRag === "GREEN" ? "#10b981" : lastRag === "YELLOW" ? "#f59e0b" : "#ef4444",
                  display: "inline-block",
                }}
                title={`Last check-in: ${lastRag}`}
              />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: confidenceColor(goal.confidenceScore),
              }}
            >
              {goal.confidenceScore}%
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>confidence</span>
          </div>
        </div>

        {/* Progress bar */}
        {goal.targetValue !== undefined && goal.targetValue > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              <span>
                {goal.currentValue}{goal.unit ? ` ${goal.unit}` : ""} / {goal.targetValue}{goal.unit ? ` ${goal.unit}` : ""}
              </span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: confidenceColor(goal.confidenceScore),
                  borderRadius: 99,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {goal.owner.firstName} {goal.owner.lastName}
            {goal._count.childGoals > 0 && ` · ${goal._count.childGoals} sub-goal${goal._count.childGoals !== 1 ? "s" : ""}`}
          </span>
          {isDue && goal.status === "ACTIVE" && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 99,
                background: "#fef3c7",
                color: "#d97706",
              }}
            >
              Due for check-in
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function GoalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals`;

  const [goalsRes, dashRes] = await Promise.all([
    fetch(`${base}?limit=50`, { headers, cache: "no-store" }),
    fetch(`${base}/dashboard`, { headers, cache: "no-store" }),
  ]);

  const goalsData = goalsRes.ok ? await goalsRes.json() : { items: [] };
  const goals: Goal[] = goalsData.items ?? [];
  const dashboard: OrgDashboard | null = dashRes.ok ? await dashRes.json() : null;

  const ragTotal = dashboard
    ? dashboard.ragCounts.RED + dashboard.ragCounts.YELLOW + dashboard.ragCounts.GREEN
    : 0;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Goals</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>
            Drive culture and revenue growth across your organization
          </p>
        </div>
        <Link href="/dashboard/goals/new">
          <button
            style={{
              padding: "10px 20px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Goal
          </button>
        </Link>
      </div>

      {/* Org Health Dashboard */}
      {dashboard && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{dashboard.activeGoals}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Active Goals</div>
          </div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: confidenceColor(dashboard.avgConfidenceScore) }}>
              {dashboard.avgConfidenceScore}%
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Avg Confidence</div>
          </div>
          {ragTotal > 0 && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>{dashboard.ragCounts.RED}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Off Track</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{dashboard.ragCounts.YELLOW}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>At Risk</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{dashboard.ragCounts.GREEN}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>On Track</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Last 30 days</div>
            </div>
          )}
          {Object.keys(dashboard.byCategory).length > 0 && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>By Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(dashboard.byCategory).map(([cat, count]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: CATEGORY_COLORS[cat] ?? "#6b7280" }}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#6b7280",
            border: "2px dashed #e5e7eb",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 16, marginBottom: 16 }}>No goals yet. Set your first goal to drive alignment across the org.</p>
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
              Create Your First Goal
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard" style={{ fontSize: 14, color: "#6b7280" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
