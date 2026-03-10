"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

interface Campaign {
  id: string;
  name: string;
}

interface Draft {
  id: string;
  name: string;
  approvalStatus: "pending" | "approved" | "rejected";
  updatedAt?: string;
  campaignId: string;
  campaignName: string;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending Review", color: "#d97706" },
  approved: { label: "Approved",       color: "#16a34a" },
  rejected: { label: "Rejected",       color: "#dc2626" },
};

type ApprovalStatus = "pending" | "approved" | "rejected";

const SECTIONS: Array<{ key: ApprovalStatus; heading: string }> = [
  { key: "pending",  heading: "Pending Review" },
  { key: "approved", heading: "Approved" },
  { key: "rejected", heading: "Rejected" },
];

export default function ApprovalsPage() {
  const router = useRouter();
  const { me, loading: meLoading } = useMe();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }

    const orgId = me.activeOrgId;

    async function load() {
      try {
        const campaignsRes = await fetch(
          `/api/organizations/${orgId}/campaigns`,
          { credentials: "include" }
        );
        if (!campaignsRes.ok) { setDataLoading(false); return; }

        const campaigns: Campaign[] = await campaignsRes.json();

        const draftResults = await Promise.all(
          (campaigns ?? []).map((campaign) =>
            fetch(
              `/api/organizations/${orgId}/campaigns/${campaign.id}/drafts`,
              { credentials: "include" }
            )
              .then((r) => r.ok ? r.json() : [])
              .catch(() => [])
              .then((ds: Omit<Draft, "campaignId" | "campaignName">[]) =>
                (ds ?? []).map((d) => ({
                  ...d,
                  campaignId: campaign.id,
                  campaignName: campaign.name,
                }))
              )
          )
        );

        setDrafts((draftResults ?? []).flat());
      } catch {
        setError("Failed to load approvals.");
      } finally {
        setDataLoading(false);
      }
    }

    load();
  }, [me, meLoading, router]);

  const grouped: Record<ApprovalStatus, Draft[]> = {
    pending:  (drafts ?? []).filter((d) => d.approvalStatus === "pending"),
    approved: (drafts ?? []).filter((d) => d.approvalStatus === "approved"),
    rejected: (drafts ?? []).filter((d) => d.approvalStatus === "rejected"),
  };

  const totalDrafts = (drafts ?? []).length;

  if (meLoading || dataLoading) {
    return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Approvals</h1>
        {totalDrafts > 0 && (
          <span style={{ fontSize: 13, color: "#888" }}>
            {grouped.pending.length} pending · {totalDrafts} total
          </span>
        )}
      </div>

      {error && <p style={{ color: "crimson", marginBottom: 16 }}>{error}</p>}

      {totalDrafts === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
          <p>No drafts found. Drafts will appear here once campaigns have content to review.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {SECTIONS.map(({ key, heading }) => {
            const sectionDrafts = grouped[key];
            const badge = STATUS_BADGE[key];

            return (
              <div key={key}>
                <h2 style={{
                  margin: "0 0 12px",
                  fontSize: key === "pending" ? 18 : 16,
                  fontWeight: key === "pending" ? 700 : 600,
                  color: badge.color,
                }}>
                  {heading} ({sectionDrafts.length})
                </h2>

                {(sectionDrafts ?? []).length === 0 ? (
                  <div style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>
                    No {heading.toLowerCase()} drafts.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(sectionDrafts ?? []).map((draft) => (
                      <Link
                        key={draft.id}
                        href={`/dashboard/campaigns/${draft.campaignId}/drafts/${draft.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div style={{
                          border: `1px solid ${key === "pending" ? "#fde68a" : "#e5e7eb"}`,
                          borderRadius: 8,
                          padding: 16,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          cursor: "pointer",
                          background: key === "pending" ? "#fffbeb" : "#fff",
                        }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 15 }}>{draft.name}</h3>
                            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
                              Campaign: {draft.campaignName}
                            </p>
                            {draft.updatedAt && (
                              <p style={{ fontSize: 12, color: "#aaa", margin: "4px 0 0" }}>
                                Last edited: {new Date(draft.updatedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 12,
                            background: "#f3f4f6",
                            color: badge.color,
                            whiteSpace: "nowrap",
                          }}>
                            {badge.label}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
