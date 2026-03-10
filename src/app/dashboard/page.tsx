// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import OrgSwitcher from "./OrgSwitcher";

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

async function getMyOrgs(token: string) {
  const res = await fetch(`${process.env.API_BASE_URL}/organizations`, {
    headers: { cookie: `access_token=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("access_token");

  if (!tokenCookie) redirect("/login");

  const user = decodeJwtPayload(tokenCookie.value);

  if (!user) redirect("/login");
  if (!user.activeOrgId) redirect("/onboarding");

  const orgs = await getMyOrgs(tokenCookie.value);

  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;
  const headers = { cookie: `access_token=${tokenCookie.value}` };

  const [goalsRes, initiativesRes, campaignsRes] = await Promise.all([
    fetch(`${base}/goals`, { headers, cache: "no-store" }),
    fetch(`${base}/initiatives`, { headers, cache: "no-store" }),
    fetch(`${base}/campaigns`, { headers, cache: "no-store" }),
  ]);

  const [goals, initiatives, campaigns] = await Promise.all([
    goalsRes.ok ? goalsRes.json() : [],
    initiativesRes.ok ? initiativesRes.json() : [],
    campaignsRes.ok ? campaignsRes.json() : [],
  ]);

  // Fetch drafts for every campaign in parallel to compute pending count
  const draftResults = await Promise.all(
    (campaigns as { id: string }[]).map((c) =>
      fetch(`${base}/campaigns/${c.id}/drafts`, { headers, cache: "no-store" })
        .then((r) => r.ok ? r.json() : [])
        .catch(() => [])
    )
  );
  const allDrafts = (draftResults as { approvalStatus: string }[][]).flat();
  const pendingCount: number = allDrafts.filter((d) => d.approvalStatus === "pending").length;

  const goalCount: number = goals.length;
  const initiativeCount: number = initiatives.length;
  const campaignCount: number = campaigns.length;

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Dashboard</h1>
        <LogoutButton />
      </div>

      <p>Welcome, <strong>{user.email}</strong></p>
      <p>Role: <strong>{user.activeOrgRole}</strong></p>

      <hr style={{ margin: "24px 0" }} />

      <h2>Your Organization</h2>
      <OrgSwitcher orgs={orgs} activeOrgId={user.activeOrgId} />

      <hr style={{ margin: "24px 0" }} />

      <h2>Quick Actions</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
        {goalCount} {goalCount === 1 ? "Goal" : "Goals"} &middot;{" "}
        {initiativeCount} {initiativeCount === 1 ? "Initiative" : "Initiatives"} &middot;{" "}
        {campaignCount} {campaignCount === 1 ? "Campaign" : "Campaigns"} &middot;{" "}
        {pendingCount} {pendingCount === 1 ? "Pending Approval" : "Pending Approvals"}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/dashboard/goals">
          <button>Goals</button>
        </Link>
        <Link href="/dashboard/initiatives">
          <button>Initiatives</button>
        </Link>
        <Link href="/dashboard/campaigns">
          <button>Campaigns</button>
        </Link>
        <Link href="/dashboard/calendar">
          <button>Calendar</button>
        </Link>
        <Link href="/dashboard/approvals">
          <button>Approvals</button>
        </Link>
        <Link href="/dashboard/members">
          <button>Manage Members</button>
        </Link>
      </div>
    </div>
  );
}
