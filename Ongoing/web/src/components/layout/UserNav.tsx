"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Megaphone, Phone, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Shield },
  { href: "/report", label: "Report", icon: Megaphone },
  { href: "/map", label: "Map", icon: Map },
  { href: "/emergency", label: "SOS", icon: Phone },
  { href: "/community", label: "Safety", icon: Shield },
];

export function UserNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

          <nav className="hidden items-center gap-1 md:flex">
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
            <Link
              href="/admin"
              className="ml-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#9CA3AF] hover:text-[#7C3AED]"
            >
              Admin
            </Link>
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-[#374151] md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-[#E5E7EB] px-4 py-3 md:hidden">
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
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-1 block px-3 py-2 text-xs font-semibold text-[#9CA3AF]"
            >
              Admin login
            </Link>
          </nav>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#E5E7EB] bg-white md:hidden">
        {NAV_ITEMS.filter((i) => i.href !== "/").map(({ href, label, icon: Icon }) => (
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

export function UserFooter() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-[#F9FAFB] py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[#6B7280] sm:px-6">
        <p>
          SafeHer · Crowdsourced safety for women in Bengaluru ·{" "}
          <Link href="/admin" className="text-[#7C3AED] hover:underline">
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
}
