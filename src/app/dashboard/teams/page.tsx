"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/hooks/useMe";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: TeamMember[];
  createdAt: string;
}

interface OrgMember {
  id: string;
  userId: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
}

function Avatar({ firstName, lastName, size = 28 }: { firstName: string | null; lastName: string | null; size?: number }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#e5e7eb", display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 700, fontSize: size * 0.38,
      color: "#374151", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function TeamsPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Create team form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Add member to team
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }

    const orgId = me.activeOrgId;
    Promise.all([
      fetch(`/api/organizations/${orgId}/teams`, { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch(`/api/organizations/${orgId}/members`, { credentials: "include" }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([t, m]) => { setTeams(t); setOrgMembers(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [me, meLoading, router]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.activeOrgId || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/organizations/${me.activeOrgId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (res.ok) {
        const team: Team = await res.json();
        setTeams((prev) => [...prev, team]);
        setNewName(""); setNewDesc(""); setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(teamId: string) {
    if (!me?.activeOrgId || !selectedUser) return;
    const res = await fetch(`/api/organizations/${me.activeOrgId}/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: selectedUser }),
    });
    if (res.ok) {
      // Refresh teams
      const updated = await fetch(`/api/organizations/${me.activeOrgId}/teams`, { credentials: "include" }).then((r) => r.json());
      setTeams(updated);
      setAddingTo(null);
      setSelectedUser("");
    }
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    if (!me?.activeOrgId) return;
    await fetch(`/api/organizations/${me.activeOrgId}/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setTeams((prev) => prev.map((t) =>
      t.id === teamId ? { ...t, members: t.members.filter((m) => m.userId !== userId) } : t
    ));
  }

  async function handleDeleteTeam(teamId: string) {
    if (!me?.activeOrgId || !confirm("Delete this team?")) return;
    await fetch(`/api/organizations/${me.activeOrgId}/teams/${teamId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }

  if (meLoading || loading) return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;

  return (
    <div style={{ padding: 40, maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Teams</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Organize members into functional groups
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: "9px 18px", fontSize: 14 }}>
          + New Team
        </button>
      </div>

      {/* Create team form */}
      {showCreate && (
        <form onSubmit={handleCreateTeam} style={{
          border: "1px solid #e5e7eb", borderRadius: 10, padding: 20,
          marginBottom: 24, background: "#f9fafb",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>New Team</h3>
          <input
            value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Team name" required
            style={{ padding: "9px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
          />
          <input
            value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            style={{ padding: "9px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={creating} style={{ padding: "8px 18px", fontSize: 14 }}>
              {creating ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
              style={{ padding: "8px 14px", fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 14, padding: "32px 0" }}>
          No teams yet. Create one to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {teams.map((team) => (
            <div key={team.id} style={{
              border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, background: "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{team.name}</h3>
                  {team.description && (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{team.description}</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setAddingTo(team.id); setSelectedUser(""); }}
                    style={{ padding: "5px 12px", fontSize: 12 }}>
                    + Add Member
                  </button>
                  <button onClick={() => handleDeleteTeam(team.id)}
                    style={{ padding: "5px 12px", fontSize: 12, color: "#dc2626", border: "1px solid #fecaca", background: "#fff" }}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Add member inline */}
              {addingTo === team.id && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <select
                    value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                    style={{ flex: 1, padding: "7px 10px", fontSize: 13, borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="">Select a member...</option>
                    {orgMembers
                      .filter((m) => !team.members.some((tm) => tm.userId === m.userId))
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {[m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email}
                        </option>
                      ))}
                  </select>
                  <button onClick={() => handleAddMember(team.id)} disabled={!selectedUser}
                    style={{ padding: "7px 14px", fontSize: 13 }}>
                    Add
                  </button>
                  <button onClick={() => setAddingTo(null)} style={{ padding: "7px 12px", fontSize: 13 }}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Members list */}
              {team.members.length === 0 ? (
                <div style={{ fontSize: 13, color: "#9ca3af" }}>No members yet.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {team.members.map((tm) => {
                    const name = [tm.user.firstName, tm.user.lastName].filter(Boolean).join(" ") || tm.user.email;
                    return (
                      <div key={tm.id} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 10px 5px 6px", borderRadius: 20,
                        border: "1px solid #e5e7eb", background: "#f9fafb", fontSize: 13,
                      }}>
                        <Avatar firstName={tm.user.firstName} lastName={tm.user.lastName} size={24} />
                        <span style={{ fontWeight: tm.role === "lead" ? 600 : 400 }}>{name}</span>
                        {tm.role === "lead" && (
                          <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600, marginLeft: 2 }}>LEAD</span>
                        )}
                        <button
                          onClick={() => handleRemoveMember(team.id, tm.userId)}
                          style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "0 2px", fontSize: 14, lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <Link href="/dashboard/members">← Back to Members</Link>
      </div>
    </div>
  );
}
