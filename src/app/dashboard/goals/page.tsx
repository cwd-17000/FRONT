// app/dashboard/goals/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      sub: string;
      email: string;
      activeOrgId: string | null;
      activeOrgRole: string | null;
    };
  } catch {
    return null;
  }
}

interface Goal {
  id: string;
  name: string;
  description?: string;
  targetMetric?: string;
  targetValue?: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "#6b7280",
  active: "#16a34a",
  paused: "#d97706",
  completed: "#2563eb",
  archived: "#9ca3af",
};

export default async function GoalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals`,
    {
      headers: { cookie: `access_token=${token.value}` },
      cache: "no-store",
    }
  );

  const goals: Goal[] = res.ok ? await res.json() : [];

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Marketing Goals</h1>
        <Link href="/dashboard/goals/new">
          <button style={{ padding: "10px 20px" }}>+ New Goal</button>
        </Link>
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
          <p>No goals yet. Create your first marketing goal to get started.</p>
          <Link href="/dashboard/goals/new">
            <button style={{ marginTop: 16, padding: "10px 24px" }}>Create Goal</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {goals.map((goal) => (
            <Link key={goal.id} href={`/dashboard/goals/${goal.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                cursor: "pointer",
              }}>
                <div>
                  <h3 style={{ margin: 0 }}>{goal.name}</h3>
                  {goal.description && (
                    <p style={{ color: "#666", margin: "4px 0 0", fontSize: 14 }}>
                      {goal.description}
                    </p>
                  )}
                  {goal.targetMetric && (
                    <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
                      Target: {goal.targetValue} {goal.targetMetric}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: "#f3f4f6",
                  color: STATUS_COLORS[goal.status] ?? "#333",
                  textTransform: "capitalize",
                }}>
                  {goal.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
