"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function JoinOrgPage() {
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
        credentials: "include",
      });

      if (res.ok) {
        window.location.assign("/onboarding/profile");
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Failed to join organization (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div className="min-h-screen bg-[#09090b] p-4 sm:p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#27272a]">
              <Users size={16} className="text-[#a1a1aa]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#fafafa]">Join organization</h1>
              <p className="text-xs text-[#71717a]">Step 1 of 2 · Enter your team code</p>
            </div>
          </div>

          <p className="text-sm text-[#71717a]">
            Enter the join code provided by your organization admin.
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Join code"
              placeholder="e.g. XK92TF3A"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              required
              className="tracking-[0.25em] uppercase text-base"
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting || !joinCode.trim()} className="w-full gap-1.5">
              {isSubmitting ? "Joining..." : "Join organization"}
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
