"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GoalType = "OBJECTIVE" | "KEY_RESULT" | "SMART" | "INITIATIVE";
type GoalCategory = "FINANCIAL" | "CUSTOMER" | "INTERNAL_PROCESS" | "LEARNING_GROWTH" | "CULTURE";
type GoalTimeframe = "ANNUAL" | "QUARTERLY" | "MONTHLY" | "WEEKLY";

interface ParentGoal {
  id: string;
  title: string;
  type: string;
  timeframe: string;
}

interface Props {
  activeOrgId: string;
  parentGoals: ParentGoal[];
}

const FRAMEWORK_OPTIONS: { type: GoalType; label: string; description: string; hint: string }[] = [
  {
    type: "OBJECTIVE",
    label: "Objective",
    description: "A qualitative, inspiring goal that sets direction",
    hint: "Best for high-level company or team outcomes. Add measurable Key Results to track progress.",
  },
  {
    type: "KEY_RESULT",
    label: "Key Result",
    description: "A measurable outcome tied to an Objective (0–100% progress)",
    hint: "Each Objective can have 1–5 Key Results. Progress rolls up to the parent automatically.",
  },
  {
    type: "SMART",
    label: "SMART Goal",
    description: "Specific, Measurable, Achievable, Relevant, Time-bound",
    hint: "Ideal for individual or team goals with a clear numeric target and defined due date.",
  },
  {
    type: "INITIATIVE",
    label: "Initiative",
    description: "A project or program that supports one or more goals",
    hint: "Use for tracking execution work (projects, programs) that drive goal progress.",
  },
];

const CATEGORY_OPTIONS: { value: GoalCategory; label: string; color: string; hint?: string }[] = [
  { value: "FINANCIAL", label: "Financial", color: "#10b981" },
  { value: "CUSTOMER", label: "Customer", color: "#3b82f6" },
  { value: "INTERNAL_PROCESS", label: "Internal Process", color: "#8b5cf6" },
  { value: "LEARNING_GROWTH", label: "Learning & Growth", color: "#f59e0b" },
  {
    value: "CULTURE",
    label: "Culture",
    color: "#ec4899",
    hint: "Culture goals should include a measurable behavior metric (e.g. '% of 1:1s completed') rather than a soft outcome.",
  },
];

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

