"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configError = searchParams.get("error") === "not_configured";
  const next = searchParams.get("next") || "/admin/dashboard";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password, next }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        next?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push(data.next || "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-white">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#111827]">Admin login</h1>
            <p className="text-sm text-[#6B7280]">SafeHer analytics portal</p>
          </div>
        </div>

        {configError && (
          <p className="mb-4 rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">
            Set <code className="font-mono">ADMIN_PASSWORD</code> in{" "}
            <code className="font-mono">web/.env.local</code> and restart the
            server.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-bold text-[#111827]"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !password}
            className="h-11 w-full rounded-xl bg-[#111827] hover:bg-[#374151]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          <Link href="/" className="font-semibold text-[#7C3AED] hover:underline">
            ← Back to SafeHer
          </Link>
        </p>
      </div>
    </div>
  );
}
