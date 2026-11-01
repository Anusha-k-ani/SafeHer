import type { Metadata } from "next";
import "./globals.built.css";
import { RiskAlertDock } from "@/components/suraksha/RiskAlertButton";
import { SessionProvider } from "@/lib/suraksha/session-context";

export const metadata: Metadata = {
  title: "SurakshaSetu — Safe Spaces. Stronger Communities.",
  description: "A smarter way to report concerns, understand safety patterns and help communities build safer public spaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-[#F3F7FB] text-[#0B1D33] antialiased">
        <SessionProvider>
          {children}
          <RiskAlertDock />
        </SessionProvider>
      </body>
    </html>
  );
}
