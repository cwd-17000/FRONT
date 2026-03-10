"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

interface Campaign {
  id: string;
  name: string;
  status: string;
  initiativeName?: string;
}

interface Draft {
  id: string;
  name: string;
  approvalStatus: string;
  updatedAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned:   "#6b7280",
  active:    "#16a34a",
  paused:    "#d97706",
  completed: "#2563eb",
  archived:  "#9ca3af",
};

const APPROVAL_COLORS: Record<string, string> = {
  draft:    "#6b7280",
  pending:  "#d97706",
  approved: "#16a34a",
  rejected: "#dc2626",
};

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const router = useRouter();
  const { me, loading: meLoading } = useMe();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }

    const orgId = me.activeOrgId;

    async function load() {
      try {
        const [campaignsRes, draftsRes] = await Promise.all([
          fetch(`/api/organizations/${orgId}/campaigns`, { credentials: "include" }),
          fetch(`/api/organizations/${orgId}/campaigns/${campaignId}/drafts`, { credentials: "include" }),
        ]);

        if (campaignsRes.ok) {
          const all: Campaign[] = await campaignsRes.json();
          setCampaign(all.find((c) => c.id === campaignId) ?? null);
        }

        if (draftsRes.ok) {
          setDrafts(await draftsRes.json());
        }
      } catch {
        setError("Failed to load campaign data.");
      } finally {
        setDataLoading(false);
      }
    }

    load();
  }, [me, meLoading, campaignId, router]);

  async function handleNewDraft() {
    if (!me?.activeOrgId) return;
    setIsCreatingDraft(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${me.activeOrgId}/campaigns/${campaignId}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject: "", body: "" }),
      });

      if (res.ok) {
        const draft: Draft = await res.json();
        router.push(`/dashboard/campaigns/${campaignId}/drafts/${draft.id}`);
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Failed to create draft (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsCreatingDraft(false);
    }
  }

  if (meLoading || dataLoading) {
    return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;
  }

  if (!campaign) {
    return (
      <div style={{ padding: 40 }}>
        <p style={{ color: "#666" }}>Campaign not found.</p>
        <Link href="/dashboard/campaigns">← Back to Campaigns</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      {/* Campaign header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>{campaign.name}</h1>
          {campaign.initiativeName && (
            <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
              Initiative: {campaign.initiativeName}
            </p>
          )}
        </div>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: 12,
          background: "#f3f4f6",
          color: STATUS_COLORS[campaign.status] ?? "#333",
          textTransform: "capitalize",
          whiteSpace: "nowrap",
          marginTop: 4,
        }}>
          {campaign.status}
        </span>
      </div>

      {/* Drafts section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Drafts</h2>
          <button
            onClick={handleNewDraft}
            disabled={isCreatingDraft}
            style={{ padding: "8px 18px", fontSize: 14 }}
          >
            {isCreatingDraft ? "Creating..." : "+ New Draft"}
          </button>
        </div>

        {error && <p style={{ color: "crimson", marginBottom: 12 }}>{error}</p>}

        {(drafts ?? []).length === 0 ? (
          <div style={{ padding: "32px 0", color: "#666", fontSize: 14 }}>
            No drafts yet. Create your first draft to start building content.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(drafts ?? []).map((draft) => (
              <Link
                key={draft.id}
                href={`/dashboard/campaigns/${campaignId}/drafts/${draft.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  cursor: "pointer",
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>{draft.name}</h3>
                    {draft.updatedAt && (
                      <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
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
                    color: APPROVAL_COLORS[draft.approvalStatus] ?? "#333",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                  }}>
                    {draft.approvalStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard/campaigns">← Back to Campaigns</Link>
      </div>
    </div>
  );
}
