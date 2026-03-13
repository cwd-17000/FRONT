"use client";

import type { ProgressOverTimeData } from "@/types/reporting";

interface Props {
  data: ProgressOverTimeData;
}

const W = 600;
const H = 160;
const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function xPos(index: number, total: number): number {
  return PAD.left + (total <= 1 ? CHART_W / 2 : (index / (total - 1)) * CHART_W);
}

function yPos(pct: number): number {
  return PAD.top + (1 - pct / 100) * CHART_H;
}

export default function ProgressOverTimeChart({ data }: Props) {
  const { buckets } = data;

  if (buckets.length === 0) return null;

  const totalBuckets = buckets.length;

  // Build (x, y) for non-null buckets
  const points = buckets.map((b, i) => ({
    x: xPos(i, totalBuckets),
    y: b.averageKeyResultProgressPercent !== null ? yPos(b.averageKeyResultProgressPercent) : null,
    label: b.bucketStartDate.slice(5), // "MM-DD"
    value: b.averageKeyResultProgressPercent,
    completed: b.objectivesCompletedCount,
  }));

  // Build connected line segments, breaking at null gaps
  const lineParts: string[][] = [];
  let current: string[] = [];
  for (const pt of points) {
    if (pt.y === null) {
      if (current.length > 0) { lineParts.push(current); current = []; }
    } else {
      current.push(current.length === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`);
    }
  }
  if (current.length > 0) lineParts.push(current);

  // Build fill areas (close each segment down to baseline)
  const fillParts: string[] = [];
  for (const part of lineParts) {
    const baseY = PAD.top + CHART_H;
    // Extract first and last x from the M/L commands
    const firstCmd = part[0]; // "M x y"
    const lastCmd = part[part.length - 1]; // "L x y" or "M x y"
    const firstX = parseFloat(firstCmd.split(" ")[1]);
    const lastX = parseFloat(lastCmd.split(" ")[1]);
    fillParts.push(`${part.join(" ")} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`);
  }

  // Y-axis tick labels
  const yTicks = [0, 25, 50, 75, 100];

  // X-axis: show a label every N buckets to avoid crowding
  const labelEvery = Math.max(1, Math.ceil(totalBuckets / 8));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-label="KR progress over time"
    >
      {/* Y-axis gridlines and labels */}
      {yTicks.map((tick) => {
        const y = yPos(tick);
        return (
          <g key={tick}>
            <line
              x1={PAD.left}
              y1={y}
              x2={PAD.left + CHART_W}
              y2={y}
              stroke="#27272a"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? "none" : "4 3"}
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="#52525b"
            >
              {tick}%
            </text>
          </g>
        );
      })}

      {/* Fill areas */}
      {fillParts.map((d, i) => (
        <path key={i} d={d} fill="#6366f1" fillOpacity={0.12} />
      ))}

      {/* Line segments */}
      {lineParts.map((part, i) => (
        <path
          key={i}
          d={part.join(" ")}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      {/* Data points */}
      {points.map((pt, i) => {
        if (pt.y === null) return null;
        return (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r={3.5} fill="#6366f1" />
            {/* Tooltip-ish title */}
            <title>{`${pt.label}: ${pt.value}%${pt.completed > 0 ? ` · ${pt.completed} completed` : ""}`}</title>
          </g>
        );
      })}

      {/* Completed objectives: small orange tick marks above baseline */}
      {points.map((pt, i) => {
        if (pt.completed === 0) return null;
        const baseY = PAD.top + CHART_H;
        return (
          <g key={`c-${i}`}>
            <line x1={pt.x} y1={baseY - 6} x2={pt.x} y2={baseY} stroke="#f59e0b" strokeWidth={2} />
            <title>{`${pt.label}: ${pt.completed} objective(s) completed`}</title>
          </g>
        );
      })}

      {/* X-axis bucket labels */}
      {points.map((pt, i) => {
        if (i % labelEvery !== 0) return null;
        return (
          <text
            key={`xl-${i}`}
            x={pt.x}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#52525b"
          >
            {pt.label}
          </text>
        );
      })}

      {/* Legend */}
      <g>
        <circle cx={PAD.left + 4} cy={H - 24} r={3} fill="#6366f1" />
        <text x={PAD.left + 11} y={H - 21} fontSize={9} fill="#52525b">
          Avg KR progress %
        </text>
        <line x1={PAD.left + 70} y1={H - 24} x2={PAD.left + 78} y2={H - 24} stroke="#f59e0b" strokeWidth={2} />
        <text x={PAD.left + 82} y={H - 21} fontSize={9} fill="#52525b">
          Objective completed
        </text>
      </g>
    </svg>
  );
}
