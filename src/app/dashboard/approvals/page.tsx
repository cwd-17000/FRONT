// app/dashboard/approvals/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

interface Campaign {
  id: string;
  name: string;
}

interface Draft {
  id: string;
  name: string;
  approvalStatus: "pending" | "approved" | "rejected";
  // attached after fetch
  campaignName: string;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending Review", color: "#d97706" },
  approved: { label: "Approved",       color: "#16a34a" },
  rejected: { label: "Rejected",       color: "#dc2626" },
};

const SECTIONS: Array<{ key: Draft["approvalStatus"]; heading: string }> = [
  { key: "pending",  heading: "Pending Review" },
  { key: "approved", heading: "Approved" },
  { key: "rejected", heading: "Rejected" },
];

export default async function ApprovalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  const campaignsRes = await fetch(`${base}/campaigns`, { headers, cache: "no-store" });
  const campaigns: Campaign[] = campaignsRes.ok ? await campaignsRes.json() : [];

  // Fetch all campaign drafts in parallel
  const draftResults = await Promise.all(
    campaigns.map((campaign) =>
      fetch(`${base}/campaigns/${campaign.id}/drafts`, { headers, cache: "no-store" })
        .then((r): Promise<Omit<Draft, "campaignName">[]> => r.ok ? r.json() : Promise.resolve([]))
        .catch(() => [] as Omit<Draft, "campaignName">[])
    )
  );

  // Flatten and attach campaign name to each draft
  const drafts: Draft[] = draftResults.flatMap((campaignDrafts, i) =>
    campaignDrafts.map((draft) => ({ ...draft, campaignName: campaigns[i].name }))
  );

  const grouped: Record<Draft["approvalStatus"], Draft[]> = {
    pending:  drafts.filter((d) => d.approvalStatus === "pending"),
    approved: drafts.filter((d) => d.approvalStatus === "approved"),
    rejected: drafts.filter((d) => d.approvalStatus === "rejected"),
  };

  const totalDrafts = drafts.length;

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Approvals</h1>
        {totalDrafts > 0 && (
          <span style={{ fontSize: 13, color: "#888" }}>
            {grouped.pending.length} pending · {totalDrafts} total
          </span>
        )}
      </div>

      {totalDrafts === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
          <p>No drafts found. Drafts will appear here once campaigns have content to review.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {SECTIONS.map(({ key, heading }) => {
            const sectionDrafts = grouped[key];
            if (sectionDrafts.length === 0) return null;
            const badge = STATUS_BADGE[key];

            return (
              <div key={key}>
                <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: badge.color }}>
                  {heading} ({sectionDrafts.length})
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {sectionDrafts.map((draft) => (
                    <div key={draft.id} style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15 }}>{draft.name}</h3>
                        <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
                          Campaign: {draft.campaignName}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: "#f3f4f6",
                        color: badge.color,
                        whiteSpace: "nowrap",
                      }}>
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
