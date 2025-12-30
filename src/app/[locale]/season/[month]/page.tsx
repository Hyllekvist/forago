// src/app/[locale]/season/[month]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./SeasonMonth.module.css";

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

function countryForLocale(_locale: Locale) {
  return "DK";
}

function inMonth(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

export async function generateMetadata({ params }: { params: { locale: string; month: string } }) {
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

export default async function SeasonMonthPage({ params }: { params: { locale: string; month: string } }) {
  if (!isLocale(params.locale)) return notFound();
  const locale = params.locale;

  const monthNum = MONTH_SLUG_TO_NUM[params.month];
  if (!monthNum) return notFound();

  const supabase = await supabaseServer();
  const country = countryForLocale(locale);

  const { data: mp, error: mpErr } = await supabase
    .from("season_month_pages")
    .select("title, intro")
    .eq("locale", locale)
    .eq("month", monthNum)
    .maybeSingle();

  if (mpErr) throw mpErr;

  const { data: seas, error: seasErr } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (seasErr) throw seasErr;

  const ids =
    (seas ?? [])
      .filter((r: any) => inMonth(monthNum, r.month_from as number, r.month_to as number))
      .map((r: any) => ({ id: r.species_id as string, conf: (r.confidence as number) ?? 0 })) ?? [];

  const uniqueIds = Array.from(new Set(ids.map((x) => x.id)));
  let speciesCards: Array<{ slug: string; name: string; conf: number }> = [];

  if (uniqueIds.length) {
    const { data: spRows, error: sp2Err } = await supabase.from("species").select("id, slug").in("id", uniqueIds);
    if (sp2Err) throw sp2Err;

    const { data: trRows, error: tr2Err } = await supabase
      .from("species_translations")
      .select("species_id, common_name")
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
    <main className={styles.wrap}>
      <Link href={`/${locale}/season`} className={styles.back}>
        ← {locale === "dk" ? "Sæson" : "Season"}
      </Link>

      <header className={styles.hero}>
        <div className={styles.kicker}>{locale === "dk" ? "MÅNED" : "MONTH"}</div>
        <h1 className={styles.h1}>
          {locale === "dk" ? `I sæson i ${monthLabel}` : `In season in ${monthLabel}`}
        </h1>
        <p className={styles.sub}>
          {locale === "dk"
            ? "Overblik + SEO-tekst. Privatliv først — ingen spots."
            : "Overview + SEO text. Privacy first — no spots."}
        </p>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.h2}>{locale === "dk" ? "Overblik" : "Overview"}</h2>
        <div className={styles.intro}>
          {mp?.intro ||
            (locale === "dk"
              ? "Tilføj intro i season_month_pages (det er din SEO-tekst)."
              : "Add intro in season_month_pages (this is your SEO text).")}
        </div>

        <div className={styles.links}>
          <Link href={`/${locale}/guides/safety-basics`} className={styles.pill}>
            {locale === "dk" ? "Sikkerhed" : "Safety"} →
          </Link>
          <Link href={`/${locale}/guides/lookalikes`} className={styles.pill}>
            {locale === "dk" ? "Forvekslinger" : "Look-alikes"} →
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionKicker}>{locale === "dk" ? "I SÆSON" : "IN SEASON"}</div>
            <h2 className={styles.h2}>{locale === "dk" ? "Arter" : "Species"}</h2>
          </div>
          <div className={styles.count}>{speciesCards.length}</div>
        </div>

        {speciesCards.length ? (
          <div className={styles.grid}>
            {speciesCards.map((s) => (
              <Link key={s.slug} href={`/${locale}/species/${s.slug}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardTitle}>{s.name}</div>
                  <div className={styles.badge}>{s.conf}%</div>
                </div>
                <div className={styles.cardMeta}>
                  {locale === "dk" ? "Sæson match" : "Season match"}
                </div>
                <div className={styles.cardArrow} aria-hidden="true">
                  →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            {locale === "dk"
              ? "Ingen arter er knyttet til denne måned endnu. Tilføj seasonality-rækker."
              : "No species linked to this month yet. Add seasonality rows."}
          </div>
        )}
      </section>
    </main>
  );
}