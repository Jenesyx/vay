import type { Metadata, Viewport } from "next";
import { Lalezar, Markazi_Text, Mirza, VT323 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const lalezar = Lalezar({ variable: "--font-lalezar", weight: "400", subsets: ["arabic", "latin"] });
const mirza = Mirza({ variable: "--font-mirza", weight: ["400", "700"], subsets: ["arabic", "latin"] });
const markazi = Markazi_Text({ variable: "--font-markazi", subsets: ["arabic", "latin"] });
const vt = VT323({ variable: "--font-vt", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "وای — کیکستی × مرصاد | VAY — KIXTY × MERSAD",
  description: "An unofficial fan-made site for VAY by KIXTY × MERSAD: the wedding tape, the lyrics, the album, and your shabash.",
};

export const viewport: Viewport = {
  themeColor: "#0d0a07",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${lalezar.variable} ${mirza.variable} ${markazi.variable} ${vt.variable}`}>
      <head>
        {/* a refresh always starts at the top (turned off before the browser restores the old position) */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual';scrollTo(0,0)" }} />
      </head>
      {/* browser extensions (Grammarly, ColorZilla…) write attributes onto <body> before React loads */}
      <body suppressHydrationWarning>
        {children}
        {/* Vercel Web Analytics: page views, served from the site's own domain (no third-party CDN) */}
        <Analytics />
      </body>
    </html>
  );
}
