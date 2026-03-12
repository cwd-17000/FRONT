// app/dashboard/calendar/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarActionItemCard, type CalendarDisplayItem } from "./CalendarActionItemCard";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  initiativeName?: string;
}

interface CadenceItem {
  id: string;
  name: string;
  recurrence: string;
  nextOccurrence?: string;
  goal?: {
    id: string;
    title: string;
    type?: "OBJECTIVE" | "KEY_RESULT";
    dueDate?: string;
    parentGoal?: { id: string; title: string; dueDate?: string };
  };
}

interface MilestoneItem {
  id: string;
  title: string;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
  goalId: string;
  goalTitle: string;
}

interface GoalSummary {
  id: string;
  title: string;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function cadenceEndDate(cadence: CadenceItem) {
  const linkedObjectiveDue = cadence.goal?.type === "KEY_RESULT"
    ? cadence.goal.parentGoal?.dueDate
    : cadence.goal?.dueDate;

  if (!linkedObjectiveDue) return null;
  const due = new Date(linkedObjectiveDue);
  return Number.isNaN(due.getTime()) ? null : due;
}

function parseGoals(value: unknown): GoalSummary[] {
  if (Array.isArray(value)) return value as GoalSummary[];
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: GoalSummary[] }).items;
  }
  return [];
}

function parseMonth(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yearText, monthText] = month.split("-");
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    if (!Number.isNaN(year) && monthIndex >= 0 && monthIndex <= 11) {
      return { year, month: monthIndex };
    }
  }

  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() };
}

function monthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function expandCadenceOccurrences(cadence: CadenceItem, year: number, month: number): string[] {
  if (!cadence.nextOccurrence) return [];

  const seed = new Date(cadence.nextOccurrence);
  if (Number.isNaN(seed.getTime())) return [];
  const endDate = cadenceEndDate(cadence);

  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const rangeEnd = endDate && endDate < monthEnd ? endDate : monthEnd;

  if (seed > rangeEnd) return [];
  const dates: string[] = [];

  const pushIfInRange = (date: Date) => {
    if (date >= monthStart && date <= monthEnd) {
      dates.push(date.toISOString());
    }
  };

  if (cadence.recurrence === "WEEKLY" || cadence.recurrence === "BIWEEKLY") {
    const intervalDays = cadence.recurrence === "WEEKLY" ? 7 : 14;

    let forward = new Date(seed);
    while (forward <= rangeEnd) {
      pushIfInRange(forward);
      forward = addDays(forward, intervalDays);
    }
  } else if (cadence.recurrence === "MONTHLY" || cadence.recurrence === "QUARTERLY") {
    const intervalMonths = cadence.recurrence === "MONTHLY" ? 1 : 3;

    let forward = new Date(seed);
    while (forward <= rangeEnd) {
      pushIfInRange(forward);
      forward = addMonths(forward, intervalMonths);
    }
  } else {
    pushIfInRange(seed);
  }

  return [...new Set(dates)].sort((a, b) => a.localeCompare(b));
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const params = searchParams ? await searchParams : undefined;
  const parsed = parseMonth(params?.month);
  const displayYear = parsed.year;
  const displayMonth = parsed.month;
  const prevMonth = new Date(displayYear, displayMonth - 1, 1);
  const nextMonth = new Date(displayYear, displayMonth + 1, 1);

  const headers = { cookie: `access_token=${token.value}` };
  const base = `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`;

  const [calendarRes, cadenceRes, goalsRes] = await Promise.all([
    fetch(`${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/calendar`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/rituals`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${base}/goals?type=OBJECTIVE&limit=100`, {
      headers,
      cache: "no-store",
    }),
  ]);

  const events: CalendarEvent[] = calendarRes.ok ? await calendarRes.json() : [];
  const cadence: CadenceItem[] = cadenceRes.ok ? await cadenceRes.json() : [];
  const goals = goalsRes.ok ? parseGoals(await goalsRes.json()) : [];

  const milestoneResponses = await Promise.all(
    goals.map((goal) => fetch(`${base}/goals/${goal.id}/milestones`, { headers, cache: "no-store" }))
  );

  const milestonesByGoal = await Promise.all(
    milestoneResponses.map(async (response, index) => {
      if (!response.ok) return [] as MilestoneItem[];
      const rows = (await response.json()) as Omit<MilestoneItem, "goalId" | "goalTitle">[];
      const goal = goals[index];
      return rows.map((row) => ({
        ...row,
        goalId: goal.id,
        goalTitle: goal.title,
      }));
    })
  );
  const milestones = milestonesByGoal.flat();

  const today = new Date();

  const cadenceItems: CalendarDisplayItem[] = cadence.flatMap((item) =>
    expandCadenceOccurrences(item, displayYear, displayMonth).map((occurrence, index) => ({
      id: `cadence-${item.id}-${index}`,
      title: item.name,
      startDate: occurrence,
      subtitle: item.goal?.title,
      kind: "CADENCE" as const,
      cadenceId: item.id,
      goalId: item.goal?.id,
      goalType: item.goal?.type,
    }))
  );

  const milestoneItems: CalendarDisplayItem[] = milestones
    .filter((item) => {
      const due = new Date(item.dueDate);
      return due.getFullYear() === displayYear && due.getMonth() === displayMonth;
    })
    .map((item) => ({
      id: `milestone-${item.id}`,
      title: item.title,
      startDate: item.dueDate,
      subtitle: item.goalTitle,
      kind: "MILESTONE" as const,
      goalId: item.goalId,
      milestoneId: item.id,
      milestoneStatus: item.status,
    }));

  const items: CalendarDisplayItem[] = [
    ...events.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      subtitle: event.initiativeName,
      kind: "EVENT" as const,
    })),
    ...cadenceItems,
    ...milestoneItems,
  ];

  const eventsByDate: Record<string, CalendarDisplayItem[]> = {};
  for (const event of items) {
    const key = (event.startDate ?? "").slice(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  }

  const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay();

  const gridCells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (gridCells.length % 7 !== 0) gridCells.push(null);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">
            {MONTH_NAMES[displayMonth]} {displayYear}
          </h1>
          <p className="mt-1 text-sm text-[#71717a]">Team calendar and cadence</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/calendar?month=${monthParam(prevMonth)}`}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ChevronLeft size={14} /> Prev
            </Button>
          </Link>
          <Link href={`/dashboard/calendar?month=${monthParam(nextMonth)}`}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              Next <ChevronRight size={14} />
            </Button>
          </Link>
          <Link href="/dashboard/calendar/new">
            <Button className="gap-1.5">
              <Plus size={15} />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Day-name header */}
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-[#71717a] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[#27272a] rounded-xl overflow-hidden border border-[#27272a]">
        {gridCells.map((day, idx) => {
          const dateKey = day
            ? `${displayYear}-${pad(displayMonth + 1)}-${pad(day)}`
            : null;
          const dayEvents = dateKey ? (eventsByDate[dateKey] ?? []) : [];
          const isToday =
            day === today.getDate() &&
            displayMonth === today.getMonth() &&
            displayYear === today.getFullYear();

          return (
            <div
              key={idx}
              className={day ? "bg-[#18181b] min-h-[90px] p-2" : "bg-[#0f0f10] min-h-[90px]"}
            >
              {day && (
                <>
                  <div className={
                    isToday
                      ? "w-6 h-6 flex items-center justify-center rounded-full bg-[#6366f1] text-white text-xs font-bold mb-1"
                      : "text-xs text-[#71717a] mb-1 pl-0.5"
                  }>
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="overflow-hidden"
                      >
                        <CalendarActionItemCard item={event} orgId={user.activeOrgId!} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-[#27272a] rounded-xl">
          <p className="text-sm text-[#71717a] mb-3">
            No events, milestones, or cadence this month.
          </p>
          <Link href="/dashboard/calendar/new">
            <Button className="gap-1.5"><Plus size={14} />Create Event</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
