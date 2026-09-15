import { UserNav, UserFooter } from "@/components/layout/UserNav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserNav />
      <main className="flex-1">{children}</main>
      <UserFooter />
    </>
  );
}
