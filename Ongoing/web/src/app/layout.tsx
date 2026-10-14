import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurakshaSetu — Connecting Streets. Protecting Lives.",
  description:
    "Incident Analysis and Hotspot Identification for Security Provision against Women Harassment in Public Spaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-[#F5F7FA] text-[#1F2937] antialiased">
        {children}
      </body>
    </html>
  );
}
