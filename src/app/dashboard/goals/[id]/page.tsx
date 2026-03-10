import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      activeOrgId: string | null;
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

interface Initiative {
  id: string;
  name: string;
  description?: string;
  status: string;
  goalId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "#6b7280",
  active: "#16a34a",
  paused: "#d97706",
  completed: "#2563eb",
  archived: "#9ca3af",
};

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
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  const [goalRes, initiativesRes] = await Promise.all([
    fetch(`${base}/goals/${id}`, { headers, cache: "no-store" }),
    fetch(`${base}/initiatives`, { headers, cache: "no-store" }),
  ]);

  if (goalRes.status === 404) notFound();
  if (!goalRes.ok) redirect("/dashboard/goals");

  const goal: Goal = await goalRes.json();
  const allInitiatives: Initiative[] = initiativesRes.ok ? await initiativesRes.json() : [];
  const initiatives = allInitiatives.filter((i) => i.goalId === id);

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>{goal.name}</h1>
          {goal.description && (
            <p style={{ color: "#666", marginTop: 8, fontSize: 15 }}>{goal.description}</p>
          )}
          {goal.targetMetric && (
            <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
              Target: {goal.targetValue} {goal.targetMetric}
            </p>
          )}
        </div>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: 12,
          background: "#f3f4f6",
          color: STATUS_COLORS[goal.status] ?? "#333",
          textTransform: "capitalize",
          whiteSpace: "nowrap",
          marginTop: 4,
        }}>
          {goal.status}
        </span>
      </div>

      {/* Initiatives section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Initiatives</h2>
          <Link href={`/dashboard/initiatives/new?goalId=${id}`}>
            <button style={{ padding: "8px 18px", fontSize: 14 }}>+ Add Initiative</button>
          </Link>
        </div>

        {initiatives.length === 0 ? (
          <div style={{ padding: "32px 0", color: "#666", fontSize: 14 }}>
            No initiatives linked to this goal yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {initiatives.map((initiative) => (
              <div key={initiative.id} style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15 }}>{initiative.name}</h3>
                  {initiative.description && (
                    <p style={{ color: "#666", margin: "4px 0 0", fontSize: 13 }}>
                      {initiative.description}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: "#f3f4f6",
                  color: STATUS_COLORS[initiative.status] ?? "#333",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap",
                }}>
                  {initiative.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard/goals">← Back to Goals</Link>
      </div>
    </div>
  );
}
