import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import GoalsList from "./GoalsList";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      sub: string;
      activeOrgId: string | null;
    };
  } catch {
    return null;
  }
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
    // fetch all goals (Objectives + Key Results) in one request
    fetch(`${base}?limit=100`, { headers, cache: "no-store" }),
    fetch(`${base}/dashboard`, { headers, cache: "no-store" }),
  ]);

  const goalsData = goalsRes.ok ? await goalsRes.json() : { items: [] };
  const goals = goalsData.items ?? [];
  const dashboard = dashRes.ok ? await dashRes.json() : null;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
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

      <GoalsList goals={goals} dashboard={dashboard} />

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard" style={{ fontSize: 14, color: "#6b7280" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
