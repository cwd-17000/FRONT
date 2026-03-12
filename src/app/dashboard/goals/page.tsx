import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import GoalsList from "./GoalsList";
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

export default async function GoalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals`;

  const [goalsRes, dashRes] = await Promise.all([
    fetch(`${base}?limit=100`, { headers, cache: "no-store" }),
    fetch(`${base}/dashboard`, { headers, cache: "no-store" }),
  ]);

  const goalsData = goalsRes.ok ? await goalsRes.json() : { items: [] };
  const goals = goalsData.items ?? [];
  const dashboard = dashRes.ok ? await dashRes.json() : null;

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
        <Link href="/dashboard/goals/new">
          <Button className="gap-1.5 shrink-0">
            <Plus size={15} />
            New Goal
          </Button>
        </Link>
      </div>

      <GoalsList goals={goals} dashboard={dashboard} />
    </div>
  );
}
