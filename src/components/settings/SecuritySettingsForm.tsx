"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SaveResult, SecuritySettings } from "./types";

type SecuritySettingsFormProps = {
  data: SecuritySettings;
  loginEmail: string;
  onChangePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<SaveResult>;
  onSignOutAllDevices: () => Promise<SaveResult>;
  onSaveTwoFactor: (required: boolean) => Promise<SaveResult>;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
};

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "••••";
  if (name.length <= 2) return `${name[0] ?? ""}•@${domain}`;
  return `${name[0]}${"•".repeat(Math.max(name.length - 2, 1))}${name[name.length - 1]}@${domain}`;
}

function getStrengthHint(password: string) {
  if (!password) return "Use at least 8 characters with a mix of letters, numbers, and symbols.";

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return "Weak password";
  if (score <= 3) return "Decent password";
  return "Strong password";
}

export function SecuritySettingsForm({
  data,
  loginEmail,
  onChangePassword,
  onSignOutAllDevices,
  onSaveTwoFactor,
  onToast,
}: SecuritySettingsFormProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(data.twoFactorRequired);
  const [savingTwoFactor, setSavingTwoFactor] = useState(false);

  const strengthHint = useMemo(() => getStrengthHint(newPassword), [newPassword]);

  const formattedLastPasswordChange = data.lastPasswordChange
    ? new Date(data.lastPasswordChange).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not available";

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation must match.");
      return;
    }

    setChangingPassword(true);
    try {
      const result = await onChangePassword({
        currentPassword,
        newPassword,
      });

      if (!result.success) {
        setPasswordError(result.message ?? "Password update failed.");
        return;
      }

      setPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onToast("Password updated successfully.", "success");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSignOutAll() {
    setSigningOutAll(true);
    try {
      const result = await onSignOutAllDevices();
      if (!result.success) {
        onToast(result.message ?? "Failed to sign out all devices.", "error");
        return;
      }
      onToast("Signed out of all devices.", "success");
    } finally {
      setSigningOutAll(false);
    }
  }

  async function handleToggleTwoFactor(value: boolean) {
    setTwoFactorRequired(value);
    setSavingTwoFactor(true);

    try {
      const result = await onSaveTwoFactor(value);
      if (!result.success) {
        setTwoFactorRequired((prev) => !prev);
        onToast(result.message ?? "Failed to update security setting.", "error");
        return;
      }

      onToast("Security preference updated.", "success");
    } finally {
      setSavingTwoFactor(false);
    }
  }

  return (
    <section role="tabpanel" aria-labelledby="settings-tab-security" id="settings-panel-security" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-[#27272a] bg-[#111113] p-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[#71717a]">Login email</p>
              <p className="text-sm text-[#fafafa]">{maskEmail(loginEmail)}</p>
            </div>
            <div>
              <p className="text-xs text-[#71717a]">Last password change</p>
              <p className="text-sm text-[#fafafa]">{formattedLastPasswordChange}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-[#27272a] bg-[#111113] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setPasswordModalOpen(true)}>
                Change password
              </Button>
              <Button type="button" variant="outline" onClick={handleSignOutAll} disabled={signingOutAll}>
                {signingOutAll ? "Signing out..." : "Sign out of all devices"}
              </Button>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-[#27272a] p-3">
              <div>
                <p className="text-sm text-[#fafafa]">Require 2FA for sensitive actions</p>
                <p className="text-xs text-[#71717a]">Toggle an additional verification check for protected account updates.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Require 2FA for sensitive actions"
                aria-checked={twoFactorRequired}
                disabled={savingTwoFactor}
                onClick={() => handleToggleTwoFactor(!twoFactorRequired)}
                className={`relative h-6 w-11 rounded-full border transition-colors ${
                  twoFactorRequired ? "border-[#6366f1] bg-[#6366f1]" : "border-[#3f3f46] bg-[#27272a]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    twoFactorRequired ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {passwordModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="w-full max-w-md rounded-xl border border-[#27272a] bg-[#18181b] p-5 shadow-[0_10px_30px_0_rgb(0,0,0,0.6)]"
          >
            <h3 id="change-password-title" className="text-base font-semibold text-[#fafafa]">
              Change password
            </h3>
            <p className="mt-1 text-xs text-[#71717a]">Use a unique password you do not use elsewhere.</p>

            <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
              <Input
                type="password"
                label="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={changingPassword}
              />
              <Input
                type="password"
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={changingPassword}
              />
              <Input
                type="password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={changingPassword}
              />

              <p className="text-xs text-[#71717a]">Strength hint: {strengthHint}</p>
              {passwordError && <p className="text-xs text-[#ef4444]">{passwordError}</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPasswordModalOpen(false)}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Saving..." : "Update password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
