import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewCadenceForm from "./NewCadenceForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

export default async function NewCadencePage({
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

  const [membersRes, goalsRes] = await Promise.all([
    fetch(`${base}/members`, { headers, cache: "no-store" }),
    fetch(`${base}/goals?type=OBJECTIVE&limit=100`, { headers, cache: "no-store" }),
  ]);

  const rawMembers = membersRes.ok ? await membersRes.json() : [];
  const members = (rawMembers as {
    userId: string;
    user: { id: string; firstName: string | null; lastName: string | null; email: string };
  }[]).map((m) => ({
    userId: m.userId,
    name: [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email,
  }));

  const goalsData = goalsRes.ok ? await goalsRes.json() : { items: [] };
  const goals = (goalsData.items ?? goalsData.data ?? []).map((g: { id: string; title: string }) => ({
    id: g.id,
    title: g.title,
  }));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Schedule a Cadence</h1>
        <p className="mt-1 text-sm text-[#71717a]">Set up a recurring meeting or check-in for your team.</p>
      </div>

      <NewCadenceForm
        orgId={user.activeOrgId}
        members={members}
        goals={goals}
        defaultGoalId={sp.goalId}
      />
    </div>
  );
}
