"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Calendar,
  GitBranch,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",       href: "/dashboard",               icon: LayoutDashboard },
  { label: "Goals",           href: "/dashboard/goals",         icon: Target },
  { label: "Reporting",       href: "/dashboard/reporting",     icon: BarChart2 },
  { label: "Calendar",        href: "/dashboard/calendar",      icon: Calendar },
  { label: "Process Flows",   href: "/dashboard/process-flows", icon: GitBranch },
  { label: "Cadence",         href: "/dashboard/cadence",       icon: RefreshCw },
  { label: "My Organization", href: "/dashboard/my-organization", icon: Building2 },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r border-[#27272a] bg-[#09090b] transition-all duration-200 shrink-0 z-20",
        collapsed ? "w-[56px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-14 px-4 border-b border-[#27272a] shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#6366f1] shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-[#fafafa] truncate">
            Marketing OS
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150",
                    isActive
                      ? "bg-[#312e81] text-[#818cf8] font-medium"
                      : "text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a]"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn("shrink-0", isActive ? "text-[#818cf8]" : "")}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 px-2 pb-4">
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-full h-8 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors duration-150"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && <span className="ml-1.5 text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
