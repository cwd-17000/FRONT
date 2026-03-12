import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

interface Cadence {
  id: string;
  name: string;
  description?: string;
  recurrence: string;
  nextOccurrence?: string;
  participantIds: string[];
  goal?: { id: string; title: string };
  _count: { checkIns: number };
}

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

const RECURRENCE_VARIANT: Record<string, "default" | "accent" | "info" | "success"> = {
  WEEKLY: "info",
  BIWEEKLY: "accent",
  MONTHLY: "success",
  QUARTERLY: "default",
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CadencePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/rituals`,
    { headers: { cookie: `access_token=${token.value}` }, cache: "no-store" }
  );

  const cadence: Cadence[] = res.ok ? await res.json() : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Cadence</h1>
          <p className="mt-1 text-sm text-[#71717a]">Recurring meetings and check-ins tied to goals.</p>
        </div>
        <Link href="/dashboard/cadence/new">
          <Button className="gap-1.5"><Plus size={14} />Schedule cadence</Button>
        </Link>
      </div>

      {cadence.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-[#71717a] mb-3">No cadence yet. Schedule your first recurring check-in.</p>
            <Link href="/dashboard/cadence/new">
              <Button className="gap-1.5"><Plus size={14} />Schedule cadence</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {cadence.map((item) => (
            <Link key={item.id} href={`/dashboard/cadence/${item.id}`}>
              <Card hover>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#fafafa] truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-[#71717a] mt-1 truncate">{item.description}</p>
                    )}
                    {item.goal && (
                      <p className="text-xs text-[#71717a] mt-1 truncate">→ {item.goal.title}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <Badge variant={RECURRENCE_VARIANT[item.recurrence] ?? "default"} className="text-[10px]">
                      {RECURRENCE_LABELS[item.recurrence] ?? item.recurrence}
                    </Badge>
                    <p className="text-xs text-[#71717a]">Next: {formatDate(item.nextOccurrence)}</p>
                    <p className="text-xs text-[#71717a]">
                      {item.participantIds.length} participant{item.participantIds.length !== 1 ? "s" : ""} · {item._count.checkIns} check-in{item._count.checkIns !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
