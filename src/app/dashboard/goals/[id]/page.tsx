import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MilestonesPanel } from "./MilestonesPanel";
import { RitualsPanel } from "./RitualsPanel";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
}

interface CheckIn {
  id: string;
  progress: number;
  confidenceScore: number;
  statusColor: "RED" | "YELLOW" | "GREEN";
  note?: string;
  createdAt: string;
  author: { id: string; firstName?: string; lastName?: string };
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName?: string; lastName?: string };
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  status: string;
  timeframe: string;
  dueDate?: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  confidenceScore: number;
  owner: { id: string; firstName?: string; lastName?: string; email: string };
  parentGoal?: { id: string; title: string; type: string; category: string };
  childGoals: {
    id: string;
    title: string;
    description?: string;
    unit?: string;
    type: string;
    status: string;
    currentValue: number;
    targetValue?: number;
    confidenceScore: number;
    owner: { id: string; firstName?: string; lastName?: string };
  }[];
  checkIns: CheckIn[];
  comments: Comment[];
  _count: { checkIns: number; comments: number; childGoals: number };
}

const CATEGORY_COLORS: Record<string, string> = {
  FINANCIAL: "#22c55e",
  CUSTOMER: "#3b82f6",
  INTERNAL_PROCESS: "#8b5cf6",
  LEARNING_GROWTH: "#f59e0b",
  CULTURE: "#ec4899",
};
const CATEGORY_LABELS: Record<string, string> = {
  FINANCIAL: "Financial",
  CUSTOMER: "Customer",
  INTERNAL_PROCESS: "Internal Process",
  LEARNING_GROWTH: "Learning & Growth",
  CULTURE: "Culture",
};
const TYPE_LABELS: Record<string, string> = {
  OBJECTIVE: "Objective",
  KEY_RESULT: "Key Result",
};
const STATUS_VARIANT: Record<string, "default" | "success" | "info" | "warning" | "danger"> = {
  DRAFT: "default",
  ACTIVE: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function confidenceColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#22c55e";
}

