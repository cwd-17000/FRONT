"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CheckIn {
  statusColor: string;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  type: string;
  category: string;
  status: string;
  timeframe: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  confidenceScore: number;
  parentGoalId?: string | null;
  teamId?: string | null;
  team?: { id: string; name: string } | null;
  owner: { id: string; firstName?: string; lastName?: string };
  checkIns: CheckIn[];
  _count: { checkIns: number; childGoals: number };
}

interface Team {
  id: string;
  name: string;
}

interface OrgDashboard {
  activeGoals: number;
  avgConfidenceScore: number;
  ragCounts: { RED: number; YELLOW: number; GREEN: number };
  byCategory: Record<string, number>;
}

interface Props {
  goals: Goal[];
  dashboard: OrgDashboard | null;
  teams: Team[];
}

const CATEGORY_COLORS: Record<string, string> = {
  FINANCIAL:        "#22c55e",
  CUSTOMER:         "#3b82f6",
  INTERNAL_PROCESS: "#8b5cf6",
  LEARNING_GROWTH:  "#f59e0b",
  CULTURE:          "#ec4899",
};

const CATEGORY_LABELS: Record<string, string> = {
  FINANCIAL:        "Financial",
  CUSTOMER:         "Customer",
  INTERNAL_PROCESS: "Internal Process",
  LEARNING_GROWTH:  "Learning & Growth",
  CULTURE:          "Culture",
};

const TIMEFRAME_LABELS: Record<string, string> = {
  ANNUAL:    "Annual",
  QUARTERLY: "Quarterly",
  MONTHLY:   "Monthly",
  WEEKLY:    "Weekly",
};

function confidenceColor(score: number): string {
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#22c55e";
}

function ragDotColor(c: string): string {
  if (c === "GREEN")  return "#22c55e";
  if (c === "YELLOW") return "#f59e0b";
  return "#ef4444";
}

