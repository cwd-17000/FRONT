"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, UserCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfileSetupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Update user's global profile (name)
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });

      if (!profileRes.ok) {
        setError("Failed to save profile. Please try again.");
        return;
      }

      // If a title was provided, update membership profile
      if (title.trim()) {
        // We need the orgId — fetch it from /api/me (token was just refreshed)
        const meRes = await fetch("/api/me", { credentials: "include" });
        if (meRes.ok) {
          const me = await meRes.json();
          if (me.activeOrgId) {
            await fetch(`/api/organizations/${me.activeOrgId}/members/${me.sub}/profile`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ title: title.trim() }),
            });
          }
        }
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] p-4 sm:p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#27272a]">
              <UserCircle2 size={16} className="text-[#a1a1aa]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#fafafa]">Set up your profile</h1>
              <p className="text-xs text-[#71717a]">Step 2 of 2 · Introduce yourself</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                required
              />
            </div>

            <Input
              label="Job title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Head of Marketing"
            />

            <p className="text-xs text-[#71717a] -mt-2">This is visible to your organization members.</p>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full gap-1.5">
              {submitting ? "Saving..." : "Continue to dashboard"}
              {!submitting && <ArrowRight size={14} />}
            </Button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full text-xs text-[#71717a] hover:text-[#a1a1aa] transition-colors"
            >
              Skip for now
            </button>
          </form>

          <p className="text-center text-xs text-[#71717a]">
            Need to switch flow?{" "}
            <Link href="/onboarding" className="text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
              Back to onboarding options
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
