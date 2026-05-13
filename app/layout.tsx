import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { XIcon } from "@/components/BrandIcons";

const serif = Fraunces({
  variable: "--font-display-serif",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

const sans = Inter({
  variable: "--font-body-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "My AI Engineer Singapore 2026 — agenda planner",
  description:
    "Pick your sessions across the 3-day AI Engineer Singapore 2026 conference and get a shareable card of your personal agenda.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <footer className="flex justify-center px-6 py-6">
          <a
            href="https://x.com/nshawbin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-[13px] font-bold tracking-wide transition-colors hover:opacity-100"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            <XIcon className="h-3.5 w-3.5" />
            @nshawbin
          </a>
        </footer>
      </body>
    </html>
  );
}
