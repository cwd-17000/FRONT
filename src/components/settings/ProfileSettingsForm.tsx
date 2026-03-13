"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileSettings, SaveResult } from "./types";

type ProfileSettingsFormProps = {
  data: ProfileSettings;
  onSave: (payload: Pick<ProfileSettings, "fullName" | "title" | "timezone">) => Promise<SaveResult>;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
};

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function ProfileSettingsForm({ data, onSave, onToast }: ProfileSettingsFormProps) {
  const [fullName, setFullName] = useState(data.fullName);
  const [title, setTitle] = useState(data.title);
  const [timezone, setTimezone] = useState(data.timezone || "UTC");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setFullName(data.fullName);
    setTitle(data.title);
    setTimezone(data.timezone || "UTC");
  }, [data]);

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [fullName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave({
        fullName: fullName.trim(),
        title: title.trim(),
        timezone,
      });
      if (!result.success) {
        setError(result.message ?? "Failed to save profile settings.");
        return;
      }
      onToast("Profile settings saved.", "success");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      // TODO: Replace with your real account deletion endpoint in NestJS.
      const response = await fetch("/api/settings/account", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        onToast(payload?.message ?? "Could not delete account.", "error");
        return;
      }

      onToast("Account deleted successfully.", "success");
    } catch {
      onToast("Request failed. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4" role="tabpanel" aria-labelledby="settings-tab-profile" id="settings-panel-profile">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-[#27272a] bg-[#111113] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#27272a] text-sm font-semibold text-[#fafafa]">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-[#fafafa]">Avatar placeholder</p>
              <p className="text-xs text-[#71717a]">Upload support can be wired later.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              error={error ?? undefined}
              disabled={saving}
            />

            <Input label="Work email" value={data.email} disabled readOnly />

            <Input
              label="Job title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Marketing Director"
              disabled={saving}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="timezone" className="text-sm font-medium text-[#a1a1aa]">
                Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={saving}
                className="h-9 w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 rounded-lg border border-[#27272a] bg-[#111113] p-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#71717a]">Primary organization</p>
                <p className="text-sm text-[#fafafa]">{data.organizationName}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717a]">Role</p>
                <p className="text-sm capitalize text-[#fafafa]">{data.organizationRole}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#ef4444]/30">
        <CardHeader>
          <CardTitle className="text-[#ef4444]">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[#a1a1aa]">
            Deleting your account is permanent. If you are the last owner of an organization, the backend may block this action until ownership is transferred.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete personal account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
