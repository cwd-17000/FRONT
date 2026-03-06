"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  function extractOrgId(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") return null;

    const data = payload as Record<string, unknown>;

    if (typeof data.orgId === "string" && data.orgId) return data.orgId;
    if (typeof data.organizationId === "string" && data.organizationId) return data.organizationId;
    if (typeof data.id === "string" && data.id) return data.id;

    const org = data.org;
    if (org && typeof org === "object") {
      const orgRecord = org as Record<string, unknown>;
      if (typeof orgRecord.id === "string" && orgRecord.id) return orgRecord.id;
    }

    const organization = data.organization;
    if (organization && typeof organization === "object") {
      const orgRecord = organization as Record<string, unknown>;
      if (typeof orgRecord.id === "string" && orgRecord.id) return orgRecord.id;
    }

    return null;
  }

  async function handleGoToDashboard() {
    let shouldSetSubmitting = false;

    try {
      setError(null);
      setIsSubmitting(true);
      shouldSetSubmitting = true;

      const meRes = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      const meData = meRes.ok ? await meRes.json().catch(() => null) : null;
      const hasActiveOrg =
        meData &&
        typeof meData === "object" &&
        "activeOrgId" in meData &&
        Boolean((meData as { activeOrgId?: unknown }).activeOrgId);

      if (!hasActiveOrg) {
        let orgIdToActivate = createdOrgId;

        if (!orgIdToActivate) {
          const orgsRes = await fetch("/api/organizations", {
            credentials: "include",
            cache: "no-store",
          });

          if (orgsRes.ok) {
            const orgsData = await orgsRes.json().catch(() => null);
            if (Array.isArray(orgsData) && orgsData.length > 0) {
              const firstOrg = orgsData[0];
              if (firstOrg && typeof firstOrg === "object") {
                const firstOrgRecord = firstOrg as Record<string, unknown>;
                if (typeof firstOrgRecord.id === "string" && firstOrgRecord.id) {
                  orgIdToActivate = firstOrgRecord.id;
                }
              }
            }
          }
        }

        if (orgIdToActivate) {
          await fetch("/api/organizations/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgId: orgIdToActivate }),
            credentials: "include",
          });
        }
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Unable to continue to dashboard. Please try again.");
    } finally {
      if (shouldSetSubmitting) {
        setIsSubmitting(false);
      }
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setJoinCode(data.joinCode);
        setCreatedOrgId(extractOrgId(data));
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Failed to create organization (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (joinCode) {
    return (
      <div style={{ padding: 40, maxWidth: 480 }}>
        <h1>Organization Created!</h1>
        <p>Share this join code with your team members:</p>
        <div
          style={{
            fontSize: 28,
            fontWeight: "bold",
            letterSpacing: 4,
            padding: "16px 24px",
            background: "#f4f4f4",
            borderRadius: 8,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          {joinCode}
        </div>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
          Save this code — team members will need it to join your organization.
        </p>
        <button
          onClick={handleGoToDashboard}
          disabled={isSubmitting}
          style={{ padding: "12px 24px", fontSize: 16 }}
        >
          {isSubmitting ? "Opening..." : "Go to Dashboard"}
        </button>
        {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 480 }}>
      <h1>Create Organization</h1>
      <form onSubmit={handleCreate}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Organization name
        </label>
        <input
          placeholder="e.g. Acme Marketing"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", fontSize: 16 }}
        />
        <br /><br />
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          style={{ padding: "12px 24px", fontSize: 16 }}
        >
          {isSubmitting ? "Creating..." : "Create Organization"}
        </button>
        {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
      </form>
      <p style={{ marginTop: 16 }}>
        <a href="/onboarding">← Back</a>
      </p>
    </div>
  );
}
