"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

interface OrgChartNode {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  title: string | null;
  department: string | null;
  reportingToId: string | null;
}

interface TreeNode extends OrgChartNode {
  children: TreeNode[];
}

function buildTree(nodes: OrgChartNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const n of nodes) map.set(n.membershipId, { ...n, children: [] });

  const roots: TreeNode[] = [];
  for (const n of map.values()) {
    if (n.reportingToId && map.has(n.reportingToId)) {
      map.get(n.reportingToId)!.children.push(n);
    } else {
      roots.push(n);
    }
  }
  return roots;
}

function Avatar({ firstName, lastName, size = 36 }: { firstName: string | null; lastName: string | null; size?: number }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#e5e7eb", display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 700, fontSize: size * 0.36,
      color: "#374151", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function NodeCard({ node }: { node: TreeNode }) {
  const displayName = [node.firstName, node.lastName].filter(Boolean).join(" ") || node.email;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Card */}
      <div style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "14px 20px",
        minWidth: 160,
        maxWidth: 200,
        textAlign: "center",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <Avatar firstName={node.firstName} lastName={node.lastName} size={40} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{displayName}</div>
        {node.title && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{node.title}</div>}
        {node.department && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{node.department}</div>}
        <div style={{
          marginTop: 6, fontSize: 10, fontWeight: 600,
          textTransform: "capitalize", color: node.role === "owner" ? "#7c3aed" : node.role === "admin" ? "#2563eb" : "#6b7280",
        }}>
          {node.role}
        </div>
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {/* Vertical connector from parent */}
          <div style={{ width: 1, height: 20, background: "#d1d5db" }} />
          {/* Horizontal bar */}
          {node.children.length > 1 && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              position: "relative",
              gap: 24,
            }}>
              {/* Top horizontal line */}
              <div style={{
                position: "absolute",
                top: 0,
                left: "calc(50% - ((100% - 160px) / 2))",
                width: "calc(100% - 160px)",
                height: 1,
                background: "#d1d5db",
              }} />
              {node.children.map((child) => (
                <div key={child.membershipId} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 1, height: 20, background: "#d1d5db" }} />
                  <NodeCard node={child} />
                </div>
              ))}
            </div>
          )}
          {node.children.length === 1 && (
            <NodeCard node={node.children[0]} />
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();

  const [nodes, setNodes] = useState<OrgChartNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }

    fetch(`/api/organizations/${me.activeOrgId}/org-chart`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setNodes)
      .catch(() => setNodes([]))
      .finally(() => setLoading(false));
  }, [me, meLoading, router]);

  if (meLoading || loading) return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;

  const tree = buildTree(nodes);
  const hasReporting = nodes.some((n) => n.reportingToId);

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Org Chart</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Visual hierarchy of your organization
          </p>
        </div>
        <Link href="/dashboard/members">
          <button style={{ padding: "8px 16px", fontSize: 13 }}>← Members List</button>
        </Link>
      </div>

      {!hasReporting && nodes.length > 0 && (
        <div style={{
          padding: "12px 16px",
          background: "#fefce8",
          border: "1px solid #fde68a",
          borderRadius: 8,
          fontSize: 13,
          color: "#92400e",
          marginBottom: 24,
        }}>
          No reporting structure set yet. Edit member profiles to assign who reports to whom.
        </div>
      )}

      {nodes.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 14 }}>No members found.</div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 32 }}>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", paddingTop: 8, minWidth: "max-content" }}>
            {tree.map((root) => (
              <NodeCard key={root.membershipId} node={root} />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