function daysSince(iso: string) {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function KRRow({ kr }: { kr: Goal }) {
  const progress =
    kr.targetValue && kr.targetValue > 0
      ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
      : null;
  const lastRag = kr.checkIns[0]?.statusColor;
  const daysSinceCheckIn = kr.checkIns[0] ? daysSince(kr.checkIns[0].createdAt) : null;
  const isDue = kr.status === "ACTIVE" && (daysSinceCheckIn === null || daysSinceCheckIn >= 7);

  return (
    <Link href={`/dashboard/goals/${kr.id}`} className="block">
      <div className="flex items-center gap-3 px-5 py-3 border-t border-[#1f1f1f] bg-[#0f0f10] hover:bg-[#18181b] transition-colors duration-150 cursor-pointer">
        <div className="w-0.5 self-stretch bg-[#27272a] rounded-full shrink-0 ml-2" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[#fafafa] truncate">{kr.title}</span>
            {isDue && <Badge variant="warning" className="shrink-0 text-[10px]">Check in</Badge>}
          </div>
          {progress !== null && (
            <div className="flex items-center gap-2">
              <Progress value={progress} color={confidenceColor(kr.confidenceScore)} size="xs" className="flex-1" />
              <span className="text-[11px] text-[#71717a] shrink-0">
                {kr.currentValue}{kr.unit ? ` ${kr.unit}` : ""} / {kr.targetValue}{kr.unit ? ` ${kr.unit}` : ""}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastRag && (
            <div className="w-2 h-2 rounded-full" style={{ background: ragDotColor(lastRag) }} title={lastRag} />
          )}
          <span className="text-sm font-bold" style={{ color: confidenceColor(kr.confidenceScore) }}>
            {kr.confidenceScore}%
          </span>
          <span className="text-[11px] text-[#71717a]">
            {kr.owner.firstName} {kr.owner.lastName}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ObjectiveCard({ objective, keyResults }: { objective: Goal; keyResults: Goal[] }) {
  const [expanded, setExpanded] = useState(false);

  const health =
    keyResults.length > 0
      ? Math.round(keyResults.reduce((s, kr) => s + kr.confidenceScore, 0) / keyResults.length)
      : objective.confidenceScore;

  const lastRag =
    keyResults.length > 0
      ? keyResults[0].checkIns[0]?.statusColor
      : objective.checkIns[0]?.statusColor;

  const krsWithTarget = keyResults.filter((kr) => kr.targetValue && kr.targetValue > 0);
  const avgKrProgress =
    krsWithTarget.length > 0
      ? Math.round(
          krsWithTarget.reduce(
            (s, kr) => s + Math.min(100, (kr.currentValue / kr.targetValue!) * 100),
            0
          ) / krsWithTarget.length
        )
      : null;

  const catColor = CATEGORY_COLORS[objective.category] ?? "#71717a";

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#1f1f1f] transition-colors duration-150"
        onClick={() => setExpanded((v) => !v)}
      >
        <ChevronRight
          size={14}
          className="shrink-0 text-[#71717a] transition-transform duration-150"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: catColor + "18", color: catColor }}
            >
              {CATEGORY_LABELS[objective.category] ?? objective.category}
            </span>
            <span className="text-[11px] text-[#71717a]">
              {TIMEFRAME_LABELS[objective.timeframe] ?? objective.timeframe}
            </span>
            {objective.team && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#312e81]/40 text-[#818cf8] font-medium">
                {objective.team.name}
              </span>
            )}
          </div>
          <Link
            href={`/dashboard/goals/${objective.id}`}
            className="text-sm font-semibold text-[#fafafa] hover:text-[#818cf8] transition-colors duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {objective.title}
          </Link>
          <div className="text-xs text-[#71717a] mt-0.5">
            {objective.owner.firstName} {objective.owner.lastName}
            {keyResults.length > 0 &&
              ` · ${keyResults.length} key result${keyResults.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {avgKrProgress !== null && (
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-[11px] text-[#71717a]">Avg progress</span>
              <Progress value={avgKrProgress} color={confidenceColor(health)} size="xs" className="w-16" />
            </div>
          )}
          {lastRag && (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: ragDotColor(lastRag) }}
              title={`Latest: ${lastRag}`}
            />
          )}
          <div className="text-right">
            <div className="text-base font-bold" style={{ color: confidenceColor(health) }}>
              {health}%
            </div>
            <div className="text-[10px] text-[#71717a]">confidence</div>
          </div>
        </div>
      </div>

      {!expanded && keyResults.length > 0 && (
        <div
          className="border-t border-[#1f1f1f] px-5 py-2 text-xs text-[#71717a] bg-[#0f0f10] cursor-pointer hover:bg-[#18181b] transition-colors duration-150"
          onClick={() => setExpanded(true)}
        >
          {keyResults.length} key result{keyResults.length !== 1 ? "s" : ""} — click to expand
        </div>
      )}

      {expanded && keyResults.length > 0 && (
        <div>{keyResults.map((kr) => <KRRow key={kr.id} kr={kr} />)}</div>
      )}

      {expanded && keyResults.length === 0 && (
        <div className="border-t border-[#1f1f1f] px-5 py-3 text-sm text-[#71717a] bg-[#0f0f10]">
          No Key Results yet.{" "}
          <Link
            href="/dashboard/goals/new"
            className="text-[#818cf8] hover:text-[#6366f1] transition-colors duration-150"
          >
            Add one →
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function GoalsList({ goals, dashboard, teams }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");

  const objectives = goals.filter((g) => g.type === "OBJECTIVE");
  const krsByParent = new Map<string, Goal[]>();
  goals
    .filter((g) => g.type === "KEY_RESULT" && g.parentGoalId)
    .forEach((kr) => {
      const list = krsByParent.get(kr.parentGoalId!) ?? [];
      list.push(kr);
      krsByParent.set(kr.parentGoalId!, list);
    });

  const filteredObjectives =
    selectedTeamId === "all"
      ? objectives
      : objectives.filter((obj) => obj.teamId === selectedTeamId);

  const ragTotal = dashboard
    ? dashboard.ragCounts.RED + dashboard.ragCounts.YELLOW + dashboard.ragCounts.GREEN
    : 0;

  return (
    <div className="space-y-6">
      {/* Org health stats */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-[#fafafa]">{dashboard.activeGoals}</p>
              <p className="text-sm text-[#71717a] mt-1">Active Objectives</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p
                className="text-3xl font-bold"
                style={{ color: confidenceColor(dashboard.avgConfidenceScore) }}
              >
                {dashboard.avgConfidenceScore}%
              </p>
              <p className="text-sm text-[#71717a] mt-1">Avg Confidence</p>
            </CardContent>
          </Card>

          {ragTotal > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {[
                    { label: "On Track",  count: dashboard.ragCounts.GREEN,  color: "#22c55e" },
                    { label: "At Risk",   count: dashboard.ragCounts.YELLOW, color: "#f59e0b" },
                    { label: "Off Track", count: dashboard.ragCounts.RED,    color: "#ef4444" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="text-center">
                      <div className="text-xl font-bold" style={{ color }}>{count}</div>
                      <div className="text-[10px] text-[#71717a] mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#71717a] mt-2">Last 30 days</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Team filter bar — only shown when teams exist */}
      {teams.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTeamId("all")}
            className={[
              "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors duration-150",
              selectedTeamId === "all"
                ? "bg-[#312e81] border-[#6366f1] text-[#818cf8]"
                : "border-[#3f3f46] text-[#71717a] hover:border-[#52525b] hover:text-[#a1a1aa]",
            ].join(" ")}
          >
            All Teams
          </button>
          {teams.map((team) => {
            const count = objectives.filter((o) => o.teamId === team.id).length;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={[
                  "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors duration-150",
                  selectedTeamId === team.id
                    ? "bg-[#312e81] border-[#6366f1] text-[#818cf8]"
                    : "border-[#3f3f46] text-[#71717a] hover:border-[#52525b] hover:text-[#a1a1aa]",
                ].join(" ")}
              >
                {team.name}
                <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Objective list */}
      {filteredObjectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#27272a] rounded-xl text-center">
          <p className="text-[#71717a] mb-4">
            {selectedTeamId === "all"
              ? "No objectives yet. Create your first to drive alignment."
              : "No objectives assigned to this team yet."}
          </p>
          <Link href="/dashboard/goals/new">
            <Button>
              <Plus size={15} />
              {selectedTeamId === "all" ? "Create Your First Objective" : "Create Objective"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredObjectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              keyResults={krsByParent.get(obj.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
