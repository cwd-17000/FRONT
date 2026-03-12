import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import AddKeyResultForm from "./AddKeyResultForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

export default async function AddKeyResultPage({
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

  const [goalRes, membersRes] = await Promise.all([
    fetch(`${base}/goals/${id}`, { headers, cache: "no-store" }),
    fetch(`${base}/members`, { headers, cache: "no-store" }),
  ]);

  if (goalRes.status === 404) notFound();
  if (!goalRes.ok) redirect("/dashboard/goals");

  const goal = await goalRes.json();

  if (goal.type !== "OBJECTIVE" || goal.status !== "ACTIVE") {
    redirect(`/dashboard/goals/${id}`);
  }

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
    <AddKeyResultForm
      activeOrgId={user.activeOrgId}
      parentGoalId={id}
      parentGoalTitle={goal.title}
      parentGoalTimeframe={goal.timeframe}
      members={members}
    />
  );
}
