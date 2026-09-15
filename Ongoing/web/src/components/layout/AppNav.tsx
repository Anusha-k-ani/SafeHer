"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  Search,
  BarChart3,
  GitCompare,
  BookOpen,
  Menu,
  X,
  Shield,
  Megaphone,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "OSM Data", icon: BarChart3 },
  { href: "/community", label: "Analytics", icon: Shield },
  { href: "/report", label: "Report", icon: Megaphone },
  { href: "/map", label: "Map", icon: Map },
  { href: "/emergency", label: "SOS", icon: Phone },
  { href: "/search", label: "Search", icon: Search },
  { href: "/areas", label: "Areas", icon: GitCompare },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
];

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const mobileItems = NAV_ITEMS.filter((i) =>
    ["/", "/community", "/report", "/map", "/emergency"].includes(i.href)
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C3AED] text-sm font-bold text-white">
              SH
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#111827]">SafeHer</p>
              <p className="text-xs text-[#6B7280]">
                Bengaluru women&apos;s street safety
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-[#F5F3FF] text-[#7C3AED]"
                    : "text-[#374151] hover:bg-[#F9FAFB]"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
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
          </nav>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#E5E7EB] bg-white lg:hidden">
        {mobileItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              pathname === href ? "text-[#7C3AED]" : "text-[#6B7280]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-[#F9FAFB] py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[#6B7280] sm:px-6">
        <p>
          SafeHer · OSM infrastructure data + live community reports ·{" "}
          <a
            href="https://www.openstreetmap.org"
            className="text-[#7C3AED] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap
          </a>
        </p>
      </div>
    </footer>
  );
}
