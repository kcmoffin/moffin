import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moffin — User Management",
  description: "Minimalist fullstack user dashboard connected to MySQL Workbench",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground antialiased selection:bg-pink-100 selection:text-pink-900">
        {children}
      </body>
    </html>
  );
}
