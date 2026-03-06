"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinOrgPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function extractOrgId(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") return null;

    const data = payload as Record<string, unknown>;

    if (typeof data.orgId === "string" && data.orgId) return data.orgId;
    if (typeof data.organizationId === "string" && data.organizationId) return data.organizationId;

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

  async function handleJoin(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setIsSubmitting(true);

  try {
    const res = await fetch("/api/organizations/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
      credentials: "include",
    });

    if (res.ok) {
      window.location.assign("/dashboard"); // new cookie is already set
      return;
    }

    const errorText = await res.text();
    setError(errorText || `Failed to join organization (${res.status})`);
  } catch {
    setError("Unable to reach the server. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
}


  return (
    <div style={{ padding: 40, maxWidth: 480 }}>
      <h1>Join Organization</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Enter the join code provided by your organization admin.
      </p>
      <form onSubmit={handleJoin}>
        <input
          placeholder="e.g. XK92TF3A"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        />
        <br /><br />
        <button
          type="submit"
          disabled={isSubmitting || !joinCode.trim()}
          style={{ padding: "12px 24px", fontSize: 16 }}
        >
          {isSubmitting ? "Joining..." : "Join Organization"}
        </button>
        {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
      </form>
      <p style={{ marginTop: 16 }}>
        <a href="/onboarding">← Back</a>
      </p>
    </div>
  );
}
