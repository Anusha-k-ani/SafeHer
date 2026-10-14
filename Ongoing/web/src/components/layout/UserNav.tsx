"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Megaphone, Phone, Shield, Menu, X, Lightbulb } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEmergencyAlert } from "@/components/suraksha/SosTap";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Shield },
  { href: "/sos", label: "SOS", icon: Phone },
  { href: "/report/incident", label: "Report", icon: Megaphone },
  { href: "/report/streetlight", label: "Lights", icon: Lightbulb },
  { href: "/map", label: "Map", icon: Map },
];

export function UserNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sos = useEmergencyAlert();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#D8E0E8] bg-[#17324D] text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo href="/" tone="dark" />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) =>
              href === "/sos" ? (
                <button
                  key={href}
                  type="button"
                  disabled={sos.busy}
                  onClick={sos.tap}
                  className="flex items-center gap-2 rounded-lg bg-[#B42318] px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  <Icon className="h-4 w-4" />
                  {sos.busy ? "Sending..." : "SOS"}
                </button>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-[#0F766E] text-white"
                      : "text-white/80 hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            )}
            <Link href="/login" className="ml-2 rounded-lg bg-[#0F766E] px-3 py-2 text-xs font-semibold text-white">
              Login
            </Link>
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-[#E5E7EB] px-4 py-3 md:hidden">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) =>
              href === "/sos" ? (
                <button
                  key={href}
                  type="button"
                  disabled={sos.busy}
                  onClick={() => {
                    setOpen(false);
                    sos.tap();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg bg-[#B42318] px-3 py-2.5 text-sm font-semibold text-white"
                >
                  <Icon className="h-4 w-4" />
                  {sos.busy ? "Sending..." : "SOS"}
                </button>
              ) : (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                    pathname === href ? "bg-[#0F766E] text-white" : "text-[#17324D]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            )}
            <Link href="/login" onClick={() => setOpen(false)} className="mt-1 block px-3 py-2 text-xs font-semibold text-[#0F766E]">
              Login
            </Link>
          </nav>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#E5E7EB] bg-white md:hidden">
        {NAV_ITEMS.filter((i) => i.href !== "/").map(({ href, label, icon: Icon }) =>
          href === "/sos" ? (
            <button
              key={href}
              type="button"
              disabled={sos.busy}
              onClick={sos.tap}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-[#B42318] disabled:opacity-70"
            >
              <Icon className="h-5 w-5" />
              {sos.busy ? "Sending" : "SOS"}
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                pathname === href ? "text-[#0F766E]" : "text-[#64748B]"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        )}
      </nav>
      {sos.result && (
        <p className={`fixed bottom-16 left-3 right-3 z-50 rounded-xl px-3 py-2 text-sm shadow md:bottom-4 ${sos.result.ok ? "bg-white text-[#1F2937]" : "bg-[#FEF2F2] text-[#B42318]"}`}>
          {sos.result.text}
        </p>
      )}
    </>
  );
}

export function UserFooter() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-[#F9FAFB] py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[#6B7280] sm:px-6">
        <p>
          SurakshaSetu · Incident Analysis and Hotspot Identification for Security Provision against Women Harassment in Public Spaces
        </p>
      </div>
    </footer>
  );
}
