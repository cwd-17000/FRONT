// src/app/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";

export default async function HomePage() {
  const cookieStore = await cookies();
  const isAuth = !!cookieStore.get("access_token");

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
        {isAuth ? (
          // Already logged in
          <>
            <Link href="/dashboard">
              <button style={{ padding: "10px 28px", fontSize: 16 }}>
                Go to Dashboard
              </button>
            </Link>
            <LogoutForm />
          </>
        ) : (
          // Not logged in
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

// Inline server action for logout — no client component needed
function LogoutForm() {
  return (
    <form
      action={async () => {
        "use server";
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        cookieStore.delete("access_token");
      }}
    >
      <button
        type="submit"
        style={{ padding: "10px 28px", fontSize: 16, cursor: "pointer" }}
      >
        Log Out
      </button>
    </form>
  );
}
