import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.APP_URL ?? "https://stampa.ng";
  const paths = ["/", "/faq", "/contact", "/privacy", "/terms"];
  return paths.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
