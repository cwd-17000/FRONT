"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationSettings, SaveResult } from "./types";

type NotificationSettingsFormProps = {
  data: NotificationSettings;
  onSave: (payload: NotificationSettings) => Promise<SaveResult>;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
};

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#27272a] bg-[#111113] p-3">
      <div className="space-y-0.5">
        <p className="text-sm text-[#fafafa]">{label}</p>
        <p className="text-xs text-[#71717a]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full border transition-colors ${
          checked ? "border-[#6366f1] bg-[#6366f1]" : "border-[#3f3f46] bg-[#27272a]"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsForm({ data, onSave, onToast }: NotificationSettingsFormProps) {
  const [form, setForm] = useState<NotificationSettings>(data);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(data);
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await onSave(form);
      if (!result.success) {
        onToast(result.message ?? "Failed to save notification preferences.", "error");
        return;
      }
      onToast("Notification preferences saved.", "success");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section role="tabpanel" aria-labelledby="settings-tab-notifications" id="settings-panel-notifications">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            label="Email: weekly OKR summary"
            description="Receive a weekly snapshot of objective and key result progress."
            checked={form.weeklySummaryEmail}
            disabled={saving}
            onChange={(checked) => setForm((prev) => ({ ...prev, weeklySummaryEmail: checked }))}
          />

          <ToggleRow
            label="Email: check-in reminders"
            description="Get reminders when it is time to submit check-ins."
            checked={form.checkInRemindersEmail}
            disabled={saving}
            onChange={(checked) => setForm((prev) => ({ ...prev, checkInRemindersEmail: checked }))}
          />

          <ToggleRow
            label="Email: @mention and comment notifications"
            description="Be notified when teammates mention you or comment on your work."
            checked={form.mentionsEmail}
            disabled={saving}
            onChange={(checked) => setForm((prev) => ({ ...prev, mentionsEmail: checked }))}
          />

          <ToggleRow
            label="In-app: product updates and tips"
            description="See product announcements and usage tips in-app."
            checked={form.productUpdatesInApp}
            disabled={saving}
            onChange={(checked) => setForm((prev) => ({ ...prev, productUpdatesInApp: checked }))}
          />

          <div className="flex justify-end pt-1">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save notification preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
