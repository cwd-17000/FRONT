"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewGoalForm({ activeOrgId }: { activeOrgId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    targetMetric: "",
    targetValue: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${activeOrgId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          targetMetric: form.targetMetric.trim() || undefined,
          targetValue: form.targetValue ? parseFloat(form.targetValue) : undefined,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/goals");
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Failed to create goal (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 560 }}>
      <h1>New Marketing Goal</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Goal name *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Increase MQLs by Q3"
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="What does success look like?"
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          />
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Target metric
            </label>
            <input
              name="targetMetric"
              value={form.targetMetric}
              onChange={handleChange}
              placeholder="e.g. MQLs, Signups, Revenue"
              style={{ width: "100%", padding: "10px", fontSize: 15 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Target value
            </label>
            <input
              name="targetValue"
              value={form.targetValue}
              onChange={handleChange}
              type="number"
              placeholder="e.g. 500"
              style={{ width: "100%", padding: "10px", fontSize: 15 }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            disabled={isSubmitting || !form.name.trim()}
            style={{ padding: "12px 28px", fontSize: 15 }}
          >
            {isSubmitting ? "Creating..." : "Create Goal"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/goals")}
            style={{ padding: "12px 20px", fontSize: 15 }}
          >
            Cancel
          </button>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </div>
  );
}
