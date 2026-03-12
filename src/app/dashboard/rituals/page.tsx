import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
}

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

const STATUS_COLORS: Record<string, string> = {
  ON_TRACK: "#34d399",
  AT_RISK: "#fbbf24",
  OFF_TRACK: "#f87171",
};

interface Ritual {
  id: string;
  name: string;
  description?: string;
  recurrence: string;
  nextOccurrence?: string;
  participantIds: string[];
  owner: { id: string; firstName?: string; lastName?: string };
  goal?: { id: string; title: string };
  _count: { checkIns: number };
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RitualsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/rituals`,
    { headers: { cookie: `access_token=${token.value}` }, cache: "no-store" }
  );
  const rituals: Ritual[] = res.ok ? await res.json() : [];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 720, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Cadence</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
            Recurring meetings tied to goals and processes.
          </p>
        </div>
        <Link
          href="/dashboard/cadence/new"
          style={{
            padding: "9px 18px",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Schedule cadence
        </Link>
      </div>

      {rituals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            border: "1px dashed #e5e7eb",
            borderRadius: 12,
            color: "#9ca3af",
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>No cadence yet</p>
          <p style={{ fontSize: 13, margin: "0 0 20px" }}>
            Schedule your first recurring check-in — weekly growth review, monthly retro, etc.
          </p>
          <Link
            href="/dashboard/cadence/new"
            style={{
              padding: "8px 18px",
              background: "#111827",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            + Schedule cadence
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rituals.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/cadence/${r.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#fff",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{r.name}</div>
                  {r.description && (
                    <div style={{ fontSize: 13, color: "#6b7280" }}>{r.description}</div>
                  )}
                  {r.goal && (
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      → {r.goal.title}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      background: "#f3f4f6",
                      borderRadius: 4,
                    }}
                  >
                    {RECURRENCE_LABELS[r.recurrence] ?? r.recurrence}
                  </span>
                  {r.nextOccurrence && (
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      Next: {formatDate(r.nextOccurrence)}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    {r.participantIds.length} participant{r.participantIds.length !== 1 ? "s" : ""} ·{" "}
                    {r._count.checkIns} check-in{r._count.checkIns !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
