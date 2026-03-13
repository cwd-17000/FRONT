"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Building2, CheckCircle2, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setJoinCode(data.joinCode);
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Failed to create organization (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }


  if (joinCode) {
    return (
      <div className="min-h-screen bg-[#09090b] p-4 sm:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-[#22c55e]/30 bg-[#0d1a12]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#22c55e]" />
              <h1 className="text-lg font-semibold text-[#fafafa]">Organization created</h1>
            </div>

            <p className="text-sm text-[#a1a1aa]">Share this join code with your team:</p>

            <div className="rounded-lg border border-[#3f3f46] bg-[#18181b] px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xl font-bold tracking-[0.25em] text-[#fafafa]">{joinCode}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(joinCode)}
                className="inline-flex items-center gap-1 text-xs text-[#818cf8] hover:text-[#a5b4fc]"
              >
                <Copy size={13} /> Copy
              </button>
            </div>

            <p className="text-xs text-[#71717a]">
              Team members can use this code on the join page to enter your organization.
            </p>

            <Button onClick={() => window.location.assign("/onboarding/profile")} className="w-full gap-1.5">
              Continue to profile
              <ArrowRight size={14} />
            </Button>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] p-4 sm:p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#312e81]">
              <Building2 size={16} className="text-[#818cf8]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#fafafa]">Create organization</h1>
              <p className="text-xs text-[#71717a]">Step 1 of 2 · Start your workspace</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Organization name"
              placeholder="e.g. Acme Marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full gap-1.5">
              {isSubmitting ? "Creating..." : "Create organization"}
              {!isSubmitting && <ArrowRight size={14} />}
            </Button>
          </form>

          <Link href="/onboarding" className="inline-flex items-center gap-1 text-xs text-[#71717a] hover:text-[#a1a1aa]">
            <ArrowLeft size={12} /> Back
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
