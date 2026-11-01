"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Files, LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import { isAuthority, useSession } from "@/lib/suraksha/session-context";
import { homeFor } from "@/lib/suraksha/domain";

export function AccountMenu() {
  const { user, logout } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const authority = isAuthority(user.role);
  const label = user.name || user.username;
  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-1.5 text-left text-sm text-white hover:bg-white/15"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400/20 text-teal-100">
          <UserRound className="h-4 w-4" aria-hidden />
        </span>
        <span className="hidden max-w-[10rem] truncate sm:block">
          <span className="block font-semibold leading-tight">{label}</span>
          <span className="block text-[11px] text-white/70">{user.username}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-[#0F2438] p-1 text-sm text-white shadow-xl" role="menu">
          <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => setOpen(false)}>
            <UserRound className="h-4 w-4" aria-hidden /> My Profile
          </Link>
          {!authority && (
            <Link href="/my-reports" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => setOpen(false)}>
              <Files className="h-4 w-4" aria-hidden /> My Reports
            </Link>
          )}
          <Link href={homeFor(user.role)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => setOpen(false)}>
            <LayoutDashboard className="h-4 w-4" aria-hidden /> Dashboard
          </Link>
          {authority && (
            <Link href="/authority/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => setOpen(false)}>
              <Settings className="h-4 w-4" aria-hidden /> Settings
            </Link>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/10"
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
