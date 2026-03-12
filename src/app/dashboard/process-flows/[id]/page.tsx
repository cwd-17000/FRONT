"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string };
  steps: ProcessStep[];
}

const STEP_TYPES = ["start", "task", "decision", "approval", "end"] as const;

const STEP_LABELS: Record<string, string> = {
  start: "Start",
  task: "Task",
  decision: "Decision",
  approval: "Approval",
  end: "End",
};

const STEP_VARIANT: Record<string, "default" | "info" | "accent" | "warning" | "success"> = {
  start: "success",
  task: "info",
  decision: "warning",
  approval: "accent",
  end: "default",
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

const fieldClass =
  "w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

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
  const [isSavingFlow, setIsSavingFlow] = useState(false);

  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [stepTitle, setStepTitle] = useState("");
  const [stepDesc, setStepDesc] = useState("");
  const [stepType, setStepType] = useState<string>("task");
  const [stepRole, setStepRole] = useState("");
  const [stepDuration, setStepDuration] = useState("");
  const [isSavingStep, setIsSavingStep] = useState(false);

  const fetchFlow = useCallback(async (orgId: string) => {
    const data = await fetch(`/api/organizations/${orgId}/process-flows/${flowId}`, {
      credentials: "include",
    }).then((res) => (res.ok ? res.json() : null));

    if (data) setFlow(data);
    else router.push("/dashboard/process-flows");
  }, [flowId, router]);

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) {
      router.push("/login");
      return;
    }

    fetchFlow(me.activeOrgId).finally(() => setLoading(false));
  }, [me, meLoading, router, fetchFlow]);

  function openAddStep() {
    setEditingStep(null);
    setStepTitle("");
    setStepDesc("");
    setStepType("task");
    setStepRole("");
    setStepDuration("");
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

  async function handleSaveStep(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me?.activeOrgId || !flow || !stepTitle.trim()) return;

    setIsSavingStep(true);

    try {
      const body = {
        title: stepTitle.trim(),
        description: stepDesc.trim() || undefined,
        type: stepType,
        assigneeRole: stepRole || undefined,
        durationDays: stepDuration ? parseInt(stepDuration, 10) : undefined,
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
      setIsSavingStep(false);
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
    const idx = steps.findIndex((step) => step.id === stepId);

    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === steps.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const orderedIds = steps.map((step) => step.id);
    [orderedIds[idx], orderedIds[swapIdx]] = [orderedIds[swapIdx], orderedIds[idx]];

    await fetch(`/api/organizations/${me.activeOrgId}/process-flows/${flow.id}/steps/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderedIds }),
    });

    await fetchFlow(me.activeOrgId);
  }

  async function handleSaveFlowMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me?.activeOrgId || !flow || !flowName.trim()) return;

    setIsSavingFlow(true);

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
      setIsSavingFlow(false);
    }
  }

  if (meLoading || loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#71717a] p-6">
        <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    );
  }

  if (!flow) return null;

  const sortedSteps = [...flow.steps].sort((a, b) => a.order - b.order);
  const author = [flow.createdBy.firstName, flow.createdBy.lastName].filter(Boolean).join(" ") || flow.createdBy.email;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/process-flows" className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#fafafa] transition-colors">
        <ArrowLeft size={14} /> Back to Process Flows
      </Link>

      <Card>
        <CardContent className="p-5 space-y-4">
          {editingFlow ? (
            <form onSubmit={handleSaveFlowMeta} className="space-y-4">
              <input value={flowName} onChange={(e) => setFlowName(e.target.value)} required className={fieldClass} />
              <textarea value={flowDesc} onChange={(e) => setFlowDesc(e.target.value)} rows={3} placeholder="Description (optional)" className={`${fieldClass} resize-vertical`} />
              <select value={flowCategory} onChange={(e) => setFlowCategory(e.target.value)} className={`${fieldClass} h-10 py-0`}>
                <option value="">No category</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSavingFlow}>{isSavingFlow ? "Saving..." : "Save"}</Button>
                <Button type="button" variant="ghost" onClick={() => setEditingFlow(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[#fafafa]">{flow.name}</h1>
                  {flow.category && <Badge variant="default">{CATEGORY_LABELS[flow.category] ?? flow.category}</Badge>}
                </div>
                {flow.description && <p className="text-sm text-[#71717a]">{flow.description}</p>}
                <p className="text-xs text-[#52525b] mt-2">Created by {author}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setFlowName(flow.name);
                  setFlowDesc(flow.description ?? "");
                  setFlowCategory(flow.category ?? "");
                  setEditingFlow(true);
                }}
              >
                <Pencil size={12} /> Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">Steps ({sortedSteps.length})</h2>
          <Button size="sm" className="gap-1.5" onClick={openAddStep}>
            <Plus size={13} /> Add Step
          </Button>
        </div>

        {sortedSteps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-[#71717a]">
              No steps yet. Add your first step to start building the flow.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedSteps.map((step, index) => (
              <Card key={step.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => handleMoveStep(step.id, "up")} disabled={index === 0} title="Move up">
                      <ChevronUp size={12} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleMoveStep(step.id, "down")} disabled={index === sortedSteps.length - 1} title="Move down">
                      <ChevronDown size={12} />
                    </Button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-[#fafafa]">{step.title}</p>
                      <Badge variant={STEP_VARIANT[step.type] ?? "default"}>{STEP_LABELS[step.type] ?? step.type}</Badge>
                      {step.assigneeRole && <span className="text-xs text-[#71717a]">→ {ROLE_LABELS[step.assigneeRole] ?? step.assigneeRole}</span>}
                      {step.durationDays && <span className="text-xs text-[#71717a]">~{step.durationDays}d</span>}
                    </div>
                    {step.description && <p className="text-xs text-[#71717a]">{step.description}</p>}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="secondary" className="gap-1" onClick={() => openEditStep(step)}>
                      <Pencil size={12} /> Edit
                    </Button>
                    <Button size="icon" variant="danger" onClick={() => handleDeleteStep(step.id)} title="Delete step">
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showStepModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#27272a] bg-[#18181b] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#fafafa]">{editingStep ? "Edit Step" : "Add Step"}</h3>
              <button onClick={() => setShowStepModal(false)} className="text-[#71717a] hover:text-[#fafafa]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStep} className="space-y-3">
              <input value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} required placeholder="Step title" className={fieldClass} />
              <textarea value={stepDesc} onChange={(e) => setStepDesc(e.target.value)} rows={2} placeholder="Description (optional)" className={`${fieldClass} resize-vertical`} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={stepType} onChange={(e) => setStepType(e.target.value)} className={`${fieldClass} h-10 py-0`}>
                  {STEP_TYPES.map((type) => (
                    <option key={type} value={type}>{STEP_LABELS[type]}</option>
                  ))}
                </select>

                <select value={stepRole} onChange={(e) => setStepRole(e.target.value)} className={`${fieldClass} h-10 py-0`}>
                  <option value="">Assigned to: Any</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>

              <input type="number" min="1" value={stepDuration} onChange={(e) => setStepDuration(e.target.value)} placeholder="Estimated duration in days (optional)" className={fieldClass} />

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={isSavingStep || !stepTitle.trim()}>
                  {isSavingStep ? "Saving..." : editingStep ? "Save Changes" : "Add Step"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowStepModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
