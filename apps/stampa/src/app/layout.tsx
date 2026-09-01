import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { BRAND, copy } from "@/lib/copy";
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

const origin = process.env.APP_URL ?? "https://stampa.ng";

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: copy.site.title,
    template: "%s · Stampa",
  },
  description: copy.site.description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
  },
  applicationName: "Stampa",
  appleWebApp: { capable: true, title: "Stampa", statusBarStyle: "default" },
  robots: { index: true, follow: true },
  openGraph: {
    title: copy.site.title,
    description: copy.site.description,
    locale: "en_NG",
    type: "website",
    siteName: BRAND.name,
    url: origin,
    images: [{ url: "/brand/icon-512.png", width: 512, height: 512, alt: BRAND.name }],
  },
  twitter: {
    card: "summary",
    title: copy.site.title,
    description: copy.site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#4C2A85",
  // Not `maximum-scale`: pinch-zoom stays available. Phase 14.7 requires 200%
  // text scaling to work, and disabling zoom is the classic way to break it.
  width: "device-width",
  initialScale: 1,
};

function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    email: BRAND.supportEmail,
    telephone: BRAND.supportPhoneTel,
    url: origin,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BRAND.supportPhoneTel,
      email: BRAND.supportEmail,
      contactType: "customer support",
      areaServed: "NG",
      availableLanguage: ["en"],
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>
        <OrganizationJsonLd />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
