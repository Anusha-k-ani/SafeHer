"use client";

import { usePathname } from "next/navigation";
import { AdminNav, AdminFooter } from "@/components/layout/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin";

  if (isLogin) {
    return <main className="flex-1 bg-[#F9FAFB]">{children}</main>;
  }

  return (
    <>
      <AdminNav />
      <main className="flex-1">{children}</main>
      <AdminFooter />
    </>
  );
}
