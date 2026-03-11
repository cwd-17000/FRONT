"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

interface Member {
  id: string;
  userId: string;
  role: string;
  title: string | null;
  department: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

const ROLE_COLORS: Record<string, string> = {
  owner: "#7c3aed",
  admin: "#2563eb",
  member: "#374151",
};

function Avatar({ firstName, lastName, avatarUrl, size = 40 }: {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  size?: number;
}) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  if (avatarUrl) {
    return <img src={avatarUrl} alt={initials} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  }
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

export default function MembersPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }

    fetch(`/api/organizations/${me.activeOrgId}/members`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [me, meLoading, router]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const name = `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.toLowerCase();
    return (
      name.includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      (m.title ?? "").toLowerCase().includes(q) ||
      (m.department ?? "").toLowerCase().includes(q)
    );
  });

  if (meLoading || loading) return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Team Members</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            {members.length} {members.length === 1 ? "member" : "members"} in your organization
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/org-chart">
            <button style={{ padding: "8px 16px", fontSize: 13 }}>Org Chart</button>
          </Link>
          <Link href="/dashboard/teams">
            <button style={{ padding: "8px 16px", fontSize: 13 }}>Teams</button>
          </Link>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, title, or department..."
        style={{ width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 20, boxSizing: "border-box" }}
      />

      {filtered.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 14, padding: "32px 0" }}>
          {search ? "No members match your search." : "No members found."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filtered.map((member) => {
            const displayName = [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") || member.user.email;
            return (
              <div key={member.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 16px",
                borderRadius: 8,
                border: "1px solid #f3f4f6",
                background: "#fff",
              }}>
                <Avatar
                  firstName={member.user.firstName}
                  lastName={member.user.lastName}
                  avatarUrl={member.user.avatarUrl}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </div>
                  {(member.title || member.department) && (
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                      {[member.title, member.department].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{member.user.email}</div>
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: "#f3f4f6",
                  color: ROLE_COLORS[member.role] ?? "#374151",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap",
                }}>
                  {member.role}
                </span>
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
