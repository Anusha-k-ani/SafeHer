import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-[#6B7280]">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
