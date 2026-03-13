import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditGoalForm } from "./EditGoalForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  status: string;
  visibility: string;
  timeframe: string;
  startDate?: string;
  dueDate?: string;
  targetValue?: number;
  unit?: string;
  confidenceScore: number;
  parentGoalId?: string | null;
  teamId?: string | null;
  ownerId: string;
  owner: { id: string; firstName?: string; lastName?: string; email: string };
  parentGoal?: { id: string; title: string; type: string } | null;
}

export default async function EditGoalPage({
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
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  const goalRes = await fetch(`${base}/goals/${id}`, { headers, cache: "no-store" });
  if (goalRes.status === 404) notFound();
  if (!goalRes.ok) redirect("/dashboard/goals");

  const goal: Goal = await goalRes.json();

  const [teamsRes, membersRes, objectivesRes] = await Promise.all([
    fetch(`${base}/teams`, { headers, cache: "no-store" }),
    fetch(`${base}/members`, { headers, cache: "no-store" }),
    fetch(`${base}/goals?type=OBJECTIVE&limit=100`, { headers, cache: "no-store" }),
  ]);

  const teams: { id: string; name: string }[] = teamsRes.ok
    ? (await teamsRes.json()).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))
    : [];

  const membersRaw = membersRes.ok ? await membersRes.json() : [];
  const members: { id: string; firstName?: string; lastName?: string; email: string }[] =
    (membersRaw as { user: { id: string; firstName?: string; lastName?: string; email: string } }[])
      .map((m) => m.user)
      .filter(Boolean);

  const objectivesData = objectivesRes.ok ? await objectivesRes.json() : { items: [] };
  const objectives: { id: string; title: string }[] = (objectivesData.items ?? []).filter(
    (g: { id: string; title: string }) => g.id !== id
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/goals/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#fafafa] transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="text-xl font-bold text-[#fafafa]">Edit Goal</h1>
      </div>

      <EditGoalForm
        goal={goal}
        orgId={user.activeOrgId!}
        teams={teams}
        members={members}
        objectives={objectives}
      />
    </div>
  );
}
