"use client";
import { useRouter } from "next/navigation";

interface Org {
  id: string;
  name: string;
}

export default function OrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: Org[];
  activeOrgId: string;
}) {
  const router = useRouter();

  async function handleSwitch(orgId: string) {
    if (orgId === activeOrgId) return;

    const res = await fetch("/api/organizations/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
      credentials: "include",
    });

    if (res.ok) {
      router.refresh(); // re-render server components with new JWT context
    }
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId);

  return (
    <div>
      <p>
        Active: <strong>{activeOrg?.name ?? "Unknown"}</strong>
      </p>

      {orgs.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: "#666", fontSize: 14 }}>Switch organization:</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {orgs
              .filter((o) => o.id !== activeOrgId)
              .map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  style={{ padding: "6px 16px" }}
                >
                  {org.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
