// app/dashboard/initiatives/page.tsx
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

interface Initiative {
  id: string;
  name: string;
  description?: string;
  status: string;
  goalName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "#6b7280",
  active: "#16a34a",
  paused: "#d97706",
  completed: "#2563eb",
  archived: "#9ca3af",
};

export default async function InitiativesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/initiatives`,
    {
      headers: { cookie: `access_token=${token.value}` },
      cache: "no-store",
    }
  );

  const initiatives: Initiative[] = res.ok ? await res.json() : [];

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Initiatives</h1>
        <Link href="/dashboard/initiatives/new">
          <button style={{ padding: "10px 20px" }}>+ New Initiative</button>
        </Link>
      </div>

      {initiatives.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
          <p>No initiatives yet. Create your first initiative to get started.</p>
          <Link href="/dashboard/initiatives/new">
            <button style={{ marginTop: 16, padding: "10px 24px" }}>Create Initiative</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {initiatives.map((initiative) => (
            <div key={initiative.id} style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}>
              <div>
                <h3 style={{ margin: 0 }}>{initiative.name}</h3>
                {initiative.description && (
                  <p style={{ color: "#666", margin: "4px 0 0", fontSize: 14 }}>
                    {initiative.description}
                  </p>
                )}
                {initiative.goalName && (
                  <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
                    Goal: {initiative.goalName}
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
              }}>
                {initiative.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
