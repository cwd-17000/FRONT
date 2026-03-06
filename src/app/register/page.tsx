"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: "include",
      });

      if (res.ok) {
        // ← new users always go to onboarding
        router.push("/dashboard");
        return;
      }

      const errorText = await res.text();
      setError(errorText || `Registration failed (${res.status})`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Account</h1>
      <form onSubmit={handleRegister}>
        <input
          placeholder="Email"
          value={email}
          type="email"
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          autoComplete="new-password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <br /><br />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
        {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
      </form>
      <p style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}
