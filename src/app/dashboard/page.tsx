// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import OrgSwitcher from "./OrgSwitcher";

async function getMe(token: string) {
  const res = await fetch(`${process.env.API_BASE_URL}/auth/me`, {
    headers: { cookie: `access_token=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
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
  const token = cookieStore.get("access_token");

  if (!token) redirect("/login");

  const [user, orgs] = await Promise.all([
    getMe(token.value),
    getMyOrgs(token.value),
  ]);

  if (!user) redirect("/login");

  // If JWT has no activeOrgId, user skipped onboarding somehow
  if (!user.activeOrgId) redirect("/onboarding");

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
      {/* OrgSwitcher shows active org and lets user switch if they belong to multiple */}
      <OrgSwitcher orgs={orgs} activeOrgId={user.activeOrgId} />

      <hr style={{ margin: "24px 0" }} />

      <h2>Quick Actions</h2>
      <div style={{ display: "flex", gap: 12 }}>
        <a href="/dashboard/members">
          <button>Manage Members</button>
        </a>
        <a href="/dashboard/projects">
          <button>Projects</button>
        </a>
      </div>
    </div>
  );
}
