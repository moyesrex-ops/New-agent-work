import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * Fonts are self-hosted with `display: swap` and are not preloaded: the system
 * fallback renders first and Archivo swaps in, which is the posture Phase 14.5
 * requires on a metered connection.
 */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-archivo",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-plex-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Stampa",
  description: "Get the NRS reference number your customer needs, in about ninety seconds.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/favicon.svg", apple: "/brand/app-icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#4C2A85",
  // Not `maximum-scale`: pinch-zoom stays available. Phase 14.7 requires 200%
  // text scaling to work, and disabling zoom is the classic way to break it.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
