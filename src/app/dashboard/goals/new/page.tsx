import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewGoalForm from "./NewGoalForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

export default async function NewGoalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  const [goalsRes, membersRes] = await Promise.all([
    fetch(`${base}/goals?limit=100`, { headers, cache: "no-store" }),
    fetch(`${base}/members`, { headers, cache: "no-store" }),
  ]);

  const goalsData = goalsRes.ok ? await goalsRes.json() : { items: [] };
  const parentGoals = (goalsData.items ?? []).map(
    (g: { id: string; title: string; type: string; timeframe: string }) => ({
      id: g.id,
      title: g.title,
      type: g.type,
      timeframe: g.timeframe,
    })
  );

  const rawMembers = membersRes.ok ? await membersRes.json() : [];
  const members = (rawMembers as {
    userId: string;
    user: { id: string; firstName: string | null; lastName: string | null; email: string };
  }[]).map((m) => ({
    userId: m.userId,
    name:
      [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") ||
      m.user.email,
  }));

  return (
    <NewGoalForm
      activeOrgId={user.activeOrgId}
      parentGoals={parentGoals}
      members={members}
    />
  );
}
