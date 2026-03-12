// src/app/dashboard/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
      <LogOut size={14} />
      Sign out
    </Button>
  );
}
