// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Target,
  ArrowRight,
  Calendar,
  GitBranch,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import OrgSwitcher from "./OrgSwitcher";
import { MilestoneStatusActions } from "@/components/goals/MilestoneStatusActions";

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

const QUICK_LINKS = [
  { label: "Goals",          href: "/dashboard/goals",           icon: Target,     desc: "Track OKRs & key results" },
  { label: "Calendar",       href: "/dashboard/calendar",        icon: Calendar,   desc: "Events & milestones" },
  { label: "Process Flows",  href: "/dashboard/process-flows",   icon: GitBranch,  desc: "Workflows & SOPs" },
  { label: "Cadence",        href: "/dashboard/cadence",         icon: RefreshCw,  desc: "Recurring cadences" },
  { label: "My Organization",href: "/dashboard/my-organization", icon: Building2,  desc: "Members, teams & org chart" },
];

interface GoalSummary {
  id: string;
  title: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
  goalId: string;
  goalTitle: string;
}

interface Cadence {
  id: string;
  name: string;
  nextOccurrence?: string;
  goal?: { id: string; title: string };
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  const goalsRes = await fetch(`${base}/goals?type=OBJECTIVE`, { headers, cache: "no-store" });
  const goals = goalsRes.ok ? asArray<GoalSummary>(await goalsRes.json()) : [];
  const goalCount = goals.length;

  const [cadenceRes, milestoneResponses] = await Promise.all([
    fetch(`${base}/rituals`, { headers, cache: "no-store" }),
    Promise.all(
      goals.map((goal) =>
        fetch(`${base}/goals/${goal.id}/milestones`, { headers, cache: "no-store" })
      )
    ),
  ]);

  const cadence: Cadence[] = cadenceRes.ok ? await cadenceRes.json() : [];

  const milestonesByGoal = await Promise.all(
    milestoneResponses.map(async (response, index) => {
      if (!response.ok) return [] as Milestone[];
      const rows = (await response.json()) as Omit<Milestone, "goalId" | "goalTitle">[];
      const goal = goals[index];
      return rows.map((row) => ({
        ...row,
        goalId: goal.id,
        goalTitle: goal.title,
      }));
    })
  );

  const milestones = milestonesByGoal.flat();

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const upcomingCadence = cadence
    .filter((item) => item.nextOccurrence && new Date(item.nextOccurrence) >= now)
    .sort((a, b) => new Date(a.nextOccurrence!).getTime() - new Date(b.nextOccurrence!).getTime())[0];

