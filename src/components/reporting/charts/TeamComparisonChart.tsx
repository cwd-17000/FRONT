"use client";

import type { TeamComparisonItem } from "@/types/reporting";

interface Props {
  data: TeamComparisonItem[];
  onTeamClick?: (teamId: string) => void;
  activeTeamId?: string | null;
}

export default function TeamComparisonChart({ data, onTeamClick, activeTeamId }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ height: 80, display: "flex", alignItems: "center", color: "#3f3f46", fontSize: 13 }}>
        No team data for this period
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #27272a" }}>
            <Th>Team</Th>
            <Th align="right">Total</Th>
            <Th align="right">Active</Th>
            <Th>Avg KR Progress</Th>
            <Th align="right">At Risk</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isActive = row.teamId === activeTeamId;
            return (
              <tr
                key={row.teamId}
                onClick={() => onTeamClick?.(row.teamId)}
                style={{
                  borderBottom: "1px solid #1c1c1e",
                  cursor: onTeamClick ? "pointer" : "default",
                  background: isActive ? "#1e1b4b" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLTableRowElement).style.background = "#18181b";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = isActive ? "#1e1b4b" : "transparent";
                }}
              >
                <td style={{ padding: "10px 8px", color: "#fafafa", fontWeight: 500 }}>
                  {row.teamName}
                  {isActive && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        color: "#818cf8",
                        background: "#312e81",
                        padding: "1px 5px",
                        borderRadius: 3,
                      }}
                    >
                      filtered
                    </span>
                  )}
                </td>
                <td style={{ padding: "10px 8px", color: "#71717a", textAlign: "right" }}>
                  {row.totalObjectivesCount}
                </td>
                <td style={{ padding: "10px 8px", color: "#a1a1aa", textAlign: "right" }}>
                  {row.activeObjectivesCount}
                </td>
                <td style={{ padding: "10px 8px", minWidth: 160 }}>
                  <ProgressBar value={row.averageKeyResultProgressPercent} />
                </td>
                <td style={{ padding: "10px 8px", textAlign: "right" }}>
                  <AtRiskBadge count={row.atRiskObjectivesCount} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      style={{
        padding: "8px 8px 10px",
        textAlign: align ?? "left",
        fontSize: 11,
        color: "#52525b",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "#27272a", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: "#a1a1aa", width: 36, textAlign: "right" }}>
        {value}%
      </span>
    </div>
  );
}

function AtRiskBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span style={{ color: "#22c55e", fontSize: 12 }}>0</span>;
  }
  return (
    <span
      style={{
        color: "#f59e0b",
        background: "#422006",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 4,
      }}
    >
      {count}
    </span>
  );
}
