"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

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
  campaign: "Campaign",
  content: "Content",
  approval: "Approval",
  onboarding: "Onboarding",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  campaign: { bg: "#dbeafe", text: "#1d4ed8" },
  content: { bg: "#dcfce7", text: "#15803d" },
  approval: { bg: "#fef3c7", text: "#92400e" },
  onboarding: { bg: "#f3e8ff", text: "#7e22ce" },
  other: { bg: "#f3f4f6", text: "#374151" },
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
      method: "DELETE",
      credentials: "include",
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

  if (meLoading || loading) return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Process Flows</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Document and visualize repeatable workflows
          </p>
        </div>
        <Link href="/dashboard/process-flows/new">
          <button style={{ padding: "9px 18px", fontSize: 14 }}>+ New Process Flow</button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search flows..."
          style={{ flex: 1, padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          {flows.length === 0
            ? "No process flows yet. Create one to start documenting your workflows."
            : "No flows match your search."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((flow) => {
            const colors = CATEGORY_COLORS[flow.category ?? "other"] ?? CATEGORY_COLORS.other;
            const author = [flow.createdBy.firstName, flow.createdBy.lastName].filter(Boolean).join(" ") || flow.createdBy.email;
            return (
              <div key={flow.id} style={{
                border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px",
                background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <Link href={`/dashboard/process-flows/${flow.id}`} style={{ textDecoration: "none" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{flow.name}</span>
                    </Link>
                    {flow.category && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                        background: colors.bg, color: colors.text, textTransform: "uppercase", letterSpacing: 0.5,
                      }}>
                        {CATEGORY_LABELS[flow.category] ?? flow.category}
                      </span>
                    )}
                  </div>
                  {flow.description && (
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "#6b7280" }}>{flow.description}</p>
                  )}
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {flow._count.steps} {flow._count.steps === 1 ? "step" : "steps"} · Created by {author}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                  <Link href={`/dashboard/process-flows/${flow.id}`}>
                    <button style={{ padding: "5px 14px", fontSize: 12 }}>View</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(flow.id)}
                    style={{ padding: "5px 12px", fontSize: 12, color: "#dc2626", border: "1px solid #fecaca", background: "#fff" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