  const upcomingMilestone = milestones
    .filter((item) => item.status !== "COMPLETED" && item.status !== "MISSED" && new Date(item.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const cadencePastWeek = cadence
    .filter((item) => {
      if (!item.nextOccurrence) return false;
      const date = new Date(item.nextOccurrence);
      return date >= weekAgo && date <= now;
    })
    .sort((a, b) => new Date(b.nextOccurrence!).getTime() - new Date(a.nextOccurrence!).getTime());

  const milestonesPastWeek = milestones
    .filter((item) => {
      const due = new Date(item.dueDate);
      return due >= weekAgo && due <= now;
    })
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Overview</h1>
        <p className="mt-1 text-sm text-[#71717a]">
          Welcome back,{" "}
          <span className="text-[#a1a1aa] font-medium">{user.email}</span>
        </p>
      </div>

      {/* ── Row 1: Goals metric card ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/goals" className="group block sm:col-span-1">
          <Card hover className="h-full">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#312e81]">
                <Target size={18} className="text-[#818cf8]" />
              </div>
              <div>
                <p className="text-4xl font-bold text-[#fafafa]">{goalCount}</p>
                <p className="text-sm text-[#71717a] mt-0.5">Objectives</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#818cf8] mt-auto">
                <span>View all goals</span>
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5 duration-150" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Role badge */}
        <div className="sm:col-span-2 flex flex-col justify-center gap-2 pl-2">
          <p className="text-xs text-[#71717a] uppercase tracking-wider font-medium">Your role</p>
          <p className="text-lg font-semibold text-[#fafafa] capitalize">
            {user.activeOrgRole ?? "Member"}
          </p>
        </div>
      </div>

      {/* ── Row 2: Quick navigation ───────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-4">
          Navigate
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map(({ label, href, icon: Icon, desc }) => (
            <Link key={href} href={href} className="group block">
              <Card hover>
                <CardContent className="flex flex-col gap-2.5 p-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#27272a] group-hover:bg-[#312e81] transition-colors duration-150">
                    <Icon size={15} className="text-[#a1a1aa] group-hover:text-[#818cf8] transition-colors duration-150" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#fafafa]">{label}</p>
                    <p className="text-xs text-[#71717a] mt-0.5 leading-snug">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Row 3: Cadence + Milestone timeline ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#a1a1aa]">Next upcoming cadence</h2>
            {upcomingCadence ? (
              <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-2">
                <p className="text-sm font-medium text-[#fafafa]">{upcomingCadence.name}</p>
                <p className="text-xs text-[#71717a]">
                  {formatDateTime(upcomingCadence.nextOccurrence)}
                  {upcomingCadence.goal ? ` · ${upcomingCadence.goal.title}` : ""}
                </p>
                <Link href={`/dashboard/cadence/${upcomingCadence.id}`} className="text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
                  Open cadence and check in →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-[#71717a]">No upcoming cadence scheduled.</p>
            )}

            <h2 className="text-sm font-semibold text-[#a1a1aa] pt-2">Next upcoming milestone</h2>
            {upcomingMilestone ? (
              <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-2">
                <div>
                  <p className="text-sm font-medium text-[#fafafa]">{upcomingMilestone.title}</p>
                  <p className="text-xs text-[#71717a]">
                    {formatDate(upcomingMilestone.dueDate)} · {upcomingMilestone.goalTitle}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/dashboard/goals/${upcomingMilestone.goalId}`} className="text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
                    Open objective →
                  </Link>
                  <MilestoneStatusActions
                    orgId={user.activeOrgId!}
                    goalId={upcomingMilestone.goalId}
                    milestoneId={upcomingMilestone.id}
                    compact
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#71717a]">No upcoming milestones scheduled.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#a1a1aa]">Past week actions</h2>

            <div className="space-y-2">
              <p className="text-xs text-[#71717a] uppercase tracking-wider">Cadence</p>
              {cadencePastWeek.length === 0 ? (
                <p className="text-sm text-[#71717a]">No cadence in the past week.</p>
              ) : (
                cadencePastWeek.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#fafafa] truncate">{item.name}</p>
                      <p className="text-xs text-[#71717a] truncate">{formatDateTime(item.nextOccurrence)}{item.goal ? ` · ${item.goal.title}` : ""}</p>
                    </div>
                    <Link href={`/dashboard/cadence/${item.id}`} className="text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors shrink-0">
                      Check in
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#71717a] uppercase tracking-wider">Milestones</p>
              {milestonesPastWeek.length === 0 ? (
                <p className="text-sm text-[#71717a]">No milestones in the past week.</p>
              ) : (
                milestonesPastWeek.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#fafafa] truncate">{item.title}</p>
                      <p className="text-xs text-[#71717a] truncate">{formatDate(item.dueDate)} · {item.goalTitle}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/dashboard/goals/${item.goalId}`} className="text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
                        Open objective
                      </Link>
                      {(item.status === "PENDING" || item.status === "IN_PROGRESS") && (
                        <MilestoneStatusActions
                          orgId={user.activeOrgId!}
                          goalId={item.goalId}
                          milestoneId={item.id}
                          compact
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Organization switcher (only if multi-org) ─────── */}
      {orgs.length > 1 && (
        <div>
          <h2 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-4">
            Organization
          </h2>
          <Card>
            <CardContent>
              <OrgSwitcher orgs={orgs} activeOrgId={user.activeOrgId!} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
