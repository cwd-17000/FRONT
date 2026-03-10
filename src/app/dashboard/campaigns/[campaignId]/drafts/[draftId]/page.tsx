"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ─── Auth helpers ──────────────────────────────────────────────────────────────

function getAuthInfo(): { orgId: string | null; permissions: string[] } {
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (!match) return { orgId: null, permissions: [] };
  try {
    const base64 = match[1].split(".")[1];
    const decoded = JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      orgId: decoded.activeOrgId ?? null,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
    };
  } catch {
    return { orgId: null, permissions: [] };
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Draft {
  id: string;
  name: string;
  subject: string;
  body: string;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface Version {
  id: string;
  label?: string;
  createdAt: string;
}

interface Comment {
  id: string;
  author: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const APPROVAL_COLORS: Record<string, string> = {
  draft:    "#6b7280",
  pending:  "#d97706",
  approved: "#16a34a",
  rejected: "#dc2626",
};

const AUTOSAVE_INTERVAL_MS = 30_000;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DraftEditorPage() {
  const { campaignId, draftId } = useParams<{ campaignId: string; draftId: string }>();
  const router = useRouter();

  // Editor state
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectInput, setRejectInput] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [showVersionLabel, setShowVersionLabel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Version history
  const [versions, setVersions] = useState<Version[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Permissions
  const [canApprove, setCanApprove] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Autosave tracking
  const lastSavedRef = useRef({ subject: "", body: "" });
  const hasChanges = useCallback(
    () => subject !== lastSavedRef.current.subject || body !== lastSavedRef.current.body,
    [subject, body]
  );

  // ── Base URL helper ──
  const base = orgId
    ? `/api/organizations/${orgId}/campaigns/${campaignId}/drafts/${draftId}`
    : null;

  // ── Initial load ──
  useEffect(() => {
    const { orgId: id, permissions } = getAuthInfo();
    if (!id) { router.push("/login"); return; }
    setOrgId(id);
    setCanApprove(permissions.includes("drafts.approve"));

    const apiBase = `/api/organizations/${id}/campaigns/${campaignId}/drafts/${draftId}`;

    async function load() {
      try {
        const [draftRes, versionsRes, commentsRes] = await Promise.all([
          fetch(apiBase,              { credentials: "include" }),
          fetch(`${apiBase}/versions`, { credentials: "include" }),
          fetch(`${apiBase}/comments`, { credentials: "include" }),
        ]);

        if (draftRes.ok) {
          const d: Draft = await draftRes.json();
          setDraft(d);
          setName(d.name);
          setSubject(d.subject ?? "");
          setBody(d.body ?? "");
          lastSavedRef.current = { subject: d.subject ?? "", body: d.body ?? "" };
        }
        if (versionsRes.ok) setVersions(await versionsRes.json());
        if (commentsRes.ok) setComments(await commentsRes.json());
      } catch {
        setActionError("Failed to load draft.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [campaignId, draftId, router]);

  // ── Autosave every 30 s if changes detected ──
  useEffect(() => {
    if (!base) return;
    const timer = setInterval(async () => {
      if (!hasChanges()) return;
      try {
        const res = await fetch(`${base}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ subject, body }),
        });
        if (res.ok) lastSavedRef.current = { subject, body };
      } catch { /* silent */ }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [base, subject, body, hasChanges]);

  // ── Rename on blur ──
  async function handleRenameBlur() {
    if (!base || name === draft?.name) return;
    try {
      const res = await fetch(`${base}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (res.ok) setDraft((prev) => prev ? { ...prev, name } : prev);
    } catch { /* silent */ }
  }

  // ── Save version ──
  async function handleSaveVersion() {
    if (!base) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`${base}/save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject,
          body,
          label: versionLabel.trim() || undefined,
        }),
      });
      if (res.ok) {
        const saved: Version = await res.json();
        setVersions((prev) => [saved, ...(prev ?? [])]);
        lastSavedRef.current = { subject, body };
        setVersionLabel("");
        setShowVersionLabel(false);
      } else {
        setActionError(`Save failed (${res.status})`);
      }
    } catch {
      setActionError("Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Submit for approval ──
  async function handleSubmit() {
    if (!base) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`${base}/submit`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setDraft((prev) => prev ? { ...prev, approvalStatus: "pending" } : prev);
      } else {
        setActionError(`Submit failed (${res.status})`);
      }
    } catch {
      setActionError("Unable to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Approve ──
  async function handleApprove() {
    if (!base) return;
    setApproving(true);
    setActionError(null);
    try {
      const res = await fetch(`${base}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setDraft((prev) => prev ? { ...prev, approvalStatus: "approved" } : prev);
      } else {
        setActionError(`Approve failed (${res.status})`);
      }
    } catch {
      setActionError("Unable to approve. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  // ── Reject ──
  async function handleReject() {
    if (!base) return;
    setRejecting(true);
    setActionError(null);
    try {
      const res = await fetch(`${base}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: rejectInput.trim() }),
      });
      if (res.ok) {
        setDraft((prev) =>
          prev ? { ...prev, approvalStatus: "rejected", rejectionReason: rejectInput.trim() } : prev
        );
        setShowRejectInput(false);
        setRejectInput("");
      } else {
        setActionError(`Reject failed (${res.status})`);
      }
    } catch {
      setActionError("Unable to reject. Please try again.");
    } finally {
      setRejecting(false);
    }
  }

  // ── Restore version ──
  async function handleRestore(versionId: string) {
    if (!base) return;
    setRestoringId(versionId);
    setActionError(null);
    try {
      const res = await fetch(`${base}/versions/${versionId}/restore`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const restored: Draft = await res.json();
        setSubject(restored.subject ?? "");
        setBody(restored.body ?? "");
        lastSavedRef.current = { subject: restored.subject ?? "", body: restored.body ?? "" };
      } else {
        setActionError(`Restore failed (${res.status})`);
      }
    } catch {
      setActionError("Unable to restore version.");
    } finally {
      setRestoringId(null);
    }
  }

  // ── Post comment ──
  async function handlePostComment() {
    if (!base || !newComment.trim()) return;
    setPostingComment(true);
    setActionError(null);
    try {
      const res = await fetch(`${base}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: newComment.trim() }),
      });
      if (res.ok) {
        const comment: Comment = await res.json();
        setComments((prev) => [...(prev ?? []), comment]);
        setNewComment("");
      } else {
        setActionError(`Comment failed (${res.status})`);
      }
    } catch {
      setActionError("Unable to post comment.");
    } finally {
      setPostingComment(false);
    }
  }

  // ── Resolve / reopen comment ──
  async function handleToggleComment(commentId: string, resolved: boolean) {
    if (!base) return;
    const action = resolved ? "reopen" : "resolve";
    try {
      const res = await fetch(`${base}/comments/${commentId}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setComments((prev) =>
          (prev ?? []).map((c) => c.id === commentId ? { ...c, resolved: !resolved } : c)
        );
      }
    } catch { /* silent */ }
  }

  // ── Render ──
  if (loading) {
    return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;
  }

  if (!draft) {
    return (
      <div style={{ padding: 40 }}>
        <p style={{ color: "#666" }}>Draft not found.</p>
        <Link href={`/dashboard/campaigns/${campaignId}`}>← Back to Campaign</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1200 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, fontSize: 13, color: "#888" }}>
        <Link href={`/dashboard/campaigns/${campaignId}`} style={{ color: "#888" }}>
          ← Back to Campaign
        </Link>
      </div>

      {actionError && (
        <p style={{ color: "crimson", marginBottom: 16 }}>{actionError}</p>
      )}

      {/* Two-panel layout */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

        {/* ── LEFT: Editor ── */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Draft name */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRenameBlur}
            style={{
              fontSize: 22,
              fontWeight: 700,
              border: "none",
              borderBottom: "2px solid #e5e7eb",
              padding: "4px 0",
              width: "100%",
              background: "transparent",
              outline: "none",
            }}
          />

          {/* Subject */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Subject line
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line..."
              style={{ width: "100%", padding: "10px", fontSize: 15 }}
            />
          </div>

          {/* Body */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              placeholder="Write your campaign content here..."
              style={{ width: "100%", padding: "10px", fontSize: 15, resize: "vertical" }}
            />
          </div>

          {/* Save version */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {showVersionLabel ? (
              <>
                <input
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="Version label (optional)"
                  style={{ padding: "8px 10px", fontSize: 14, flex: 1, minWidth: 180 }}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveVersion()}
                />
                <button
                  onClick={handleSaveVersion}
                  disabled={saving}
                  style={{ padding: "8px 16px", fontSize: 14 }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setShowVersionLabel(false); setVersionLabel(""); }}
                  style={{ padding: "8px 14px", fontSize: 14 }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowVersionLabel(true)}
                style={{ padding: "8px 18px", fontSize: 14 }}
              >
                Save Version
              </button>
            )}

            {draft.approvalStatus === "draft" && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: "8px 18px", fontSize: 14 }}
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Status & Actions ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          minWidth: 220,
          borderLeft: "1px solid #e5e7eb",
          paddingLeft: 28,
        }}>
          {/* Status badge */}
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>
              APPROVAL STATUS
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 12,
              background: "#f3f4f6",
              color: APPROVAL_COLORS[draft.approvalStatus] ?? "#333",
              textTransform: "capitalize",
            }}>
              {draft.approvalStatus}
            </span>
          </div>

          {/* Rejection reason */}
          {draft.approvalStatus === "rejected" && draft.rejectionReason && (
            <div style={{
              padding: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>
                Rejection reason
              </div>
              <div style={{ color: "#333" }}>{draft.rejectionReason}</div>
            </div>
          )}

          {/* Approve / Reject (pending + canApprove) */}
          {draft.approvalStatus === "pending" && canApprove && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleApprove}
                disabled={approving}
                style={{ padding: "10px 0", fontSize: 14, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                {approving ? "Approving..." : "Approve"}
              </button>

              {showRejectInput ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea
                    value={rejectInput}
                    onChange={(e) => setRejectInput(e.target.value)}
                    rows={3}
                    placeholder="Reason for rejection..."
                    style={{ padding: "8px", fontSize: 14, resize: "vertical" }}
                  />
                  <button
                    onClick={handleReject}
                    disabled={rejecting}
                    style={{ padding: "8px 0", fontSize: 14, background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                  >
                    {rejecting ? "Rejecting..." : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => { setShowRejectInput(false); setRejectInput(""); }}
                    style={{ padding: "6px 0", fontSize: 13 }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowRejectInput(true)}
                  style={{ padding: "10px 0", fontSize: 14, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer" }}
                >
                  Reject
                </button>
              )}
            </div>
          )}

          {/* Version history */}
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 500 }}>
              VERSION HISTORY
            </div>
            {(versions ?? []).length === 0 ? (
              <div style={{ fontSize: 13, color: "#aaa" }}>No saved versions yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(versions ?? []).map((v) => (
                  <div key={v.id} style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{v.label || "Untitled"}</div>
                      <div style={{ color: "#888", fontSize: 11 }}>
                        {new Date(v.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(v.id)}
                      disabled={restoringId === v.id}
                      style={{ padding: "4px 10px", fontSize: 12 }}
                    >
                      {restoringId === v.id ? "..." : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Comments ── */}
      <div style={{ marginTop: 48, borderTop: "1px solid #e5e7eb", paddingTop: 32 }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>Comments</h2>

        {(comments ?? []).length === 0 ? (
          <div style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
            No comments yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {(comments ?? []).map((comment) => (
              <div key={comment.id} style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px 16px",
                opacity: comment.resolved ? 0.5 : 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    {comment.author}
                    {comment.resolved && (
                      <span style={{ marginLeft: 8, fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>
                        · resolved
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: comment.resolved ? "#9ca3af" : "#333" }}>
                    {comment.message}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleComment(comment.id, comment.resolved)}
                  style={{ padding: "4px 12px", fontSize: 12, whiteSpace: "nowrap" }}
                >
                  {comment.resolved ? "Reopen" : "Resolve"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostComment()}
            style={{ flex: 1, padding: "10px", fontSize: 14 }}
          />
          <button
            onClick={handlePostComment}
            disabled={postingComment || !newComment.trim()}
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            {postingComment ? "Posting..." : "Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
