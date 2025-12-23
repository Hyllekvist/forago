import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPPORTED_LOCALES = ["dk", "en"] as const;

function siteUrl() {
  // Vercel sets VERCEL_URL. Locally you can set NEXT_PUBLIC_SITE_URL.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  // Fallback
  return "http://localhost:3000";
}

function supabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars for sitemap.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const supabase = supabaseAnon();

  const { data: species, error } = await supabase
    .from("species")
    .select("slug, created_at")
    .order("slug", { ascending: true });

  if (error) throw error;

  const staticPerLocale = (locale: string) => [
    `/${locale}`,
    `/${locale}/species`,
    `/${locale}/season`,
    `/${locale}/guides`,
    `/${locale}/feed`,
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Root landing (if you have one)
  entries.push({
    url: `${base}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  });

  for (const locale of SUPPORTED_LOCALES) {
    for (const path of staticPerLocale(locale)) {
      entries.push({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path.endsWith(`/${locale}`) ? 0.8 : 0.7,
      });
    }

    for (const sp of species ?? []) {
      entries.push({
        url: `${base}/${locale}/species/${sp.slug}`,
        lastModified: sp.created_at ? new Date(sp.created_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return entries;
}