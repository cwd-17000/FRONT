"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GoalType = "OBJECTIVE" | "KEY_RESULT";
type GoalTimeframe = "ANNUAL" | "QUARTERLY" | "MONTHLY" | "WEEKLY";

interface ParentGoal {
  id: string;
  title: string;
  type: string;
  timeframe: string;
}

interface Member {
  userId: string;
  name: string;
}

interface Props {
  activeOrgId: string;
  parentGoals: ParentGoal[];
  members: Member[];
}

const TIMEFRAME_OPTIONS: { value: GoalTimeframe; label: string }[] = [
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
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

export default function NewGoalForm({ activeOrgId, parentGoals, members }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<GoalType | null>(null);
  const [title, setTitle] = useState("");
  const [timeframe, setTimeframe] = useState<GoalTimeframe | "">("");
  const [ownerId, setOwnerId] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [parentGoalId, setParentGoalId] = useState("");

  const objectives = parentGoals.filter((g) => g.type === "OBJECTIVE");

  const canSubmit =
    selectedType !== null &&
    title.trim().length > 0 &&
    timeframe !== "" &&
    (selectedType !== "KEY_RESULT" || parentGoalId !== "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || !selectedType) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type: selectedType,
        timeframe,
        status: "ACTIVE",
      };
      if (ownerId) body.ownerId = ownerId;
      if (targetValue) body.targetValue = parseFloat(targetValue);
      if (unit.trim()) body.unit = unit.trim();
      if (parentGoalId) body.parentGoalId = parentGoalId;

      const res = await fetch(`/api/organizations/${activeOrgId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/dashboard/goals/${created.id}`);
        return;
      }

      const text = await res.text();
      setError(text || `Failed to create goal (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: "40px", maxWidth: 560, margin: "0 auto" }}>

      {/* ── Step 1: Objective or Key Result ── */}
      {step === 1 && (
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>New Goal</h1>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6b7280" }}>
            What type of goal are you creating?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={() => { setSelectedType("OBJECTIVE"); setStep(2); }}
              style={{
                textAlign: "left",
                padding: "20px 24px",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Objective</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                A qualitative, inspiring goal that sets direction. Objectives can roll up to other Objectives.
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedType("KEY_RESULT"); setStep(2); }}
              style={{
                textAlign: "left",
                padding: "20px 24px",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Key Result</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                A measurable outcome linked to an Objective. Progress rolls up automatically.
              </div>
            </button>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={() => router.push("/dashboard/goals")}
              style={{
                padding: "10px 20px",
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
        </div>
      )}

      {/* ── Step 2: Goal details ── */}
      {step === 2 && selectedType && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, padding: 0, lineHeight: 1 }}
              >
                ←
              </button>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                New {selectedType === "OBJECTIVE" ? "Objective" : "Key Result"}
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Title */}
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={
                  selectedType === "OBJECTIVE"
                    ? "e.g. Become the undisputed market leader"
                    : "e.g. Increase MQL volume to 500"
                }
                style={{ ...inputStyle, fontSize: 15 }}
              />
            </div>

            {/* Timeframe */}
            <div>
              <label style={labelStyle}>Timeframe *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <button
                    key={tf.value}
                    type="button"
                    onClick={() => setTimeframe(tf.value)}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      border: `2px solid ${timeframe === tf.value ? "#111827" : "#e5e7eb"}`,
                      borderRadius: 8,
                      background: timeframe === tf.value ? "#111827" : "#fff",
                      color: timeframe === tf.value ? "#fff" : "#374151",
                      fontSize: 13,
                      fontWeight: timeframe === tf.value ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner */}
            {members.length > 0 && (
              <div>
                <label style={labelStyle}>Owner</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  style={{ ...inputStyle, background: "#fff" }}
                >
                  <option value="">— Assign to me —</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Key Result-only fields */}
            {selectedType === "KEY_RESULT" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Target Value</label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g. 500"
                    min="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder='e.g. "%", "calls", "$"'
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Parent objective */}
            <div>
              <label style={labelStyle}>
                {selectedType === "OBJECTIVE" ? "Parent Objective (optional)" : "Parent Objective *"}
              </label>
              {objectives.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                  {selectedType === "KEY_RESULT"
                    ? "No Objectives exist yet. Create an Objective first."
                    : "No existing Objectives to link to."}
                </p>
              ) : (
                <select
                  value={parentGoalId}
                  onChange={(e) => setParentGoalId(e.target.value)}
                  style={{ ...inputStyle, background: "#fff" }}
                  required={selectedType === "KEY_RESULT"}
                >
                  <option value="">— None —</option>
                  {objectives.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.timeframe})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 14, marginTop: 16 }}>{error}</p>
          )}

          <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
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
              {isSubmitting ? "Creating..." : `Create ${selectedType === "OBJECTIVE" ? "Objective" : "Key Result"}`}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/goals")}
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
      )}
    </div>
  );
}
