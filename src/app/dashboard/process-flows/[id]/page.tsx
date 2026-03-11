"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

interface ProcessStep {
  id: string;
  title: string;
  description: string | null;
  order: number;
  type: string;
  assigneeRole: string | null;
  durationDays: number | null;
}

interface ProcessFlow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  createdAt: string;
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string };
  steps: ProcessStep[];
}

const STEP_TYPES = ["start", "task", "decision", "approval", "end"] as const;

const STEP_CONFIG: Record<string, { label: string; color: string; bg: string; shape: "pill" | "diamond" | "rounded" }> = {
  start:    { label: "Start",    color: "#166534", bg: "#dcfce7", shape: "pill" },
  task:     { label: "Task",     color: "#1e40af", bg: "#dbeafe", shape: "rounded" },
  decision: { label: "Decision", color: "#92400e", bg: "#fef3c7", shape: "diamond" },
  approval: { label: "Approval", color: "#7e22ce", bg: "#f3e8ff", shape: "rounded" },
  end:      { label: "End",      color: "#991b1b", bg: "#fee2e2", shape: "pill" },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const CATEGORY_LABELS: Record<string, string> = {
  campaign: "Campaign",
  content: "Content",
  approval: "Approval",
  onboarding: "Onboarding",
  other: "Other",
};

function StepNode({ step, onEdit, onDelete, isFirst, isLast, onMoveUp, onMoveDown }: {
  step: ProcessStep;
  onEdit: (step: ProcessStep) => void;
  onDelete: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  const cfg = STEP_CONFIG[step.type] ?? STEP_CONFIG.task;
  const isPill = cfg.shape === "pill";
  const isDiamond = cfg.shape === "diamond";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Connector line above (except first) */}
      {!isFirst && (
        <div style={{ width: 2, height: 28, background: "#d1d5db" }} />
      )}

      <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
        {/* Move buttons */}
        <div style={{
          position: "absolute", left: -44, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          <button
            onClick={() => onMoveUp(step.id)}
            disabled={isFirst}
            style={{ padding: "2px 6px", fontSize: 11, opacity: isFirst ? 0.3 : 1, cursor: isFirst ? "default" : "pointer" }}
          >▲</button>
          <button
            onClick={() => onMoveDown(step.id)}
            disabled={isLast}
            style={{ padding: "2px 6px", fontSize: 11, opacity: isLast ? 0.3 : 1, cursor: isLast ? "default" : "pointer" }}
          >▼</button>
        </div>

        {isDiamond ? (
          <div style={{ position: "relative", padding: "2px 0" }}>
            {/* Diamond shape via CSS transform */}
            <div style={{
              background: cfg.bg, border: `2px solid ${cfg.color}`,
              borderRadius: 8, padding: "14px 24px",
              transform: "perspective(80px) rotateX(0deg)",
            }}>
              <StepContent step={step} cfg={cfg} onEdit={onEdit} onDelete={onDelete} />
            </div>
            {/* Visual diamond indicator */}
            <div style={{
              position: "absolute", right: -12, top: "50%", transform: "translateY(-50%) rotate(45deg)",
              width: 12, height: 12, background: cfg.color, borderRadius: 2,
            }} />
          </div>
        ) : (
          <div style={{
            background: cfg.bg, border: `2px solid ${cfg.color}`,
            borderRadius: isPill ? 40 : 10, padding: "14px 24px",
          }}>
            <StepContent step={step} cfg={cfg} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>

      {/* Connector line below (except last) */}
      {!isLast && (
        <div style={{ width: 2, height: 28, background: "#d1d5db" }} />
      )}
    </div>
  );
}

function StepContent({ step, cfg, onEdit, onDelete }: {
  step: ProcessStep;
  cfg: { label: string; color: string; bg: string };
  onEdit: (step: ProcessStep) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: cfg.color,
              textTransform: "uppercase", letterSpacing: 0.5,
            }}>{cfg.label}</span>
            {step.assigneeRole && (
              <span style={{ fontSize: 10, color: "#6b7280" }}>
                → {ROLE_LABELS[step.assigneeRole] ?? step.assigneeRole}
              </span>
            )}
            {step.durationDays && (
              <span style={{ fontSize: 10, color: "#6b7280" }}>
                ~{step.durationDays}d
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{step.title}</div>
          {step.description && (
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{step.description}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: 12, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(step)}
            style={{ padding: "3px 8px", fontSize: 11, background: "rgba(255,255,255,0.7)" }}
          >Edit</button>
          <button
            onClick={() => onDelete(step.id)}
            style={{ padding: "3px 8px", fontSize: 11, background: "rgba(255,255,255,0.7)", color: "#dc2626", border: "1px solid #fecaca" }}
          >×</button>
        </div>
      </div>
    </div>
  );
}

export default function ProcessFlowDetailPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;

  const [flow, setFlow] = useState<ProcessFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowDesc, setFlowDesc] = useState("");
  const [flowCategory, setFlowCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // Add/edit step modal
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [stepTitle, setStepTitle] = useState("");
  const [stepDesc, setStepDesc] = useState("");
  const [stepType, setStepType] = useState<string>("task");
  const [stepRole, setStepRole] = useState("");
  const [stepDuration, setStepDuration] = useState("");
  const [stepSaving, setStepSaving] = useState(false);

  const fetchFlow = useCallback(async (orgId: string) => {
    const data = await fetch(`/api/organizations/${orgId}/process-flows/${flowId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null);
    if (data) setFlow(data);
    else router.push("/dashboard/process-flows");
  }, [flowId, router]);

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }
    fetchFlow(me.activeOrgId).finally(() => setLoading(false));
  }, [me, meLoading, router, fetchFlow]);

  function openAddStep() {
    setEditingStep(null);
    setStepTitle(""); setStepDesc(""); setStepType("task"); setStepRole(""); setStepDuration("");
    setShowStepModal(true);
  }

  function openEditStep(step: ProcessStep) {
    setEditingStep(step);
    setStepTitle(step.title);
    setStepDesc(step.description ?? "");
    setStepType(step.type);
    setStepRole(step.assigneeRole ?? "");
    setStepDuration(step.durationDays ? String(step.durationDays) : "");
    setShowStepModal(true);
  }

  async function handleSaveStep(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.activeOrgId || !flow) return;
    setStepSaving(true);
    try {
      const body = {
        title: stepTitle.trim(),
        description: stepDesc.trim() || undefined,
        type: stepType,
        assigneeRole: stepRole || undefined,
        durationDays: stepDuration ? parseInt(stepDuration) : undefined,
        order: editingStep ? editingStep.order : flow.steps.length,
      };

      const url = editingStep
        ? `/api/organizations/${me.activeOrgId}/process-flows/${flow.id}/steps/${editingStep.id}`
        : `/api/organizations/${me.activeOrgId}/process-flows/${flow.id}/steps`;

      const res = await fetch(url, {
        method: editingStep ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchFlow(me.activeOrgId);
        setShowStepModal(false);
      }
    } finally {
      setStepSaving(false);
    }
  }

  async function handleDeleteStep(stepId: string) {
    if (!me?.activeOrgId || !flow || !confirm("Remove this step?")) return;
    await fetch(`/api/organizations/${me.activeOrgId}/process-flows/${flow.id}/steps/${stepId}`, {
      method: "DELETE",
      credentials: "include",
    });
    await fetchFlow(me.activeOrgId);
  }

  async function handleMoveStep(stepId: string, direction: "up" | "down") {
    if (!me?.activeOrgId || !flow) return;
    const steps = [...flow.steps].sort((a, b) => a.order - b.order);
    const idx = steps.findIndex((s) => s.id === stepId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === steps.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const orderedIds = steps.map((s) => s.id);
    [orderedIds[idx], orderedIds[swapIdx]] = [orderedIds[swapIdx], orderedIds[idx]];

    await fetch(`/api/organizations/${me.activeOrgId}/process-flows/${flow.id}/steps/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderedIds }),
    });
    await fetchFlow(me.activeOrgId);
  }

  async function handleSaveFlowMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.activeOrgId || !flow) return;
    setSaving(true);
    try {
      await fetch(`/api/organizations/${me.activeOrgId}/process-flows/${flow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: flowName.trim(),
          description: flowDesc.trim() || undefined,
          category: flowCategory || undefined,
        }),
      });
      await fetchFlow(me.activeOrgId);
      setEditingFlow(false);
    } finally {
      setSaving(false);
    }
  }

  if (meLoading || loading) return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;
  if (!flow) return null;

  const sortedSteps = [...flow.steps].sort((a, b) => a.order - b.order);

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        {editingFlow ? (
          <form onSubmit={handleSaveFlowMeta} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              value={flowName} onChange={(e) => setFlowName(e.target.value)}
              required style={{ padding: "8px 12px", fontSize: 18, fontWeight: 700, borderRadius: 6, border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box" }}
            />
            <textarea
              value={flowDesc} onChange={(e) => setFlowDesc(e.target.value)}
              placeholder="Description (optional)" rows={2}
              style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db", resize: "vertical", width: "100%", boxSizing: "border-box" }}
            />
            <select
              value={flowCategory} onChange={(e) => setFlowCategory(e.target.value)}
              style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">No category</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={saving} style={{ padding: "7px 16px", fontSize: 13 }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setEditingFlow(false)} style={{ padding: "7px 12px", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{flow.name}</h1>
                {flow.category && (
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                    {CATEGORY_LABELS[flow.category] ?? flow.category}
                  </span>
                )}
                {flow.description && (
                  <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>{flow.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setFlowName(flow.name);
                  setFlowDesc(flow.description ?? "");
                  setFlowCategory(flow.category ?? "");
                  setEditingFlow(true);
                }}
                style={{ padding: "5px 14px", fontSize: 12, flexShrink: 0, marginLeft: 12 }}
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Flow visualization */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Steps <span style={{ fontWeight: 400, color: "#9ca3af" }}>({sortedSteps.length})</span>
          </h2>
          <button onClick={openAddStep} style={{ padding: "6px 14px", fontSize: 13 }}>
            + Add Step
          </button>
        </div>

        {sortedSteps.length === 0 ? (
          <div style={{
            border: "2px dashed #e5e7eb", borderRadius: 12, padding: "40px 24px",
            textAlign: "center", color: "#9ca3af", fontSize: 14,
          }}>
            No steps yet. Add your first step to start building the flow.
          </div>
        ) : (
          <div style={{ paddingLeft: 52 }}>
            {sortedSteps.map((step, i) => (
              <StepNode
                key={step.id}
                step={step}
                onEdit={openEditStep}
                onDelete={handleDeleteStep}
                isFirst={i === 0}
                isLast={i === sortedSteps.length - 1}
                onMoveUp={(id) => handleMoveStep(id, "up")}
                onMoveDown={(id) => handleMoveStep(id, "down")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Step modal */}
      {showStepModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 480,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>
              {editingStep ? "Edit Step" : "Add Step"}
            </h3>
            <form onSubmit={handleSaveStep} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                  Step title *
                </label>
                <input
                  value={stepTitle} onChange={(e) => setStepTitle(e.target.value)}
                  placeholder="e.g. Review copy draft" required
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                  Description
                </label>
                <textarea
                  value={stepDesc} onChange={(e) => setStepDesc(e.target.value)}
                  placeholder="What happens in this step?"
                  rows={2}
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                    Step type
                  </label>
                  <select
                    value={stepType} onChange={(e) => setStepType(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    {STEP_TYPES.map((t) => (
                      <option key={t} value={t}>{STEP_CONFIG[t].label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                    Assigned to
                  </label>
                  <select
                    value={stepRole} onChange={(e) => setStepRole(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="">Any</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                  Estimated duration (days)
                </label>
                <input
                  type="number" min="1"
                  value={stepDuration} onChange={(e) => setStepDuration(e.target.value)}
                  placeholder="Optional"
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit" disabled={stepSaving || !stepTitle.trim()} style={{ padding: "8px 18px", fontSize: 14 }}>
                  {stepSaving ? "Saving..." : editingStep ? "Save Changes" : "Add Step"}
                </button>
                <button type="button" onClick={() => setShowStepModal(false)} style={{ padding: "8px 14px", fontSize: 14 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard/process-flows">← Back to Process Flows</Link>
      </div>
    </div>
  );
}
