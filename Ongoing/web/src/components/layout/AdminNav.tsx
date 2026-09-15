"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Map,
  Search,
  BarChart3,
  GitCompare,
  BookOpen,
  Shield,
  AlertTriangle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/hotspots", label: "Hotspots", icon: AlertTriangle },
  { href: "/admin/analytics", label: "Analytics", icon: Shield },
  { href: "/admin/map", label: "Map", icon: Map },
  { href: "/admin/search", label: "Search", icon: Search },
  { href: "/admin/areas", label: "Areas", icon: GitCompare },
  { href: "/admin/methodology", label: "Methodology", icon: BookOpen },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#111827] text-sm font-bold text-white">
            AD
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#111827]">SafeHer Admin</p>
            <p className="text-xs text-[#6B7280]">OSM + community analytics</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-[#F5F3FF] text-[#7C3AED]"
                  : "text-[#374151] hover:bg-[#F9FAFB]"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#E02424]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-[#374151] lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-[#E5E7EB] px-4 py-3 lg:hidden">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === href
                  ? "bg-[#F5F3FF] text-[#7C3AED]"
                  : "text-[#374151]"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#E02424]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mt-1 block px-3 py-2 text-xs font-semibold text-[#9CA3AF]"
          >
            ← Back to public site
          </Link>
        </nav>
      )}
    </header>
  );
}

export function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-[#F9FAFB] py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[#6B7280] sm:px-6">
        <p>
          SafeHer Admin ·{" "}
          <Link href="/" className="text-[#7C3AED] hover:underline">
            Public site
          </Link>
        </p>
      </div>
    </footer>
  );
}
