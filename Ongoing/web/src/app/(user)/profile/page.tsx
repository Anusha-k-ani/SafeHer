"use client";

import { useSession } from "@/lib/suraksha/session-context";
import { homeFor } from "@/lib/suraksha/domain";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading, logout } = useSession();
  if (loading) return <p className="p-6 text-sm text-[#64748B]">Checking session…</p>;
  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-2 text-sm text-[#64748B]">Sign in to see your account. <Link className="font-semibold text-teal-700" href="/login">Login</Link></p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0B1D33]">My Profile</h1>
      <dl className="rounded-2xl border border-[#D8E0E8] bg-white p-5 text-sm">
        <dt className="text-[#64748B]">Name</dt>
        <dd className="font-semibold">{user.name}</dd>
        <dt className="mt-3 text-[#64748B]">Username</dt>
        <dd className="font-semibold">{user.username}</dd>
        <dt className="mt-3 text-[#64748B]">Role</dt>
        <dd className="font-semibold">{user.role}</dd>
      </dl>
      <p className="text-sm text-[#64748B]">These are demonstration accounts. Password hashing and public registration are not implemented. Email is not stored, so username is shown instead.</p>
      <div className="flex gap-3">
        <Link href={homeFor(user.role)} className="rounded-xl bg-[#0B1D33] px-4 py-2 text-sm font-semibold text-white">Dashboard</Link>
        <button type="button" className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={() => logout().then(() => { location.href = "/"; })}>Logout</button>
      </div>
    </main>
  );
}
