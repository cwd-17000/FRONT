"use client";

import { useState } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const inputClass =
  "w-full h-9 rounded-lg border border-[#3f3f46] bg-[#09090b] px-3 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

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
    <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">
          External Campaigns ({links.length})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { resetForm(); setEditingId(null); setAdding((a) => !a); }}
          className="gap-1 text-xs"
        >
          {adding ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Link campaign</>}
        </Button>
      </div>

      {adding && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#09090b] border border-[#27272a]"
        >
          <select
            value={form.sourceSystem}
            onChange={(e) => setForm((f) => ({ ...f, sourceSystem: e.target.value }))}
            className={inputClass + " col-span-2 bg-[#09090b]"}
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
            className={inputClass}
          />
          <input
            required
            placeholder="External ID"
            value={form.externalId}
            onChange={(e) => setForm((f) => ({ ...f, externalId: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Status (e.g. active)"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="URL (optional deep-link)"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Primary metric label"
            value={form.primaryMetricLabel}
            onChange={(e) => setForm((f) => ({ ...f, primaryMetricLabel: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Primary metric value"
            value={form.primaryMetricValue}
            onChange={(e) => setForm((f) => ({ ...f, primaryMetricValue: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Secondary metric label"
            value={form.secondaryMetricLabel}
            onChange={(e) => setForm((f) => ({ ...f, secondaryMetricLabel: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Secondary metric value"
            value={form.secondaryMetricValue}
            onChange={(e) => setForm((f) => ({ ...f, secondaryMetricValue: e.target.value }))}
            className={inputClass}
          />
          <Button type="submit" disabled={saving} className="col-span-2">
            {saving ? "Saving…" : editingId ? "Update link" : "Save link"}
          </Button>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {links.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 py-2 border-b border-[#27272a] last:border-0 text-sm"
          >
            <Badge variant="default" className="text-[10px] shrink-0">
              {SOURCE_LABELS[l.sourceSystem] ?? l.sourceSystem}
            </Badge>

            <span className="font-medium flex-1 min-w-0 truncate text-[#fafafa]">
              {l.url ? (
                <a href={l.url} target="_blank" rel="noreferrer" className="text-[#818cf8] hover:text-[#6366f1] transition-colors">
                  {l.name}
                </a>
              ) : (
                l.name
              )}
            </span>

            {l.primaryMetricLabel && (
              <span className="text-xs text-[#71717a] whitespace-nowrap">
                {l.primaryMetricLabel}: <strong className="text-[#fafafa]">{l.primaryMetricValue ?? "—"}</strong>
              </span>
            )}

            {l.status && (
              <span className="text-xs text-[#52525b] whitespace-nowrap">{l.status}</span>
            )}

            <button
              onClick={() => startEdit(l)}
              className="text-[#71717a] hover:text-[#fafafa] transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => handleDelete(l.id)}
              className="text-[#71717a] hover:text-[#ef4444] transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {links.length === 0 && !adding && (
          <p className="text-sm text-[#52525b]">
            No external campaigns linked. Connect HubSpot, Mailchimp, or custom sources.
          </p>
        )}
      </div>
    </section>
  );
}
