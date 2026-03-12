"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({} as Record<string, unknown>));

        const hasOrganization =
          data &&
          typeof data === "object" &&
          (
            ("hasOrganization" in data && Boolean(data.hasOrganization)) ||
            ("organizationId" in data && Boolean(data.organizationId)) ||
            ("orgId" in data && Boolean(data.orgId)) ||
            ("organization" in data && Boolean(data.organization)) ||
            ("org" in data && Boolean(data.org))
          );

        const hasOrganizationSignal =
          data &&
          typeof data === "object" &&
          (
            "hasOrganization" in data ||
            "organizationId" in data ||
            "orgId" in data ||
            "organization" in data ||
            "org" in data
          );

        const requiresOnboarding =
          data &&
          typeof data === "object" &&
          (
            ("requiresOnboarding" in data && Boolean(data.requiresOnboarding)) ||
            ("needsOnboarding" in data && Boolean(data.needsOnboarding)) ||
            ("isFirstLogin" in data && Boolean(data.isFirstLogin)) ||
            ("hasOrganization" in data && data.hasOrganization === false) ||
            (hasOrganizationSignal && !hasOrganization)
          );

        router.push(requiresOnboarding ? "/onboarding" : "/dashboard");
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Login failed (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#6366f1] mb-4">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#fafafa]">Marketing OS</h1>
          <p className="text-sm text-[#71717a] mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6 shadow-[0_8px_32px_0_rgb(0,0,0,0.4)]">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-1.5"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
              {!isSubmitting && <ArrowRight size={14} />}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#71717a] mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[#818cf8] hover:text-[#6366f1] transition-colors duration-150"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
