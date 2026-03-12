// app/dashboard/calendar/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  nextOccurrence?: string;
  goal?: { id: string; title: string };
}

interface CalendarDisplayItem {
  id: string;
  title: string;
  startDate: string;
  subtitle?: string;
  kind: "EVENT" | "CADENCE";
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const headers = { cookie: `access_token=${token.value}` };
  const [calendarRes, cadenceRes] = await Promise.all([
    fetch(`${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/calendar`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/rituals`, {
      headers,
      cache: "no-store",
    }),
  ]);

  const events: CalendarEvent[] = calendarRes.ok ? await calendarRes.json() : [];
  const cadence: CadenceItem[] = cadenceRes.ok ? await cadenceRes.json() : [];

  const items: CalendarDisplayItem[] = [
    ...events.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      subtitle: event.initiativeName,
      kind: "EVENT" as const,
    })),
    ...cadence
      .filter((item) => !!item.nextOccurrence)
      .map((item) => ({
        id: `cadence-${item.id}`,
        title: item.name,
        startDate: item.nextOccurrence!,
        subtitle: item.goal?.title,
        kind: "CADENCE" as const,
      })),
  ];

  const eventsByDate: Record<string, CalendarDisplayItem[]> = {};
  for (const event of items) {
    const key = (event.startDate ?? "").slice(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  }

  const today = new Date();
  const displayYear = today.getFullYear();
  const displayMonth = today.getMonth();

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
        <Link href="/dashboard/calendar/new">
          <Button className="gap-1.5">
            <Plus size={15} />
            New Event
          </Button>
        </Link>
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
                        className={[
                          "text-[10px] px-1.5 py-0.5 rounded border overflow-hidden",
                          event.kind === "CADENCE"
                            ? "bg-[#052e16] border-[#22c55e]/30"
                            : "bg-[#312e81] border-[#6366f1]/20",
                        ].join(" ")}
                      >
                        <div className={event.kind === "CADENCE" ? "font-medium text-[#86efac] truncate" : "font-medium text-[#818cf8] truncate"}>
                          {event.title}
                        </div>
                        {event.subtitle && (
                          <div className="text-[#71717a] truncate">{event.subtitle}</div>
                        )}
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
            No events or cadence this month. Create your first calendar event.
          </p>
          <Link href="/dashboard/calendar/new">
            <Button className="gap-1.5"><Plus size={14} />Create Event</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
