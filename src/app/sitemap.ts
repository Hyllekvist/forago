import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPPORTED_LOCALES = ["dk", "en"] as const;
const MONTH_SLUGS = [
  "",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const MIN_SPECIES_PER_MONTH = 10;

function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

function supabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars for sitemap.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function inMonth(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  // wrap-around season (e.g. Nov->Feb)
  return month >= from || month <= to;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const supabase = supabaseAnon();

  const { data: species, error: spErr } = await supabase
    .from("species")
    .select("slug, created_at")
    .order("slug", { ascending: true });

  if (spErr) throw spErr;

  const entries: MetadataRoute.Sitemap = [];

  entries.push({
    url: `${base}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  });

  // Pull all seasonality once, then compute month coverage per locale (country=locale)
  const { data: seas, error: seasErr } = await supabase
    .from("seasonality")
    .select("country, region, species_id, month_from, month_to, confidence")
    .eq("region", ""); // national only for now

  if (seasErr) throw seasErr;

  for (const locale of SUPPORTED_LOCALES) {
    // Core pages
    const core = [`/${locale}`, `/${locale}/species`, `/${locale}/season`, `/${locale}/guides`, `/${locale}/feed`];

    for (const path of core) {
      entries.push({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === `/${locale}` ? 0.8 : 0.7,
      });
    }

    // Species pages
    for (const sp of species ?? []) {
      entries.push({
        url: `${base}/${locale}/species/${sp.slug}`,
        lastModified: sp.created_at ? new Date(sp.created_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }

    // Smart month pages (only if month has enough species)
    const relevant = (seas ?? []).filter((r) => (r.country as string) === locale);

    for (let m = 1; m <= 12; m++) {
      const set = new Set<string>();
      for (const r of relevant) {
        const from = r.month_from as number;
        const to = r.month_to as number;
        if (inMonth(m, from, to)) set.add(r.species_id as string);
      }

      if (set.size >= MIN_SPECIES_PER_MONTH) {
        entries.push({
          url: `${base}/${locale}/season/${MONTH_SLUGS[m]}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.65,
        });
      }
    }
  }

  return entries;
}