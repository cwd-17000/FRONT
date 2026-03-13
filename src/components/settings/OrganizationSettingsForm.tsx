"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CadenceOption, OrganizationSettings, SaveResult } from "./types";

type OrganizationSettingsFormProps = {
  data: OrganizationSettings;
  onSave: (payload: Pick<OrganizationSettings, "name" | "defaultCadence">) => Promise<SaveResult>;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
};

const CADENCE_OPTIONS: CadenceOption[] = ["Monthly", "Quarterly", "Semi-Annual", "Annual"];

export function OrganizationSettingsForm({ data, onSave, onToast }: OrganizationSettingsFormProps) {
  const [name, setName] = useState(data.name);
  const [defaultCadence, setDefaultCadence] = useState<CadenceOption>(data.defaultCadence);
  const [saving, setSaving] = useState(false);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(data.name);
    setDefaultCadence(data.defaultCadence);
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave({
        name: name.trim(),
        defaultCadence,
      });
      if (!result.success) {
        setError(result.message ?? "Could not save organization settings.");
        return;
      }

      onToast("Organization settings saved.", "success");
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setLogoFileName(file?.name ?? null);
    // TODO: Wire this to your org logo upload endpoint once storage is chosen.
    if (file) {
      onToast(`Selected logo: ${file.name}`, "info");
    }
  }

  return (
    <section role="tabpanel" aria-labelledby="settings-tab-organization" id="settings-panel-organization">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              error={error ?? undefined}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="defaultCadence" className="text-sm font-medium text-[#a1a1aa]">
                Default OKR cadence
              </label>
              <select
                id="defaultCadence"
                value={defaultCadence}
                onChange={(e) => setDefaultCadence(e.target.value as CadenceOption)}
                disabled={saving}
                className="h-9 w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {CADENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 rounded-lg border border-[#27272a] bg-[#111113] p-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#71717a]">Slug / short code</p>
                <p className="text-sm text-[#fafafa]">{data.slug}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717a]">Industry</p>
                <p className="text-sm text-[#fafafa]">{data.industry || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717a]">Current plan</p>
                <p className="text-sm text-[#fafafa]">{data.plan}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717a]">Member count</p>
                <p className="text-sm text-[#fafafa]">{data.membersCount}</p>
              </div>
            </div>

            <div className="rounded-lg border border-[#27272a] bg-[#111113] p-3">
              <label htmlFor="orgLogo" className="text-sm font-medium text-[#a1a1aa]">
                Workspace / org logo
              </label>
              <input
                id="orgLogo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="mt-2 block w-full text-xs text-[#a1a1aa] file:mr-3 file:rounded-md file:border file:border-[#3f3f46] file:bg-[#27272a] file:px-3 file:py-1.5 file:text-xs file:text-[#fafafa]"
              />
              <p className="mt-2 text-xs text-[#71717a]">{logoFileName ? `Selected file: ${logoFileName}` : "No logo selected"}</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save organization settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
