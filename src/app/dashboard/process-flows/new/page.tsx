"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

const CATEGORIES = [
  { value: "campaign", label: "Campaign" },
  { value: "content", label: "Content" },
  { value: "approval", label: "Approval" },
  { value: "onboarding", label: "Onboarding" },
  { value: "other", label: "Other" },
];

export default function NewProcessFlowPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.activeOrgId || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${me.activeOrgId}/process-flows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
        }),
      });
      if (res.ok) {
        const flow = await res.json();
        router.push(`/dashboard/process-flows/${flow.id}`);
      } else {
        const text = await res.text();
        setError(text || "Failed to create process flow");
      }
    } catch {
      setError("Unable to reach the server");
    } finally {
      setSubmitting(false);
    }
  }

  if (meLoading) return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;

  return (
    <div style={{ padding: 40, maxWidth: 540 }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700 }}>New Process Flow</h1>
      <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 14 }}>
        Define a repeatable workflow for your team.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Flow name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Campaign Launch Checklist"
            required
            style={{ width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of when and how this process is used"
            rows={3}
            style={{ width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {error && <p style={{ margin: 0, color: "#dc2626", fontSize: 13 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button type="submit" disabled={submitting || !name.trim()} style={{ padding: "10px 22px", fontSize: 14 }}>
            {submitting ? "Creating..." : "Create Flow"}
          </button>
          <Link href="/dashboard/process-flows">
            <button type="button" style={{ padding: "10px 16px", fontSize: 14 }}>Cancel</button>
          </Link>
        </div>
      </form>
    </div>
  );
}
