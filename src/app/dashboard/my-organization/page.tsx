"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import {
  Users,
  Building2,
  Network,
  Search,
  Plus,
  X,
  Check,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Member {
  id: string;
  userId: string;
  role: string;
  title: string | null;
  department: string | null;
  reportingToId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: TeamMember[];
}

interface OrgChartNode {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  title: string | null;
  department: string | null;
  reportingToId: string | null;
}

interface TreeNode extends OrgChartNode {
  children: TreeNode[];
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

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

function Avatar({
  firstName,
  lastName,
  size = "md",
}: {
  firstName: string | null;
  lastName: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const sizeMap = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  return (
    <div
      className={cn(
        "rounded-full bg-[#312e81] text-[#818cf8] flex items-center justify-center font-bold shrink-0",
        sizeMap[size]
      )}
    >
      {initials}
    </div>
  );
}

const ROLE_BADGE: Record<string, "accent" | "info" | "default"> = {
  owner: "accent",
  admin: "info",
  member: "default",
};

/* ── Org chart node ──────────────────────────────────────────────────────── */

function OrgNode({ node }: { node: TreeNode }) {
  const displayName =
    [node.firstName, node.lastName].filter(Boolean).join(" ") || node.email;
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 min-w-[140px] max-w-[180px] text-center shadow-[0_1px_3px_0_rgb(0,0,0,0.4)]">
        <div className="flex justify-center mb-2">
          <Avatar firstName={node.firstName} lastName={node.lastName} size="lg" />
        </div>
        <p className="text-xs font-semibold text-[#fafafa] leading-tight">{displayName}</p>
        {node.title && <p className="text-[11px] text-[#71717a] mt-1">{node.title}</p>}
        {node.department && <p className="text-[10px] text-[#3f3f46] mt-0.5">{node.department}</p>}
        <div className="mt-1.5">
          <Badge variant={ROLE_BADGE[node.role] ?? "default"} className="text-[10px] capitalize">
            {node.role}
          </Badge>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-5 bg-[#27272a]" />
          <div className="relative flex items-start gap-6">
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-[#27272a]"
                style={{ left: "calc(50% - (50% - 70px))", right: "calc(50% - (50% - 70px))" }}
              />
            )}
            {node.children.map((child) => (
              <div key={child.membershipId} className="flex flex-col items-center">
                <div className="w-px h-5 bg-[#27272a]" />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

type Tab = "members" | "teams" | "org-chart";

export default function MyOrganizationPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("members");

  /* Members state */
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");

  /* Teams state */
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [addingMemberTo, setAddingMemberTo] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  /* Org chart state */
  const [orgNodes, setOrgNodes] = useState<OrgChartNode[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    if (meLoading) return;
    if (!me?.activeOrgId) { router.push("/login"); return; }

    const orgId = me.activeOrgId;

    Promise.all([
      fetch(`/api/organizations/${orgId}/members`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/organizations/${orgId}/teams`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/organizations/${orgId}/org-chart`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([m, t, o]) => {
      setMembers(m);
      setTeams(t);
      setOrgNodes(o);
      setMembersLoading(false);
      setTeamsLoading(false);
      setOrgLoading(false);
    });
  }, [me, meLoading, router]);

  /* ── Members helpers ── */
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    const name = `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.toLowerCase();
    return (
      name.includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      (m.title ?? "").toLowerCase().includes(q) ||
      (m.department ?? "").toLowerCase().includes(q)
    );
  });

  /* ── Team helpers ── */
  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.activeOrgId || !newTeamName.trim()) return;
    setCreatingTeam(true);
    const res = await fetch(`/api/organizations/${me.activeOrgId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newTeamName.trim(), description: newTeamDesc.trim() || undefined }),
    });
    if (res.ok) {
      const team = await res.json();
      setTeams((prev) => [...prev, team]);
      setNewTeamName(""); setNewTeamDesc(""); setShowCreateTeam(false);
    }
    setCreatingTeam(false);
  }

  async function handleAddTeamMember(teamId: string) {
    if (!me?.activeOrgId || !selectedUserId) return;
    const res = await fetch(`/api/organizations/${me.activeOrgId}/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: selectedUserId }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/organizations/${me.activeOrgId}/teams`, { credentials: "include" }).then((r) => r.json());
      setTeams(updated);
      setAddingMemberTo(null);
      setSelectedUserId("");
    }
  }

  async function handleRemoveTeamMember(teamId: string, userId: string) {
    if (!me?.activeOrgId) return;
    await fetch(`/api/organizations/${me.activeOrgId}/teams/${teamId}/members/${userId}`, {
      method: "DELETE", credentials: "include",
    });
    setTeams((prev) => prev.map((t) =>
      t.id === teamId ? { ...t, members: t.members.filter((m) => m.userId !== userId) } : t
    ));
  }

  async function handleDeleteTeam(teamId: string) {
    if (!me?.activeOrgId || !confirm("Delete this team?")) return;
    await fetch(`/api/organizations/${me.activeOrgId}/teams/${teamId}`, {
      method: "DELETE", credentials: "include",
    });
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }

  const isLoading = membersLoading || teamsLoading || orgLoading;

  /* ── Tabs config ── */
  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "members",   label: "Members",   icon: Users,    count: members.length },
    { id: "teams",     label: "Teams",     icon: Building2, count: teams.length },
    { id: "org-chart", label: "Org Chart", icon: Network },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">My Organization</h1>
        <p className="mt-1 text-sm text-[#71717a]">
          Manage members, teams, and your organization structure
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-[#18181b] border border-[#27272a] w-fit">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150",
              activeTab === id
                ? "bg-[#27272a] text-[#fafafa]"
                : "text-[#71717a] hover:text-[#a1a1aa]"
            )}
          >
            <Icon size={14} />
            {label}
            {count !== undefined && (
              <span className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full",
                activeTab === id ? "bg-[#3f3f46] text-[#a1a1aa]" : "bg-[#27272a] text-[#71717a]"
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[#71717a] py-8">
          <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {/* ── Members tab ────────────────────────────────────────────── */}
      {!isLoading && activeTab === "members" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, title, or department…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#3f3f46] bg-[#27272a] text-sm text-[#fafafa] placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <p className="text-sm text-[#71717a] py-6 text-center">
              {memberSearch ? "No members match your search." : "No members found."}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredMembers.map((member) => {
                const displayName =
                  [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") || member.user.email;
                return (
                  <Card key={member.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar firstName={member.user.firstName} lastName={member.user.lastName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#fafafa] truncate">{displayName}</p>
                        {(member.title || member.department) && (
                          <p className="text-xs text-[#71717a] mt-0.5 truncate">
                            {[member.title, member.department].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="text-xs text-[#3f3f46] mt-0.5 truncate">{member.user.email}</p>
                      </div>
                      <Badge variant={ROLE_BADGE[member.role] ?? "default"} className="capitalize shrink-0">
                        {member.role === "owner" && <Crown size={10} className="mr-1" />}
                        {member.role}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Teams tab ──────────────────────────────────────────────── */}
      {!isLoading && activeTab === "teams" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => { setShowCreateTeam((v) => !v); setNewTeamName(""); setNewTeamDesc(""); }}
            >
              <Plus size={14} />
              New Team
            </Button>
          </div>

          {showCreateTeam && (
            <Card>
              <CardHeader>
                <CardTitle>Create Team</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeam} className="flex flex-col gap-3">
                  <Input
                    label="Team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Growth Marketing"
                    required
                  />
                  <Input
                    label="Description (optional)"
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    placeholder="What does this team do?"
                  />
                  <div className="flex gap-2 mt-1">
                    <Button type="submit" size="sm" disabled={creatingTeam || !newTeamName.trim()}>
                      {creatingTeam ? "Creating…" : "Create team"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateTeam(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {teams.length === 0 && !showCreateTeam ? (
            <div className="text-center py-12 border-2 border-dashed border-[#27272a] rounded-xl">
              <Building2 size={24} className="text-[#3f3f46] mx-auto mb-3" />
              <p className="text-sm text-[#71717a]">No teams yet.</p>
              <Button size="sm" className="mt-3" onClick={() => setShowCreateTeam(true)}>
                <Plus size={14} />
                Create your first team
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      {team.description && (
                        <p className="text-xs text-[#71717a] mt-0.5">{team.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setAddingMemberTo(team.id); setSelectedUserId(""); }}
                      >
                        <Plus size={12} />
                        Add
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {addingMemberTo === team.id && (
                      <div className="flex gap-2 mb-4">
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="flex-1 h-9 rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
                        >
                          <option value="">Select a member…</option>
                          {members
                            .filter((m) => !team.members.some((tm) => tm.userId === m.userId))
                            .map((m) => (
                              <option key={m.userId} value={m.userId}>
                                {[m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email}
                              </option>
                            ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!selectedUserId}
                          onClick={() => handleAddTeamMember(team.id)}
                        >
                          <Check size={12} />
                          Add
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setAddingMemberTo(null)}>
                          <X size={12} />
                        </Button>
                      </div>
                    )}

                    {team.members.length === 0 ? (
                      <p className="text-sm text-[#71717a]">No members yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((tm) => {
                          const name =
                            [tm.user.firstName, tm.user.lastName].filter(Boolean).join(" ") || tm.user.email;
                          return (
                            <div
                              key={tm.id}
                              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full border border-[#27272a] bg-[#27272a] text-xs"
                            >
                              <Avatar firstName={tm.user.firstName} lastName={tm.user.lastName} size="sm" />
                              <span className={cn("text-[#a1a1aa]", tm.role === "lead" && "font-semibold text-[#818cf8]")}>
                                {name}
                              </span>
                              {tm.role === "lead" && (
                                <Crown size={10} className="text-[#818cf8]" />
                              )}
                              <button
                                onClick={() => handleRemoveTeamMember(team.id, tm.userId)}
                                className="text-[#71717a] hover:text-[#ef4444] transition-colors ml-0.5"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Org Chart tab ──────────────────────────────────────────── */}
      {!isLoading && activeTab === "org-chart" && (
        <div>
          {orgNodes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#27272a] rounded-xl">
              <Network size={24} className="text-[#3f3f46] mx-auto mb-3" />
              <p className="text-sm text-[#71717a]">No members found.</p>
            </div>
          ) : (
            <>
              {!orgNodes.some((n) => n.reportingToId) && (
                <div className="flex items-start gap-2 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-3 mb-4">
                  <p className="text-sm text-[#f59e0b]">
                    No reporting structure set yet. Edit member profiles to assign reporting lines.
                  </p>
                </div>
              )}
              <div className="overflow-x-auto pb-8">
                <div className="flex gap-8 justify-center pt-4 min-w-max">
                  {buildTree(orgNodes).map((root) => (
                    <OrgNode key={root.membershipId} node={root} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