export default function NewGoalForm({ activeOrgId, parentGoals }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [selectedType, setSelectedType] = useState<GoalType | null>(null);

  // Step 2
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as GoalCategory | "",
    timeframe: "" as GoalTimeframe | "",
    startDate: "",
    dueDate: "",
    targetValue: "",
    unit: "",
    confidenceScore: "50",
  });

  // Step 3
  const [parentGoalId, setParentGoalId] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function canAdvanceStep2() {
    return form.title.trim() && form.category && form.timeframe;
  }

  async function handleSubmit() {
    if (!selectedType || !form.category || !form.timeframe) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        type: selectedType,
        category: form.category,
        timeframe: form.timeframe,
        status: "DRAFT",
      };
      if (form.description.trim()) body.description = form.description.trim();
      if (form.startDate) body.startDate = form.startDate;
      if (form.dueDate) body.dueDate = form.dueDate;
      if (form.targetValue) body.targetValue = parseFloat(form.targetValue);
      if (form.unit.trim()) body.unit = form.unit.trim();
      if (form.confidenceScore) body.confidenceScore = parseInt(form.confidenceScore, 10);
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

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.value === form.category);
  const btnPrimary = (enabled: boolean): React.CSSProperties => ({
    padding: "11px 28px",
    background: enabled ? "#111827" : "#e5e7eb",
    color: enabled ? "#fff" : "#9ca3af",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: enabled ? "pointer" : "not-allowed",
  });
  const btnSecondary: React.CSSProperties = {
    padding: "11px 20px",
    background: "transparent",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 640, margin: "0 auto" }}>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 32 }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: step >= n ? "#111827" : "#e5e7eb",
                color: step >= n ? "#fff" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {n}
            </div>
            <span
              style={{
                fontSize: 13,
                color: step === n ? "#111827" : "#9ca3af",
                fontWeight: step === n ? 600 : 400,
              }}
            >
              {n === 1 ? "Framework" : n === 2 ? "Details" : "Alignment"}
            </span>
            {n < 3 && <div style={{ width: 24, height: 1, background: "#e5e7eb" }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Framework selection ── */}
      {step === 1 && (
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Choose a Goal Framework</h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280" }}>
            Select the type that best fits what you want to accomplish.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FRAMEWORK_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedType(opt.type)}
                style={{
                  textAlign: "left",
                  padding: "16px 20px",
                  border: `2px solid ${selectedType === opt.type ? "#111827" : "#e5e7eb"}`,
                  borderRadius: 10,
                  background: selectedType === opt.type ? "#f9fafb" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{opt.label}</div>
                <div style={{ fontSize: 13, color: "#374151" }}>{opt.description}</div>
                {selectedType === opt.type && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "#6b7280",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: 8,
                    }}
                  >
                    {opt.hint}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button
              type="button"
              disabled={!selectedType}
              onClick={() => setStep(2)}
              style={btnPrimary(!!selectedType)}
            >
              Continue →
            </button>
            <button type="button" onClick={() => router.push("/dashboard/goals")} style={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Goal details ── */}
      {step === 2 && (
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Goal Details</h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280" }}>
            Define your goal clearly so progress can be measured.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder={
                  selectedType === "OBJECTIVE"
                    ? "e.g. Become the market leader in our segment"
                    : "e.g. Increase MQL volume by 40%"
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="What does success look like? What's the context?"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Category *</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
                  gap: 8,
                }}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                    style={{
                      padding: "10px 12px",
                      border: `2px solid ${form.category === cat.value ? cat.color : "#e5e7eb"}`,
                      borderRadius: 8,
                      background: form.category === cat.value ? cat.color + "18" : "#fff",
                      color: form.category === cat.value ? cat.color : "#374151",
                      fontSize: 13,
                      fontWeight: form.category === cat.value ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {selectedCategory?.hint && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    background: "#fefce8",
                    border: "1px solid #fde68a",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#92400e",
                  }}
                >
                  💡 {selectedCategory.hint}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Timeframe *</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <button
                    key={tf.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, timeframe: tf.value }))}
                    style={{
                      padding: "8px 14px",
                      border: `2px solid ${form.timeframe === tf.value ? "#111827" : "#e5e7eb"}`,
                      borderRadius: 8,
                      background: form.timeframe === tf.value ? "#111827" : "#fff",
                      color: form.timeframe === tf.value ? "#fff" : "#374151",
                      fontSize: 13,
                      fontWeight: form.timeframe === tf.value ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
              {form.timeframe === "QUARTERLY" && (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280" }}>
                  💡 Consider linking this to an Annual goal in the next step.
                </p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Target Value</label>
                <input
                  type="number"
                  name="targetValue"
                  value={form.targetValue}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  min="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <input
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder='e.g. "$", "%", "calls"'
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Initial Confidence Score:{" "}
                <strong style={{ color: parseInt(form.confidenceScore) < 40 ? "#ef4444" : parseInt(form.confidenceScore) <= 70 ? "#f59e0b" : "#10b981" }}>
                  {form.confidenceScore}%
                </strong>
              </label>
              <input
                type="range"
                name="confidenceScore"
                value={form.confidenceScore}
                onChange={handleChange}
                min="0"
                max="100"
                style={{ width: "100%", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
                <span>Low (0)</span>
                <span>Medium (50)</span>
                <span>High (100)</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button type="button" onClick={() => setStep(1)} style={btnSecondary}>
              ← Back
            </button>
            <button
              type="button"
              disabled={!canAdvanceStep2()}
              onClick={() => setStep(3)}
              style={btnPrimary(!!canAdvanceStep2())}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Alignment ── */}
      {step === 3 && (
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Link to a Parent Goal</h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280" }}>
            Align this goal to a higher-level objective to show how it contributes to org-wide outcomes.
          </p>

          {selectedType === "KEY_RESULT" && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 16px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 8,
                fontSize: 13,
                color: "#1e40af",
              }}
            >
              Key Results must be linked to an Objective. Please select one below.
            </div>
          )}

          {parentGoals.length === 0 ? (
            <p style={{ fontSize: 14, color: "#6b7280" }}>No existing goals to align to yet.</p>
          ) : (
            <div>
              <label style={labelStyle}>
                Parent Goal {selectedType === "KEY_RESULT" ? "*" : "(optional)"}
              </label>
              <select
                value={parentGoalId}
                onChange={(e) => setParentGoalId(e.target.value)}
                style={{ ...inputStyle, background: "#fff" }}
              >
                <option value="">— None —</option>
                {parentGoals
                  .filter((g) => selectedType !== "KEY_RESULT" || g.type === "OBJECTIVE")
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.type}] {g.title} ({g.timeframe})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {error && (
            <p style={{ color: "#ef4444", fontSize: 14, marginTop: 12 }}>{error}</p>
          )}

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button type="button" onClick={() => setStep(2)} style={btnSecondary}>
              ← Back
            </button>
            <button
              type="button"
              disabled={isSubmitting || (selectedType === "KEY_RESULT" && !parentGoalId)}
              onClick={handleSubmit}
              style={{
                ...btnPrimary(!(isSubmitting || (selectedType === "KEY_RESULT" && !parentGoalId))),
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "wait" : "pointer",
              }}
            >
              {isSubmitting ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
