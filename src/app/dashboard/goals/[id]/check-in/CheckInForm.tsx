"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StatusColor = "RED" | "YELLOW" | "GREEN";

interface Props {
  activeOrgId: string;
  goalId: string;
  goalTitle: string;
  goalCurrentValue: number;
  goalTargetValue?: number;
  goalUnit?: string;
}

const RAG_OPTIONS: { value: StatusColor; label: string; description: string; color: string; bg: string }[] = [
  {
    value: "GREEN",
    label: "On Track",
    description: "We are confident this goal will be achieved",
    color: "#10b981",
    bg: "#f0fdf4",
  },
  {
    value: "YELLOW",
    label: "At Risk",
    description: "There are blockers or concerns that need attention",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    value: "RED",
    label: "Off Track",
    description: "This goal is unlikely to be achieved without major intervention",
    color: "#ef4444",
    bg: "#fef2f2",
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontWeight: 500,
  fontSize: 14,
};

function confidenceColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#10b981";
}

export default function CheckInForm({
  activeOrgId,
  goalId,
  goalTitle,
  goalCurrentValue,
  goalTargetValue,
  goalUnit,
}: Props) {
  const router = useRouter();
  const [progress, setProgress] = useState(String(goalCurrentValue));
  const [confidenceScore, setConfidenceScore] = useState("50");
  const [statusColor, setStatusColor] = useState<StatusColor | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPct =
    goalTargetValue && goalTargetValue > 0
      ? Math.min(100, Math.round((parseFloat(progress || "0") / goalTargetValue) * 100))
      : null;

  const canSubmit = statusColor !== null && progress.trim() !== "" && !isNaN(parseFloat(progress));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !statusColor) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/organizations/${activeOrgId}/goals/${goalId}/check-ins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            progress: parseFloat(progress),
            confidenceScore: parseInt(confidenceScore, 10),
            statusColor,
            note: note.trim() || undefined,
          }),
        }
      );

      if (res.ok) {
        router.push(`/dashboard/goals/${goalId}`);
        return;
      }

      const text = await res.text();
      setError(text || `Failed to submit check-in (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 580, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "#9ca3af" }}>Check-in for</p>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{goalTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Progress input */}
        <div>
          <label style={labelStyle}>
            Current Progress{goalUnit ? ` (${goalUnit})` : ""}
          </label>
          <input
            type="number"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder={`e.g. ${goalCurrentValue}`}
            min="0"
            style={inputStyle}
            required
          />
          {progressPct !== null && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                <span>
                  {parseFloat(progress) || 0}
                  {goalUnit ? ` ${goalUnit}` : ""} / {goalTargetValue}
                  {goalUnit ? ` ${goalUnit}` : ""}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "#f3f4f6",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: "#3b82f6",
                    borderRadius: 99,
                    transition: "width 0.2s",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status color (RAG) */}
        <div>
          <label style={labelStyle}>Status *</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RAG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusColor(opt.value)}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  border: `2px solid ${statusColor === opt.value ? opt.color : "#e5e7eb"}`,
                  borderRadius: 8,
                  background: statusColor === opt.value ? opt.bg : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: opt.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: statusColor === opt.value ? opt.color : "#374151",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Confidence score */}
        <div>
          <label style={labelStyle}>
            Confidence Score:{" "}
            <strong style={{ color: confidenceColor(parseInt(confidenceScore)) }}>
              {confidenceScore}%
            </strong>
          </label>
          <input
            type="range"
            value={confidenceScore}
            onChange={(e) => setConfidenceScore(e.target.value)}
            min="0"
            max="100"
            style={{ width: "100%", cursor: "pointer" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#9ca3af",
              marginTop: 2,
            }}
          >
            <span>Not confident (0)</span>
            <span>Very confident (100)</span>
          </div>
        </div>

        {/* Note */}
        <div>
          <label style={labelStyle}>Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="What happened this period? Any blockers? What are the next steps?"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {error && (
          <p style={{ margin: 0, color: "#ef4444", fontSize: 14 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            style={{
              padding: "11px 28px",
              background: canSubmit && !isSubmitting ? "#111827" : "#e5e7eb",
              color: canSubmit && !isSubmitting ? "#fff" : "#9ca3af",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Saving..." : "Submit Check-in"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/goals/${goalId}`)}
            style={{
              padding: "11px 20px",
              background: "transparent",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
