// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
  <a href="/dashboard/goals">
    <button>Goals</button>
  </a>
  <a href="/dashboard/initiatives">
    <button>Initiatives</button>
  </a>
  <a href="/dashboard/campaigns">
    <button>Campaigns</button>
  </a>
  <a href="/dashboard/members">
    <button>Manage Members</button>
  </a>
</div>
    </div>
  );
}
