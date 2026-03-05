// src/app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) {
    redirect("/login");
  }

  // Fetch the current user from NestJS using the cookie
  const res = await fetch(`${process.env.API_BASE_URL}/auth/me`, {
    headers: { cookie: `access_token=${token.value}` },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  const user = await res.json();

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <p>Role: {user.role ?? "N/A"}</p>
      <LogoutButton />
      <p style={{ marginTop: 16 }}>
        Don't have an account? <a href="/register">Sign up</a>
      </p>
    </div>
  );
}
