"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";
import { Plus, Search, Trash2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProcessFlow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  createdAt: string;
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string };
  _count: { steps: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  campaign:   "Campaign",
  content:    "Content",
  approval:   "Approval",
  onboarding: "Onboarding",
  other:      "Other",
};

const CATEGORY_VARIANT: Record<string, "info" | "success" | "warning" | "accent" | "default"> = {
  campaign:   "info",
  content:    "success",
  approval:   "warning",
  onboarding: "accent",
  other:      "default",
};

export default function ProcessFlowsPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();

  const [flows, setFlows] = useState<ProcessFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }
    fetch(`/api/organizations/${me.activeOrgId}/process-flows`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setFlows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [me, meLoading, router]);

  async function handleDelete(id: string) {
    if (!me?.activeOrgId || !confirm("Delete this process flow?")) return;
    await fetch(`/api/organizations/${me.activeOrgId}/process-flows/${id}`, {
      method: "DELETE", credentials: "include",
    });
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }

  const filtered = flows.filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || f.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (meLoading || loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#71717a] p-6">
        <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Process Flows</h1>
          <p className="mt-1 text-sm text-[#71717a]">Document and visualize repeatable workflows</p>
        </div>
        <Link href="/dashboard/process-flows/new">
          <Button className="gap-1.5 shrink-0"><Plus size={15} />New Flow</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flows…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#3f3f46] bg-[#27272a] text-sm text-[#fafafa] placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#27272a] rounded-xl">
          <p className="text-sm text-[#71717a]">
            {flows.length === 0
              ? "No process flows yet. Create one to document your workflows."
              : "No flows match your search."}
          </p>
          {flows.length === 0 && (
            <Link href="/dashboard/process-flows/new">
              <Button className="mt-4 gap-1.5"><Plus size={14} />Create first flow</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((flow) => {
            const author =
              [flow.createdBy.firstName, flow.createdBy.lastName].filter(Boolean).join(" ") ||
              flow.createdBy.email;
            return (
              <Card key={flow.id} hover>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/dashboard/process-flows/${flow.id}`}>
                        <span className="text-sm font-semibold text-[#fafafa] hover:text-[#818cf8] transition-colors">
                          {flow.name}
                        </span>
                      </Link>
                      {flow.category && (
                        <Badge variant={CATEGORY_VARIANT[flow.category] ?? "default"}>
                          {CATEGORY_LABELS[flow.category] ?? flow.category}
                        </Badge>
                      )}
                    </div>
                    {flow.description && (
                      <p className="text-xs text-[#71717a] mb-1 truncate">{flow.description}</p>
                    )}
                    <p className="text-xs text-[#3f3f46]">
                      {flow._count.steps} {flow._count.steps === 1 ? "step" : "steps"} · Created by {author}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/dashboard/process-flows/${flow.id}`}>
                      <Button variant="secondary" size="sm" className="gap-1">
                        View <ArrowRight size={12} />
                      </Button>
                    </Link>
                    <Button variant="danger" size="icon" onClick={() => handleDelete(flow.id)} title="Delete">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
