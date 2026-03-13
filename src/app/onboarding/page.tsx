"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#09090b] p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-[#fafafa]">Welcome to Marketing OS</h1>
          <p className="text-sm text-[#71717a] mt-1">
            Create a new organization or join your team workspace to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card hover className="border-[#312e81]/40">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#312e81]">
                <Building2 size={18} className="text-[#818cf8]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#fafafa]">Create organization</h2>
                <p className="text-xs text-[#71717a] mt-1">
                  Start a new workspace and invite your team with a generated join code.
                </p>
              </div>
              <Button onClick={() => router.push("/onboarding/create")} className="w-full gap-1.5">
                Continue
                <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#27272a]">
                <Users size={18} className="text-[#a1a1aa]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#fafafa]">Join with code</h2>
                <p className="text-xs text-[#71717a] mt-1">
                  Enter your organization join code and set up your profile in seconds.
                </p>
              </div>
              <Button variant="secondary" onClick={() => router.push("/onboarding/join")} className="w-full gap-1.5">
                Enter code
                <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-[#71717a]">
          Already onboarded?{" "}
          <Link href="/dashboard" className="text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
