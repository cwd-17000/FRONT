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
  { label: "Rituals",        href: "/dashboard/rituals",         icon: RefreshCw,  desc: "Recurring ceremonies" },
  { label: "My Organization",href: "/dashboard/my-organization", icon: Building2,  desc: "Members, teams & org chart" },
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

  const goalsRes = await fetch(`${base}/goals`, { headers, cache: "no-store" });
  const goals = goalsRes.ok ? await goalsRes.json() : [];
  const goalCount: number = Array.isArray(goals) ? goals.length : (goals?.items?.length ?? 0);

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
                <p className="text-sm text-[#71717a] mt-0.5">Active Goals</p>
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

      {/* ── Row 3: Organization switcher (only if multi-org) ─────── */}
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
