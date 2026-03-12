// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Target,
  Rocket,
  Megaphone,
  Clock,
  ArrowRight,
  Calendar,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

const QUICK_LINKS = [
  { label: "Goals",         href: "/dashboard/goals",          icon: Target,       desc: "Track OKRs & key results" },
  { label: "Initiatives",   href: "/dashboard/initiatives",    icon: Rocket,       desc: "Strategic projects" },
  { label: "Campaigns",     href: "/dashboard/campaigns",      icon: Megaphone,    desc: "Marketing campaigns" },
  { label: "Calendar",      href: "/dashboard/calendar",       icon: Calendar,     desc: "Events & milestones" },
  { label: "Approvals",     href: "/dashboard/approvals",      icon: CheckCircle2, desc: "Pending reviews" },
  { label: "Process Flows", href: "/dashboard/process-flows",  icon: GitBranch,    desc: "Workflows & SOPs" },
  { label: "Rituals",       href: "/dashboard/rituals",        icon: RefreshCw,    desc: "Recurring ceremonies" },
  { label: "Members",       href: "/dashboard/members",        icon: Users,        desc: "Team management" },
];

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

  const [goalsRes, initiativesRes, campaignsRes] = await Promise.all([
    fetch(`${base}/goals`, { headers, cache: "no-store" }),
    fetch(`${base}/initiatives`, { headers, cache: "no-store" }),
    fetch(`${base}/campaigns`, { headers, cache: "no-store" }),
  ]);

  const [goals, initiatives, campaigns] = await Promise.all([
    goalsRes.ok ? goalsRes.json() : [],
    initiativesRes.ok ? initiativesRes.json() : [],
    campaignsRes.ok ? campaignsRes.json() : [],
  ]);

  const draftResults = await Promise.all(
    (campaigns as { id: string }[]).map((c) =>
      fetch(`${base}/campaigns/${c.id}/drafts`, { headers, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
    )
  );
  const allDrafts = (draftResults as { approvalStatus: string }[][]).flat();
  const pendingCount: number = allDrafts.filter(
    (d) => d.approvalStatus === "pending"
  ).length;

  const goalCount: number = Array.isArray(goals) ? goals.length : (goals?.items?.length ?? 0);
  const initiativeCount: number = initiatives.length;
  const campaignCount: number = campaigns.length;

  const METRICS = [
    {
      label: "Active Goals",
      value: goalCount,
      icon: Target,
      href: "/dashboard/goals",
      accent: "#6366f1",
    },
    {
      label: "Initiatives",
      value: initiativeCount,
      icon: Rocket,
      href: "/dashboard/initiatives",
      accent: "#8b5cf6",
    },
    {
      label: "Campaigns",
      value: campaignCount,
      icon: Megaphone,
      href: "/dashboard/campaigns",
      accent: "#3b82f6",
    },
    {
      label: "Pending Approvals",
      value: pendingCount,
      icon: Clock,
      href: "/dashboard/approvals",
      accent: pendingCount > 0 ? "#f59e0b" : "#71717a",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Overview</h1>
        <p className="mt-1 text-sm text-[#71717a]">
          Welcome back,{" "}
          <span className="text-[#a1a1aa] font-medium">{user.email}</span>
        </p>
      </div>

      {/* ── Row 1: Metric cards (bento) ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(({ label, value, icon: Icon, href, accent }) => (
          <Link key={href} href={href} className="group block">
            <Card hover className="h-full">
              <CardContent className="flex flex-col gap-3 p-5">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ background: accent + "20" }}
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#fafafa]">{value}</p>
                  <p className="text-sm text-[#71717a] mt-0.5">{label}</p>
                </div>
                <div className="flex items-center gap-1 text-xs mt-auto" style={{ color: accent }}>
                  <span>View</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5 duration-150" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Row 2: Quick navigation grid ────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4">
          Navigate
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ label, href, icon: Icon, desc }) => (
            <Link key={href} href={href} className="group block">
              <Card hover>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#27272a] shrink-0 group-hover:bg-[#312e81] transition-colors duration-150">
                    <Icon size={15} className="text-[#a1a1aa] group-hover:text-[#818cf8] transition-colors duration-150" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#fafafa]">{label}</p>
                    <p className="text-xs text-[#71717a] mt-0.5 truncate">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Row 3: Organization ─────────────────────────────────── */}
      {orgs.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4">
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
