import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16">
      <Logo />
      <h1 className="mt-8 text-3xl font-bold text-[#0B1D33]">Public registration is not available</h1>
      <p className="mt-3 text-sm text-[#64748B]">
        This build uses local demonstration accounts. New self-serve sign-up, email verification and password reset are not implemented, so this page does not pretend they exist.
      </p>
      <p className="mt-3 text-sm text-[#64748B]">Use the citizen demonstration login to explore the citizen experience.</p>
      <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white">Go to login</Link>
    </main>
  );
}
