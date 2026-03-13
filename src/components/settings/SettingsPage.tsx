"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { SecuritySettingsForm } from "./SecuritySettingsForm";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { BillingSettingsSection } from "./BillingSettingsSection";
import { ToastMessage } from "./ToastMessage";
import { useToast } from "./useToast";
import type {
  NotificationSettings,
  OrganizationSettings,
  ProfileSettings,
  SaveResult,
  SettingsResponse,
} from "./types";

type TabKey = "profile" | "security" | "notifications" | "organization" | "billing";

type TabConfig = {
  key: TabKey;
  label: string;
};

function isAdminLike(role: string) {
  const normalized = role.toLowerCase();
  return normalized === "admin" || normalized === "owner";
}

function isOwner(role: string) {
  return role.toLowerCase() === "owner";
}

async function parseSaveResponse(response: Response): Promise<SaveResult> {
  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; message?: string }
    | null;

  if (!response.ok || payload?.success === false) {
    return {
      success: false,
      message: payload?.message ?? "Request failed",
    };
  }

  return { success: true, message: payload?.message };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        // TODO: Wire GET /api/settings to your NestJS settings aggregate endpoint.
        const response = await fetch("/api/settings", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | (SettingsResponse & { message?: string })
          | null;

        if (!response.ok || !payload) {
          throw new Error(payload?.message ?? "Failed to load settings");
        }

        if (isMounted) {
          setSettings(payload);
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Failed to load settings.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const tabs = useMemo<TabConfig[]>(() => {
    if (!settings) return [{ key: "profile", label: "Profile" }];

    const baseTabs: TabConfig[] = [
      { key: "profile", label: "Profile" },
      { key: "security", label: "Security" },
      { key: "notifications", label: "Notifications" },
    ];

    if (settings.organization && isAdminLike(settings.profile.organizationRole)) {
      baseTabs.push({ key: "organization", label: "Organization" });
    }

    if (settings.organization && isOwner(settings.profile.organizationRole)) {
      baseTabs.push({ key: "billing", label: "Billing" });
    }

    return baseTabs;
  }, [settings]);

  useEffect(() => {
    if (!tabs.find((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0]?.key ?? "profile");
    }
  }, [activeTab, tabs]);

  async function saveProfile(payload: Pick<ProfileSettings, "fullName" | "title" | "timezone">) {
    try {
      // TODO: Point this to your real profile settings endpoint in NestJS.
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await parseSaveResponse(response);
      if (result.success) {
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                profile: { ...prev.profile, ...payload },
              }
            : prev,
        );
      }
      return result;
    } catch {
      return { success: false, message: "Could not save profile settings." };
    }
  }

  async function saveNotifications(payload: NotificationSettings) {
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await parseSaveResponse(response);
      if (result.success) {
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                notifications: payload,
              }
            : prev,
        );
      }
      return result;
    } catch {
      return { success: false, message: "Could not save notification settings." };
    }
  }

  async function saveOrganization(payload: Pick<OrganizationSettings, "name" | "defaultCadence">) {
    try {
      const response = await fetch("/api/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await parseSaveResponse(response);
      if (result.success) {
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                organization: prev.organization ? { ...prev.organization, ...payload } : prev.organization,
              }
            : prev,
        );
      }
      return result;
    } catch {
      return { success: false, message: "Could not save organization settings." };
    }
  }

  async function changePassword(payload: { currentPassword: string; newPassword: string }) {
    try {
      const response = await fetch("/api/settings/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      return parseSaveResponse(response);
    } catch {
      return { success: false, message: "Could not change password." };
    }
  }

  async function signOutAllDevices() {
    try {
      const response = await fetch("/api/settings/security/sign-out-all", {
        method: "POST",
        credentials: "include",
      });
      return parseSaveResponse(response);
    } catch {
      return { success: false, message: "Could not sign out all devices." };
    }
  }

  async function saveTwoFactor(required: boolean) {
    try {
      const response = await fetch("/api/settings/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ twoFactorRequired: required }),
      });

      const result = await parseSaveResponse(response);
      if (result.success) {
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                security: {
                  ...prev.security,
                  twoFactorRequired: required,
                },
              }
            : prev,
        );
      }
      return result;
    } catch {
      return { success: false, message: "Could not save security setting." };
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-[#27272a]" />
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="h-9 w-full animate-pulse rounded bg-[#27272a]" />
            <div className="h-9 w-full animate-pulse rounded bg-[#27272a]" />
            <div className="h-24 w-full animate-pulse rounded bg-[#27272a]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <h1 className="text-2xl font-bold text-[#fafafa]">Settings</h1>
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-[#ef4444]">{error ?? "Unable to load settings."}</p>
            <div>
              <Button type="button" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Settings</h1>
        <p className="mt-1 text-sm text-[#71717a]">Manage profile, security, notifications, and organization settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <aside>
          <nav role="tablist" className="flex gap-2 overflow-x-auto rounded-xl border border-[#27272a] bg-[#111113] p-2 md:flex-col">
            {tabs.map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`settings-tab-${tab.key}`}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`settings-panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "bg-[#312e81] font-medium text-[#818cf8]"
                      : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div>
          {activeTab === "profile" && (
            <ProfileSettingsForm data={settings.profile} onSave={saveProfile} onToast={showToast} />
          )}

          {activeTab === "security" && (
            <SecuritySettingsForm
              data={settings.security}
              loginEmail={settings.profile.email}
              onChangePassword={changePassword}
              onSignOutAllDevices={signOutAllDevices}
              onSaveTwoFactor={saveTwoFactor}
              onToast={showToast}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationSettingsForm
              data={settings.notifications}
              onSave={saveNotifications}
              onToast={showToast}
            />
          )}

          {activeTab === "organization" && settings.organization && (
            <OrganizationSettingsForm data={settings.organization} onSave={saveOrganization} onToast={showToast} />
          )}

          {activeTab === "billing" && settings.organization && <BillingSettingsSection organization={settings.organization} />}
        </div>
      </div>

      <ToastMessage toast={toast} />
    </div>
  );
}
