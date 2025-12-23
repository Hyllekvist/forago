import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const MONTH_NUM_TO_SLUG: Record<number, string> = {
  1: "january",
  2: "february",
  3: "march",
  4: "april",
  5: "may",
  6: "june",
  7: "july",
  8: "august",
  9: "september",
  10: "october",
  11: "november",
  12: "december",
};

const LOCALES = ["dk"] as const;
const MONTH_THRESHOLD = 6;

function baseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function monthsBetween(from: number, to: number) {
  const out: number[] = [];
  if (from <= to) {
    for (let m = from; m <= to; m++) out.push(m);
  } else {
    for (let m = from; m <= 12; m++) out.push(m);
    for (let m = 1; m <= to; m++) out.push(m);
  }
  return out;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const sb = supabasePublic();

  // ✅ species has created_at (not updated_at)
  const { data: species, error: spErr } = await sb
    .from("species")
    .select("slug, created_at")
    .order("slug", { ascending: true });

  if (spErr) throw spErr;

  const { data: monthPages, error: mpErr } = await sb
    .from("season_month_pages")
    .select("locale, month, updated_at");

  if (mpErr) throw mpErr;

  const { data: seas, error: seasErr } = await sb
    .from("seasonality")
    .select("country, region, month_from, month_to");

  if (seasErr) throw seasErr;

  const out: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    out.push(
      { url: `${base}/${locale}`, lastModified: new Date() },
      { url: `${base}/${locale}/species`, lastModified: new Date() },
      { url: `${base}/${locale}/season`, lastModified: new Date() },
      { url: `${base}/${locale}/guides`, lastModified: new Date() },
      { url: `${base}/${locale}/guides/safety-basics`, lastModified: new Date() },
      { url: `${base}/${locale}/guides/lookalikes`, lastModified: new Date() }
    );

    for (const s of species ?? []) {
      out.push({
        url: `${base}/${locale}/species/${s.slug}`,
        lastModified: s.created_at ? new Date(s.created_at) : new Date(),
      });
    }

    // month counts from seasonality (country = locale, region = '')
    const monthCount = new Map<number, number>();
    const rows = (seas ?? []).filter(
      (r: any) => r.country === locale && (r.region ?? "") === ""
    );

    for (const r of rows) {
      const from = Number(r.month_from);
      const to = Number(r.month_to);
      for (const m of monthsBetween(from, to)) {
        monthCount.set(m, (monthCount.get(m) ?? 0) + 1);
      }
    }

    // include month page if threshold met OR intro exists in DB
    const dbMonths = new Set<number>(
      (monthPages ?? [])
        .filter((p: any) => p.locale === locale)
        .map((p: any) => Number(p.month))
    );

    for (let m = 1; m <= 12; m++) {
      const count = monthCount.get(m) ?? 0;
      if (count >= MONTH_THRESHOLD || dbMonths.has(m)) {
        out.push({
          url: `${base}/${locale}/season/${MONTH_NUM_TO_SLUG[m]}`,
          lastModified: new Date(),
        });
      }
    }
  }

  return out;
}