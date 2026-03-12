"use client";

import { useState } from "react";

interface ExternalLink {
  id: string;
  sourceSystem: string;
  externalId: string;
  name: string;
  status?: string;
  primaryMetricLabel?: string;
  primaryMetricValue?: number;
  secondaryMetricLabel?: string;
  secondaryMetricValue?: number;
  url?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  HUBSPOT: "HubSpot",
  MAILCHIMP: "Mailchimp",
  LINKEDIN: "LinkedIn",
  GOOGLE_ADS: "Google Ads",
  CUSTOM: "Custom",
};

const SOURCE_SYSTEMS = Object.keys(SOURCE_LABELS);

export function ExternalCampaignsPanel({
  goalId,
  orgId,
  initialData,
}: {
  goalId: string;
  orgId: string;
  initialData: ExternalLink[];
}) {
  const [links, setLinks] = useState(initialData);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    sourceSystem: "CUSTOM",
    externalId: "",
    name: "",
    status: "",
    primaryMetricLabel: "",
    primaryMetricValue: "",
    secondaryMetricLabel: "",
    secondaryMetricValue: "",
    url: "",
  });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({
      sourceSystem: "CUSTOM",
      externalId: "",
      name: "",
      status: "",
      primaryMetricLabel: "",
      primaryMetricValue: "",
      secondaryMetricLabel: "",
      secondaryMetricValue: "",
      url: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      goalId,
      sourceSystem: form.sourceSystem,
      externalId: form.externalId,
      name: form.name,
      status: form.status || undefined,
      primaryMetricLabel: form.primaryMetricLabel || undefined,
      primaryMetricValue: form.primaryMetricValue ? parseFloat(form.primaryMetricValue) : undefined,
      secondaryMetricLabel: form.secondaryMetricLabel || undefined,
      secondaryMetricValue: form.secondaryMetricValue ? parseFloat(form.secondaryMetricValue) : undefined,
      url: form.url || undefined,
    };

    if (editingId) {
      const res = await fetch(`/api/organizations/${orgId}/external-campaigns/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setLinks((l) => l.map((li) => (li.id === editingId ? updated : li)));
        setEditingId(null);
        setAdding(false);
        resetForm();
      }
    } else {
      const res = await fetch(`/api/organizations/${orgId}/external-campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created = await res.json();
        setLinks((l) => [...l, created]);
        setAdding(false);
        resetForm();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/organizations/${orgId}/external-campaigns/${id}`, { method: "DELETE" });
    setLinks((l) => l.filter((li) => li.id !== id));
  }

  function startEdit(link: ExternalLink) {
    setForm({
      sourceSystem: link.sourceSystem,
      externalId: link.externalId,
      name: link.name,
      status: link.status ?? "",
      primaryMetricLabel: link.primaryMetricLabel ?? "",
      primaryMetricValue: link.primaryMetricValue?.toString() ?? "",
      secondaryMetricLabel: link.secondaryMetricLabel ?? "",
      secondaryMetricValue: link.secondaryMetricValue?.toString() ?? "",
      url: link.url ?? "",
    });
    setEditingId(link.id);
    setAdding(true);
  }

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "16px 20px",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          External Campaigns ({links.length})
        </h2>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setAdding((a) => !a);
          }}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {adding ? "Cancel" : "+ Link campaign"}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            padding: "12px",
            background: "#f9fafb",
            borderRadius: 8,
          }}
        >
          <select
            value={form.sourceSystem}
            onChange={(e) => setForm((f) => ({ ...f, sourceSystem: e.target.value }))}
            style={{
              gridColumn: "1 / -1",
              padding: "7px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              background: "#fff",
            }}
          >
            {SOURCE_SYSTEMS.map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
            ))}
          </select>

          <input
            required
            placeholder="Campaign name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />
          <input
            required
            placeholder="External ID (from source system)"
            value={form.externalId}
            onChange={(e) => setForm((f) => ({ ...f, externalId: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />

          <input
            placeholder="Status (e.g. active)"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />
          <input
            placeholder="URL (optional deep-link)"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />

          <input
            placeholder="Primary metric label (e.g. Leads)"
            value={form.primaryMetricLabel}
            onChange={(e) => setForm((f) => ({ ...f, primaryMetricLabel: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />
          <input
            type="number"
            min="0"
            placeholder="Primary metric value"
            value={form.primaryMetricValue}
            onChange={(e) => setForm((f) => ({ ...f, primaryMetricValue: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />

          <input
            placeholder="Secondary metric label (e.g. Clicks)"
            value={form.secondaryMetricLabel}
            onChange={(e) => setForm((f) => ({ ...f, secondaryMetricLabel: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />
          <input
            type="number"
            min="0"
            placeholder="Secondary metric value"
            value={form.secondaryMetricValue}
            onChange={(e) => setForm((f) => ({ ...f, secondaryMetricValue: e.target.value }))}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              gridColumn: "1 / -1",
              padding: "7px 14px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving…" : editingId ? "Update link" : "Save link"}
          </button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((l) => (
          <div
            key={l.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: "1px solid #f3f4f6",
              fontSize: 13,
            }}
          >
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: "#f3f4f6",
                borderRadius: 4,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {SOURCE_LABELS[l.sourceSystem] ?? l.sourceSystem}
            </span>

            <span style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {l.url ? (
                <a href={l.url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
                  {l.name}
                </a>
              ) : (
                l.name
              )}
            </span>

            {l.primaryMetricLabel && (
              <span style={{ fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>
                {l.primaryMetricLabel}: <strong>{l.primaryMetricValue ?? "—"}</strong>
              </span>
            )}

            {l.status && (
              <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>
                {l.status}
              </span>
            )}

            <button
              onClick={() => startEdit(l)}
              style={{ fontSize: 11, border: "none", background: "none", cursor: "pointer", color: "#6b7280" }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(l.id)}
              style={{ fontSize: 11, border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
            >
              ×
            </button>
          </div>
        ))}
        {links.length === 0 && !adding && (
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            No external campaigns linked. Connect HubSpot, Mailchimp, or custom sources.
          </p>
        )}
      </div>
    </section>
  );
}