function ragColor(c: string) {
  if (c === "GREEN") return "#22c55e";
  if (c === "YELLOW") return "#f59e0b";
  return "#ef4444";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProgressChart({ checkIns, unit }: { checkIns: CheckIn[]; unit?: string }) {
  if (checkIns.length < 2) return null;
  const sorted = [...checkIns].reverse();
  const maxVal = Math.max(...sorted.map((c) => c.progress), 1);
  const W = 560;
  const H = 120;
  const pad = { top: 10, right: 16, bottom: 20, left: 40 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const xStep = iW / Math.max(sorted.length - 1, 1);

  const pts = sorted.map((c, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + iH - (c.progress / maxVal) * iH,
    c,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {[0, 0.5, 1].map((t) => {
        const y = pad.top + iH - t * iH;
        return (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + iW} y1={y} y2={y} stroke="#27272a" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#71717a">
              {Math.round(t * maxVal)}{unit ? unit : ""}
            </text>
          </g>
        );
      })}
      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={ragColor(p.c.statusColor)} stroke="#18181b" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

export default async function GoalDetailPage({
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
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals`;

  const goalRes = await fetch(`${base}/${id}`, { headers, cache: "no-store" });
  if (goalRes.status === 404) notFound();
  if (!goalRes.ok) redirect("/dashboard/goals");

  const goal: Goal = await goalRes.json();

  const extBase = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;
  const [milestonesRes, ritualsRes] = await Promise.all([
    fetch(`${extBase}/goals/${id}/milestones`, { headers, cache: "no-store" }),
    fetch(`${extBase}/rituals/by-goal/${id}`, { headers, cache: "no-store" }),
  ]);
  const [milestones, rituals] = await Promise.all([
    milestonesRes.ok ? milestonesRes.json() : [],
    ritualsRes.ok ? ritualsRes.json() : [],
  ]);

  const progress =
    goal.targetValue && goal.targetValue > 0
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;

  const isObjective = goal.type === "OBJECTIVE";
  const isKeyResult = goal.type === "KEY_RESULT";

  const daysSinceCheckIn =
    goal.checkIns.length > 0
      ? Math.floor(
          (Date.now() - new Date(goal.checkIns[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

  const isDueForCheckIn =
    isKeyResult &&
    goal.status === "ACTIVE" &&
    (daysSinceCheckIn === null || daysSinceCheckIn >= 7);

  const catColor = CATEGORY_COLORS[goal.category] ?? "#71717a";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Check-in nudge banner */}
      {isDueForCheckIn && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10">
          <span className="text-sm text-[#fbbf24] font-medium">
            No check-in{daysSinceCheckIn !== null ? ` in ${daysSinceCheckIn} days` : " yet"}. Keep the team updated.
          </span>
          <Link href={`/dashboard/goals/${id}/check-in`}>
            <Button size="sm">Check In Now</Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: catColor + "18", color: catColor }}
            >
              {CATEGORY_LABELS[goal.category] ?? goal.category}
            </span>
            <span className="text-xs text-[#71717a]">{TYPE_LABELS[goal.type] ?? goal.type}</span>
            <span className="text-xs text-[#71717a]">· {goal.timeframe}</span>
            <Badge variant={STATUS_VARIANT[goal.status] ?? "default"}>
              {goal.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#fafafa]">{goal.title}</h1>
          {goal.description && (
            <p className="mt-2 text-sm text-[#71717a]">{goal.description}</p>
          )}
        </div>

        {isObjective && goal.status === "ACTIVE" && (
          <Link href={`/dashboard/goals/${id}/add-key-result`}>
            <Button className="gap-1.5 shrink-0">
              <Plus size={14} /> Add Key Result
            </Button>
          </Link>
        )}

        {isKeyResult && goal.status === "ACTIVE" && (
          <Link href={`/dashboard/goals/${id}/check-in`}>
            <Button className="gap-1.5 shrink-0">
              <Plus size={14} /> Check In
            </Button>
          </Link>
        )}
      </div>

      {isObjective ? (
        <>
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-[#a1a1aa] mb-4">Objective Summary</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[#71717a] mb-1">Title</dt>
                  <dd className="text-[#fafafa] font-medium">{goal.title}</dd>
                </div>
                <div>
                  <dt className="text-[#71717a] mb-1">Timeframe</dt>
                  <dd className="text-[#fafafa] font-medium">{goal.timeframe}</dd>
                </div>
                <div>
                  <dt className="text-[#71717a] mb-1">Owner</dt>
                  <dd className="text-[#fafafa] font-medium">
                    {goal.owner.firstName} {goal.owner.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#71717a] mb-1">Parent objective</dt>
                  <dd className="text-[#fafafa] font-medium">
                    {goal.parentGoal ? (
                      <Link href={`/dashboard/goals/${goal.parentGoal.id}`} className="text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
                        {goal.parentGoal.title}
                      </Link>
                    ) : (
                      "None"
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-[#a1a1aa] mb-3">Next Steps</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href={`/dashboard/goals/${id}/add-key-result`}>
                  <div className="rounded-lg border border-[#3f3f46] hover:border-[#6366f1]/50 transition-colors p-3 text-sm text-[#fafafa]">
                    Add Key Results
                  </div>
                </Link>
                <a href="#milestones" className="rounded-lg border border-[#3f3f46] hover:border-[#6366f1]/50 transition-colors p-3 text-sm text-[#fafafa]">
                  Add milestones
                </a>
                <a href="#cadence" className="rounded-lg border border-[#3f3f46] hover:border-[#6366f1]/50 transition-colors p-3 text-sm text-[#fafafa]">
                  Schedule cadence
                </a>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#a1a1aa]">Key Results ({goal.childGoals.length})</h2>
              <Link href={`/dashboard/goals/${id}/add-key-result`}>
                <Button size="sm" className="gap-1.5">
                  <Plus size={14} /> Add Key Result
                </Button>
              </Link>
            </div>

            {goal.childGoals.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-[#71717a]">
                  No key results yet. Add 2–4 key results to define how this objective will be measured.
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {goal.childGoals.map((kr) => (
                  <Link key={kr.id} href={`/dashboard/goals/${kr.id}`}>
                    <Card hover>
                      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 text-sm">
                        <div className="sm:col-span-2 min-w-0">
                          <p className="text-xs text-[#71717a] mb-1">Title</p>
                          <p className="text-[#fafafa] font-medium truncate">{kr.title}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717a] mb-1">Metric</p>
                          <p className="text-[#fafafa]">{kr.description || kr.unit || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717a] mb-1">Baseline</p>
                          <p className="text-[#fafafa]">—</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717a] mb-1">Target</p>
                          <p className="text-[#fafafa]">{kr.targetValue ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717a] mb-1">Current / Status</p>
                          <p className="text-[#fafafa]">
                            {kr.currentValue}
                            {kr.unit ? ` ${kr.unit}` : ""}
                            <span className="text-[#71717a]"> · {STATUS_LABELS[kr.status] ?? kr.status}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div id="milestones" className="scroll-mt-24">
            <MilestonesPanel goalId={id} orgId={user.activeOrgId!} initialData={milestones} />
          </div>

          <div id="cadence" className="scroll-mt-24">
            <RitualsPanel goalId={id} orgId={user.activeOrgId!} rituals={rituals} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#71717a] mb-1">Confidence</p>
                <p className="text-2xl font-bold" style={{ color: confidenceColor(goal.confidenceScore) }}>
                  {goal.confidenceScore}%
                </p>
              </CardContent>
            </Card>

            {goal.targetValue !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-[#71717a] mb-1">Progress</p>
                  <p className="text-2xl font-bold text-[#fafafa]">{progress}%</p>
                  <p className="text-xs text-[#71717a]">
                    {goal.currentValue}{goal.unit ? ` ${goal.unit}` : ""} / {goal.targetValue}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#71717a] mb-1">Owner</p>
                <p className="text-sm font-semibold text-[#fafafa]">
                  {goal.owner.firstName} {goal.owner.lastName}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#71717a] mb-1">Due</p>
                <p className="text-sm font-semibold text-[#fafafa]">{formatDate(goal.dueDate)}</p>
              </CardContent>
            </Card>
          </div>

          {goal.targetValue !== undefined && goal.targetValue > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm text-[#71717a]">
                  <span>Progress toward target</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} color={confidenceColor(goal.confidenceScore)} />
              </CardContent>
            </Card>
          )}

          {goal.parentGoal && (
            <div>
              <h2 className="text-sm font-semibold text-[#a1a1aa] mb-2">Parent Goal</h2>
              <Link href={`/dashboard/goals/${goal.parentGoal.id}`}>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#3f3f46] bg-[#18181b] hover:border-[#6366f1]/50 transition-colors text-sm">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: (CATEGORY_COLORS[goal.parentGoal.category] ?? "#71717a") + "18",
                      color: CATEGORY_COLORS[goal.parentGoal.category] ?? "#71717a",
                    }}
                  >
                    {TYPE_LABELS[goal.parentGoal.type] ?? goal.parentGoal.type}
                  </span>
                  <span className="font-medium text-[#fafafa]">{goal.parentGoal.title}</span>
                  <span className="text-[#71717a]">↗</span>
                </div>
              </Link>
            </div>
          )}

          {goal.checkIns.length >= 2 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-[#a1a1aa] mb-4">Progress Over Time</h2>
                <ProgressChart checkIns={goal.checkIns} unit={goal.unit} />
                <div className="flex gap-4 mt-3 text-xs text-[#71717a]">
                  <span><span style={{ color: "#22c55e" }}>●</span> On Track</span>
                  <span><span style={{ color: "#f59e0b" }}>●</span> At Risk</span>
                  <span><span style={{ color: "#ef4444" }}>●</span> Off Track</span>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.checkIns.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#a1a1aa] mb-3">
                Check-in History ({goal._count.checkIns})
              </h2>
              <div className="flex flex-col gap-2">
                {goal.checkIns.map((ci) => (
                  <div
                    key={ci.id}
                    className="rounded-lg border border-[#27272a] bg-[#18181b] p-4"
                    style={{ borderLeftWidth: 3, borderLeftColor: ragColor(ci.statusColor) }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#fafafa]">
                          {ci.progress}{goal.unit ? ` ${goal.unit}` : ""}
                        </span>
                        <span className="text-sm font-bold" style={{ color: confidenceColor(ci.confidenceScore) }}>
                          {ci.confidenceScore}% confidence
                        </span>
                      </div>
                      <span className="text-xs text-[#71717a]">
                        {ci.author.firstName} {ci.author.lastName} · {formatDate(ci.createdAt)}
                      </span>
                    </div>
                    {ci.note && (
                      <p className="text-sm text-[#a1a1aa] mt-1">{ci.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-[#a1a1aa] mb-3">
              Comments ({goal._count.comments})
            </h2>
            {goal.comments.length === 0 ? (
              <p className="text-sm text-[#52525b]">No comments yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {goal.comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[#fafafa]">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <span className="text-xs text-[#71717a]">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[#a1a1aa]">{comment.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Link href="/dashboard/goals" className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#fafafa] transition-colors">
        <ArrowLeft size={14} /> Back to Goals
      </Link>
    </div>
  );
}
