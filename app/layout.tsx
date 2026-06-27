import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora · Travel by timing, not by luck.",
  description:
    "Plan once. Refine all year. A living annual travel plan whose confidence converges over time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://rsms.me/"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className="min-h-screen bg-white text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
