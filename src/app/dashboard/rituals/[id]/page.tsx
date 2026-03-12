import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { RitualDetailClient } from "./RitualDetailClient";

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

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Ritual {
  id: string;
  name: string;
  description?: string;
  recurrence: string;
  participantIds: string[];
  nextOccurrence?: string;
  isActive: boolean;
  owner: { id: string; firstName?: string; lastName?: string };
  goal?: { id: string; title: string };
  processFlow?: { id: string; name: string };
  checkIns: CheckIn[];
}

interface CheckIn {
  id: string;
  status: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  summary: string;
  keyUpdates?: string;
  blockers?: string;
  occurredAt: string;
  createdBy: { id: string; firstName?: string; lastName?: string };
}

export default async function RitualDetailPage({
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
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/rituals`;

  const [ritualRes, checkInsRes] = await Promise.all([
    fetch(`${base}/${id}`, { headers, cache: "no-store" }),
    fetch(`${base}/${id}/check-ins`, { headers, cache: "no-store" }),
  ]);

  if (ritualRes.status === 404) notFound();
  if (!ritualRes.ok) redirect("/dashboard/cadence");

  const ritual: Ritual = await ritualRes.json();
  const checkIns: CheckIn[] = checkInsRes.ok ? await checkInsRes.json() : [];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <Link href="/dashboard/cadence" style={{ fontSize: 13, color: "#9ca3af" }}>
          ← Cadence
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: "#f3f4f6",
                borderRadius: 4,
              }}
            >
              {RECURRENCE_LABELS[ritual.recurrence] ?? ritual.recurrence}
            </span>
            {ritual.nextOccurrence && (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                Next: {formatDate(ritual.nextOccurrence)}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{ritual.name}</h1>
          {ritual.description && (
            <p style={{ fontSize: 14, color: "#6b7280", margin: "6px 0 0" }}>
              {ritual.description}
            </p>
          )}
          {ritual.goal && (
            <div style={{ marginTop: 8 }}>
              <Link
                href={`/dashboard/goals/${ritual.goal.id}`}
                style={{ fontSize: 13, color: "#1d4ed8" }}
              >
                → {ritual.goal.title}
              </Link>
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
          <div>
            Owner: {ritual.owner.firstName} {ritual.owner.lastName}
          </div>
          <div>{ritual.participantIds.length} participant{ritual.participantIds.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Check-in form + history */}
      <RitualDetailClient
        orgId={user.activeOrgId!}
        ritualId={id}
        initialCheckIns={checkIns}
        currentUserId={user.sub}
        participantIds={ritual.participantIds}
        ownerId={ritual.owner.id}
      />

      <div style={{ marginTop: 24 }}>
        <Link href="/dashboard/cadence" style={{ fontSize: 14, color: "#6b7280" }}>
          ← Back to Cadence
        </Link>
      </div>
    </div>
  );
}
