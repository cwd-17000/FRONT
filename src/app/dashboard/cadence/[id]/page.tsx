import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CadenceDetailClient } from "./CadenceDetailClient";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
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

interface Cadence {
  id: string;
  name: string;
  description?: string;
  recurrence: string;
  participantIds: string[];
  nextOccurrence?: string;
  owner: { id: string; firstName?: string; lastName?: string };
  goal?: { id: string; title: string };
}

interface CheckIn {
  id: string;
  status: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  summary: string;
  keyUpdates?: string;
  blockers?: string;
  occurredAt: string;
  createdBy: { id: string; firstName?: string; lastName?: string };
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CadenceDetailPage({
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
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/rituals`;

  const [cadenceRes, checkInsRes] = await Promise.all([
    fetch(`${base}/${id}`, { headers, cache: "no-store" }),
    fetch(`${base}/${id}/check-ins`, { headers, cache: "no-store" }),
  ]);

  if (cadenceRes.status === 404) notFound();
  if (!cadenceRes.ok) redirect("/dashboard/cadence");

  const cadence: Cadence = await cadenceRes.json();
  const checkIns: CheckIn[] = checkInsRes.ok ? await checkInsRes.json() : [];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/cadence" className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#fafafa] transition-colors">
        <ArrowLeft size={14} /> Back to Cadence
      </Link>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={RECURRENCE_VARIANT[cadence.recurrence] ?? "default"}>
                  {RECURRENCE_LABELS[cadence.recurrence] ?? cadence.recurrence}
                </Badge>
                <span className="text-xs text-[#71717a]">Next: {formatDate(cadence.nextOccurrence)}</span>
              </div>
              <h1 className="text-2xl font-bold text-[#fafafa]">{cadence.name}</h1>
              {cadence.description && (
                <p className="mt-2 text-sm text-[#71717a]">{cadence.description}</p>
              )}
              {cadence.goal && (
                <p className="mt-2 text-sm text-[#71717a]">
                  Linked objective: <Link href={`/dashboard/goals/${cadence.goal.id}`} className="text-[#818cf8] hover:text-[#a5b4fc] transition-colors">{cadence.goal.title}</Link>
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-[#71717a]">Owner</p>
              <p className="text-sm font-medium text-[#fafafa]">{cadence.owner.firstName} {cadence.owner.lastName}</p>
              <p className="text-xs text-[#71717a] mt-1">
                {cadence.participantIds.length} participant{cadence.participantIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CadenceDetailClient
        orgId={user.activeOrgId}
        cadenceId={id}
        initialCheckIns={checkIns}
        currentUserId={user.sub}
        participantIds={cadence.participantIds}
        ownerId={cadence.owner.id}
      />
    </div>
  );
}
