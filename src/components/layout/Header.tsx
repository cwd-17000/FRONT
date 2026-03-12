"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userEmail?: string;
  orgName?: string;
}

export default function Header({ userEmail, orgName }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "??";

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-[#27272a] bg-[#09090b] shrink-0">
      {/* Left: org name */}
      <div className="flex items-center gap-3">
        {orgName && (
          <span className="text-sm font-medium text-[#fafafa] truncate max-w-[200px]">
            {orgName}
          </span>
        )}
      </div>

      {/* Center: search */}
      <div className="flex-1 max-w-sm mx-6 hidden sm:block">
        <div
          className={cn(
            "flex items-center gap-2 h-8 rounded-lg border bg-[#18181b] px-3 transition-colors duration-150",
            searchFocused
              ? "border-[#6366f1]"
              : "border-[#27272a] hover:border-[#3f3f46]"
          )}
        >
          <Search size={13} className="text-[#71717a] shrink-0" />
          <input
            placeholder="Search…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent text-sm text-[#fafafa] placeholder:text-[#71717a] outline-none w-full"
          />
          <kbd className="hidden md:inline-flex text-[10px] text-[#71717a] font-mono border border-[#3f3f46] rounded px-1">⌘K</kbd>
        </div>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-1.5">
        <button
          title="Notifications"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors duration-150"
        >
          <Bell size={15} />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 h-8 rounded-lg px-2 text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors duration-150"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#312e81] text-[#818cf8] text-[10px] font-bold shrink-0">
              {initials}
            </div>
            <span className="hidden md:block text-xs text-[#a1a1aa] truncate max-w-[120px]">
              {userEmail}
            </span>
            <ChevronDown size={12} />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-10 z-40 w-52 rounded-xl border border-[#27272a] bg-[#18181b] shadow-[0_8px_32px_0_rgb(0,0,0,0.6)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#312e81] text-[#818cf8] text-xs font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#fafafa] truncate">{userEmail}</p>
                      {orgName && (
                        <p className="text-[11px] text-[#71717a] truncate">{orgName}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors duration-150"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
