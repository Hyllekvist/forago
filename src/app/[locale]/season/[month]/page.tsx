import Link from "next/link"; 
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const MONTH_SLUG_TO_NUM: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const MONTH_NUM_TO_DK: Record<number, string> = {
  1: "januar",
  2: "februar",
  3: "marts",
  4: "april",
  5: "maj",
  6: "juni",
  7: "juli",
  8: "august",
  9: "september",
  10: "oktober",
  11: "november",
  12: "december",
};

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function inMonth(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to; // wrap-around
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; month: string };
}) {
  if (!isLocale(params.locale)) return { title: "Forago" };

  const monthNum = MONTH_SLUG_TO_NUM[params.month];
  if (!monthNum) return { title: "Forago" };

const supabase = await supabaseServer();
  const { data: mp } = await supabase
    .from("season_month_pages")
    .select("title, seo_description")
    .eq("locale", params.locale)
    .eq("month", monthNum)
    .maybeSingle();

  const title = mp?.title || `Season ${params.month} — Forago`;
  const description =
    mp?.seo_description ||
    (params.locale === "dk"
      ? `Se hvad der er i sæson i ${MONTH_NUM_TO_DK[monthNum]}.`
      : `See what's in season in ${params.month}.`);

  return {
    title,
    description,
    alternates: { canonical: `/${params.locale}/season/${params.month}` },
  };
}

export default async function SeasonMonthPage({
  params,
}: {
  params: { locale: string; month: string };
}) {
  if (!isLocale(params.locale)) return notFound();
  const locale = params.locale;

  const monthNum = MONTH_SLUG_TO_NUM[params.month];
  if (!monthNum) return notFound();

const supabase = await supabaseServer();

  // Month page intro (SEO text)
  const { data: mp, error: mpErr } = await supabase
    .from("season_month_pages")
    .select("title, intro")
    .eq("locale", locale)
    .eq("month", monthNum)
    .maybeSingle();

  if (mpErr) throw mpErr;

  // Species in season in this month (DK national region='')
  const { data: seas, error: seasErr } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", locale)
    .eq("region", "");

  if (seasErr) throw seasErr;

  const ids =
    (seas ?? [])
      .filter((r: any) => inMonth(monthNum, r.month_from as number, r.month_to as number))
      .map((r: any) => ({ id: r.species_id as string, conf: (r.confidence as number) ?? 0 })) ?? [];

  // Load species + translations
  const uniqueIds = Array.from(new Set(ids.map((x) => x.id)));
  let speciesCards: Array<{ slug: string; name: string; conf: number }> = [];

  if (uniqueIds.length) {
    const { data: spRows, error: sp2Err } = await supabase
      .from("species")
      .select("id, slug")
      .in("id", uniqueIds);

    if (sp2Err) throw sp2Err;

    const { data: trRows, error: tr2Err } = await supabase
      .from("species_translations")
      .select("species_id, common_name, locale")
      .eq("locale", locale)
      .in("species_id", uniqueIds);

    if (tr2Err) throw tr2Err;

    const slugMap = new Map((spRows ?? []).map((s: any) => [s.id as string, s.slug as string]));
    const nameMap = new Map((trRows ?? []).map((t: any) => [t.species_id as string, t.common_name as string]));
    const confMap = new Map(ids.map((x) => [x.id, x.conf]));

    speciesCards = uniqueIds
      .map((id) => ({
        slug: slugMap.get(id) || "",
        name: nameMap.get(id) || slugMap.get(id) || "unknown",
        conf: confMap.get(id) || 0,
      }))
      .filter((x) => x.slug)
      .sort((a, b) => b.conf - a.conf);
  }

  const monthLabel = locale === "dk" ? MONTH_NUM_TO_DK[monthNum] : params.month;

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <p style={{ margin: 0 }}>
        <Link href={`/${locale}/season`} style={{ textDecoration: "none" }}>
          ← {locale === "dk" ? "Sæson" : "Season"}
        </Link>
      </p>

      <h1 style={{ margin: "10px 0 8px" }}>
        {locale === "dk" ? `I sæson i ${monthLabel}` : `In season in ${monthLabel}`}
      </h1>

      <section
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: 14,
          background: "rgba(255,255,255,0.03)",
          marginTop: 10,
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>
          {locale === "dk" ? "Overblik" : "Overview"}
        </h2>
        <div style={{ opacity: 0.92, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {mp?.intro ||
            (locale === "dk"
              ? "Tilføj intro i season_month_pages (det er din SEO-tekst)."
              : "Add intro in season_month_pages (this is your SEO text).")}
        </div>

        {/* Interlinking → Guides */}
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href={`/${locale}/guides/safety-basics`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            {locale === "dk" ? "Sikkerhed →" : "Safety →"}
          </Link>
          <Link
            href={`/${locale}/guides/lookalikes`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            {locale === "dk" ? "Forvekslinger →" : "Look-alikes →"}
          </Link>
        </div>
      </section>

      <h2 style={{ margin: "16px 0 10px", fontSize: 16 }}>
        {locale === "dk" ? "Arter i sæson" : "Species in season"}
      </h2>

      {speciesCards.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 10,
          }}
        >
          {speciesCards.map((s) => (
            <Link
              key={s.slug}
              href={`/${locale}/species/${s.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 14,
                padding: 12,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{s.name}</div>
              <div style={{ opacity: 0.78, fontSize: 13 }}>
                {locale === "dk" ? "Sæson match" : "Season match"} · {s.conf}%
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ opacity: 0.75, margin: 0 }}>
          {locale === "dk"
            ? "Ingen arter er knyttet til denne måned endnu. Tilføj seasonality-rækker."
            : "No species linked to this month yet. Add seasonality rows."}
        </p>
      )}
    </main>
  );
}