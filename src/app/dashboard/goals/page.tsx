import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import GoalsList from "./GoalsList";
import UpcomingPanel, { type UpcomingMilestone, type UpcomingCadence } from "./UpcomingPanel";
import { Button } from "@/components/ui/button";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      sub: string;
      activeOrgId: string | null;
    };
  } catch {
    return null;
  }
}

interface GoalItem {
  id: string;
  title: string;
  type: string;
  status: string;
}

interface RitualItem {
  id: string;
  name: string;
  recurrence: string;
  nextOccurrence?: string;
  goal?: { id: string; title: string; type?: string };
  checkIns?: { occurredAt: string }[];
}

interface MilestoneItem {
  id: string;
  title: string;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
}

function getPrevOccurrence(recurrence: string, nextOcc: Date): Date | null {
  switch (recurrence) {
    case "WEEKLY":
      return new Date(nextOcc.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "BIWEEKLY":
      return new Date(nextOcc.getTime() - 14 * 24 * 60 * 60 * 1000);
    case "MONTHLY": {
      const d = new Date(nextOcc);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "QUARTERLY": {
      const d = new Date(nextOcc);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    default:
      return null;
  }
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "archived" ? "archived" : "active";

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals`;
  const orgBase = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  const goalsUrl =
    activeTab === "archived"
      ? `${base}?status=ARCHIVED&limit=100`
      : `${base}?limit=100`;

  const fetchList = [
    fetch(goalsUrl, { headers, cache: "no-store" }),
    fetch(`${base}/dashboard`, { headers, cache: "no-store" }),
    fetch(`${orgBase}/teams`, { headers, cache: "no-store" }),
  ];

  // Only fetch rituals/milestones for the active tab
  if (activeTab === "active") {
    fetchList.push(fetch(`${orgBase}/rituals`, { headers, cache: "no-store" }));
  }

  const [goalsRes, dashRes, teamsRes, ritualsRes] = await Promise.all(fetchList);

  const goalsData = goalsRes.ok ? await goalsRes.json() : { items: [] };
  const goals = goalsData.items ?? [];
  const dashboard = dashRes.ok ? await dashRes.json() : null;
  const teams: { id: string; name: string }[] = teamsRes.ok
    ? (await teamsRes.json()).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))
    : [];
  const rituals: RitualItem[] = ritualsRes?.ok ? await ritualsRes.json() : [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let nextMilestone: UpcomingMilestone | null = null;
  let pastWeekMilestones: UpcomingMilestone[] = [];

  if (activeTab === "active") {
    // Fetch milestones for active objectives in parallel
    const activeObjectives: GoalItem[] = (goals as GoalItem[]).filter(
      (g) => g.type === "OBJECTIVE" && g.status === "ACTIVE"
    );
    const milestoneResponses = await Promise.all(
      activeObjectives.map((g) =>
        fetch(`${base}/${g.id}/milestones`, { headers, cache: "no-store" })
      )
    );
    const allMilestones: UpcomingMilestone[] = (
      await Promise.all(
        milestoneResponses.map(async (res, i) => {
          if (!res.ok) return [];
          const data: MilestoneItem[] = await res.json();
          const goal = activeObjectives[i];
          return data.map((m) => ({ ...m, goalId: goal.id, goalTitle: goal.title }));
        })
      )
    ).flat();

    nextMilestone =
      allMilestones
        .filter(
          (m) =>
            new Date(m.dueDate) > now &&
            m.status !== "COMPLETED" &&
            m.status !== "MISSED"
        )
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;

    pastWeekMilestones = allMilestones
      .filter((m) => {
        const due = new Date(m.dueDate);
        return due >= sevenDaysAgo && due <= now;
      })
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }

  // Next upcoming cadence (soonest future nextOccurrence)
  const upcomingCadences = rituals
    .filter((r) => r.nextOccurrence)
    .map((r) => {
      const next = new Date(r.nextOccurrence!);
      if (next > now) {
        return {
          id: r.id,
          name: r.name,
          occurrenceDate: r.nextOccurrence!,
          goalId: r.goal?.id,
          goalTitle: r.goal?.title,
          goalType: r.goal?.type,
          _ms: next.getTime(),
        };
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a._ms - b._ms);

  const nextCadenceRaw = upcomingCadences[0];
  const nextCadence: UpcomingCadence | null = nextCadenceRaw
    ? {
        id: nextCadenceRaw.id,
        name: nextCadenceRaw.name,
        occurrenceDate: nextCadenceRaw.occurrenceDate,
        goalId: nextCadenceRaw.goalId,
        goalTitle: nextCadenceRaw.goalTitle,
        goalType: nextCadenceRaw.goalType,
      }
    : null;

  // Past week cadences (previous occurrence within last 7 days)
  const pastWeekCadences: UpcomingCadence[] = rituals
    .filter((r) => r.nextOccurrence)
    .flatMap((r) => {
      const next = new Date(r.nextOccurrence!);
      const prev = getPrevOccurrence(r.recurrence, next);
      if (prev && prev >= sevenDaysAgo && prev <= now) {
        const lastCheckIn = r.checkIns?.[0];
        const hasRecentCheckIn = lastCheckIn
          ? new Date(lastCheckIn.occurredAt) >= prev
          : false;
        return [
          {
            id: r.id,
            name: r.name,
            occurrenceDate: prev.toISOString(),
            goalId: r.goal?.id,
            goalTitle: r.goal?.title,
            goalType: r.goal?.type,
            hasRecentCheckIn,
          },
        ];
      }
      return [];
    });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Goals</h1>
          <p className="mt-1 text-sm text-[#71717a]">
            Drive culture and revenue growth across your organization
          </p>
        </div>
        {activeTab === "active" && (
          <Link href="/dashboard/goals/new">
            <Button className="gap-1.5 shrink-0">
              <Plus size={15} />
              New Goal
            </Button>
          </Link>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#27272a]">
        <Link
          href="/dashboard/goals"
          className={[
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150",
            activeTab === "active"
              ? "border-[#6366f1] text-[#fafafa]"
              : "border-transparent text-[#71717a] hover:text-[#a1a1aa]",
          ].join(" ")}
        >
          Active
        </Link>
        <Link
          href="/dashboard/goals?tab=archived"
          className={[
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 flex items-center gap-1.5",
            activeTab === "archived"
              ? "border-[#f59e0b] text-[#fbbf24]"
              : "border-transparent text-[#71717a] hover:text-[#a1a1aa]",
          ].join(" ")}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: activeTab === "archived" ? "#f59e0b" : "#52525b" }}
          />
          Archived
        </Link>
      </div>

      {activeTab === "active" && (
        <UpcomingPanel
          orgId={user.activeOrgId!}
          nextMilestone={nextMilestone}
          nextCadence={nextCadence}
          pastWeekMilestones={pastWeekMilestones}
          pastWeekCadences={pastWeekCadences}
        />
      )}

      <GoalsList goals={goals} dashboard={activeTab === "active" ? dashboard : null} teams={teams} archived={activeTab === "archived"} />
    </div>
  );
}
