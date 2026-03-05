"use client";

import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div style={{ padding: 40, maxWidth: 480 }}>
      <h1>Welcome</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        To get started, create a new organization or join an existing one.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={() => router.push("/onboarding/create")}
          style={{ padding: "14px 24px", fontSize: 16 }}
        >
          Create an organization
        </button>
        <button
          onClick={() => router.push("/onboarding/join")}
          style={{ padding: "14px 24px", fontSize: 16 }}
        >
          Join with a code
        </button>
      </div>
    </div>
  );
}
