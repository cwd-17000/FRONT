// src/app/dashboard/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  }

  return (
    <button onClick={handleLogout} style={{ marginTop: 24 }}>
      Log out
    </button>
  );
}
