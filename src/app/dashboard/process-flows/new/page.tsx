"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "campaign", label: "Campaign" },
  { value: "content", label: "Content" },
  { value: "approval", label: "Approval" },
  { value: "onboarding", label: "Onboarding" },
  { value: "other", label: "Other" },
];

const fieldClass =
  "w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-colors";

export default function NewProcessFlowPage() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me?.activeOrgId || !name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${me.activeOrgId}/process-flows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
        }),
      });

      if (res.ok) {
        const flow = await res.json();
        router.push(`/dashboard/process-flows/${flow.id}`);
        return;
      }

      const text = await res.text();
      setError(text || "Failed to create process flow.");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (meLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#71717a] p-6">
        <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">New Process Flow</h1>
        <p className="mt-1 text-sm text-[#71717a]">Define a repeatable workflow for your team.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Flow name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Campaign launch checklist"
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of when and how this process is used"
            className={`${fieldClass} resize-vertical`}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-[#a1a1aa]">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${fieldClass} h-10 py-0`}
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2.5">
            <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
            <p className="text-sm text-[#ef4444]">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Creating..." : "Create Flow"}
          </Button>
          <Link href="/dashboard/process-flows">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
