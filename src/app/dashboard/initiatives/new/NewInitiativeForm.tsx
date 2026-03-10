"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Goal {
  id: string;
  name: string;
}

interface Props {
  activeOrgId: string;
  goals: Goal[];
  defaultGoalId?: string;
}

export default function NewInitiativeForm({ activeOrgId, goals, defaultGoalId = "" }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    goalId: defaultGoalId,
    status: "planned",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${activeOrgId}/initiatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          goalId: form.goalId || undefined,
          status: form.status,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/initiatives");
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Failed to create initiative (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 560 }}>
      <h1>New Initiative</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Initiative name *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Q3 Email Nurture Campaign"
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
            placeholder="What will this initiative accomplish?"
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Link to goal
          </label>
          <select
            name="goalId"
            value={form.goalId}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          >
            <option value="">— None —</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Complete</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            disabled={isSubmitting || !form.name.trim()}
            style={{ padding: "12px 28px", fontSize: 15 }}
          >
            {isSubmitting ? "Creating..." : "Create Initiative"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/initiatives")}
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
