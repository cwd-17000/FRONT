import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NewRitualForm } from "./NewRitualForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
}

export default async function NewRitualPage({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  // Load members for participant picker and goals for linking
  const [membersRes, goalsRes] = await Promise.all([
    fetch(`${base}/members`, { headers, cache: "no-store" }),
    fetch(`${base}/goals?limit=50`, { headers, cache: "no-store" }),
  ]);
  const members = membersRes.ok ? await membersRes.json() : [];
  const goalsData = goalsRes.ok ? await goalsRes.json() : { data: [] };
  const goals = goalsData.data ?? [];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Schedule a Ritual</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>
        Set up a recurring meeting or check-in for your team.
      </p>
      <NewRitualForm
        orgId={user.activeOrgId}
        members={members}
        goals={goals}
        defaultGoalId={sp.goalId}
      />
    </div>
  );
}
