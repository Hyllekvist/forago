import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";
import { LOCALES, isLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { locale: string } };

function currentMonthUTC() {
  return new Date().getUTCMonth() + 1; // 1..12
}

export default async function FeedPage({ params }: Props) {
  const locale = params?.locale;
  if (!locale || !isLocale(locale)) return notFound();

  const month = currentMonthUTC();
  const supabase = await supabaseServer();

  // midlertidigt: land = locale, region = ""
  const country = locale;
  const region = "";

  // --- In-season now (top picks) ---
  let inSeason: Array<{
    slug: string;
    name: string;
    confidence: number;
    short?: string | null;
  }> = [];

  try {
    const { data: seas, error: seasErr } = await supabase
      .from("seasonality")
      .select("species_id, month_from, month_to, confidence")
      .eq("country", country)
      .eq("region", region);

    if (!seasErr && seas?.length) {
      const inNow = (seas ?? [])
        .filter((r: any) => {
          const from = r.month_from as number;
          const to = r.month_to as number;
          if (!from || !to) return false;
          if (from <= to) return month >= from && month <= to;
          return month >= from || month <= to;
        })
        .sort((a: any, b: any) => (b.confidence ?? 0) - (a.confidence ?? 0))
        .slice(0, 18);

      const ids = inNow.map((r: any) => r.species_id as string);

      if (ids.length) {
        const [{ data: sp }, { data: tr }] = await Promise.all([
          supabase.from("species").select("id, slug").in("id", ids),
          supabase
            .from("species_translations")
            .select("species_id, common_name, short_description")
            .eq("locale", locale)
            .in("species_id", ids),
        ]);

        const slugMap = new Map((sp ?? []).map((s: any) => [s.id, s.slug]));
        const trMap = new Map(
          (tr ?? []).map((t: any) => [
            t.species_id,
            { name: t.common_name, short: t.short_description },
          ])
        );

        inSeason = inNow
          .map((r: any) => {
            const id = r.species_id as string;
            const slug = slugMap.get(id);
            const t = trMap.get(id);
            return slug
              ? {
                  slug,
                  name: t?.name || slug,
                  short: t?.short ?? null,
                  confidence: (r.confidence as number) ?? 0,
                }
              : null;
          })
          .filter(Boolean) as any;
      }
    }
  } catch {
    // ignore
  }

  // --- New spots (recent) ---
  let recentSpots: Array<{
    id: string;
    title?: string | null;
    species_slug?: string | null;
    created_at?: string | null;
  }> = [];

  try {
    const { data, error } = await supabase
      .from("spots")
      .select("id, title, species_slug, created_at")
      .order("created_at", { ascending: false })
      .limit(18);

    if (!error) recentSpots = (data ?? []) as any;
  } catch {
    // ignore
  }

  return (
    <FeedClient
      locale={locale}
      month={month}
      inSeason={inSeason}
      recentSpots={recentSpots}
    />
  );
} 