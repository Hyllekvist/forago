import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/locales";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  // Keep this conservative for MVP; later generate from DB + per-locale sitemaps.
  const paths = [
    "",
    "/season",
    "/species",
    "/guides",
    "/feed",
    "/map",
    "/log",
    "/me",
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const l of LOCALES) {
    for (const p of paths) {
      entries.push({
        url: `${base}/${l}${p}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }
  }

  return entries;
}
