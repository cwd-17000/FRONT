"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: "include",
      });

      if (res.ok) {
        router.push("/dashboard");
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
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          placeholder="Email"
          value={email}
          type="email"
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <br />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        {error ? (
          <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>
        ) : null}
      </form>
      <p style={{ marginTop: 16 }}>
        Don't have an account? <a href="/register">Sign up</a>
      </p>
    </div>
  );
}
