import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

type GoalSummary = {
  id: string;
  status?: string;
  demoMode?: boolean;
};

type CadenceSummary = {
  id: string;
  demoMode?: boolean;
};

function pickDemoFirst<T extends { demoMode?: boolean }>(items: T[]): T | undefined {
  return items.find((item) => item.demoMode === true) ?? items[0];
}

export default async function DemoOpenPage({
  params,
}: {
  params: Promise<{ target: string }>;
}) {
  const { target } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  if (target === "kr-details" || target === "check-in") {
    const krsRes = await fetch(`${base}/goals?type=KEY_RESULT&limit=100`, {
      headers,
      cache: "no-store",
    });
    const krData = krsRes.ok ? await krsRes.json() : { items: [] };
    const krs = (krData?.items ?? []) as GoalSummary[];

    if (target === "check-in") {
      const activeKr = pickDemoFirst(krs.filter((kr) => kr.status === "ACTIVE"));
      if (activeKr) {
        redirect(`/dashboard/goals/${activeKr.id}/check-in`);
      }
      const fallbackKr = pickDemoFirst(krs);
      if (fallbackKr) {
        redirect(`/dashboard/goals/${fallbackKr.id}`);
      }
      redirect("/dashboard/goals");
    }

    const kr = pickDemoFirst(krs);
    if (kr) {
      redirect(`/dashboard/goals/${kr.id}`);
    }
    redirect("/dashboard/goals");
  }

  if (target === "milestones") {
    const objectivesRes = await fetch(`${base}/goals?type=OBJECTIVE&limit=100`, {
      headers,
      cache: "no-store",
    });
    const objectiveData = objectivesRes.ok ? await objectivesRes.json() : { items: [] };
    const objectives = (objectiveData?.items ?? []) as GoalSummary[];
    const objective = pickDemoFirst(objectives);

    if (objective) {
      redirect(`/dashboard/goals/${objective.id}#milestones`);
    }
    redirect("/dashboard/goals");
  }

  if (target === "cadence") {
    const cadenceRes = await fetch(`${base}/rituals`, {
      headers,
      cache: "no-store",
    });
    const cadence = (cadenceRes.ok ? await cadenceRes.json() : []) as CadenceSummary[];
    const item = pickDemoFirst(cadence);

    if (item) {
      redirect(`/dashboard/cadence/${item.id}`);
    }
    redirect("/dashboard/cadence");
  }

  redirect("/dashboard");
}
