// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      gap: 16,
    }}>
      <h1>Marketing Platform</h1>
      <p style={{ color: "#666" }}>Manage your marketing initiatives in one place.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Link href="/login">
          <button style={{ padding: "10px 28px", fontSize: 16 }}>
            Log In
          </button>
        </Link>
        <Link href="/register">
          <button style={{ padding: "10px 28px", fontSize: 16 }}>
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
}
