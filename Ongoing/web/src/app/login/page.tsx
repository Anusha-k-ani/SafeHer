"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [kind, setKind] = useState<"user" | "authority">(params.get("kind") === "authority" ? "authority" : "user");
  const [username, setUsername] = useState(kind === "user" ? "citizen" : "supervisor");
  const [password, setPassword] = useState("suraksha-demo");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/suraksha/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Sign-in failed");
      return;
    }
    if (kind === "user" && data.role !== "public") {
      setError("That account is an authority login. Switch to Authority Login.");
      await fetch("/api/suraksha/session", { method: "DELETE" });
      return;
    }
    if (kind === "authority" && data.role === "public") {
      setError("That account is a public login. Switch to User Login.");
      await fetch("/api/suraksha/session", { method: "DELETE" });
      return;
    }
    router.push(data.home || "/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <Logo />
      <p className="mt-6 text-sm text-[#64748B]">
        Incident Analysis and Hotspot Identification for Security Provision against Women Harassment in Public Spaces
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-white p-1">
        {(["user", "authority"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setKind(item);
              setUsername(item === "user" ? "citizen" : "supervisor");
            }}
            className={`rounded-lg px-3 py-3 text-sm font-semibold ${kind === item ? "bg-[#0F766E] text-white" : "text-[#17324D]"}`}
          >
            {item === "user" ? "User Login" : "Authority Login"}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-2xl border border-[#D8E0E8] bg-white p-5">
        <label className="block text-sm font-semibold text-[#1F2937]">
          Username
          <input className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label className="block text-sm font-semibold text-[#1F2937]">
          Password
          <input className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="text-sm text-[#B42318]">{error}</p>}
        <button className="h-11 w-full rounded-lg bg-[#0F766E] text-sm font-semibold text-white" type="submit">
          Sign in
        </button>
        <p className="text-xs text-[#64748B]">
          Presentation accounts use the password suraksha-demo. Authority usernames: supervisor, reviewer, patrol, municipal, admin.
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
