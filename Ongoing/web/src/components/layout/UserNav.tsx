"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, ClipboardPlus, Files, House, Info, LogIn, Map, Menu, Siren, UserPlus, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { isAuthority, useSession } from "@/lib/suraksha/session-context";
import { AccountMenu } from "./AccountMenu";

const CITIZEN_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/report/incident", label: "Report an Incident", icon: ClipboardPlus },
  { href: "/sos", label: "Risk Alert", icon: Siren },
  { href: "/map", label: "Safety Map", icon: Map },
  { href: "/my-reports", label: "My Reports", icon: Files },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/resources", label: "Safety Resources", icon: BookOpen },
  { href: "/about", label: "About", icon: Info },
];

const PUBLIC_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/map", label: "Safety Map", icon: Map },
  { href: "/resources", label: "Safety Resources", icon: BookOpen },
  { href: "/about", label: "About", icon: Info },
];

export function UserNav() {
  const pathname = usePathname();
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  const authority = isAuthority(user?.role);
  const items = user && !authority ? CITIZEN_ITEMS : PUBLIC_ITEMS;

  return (
    <header className="chrome-dark sticky top-0 z-40 border-b border-white/10 bg-[#0B1D33] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" tone="dark" />
        <nav className="hidden items-center gap-1 lg:flex">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                pathname === href ? "bg-teal-500 text-white" : "text-white/80 hover:bg-white/10",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          ))}
          {!loading && !user && (
            <>
              <Link href="/login" className="ml-2 flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold">
                <LogIn className="h-4 w-4" aria-hidden /> Login
              </Link>
              <Link href="/signup" className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold">
                <UserPlus className="h-4 w-4" aria-hidden /> Sign Up
              </Link>
            </>
          )}
          {!loading && user && !authority && <AccountMenu />}
          {!loading && authority && (
            <Link href={user.role === "patrol" ? "/patrol" : user.role === "municipal" ? "/municipal" : "/authority"} className="ml-2 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold">
              Open workspace
            </Link>
          )}
        </nav>
        <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="space-y-1 border-t border-white/10 px-4 py-3 lg:hidden">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm">
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          ))}
          {!user && (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold">Login</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm">Sign Up</Link>
            </>
          )}
          {user && !authority && (
            <div className="pt-2">
              <AccountMenu />
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

export function UserFooter() {
  return (
    <footer className="chrome-dark mt-auto border-t border-[#1E3A54] bg-[#0B1D33] py-8 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-semibold text-white">SurakshaSetu</p>
          <p className="mt-2 text-sm">Safe Spaces. Stronger Communities.</p>
        </div>
        <div className="text-sm">
          <p>This product records in-app reports and analysis. It does not replace 112 or a police control room.</p>
        </div>
        <div className="text-sm">
          <Link href="/about" className="block hover:text-white">About</Link>
          <Link href="/resources" className="mt-1 block hover:text-white">Safety resources</Link>
          <Link href="/map" className="mt-1 block hover:text-white">Safety map</Link>
        </div>
      </div>
    </footer>
  );
}
