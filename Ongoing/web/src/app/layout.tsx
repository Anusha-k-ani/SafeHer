import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeHer — Bengaluru women's street safety",
  description:
    "Report how streets feel, see the community map, and get emergency help — Plus admin analytics from OpenStreetMap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-[#F9FAFB] text-[#374151] antialiased">
        {children}
      </body>
    </html>
  );
}
