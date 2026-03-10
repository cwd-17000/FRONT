// app/dashboard/calendar/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      activeOrgId: string | null;
    };
  } catch {
    return null;
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string e.g. "2026-03-15"
  initiativeName?: string;
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

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/calendar`,
    {
      headers: { cookie: `access_token=${token.value}` },
      cache: "no-store",
    }
  );

  const events: CalendarEvent[] = res.ok ? await res.json() : [];

  // Group events by "YYYY-MM-DD" for O(1) lookup in the grid
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const key = event.date.slice(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  }

  // Determine which month to show: earliest event month, or current month
  const today = new Date();
  const displayYear = today.getFullYear();
  const displayMonth = today.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sun

  // Build grid cells: leading empty slots + day numbers
  const gridCells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (gridCells.length % 7 !== 0) gridCells.push(null);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>
          {MONTH_NAMES[displayMonth]} {displayYear}
        </h1>
        <Link href="/dashboard/calendar/new">
          <button style={{ padding: "10px 20px" }}>+ New Event</button>
        </Link>
      </div>

      {/* Day-name header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 1,
        marginBottom: 1,
      }}>
        {DAY_NAMES.map((d) => (
          <div key={d} style={{
            padding: "6px 0",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "#888",
            textTransform: "uppercase",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 1,
        background: "#e5e7eb",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
      }}>
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
            <div key={idx} style={{
              background: day ? "#fff" : "#f9fafb",
              minHeight: 90,
              padding: 8,
              verticalAlign: "top",
            }}>
              {day && (
                <>
                  <div style={{
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? "#2563eb" : "#333",
                    marginBottom: 4,
                  }}>
                    {day}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {dayEvents.map((event) => (
                      <div key={event.id} style={{
                        fontSize: 11,
                        padding: "3px 6px",
                        borderRadius: 4,
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          color: "#111",
                        }}>
                          {event.title}
                        </div>
                        {event.initiativeName && (
                          <div style={{
                            color: "#888",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {event.initiativeName}
                          </div>
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

      {/* Events with no renderable date or overflow — list below empty state */}
      {events.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#666" }}>
          <p>No events this month. Create your first calendar event to get started.</p>
          <Link href="/dashboard/calendar/new">
            <button style={{ marginTop: 16, padding: "10px 24px" }}>Create Event</button>
          </Link>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
