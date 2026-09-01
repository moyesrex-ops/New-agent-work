import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/copy";

/**
 * Installable web app (ticket P-04).
 *
 * A PWA rather than a Play Store listing, for the reason the whole product
 * exists: the supplier arrives from a WhatsApp link their customer sent, and a
 * store install between that link and their first invoice would lose most of
 * them. Installing is offered later, from a surface they already trust.
 *
 * `start_url` is /s and not / — the launcher icon belongs to the supplier app.
 * Nobody installs an accounts-payable console to their home screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — invoices your customer can pay`,
    short_name: BRAND.name,
    description:
      "Get the NRS reference number your customer needs, in about ninety seconds. Free for suppliers.",
    id: "/s",
    start_url: "/s",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en-NG",
    dir: "ltr",
    categories: ["business", "finance", "productivity"],
    background_color: "#FBF9F4",
    theme_color: "#4C2A85",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Separate artwork, not the same file relabelled: a launcher crops up to
      // 20% off each edge, and the any-purpose icon's corners would go with it.
      { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "New invoice",
        short_name: "New invoice",
        url: "/s/new",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
