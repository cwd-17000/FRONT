"use client";
import { useRouter } from "next/navigation";
import { Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      router.refresh();
    }
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Building2 size={14} className="text-[#71717a]" />
        <span className="text-sm text-[#a1a1aa]">
          Active:{" "}
          <span className="font-semibold text-[#fafafa]">
            {activeOrg?.name ?? "Unknown"}
          </span>
        </span>
      </div>

      {orgs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {orgs.map((org) => (
            <Button
              key={org.id}
              variant={org.id === activeOrgId ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSwitch(org.id)}
              className="gap-1.5"
            >
              {org.id === activeOrgId && <Check size={12} />}
              {org.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
