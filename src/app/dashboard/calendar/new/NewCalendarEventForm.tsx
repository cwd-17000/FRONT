"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Initiative {
  id: string;
  name: string;
}

interface Props {
  activeOrgId: string;
  initiatives: Initiative[];
}

export default function NewCalendarEventForm({ activeOrgId, initiatives }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    date: "",
    endDate: "",
    initiativeId: "",
    description: "",
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
      const res = await fetch(`/api/organizations/${activeOrgId}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          date: form.date,
          endDate: form.endDate || undefined,
          initiativeId: form.initiativeId || undefined,
          description: form.description.trim() || undefined,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/calendar");
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Failed to create event (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 560 }}>
      <h1>New Calendar Event</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Event title *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Campaign Launch"
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          />
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Start date *
            </label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", fontSize: 15 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              End date
            </label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              min={form.date || undefined}
              style={{ width: "100%", padding: "10px", fontSize: 15 }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Link to initiative
          </label>
          <select
            name="initiativeId"
            value={form.initiativeId}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          >
            <option value="">— None —</option>
            {initiatives.map((initiative) => (
              <option key={initiative.id} value={initiative.id}>
                {initiative.name}
              </option>
            ))}
          </select>
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
            placeholder="Additional details about this event"
            style={{ width: "100%", padding: "10px", fontSize: 15 }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            disabled={isSubmitting || !form.title.trim() || !form.date}
            style={{ padding: "12px 28px", fontSize: 15 }}
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/calendar")}
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
