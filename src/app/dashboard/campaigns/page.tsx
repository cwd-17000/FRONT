// app/dashboard/campaigns/page.tsx
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

interface Campaign {
  id: string;
  name: string;
  status: string;
  initiativeName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "#6b7280",
  active: "#16a34a",
  paused: "#d97706",
  completed: "#2563eb",
  archived: "#9ca3af",
};

export default async function CampaignsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/campaigns`,
    {
      headers: { cookie: `access_token=${token.value}` },
      cache: "no-store",
    }
  );

  const campaigns: Campaign[] = res.ok ? await res.json() : [];

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  const draftCounts: Record<string, number> = {};
  await Promise.all(
    campaigns.map(async (campaign) => {
      try {
        const r = await fetch(`${base}/campaigns/${campaign.id}/drafts`, { headers, cache: "no-store" });
        const drafts = r.ok ? await r.json() : [];
        draftCounts[campaign.id] = Array.isArray(drafts) ? drafts.length : 0;
      } catch {
        draftCounts[campaign.id] = 0;
      }
    })
  );

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Campaigns</h1>
        <Link href="/dashboard/campaigns/new">
          <button style={{ padding: "10px 20px" }}>+ New Campaign</button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
          <p>No campaigns yet. Create your first campaign to get started.</p>
          <Link href="/dashboard/campaigns/new">
            <button style={{ marginTop: 16, padding: "10px 24px" }}>Create Campaign</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`} style={{ textDecoration: "none", color: "inherit" }}>
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
                  <h3 style={{ margin: 0 }}>{campaign.name}</h3>
                  {campaign.initiativeName && (
                    <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
                      Initiative: {campaign.initiativeName}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                    {draftCounts[campaign.id] === 1 ? "1 draft" : `${draftCounts[campaign.id] ?? 0} drafts`}
                  </p>
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: "#f3f4f6",
                  color: STATUS_COLORS[campaign.status] ?? "#333",
                  textTransform: "capitalize",
                }}>
                  {campaign.status}
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
