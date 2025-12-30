// src/app/[locale]/season/[month]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./SeasonMonth.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function countryForLocale(_locale: string) {
  return "DK";
}

const MONTH_SLUG_TO_NUM: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const MONTH_NUM_TO_DK: Record<number, string> = {
  1: "januar", 2: "februar", 3: "marts", 4: "april", 5: "maj", 6: "juni",
  7: "juli", 8: "august", 9: "september", 10: "oktober", 11: "november", 12: "december",
};

const MONTH_NUM_TO_SLUG = Object.fromEntries(Object.entries(MONTH_SLUG_TO_NUM).map(([k, v]) => [v, k])) as Record<number, string>;

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
    .eq("country", country)   // ✅ FIX
    .eq("region", "");

  if (seasErr) throw seasErr;

  const matches =
    (seas ?? [])
      .filter((r: any) => inMonth(monthNum, r.month_from as number, r.month_to as number))
      .map((r: any) => ({ id: r.species_id as string, conf: (r.confidence as number) ?? 0 })) ?? [];

  const uniqueIds = Array.from(new Set(matches.map((x) => x.id)));

  let speciesCards: Array<{ slug: string; name: string; conf: number }> = [];
  if (uniqueIds.length) {
    const { data: spRows, error: spErr } = await supabase
      .from("species")
      .select("id, slug")
      .in("id", uniqueIds);
    if (spErr) throw spErr;

    const { data: trRows, error: trErr } = await supabase
      .from("species_translations")
      .select("species_id, common_name")
      .eq("locale", locale)
      .in("species_id", uniqueIds);
    if (trErr) throw trErr;

    const slugMap = new Map((spRows ?? []).map((s: any) => [s.id as string, s.slug as string]));
    const nameMap = new Map((trRows ?? []).map((t: any) => [t.species_id as string, t.common_name as string]));
    const confMap = new Map(matches.map((x) => [x.id, x.conf]));

    speciesCards = uniqueIds
      .map((id) => ({
        slug: slugMap.get(id) || "",
        name: nameMap.get(id) || slugMap.get(id) || "unknown",
        conf: confMap.get(id) || 0,
      }))
      .filter((x) => x.slug)
      .sort((a, b) => b.conf - a.conf);
  }

  const label = locale === "dk" ? MONTH_NUM_TO_DK[monthNum] : params.month;

  const prevNum = monthNum === 1 ? 12 : monthNum - 1;
  const nextNum = monthNum === 12 ? 1 : monthNum + 1;

  const prevHref = `/${locale}/season/${MONTH_NUM_TO_SLUG[prevNum]}`;
  const nextHref = `/${locale}/season/${MONTH_NUM_TO_SLUG[nextNum]}`;

  return (
    <main className={styles.wrap}>
      <header className={styles.top}>
        <Link className={styles.back} href={`/${locale}/season`}>← {locale === "dk" ? "Sæson" : "Season"}</Link>

        <div className={styles.headRow}>
          <div>
            <h1 className={styles.h1}>
              {locale === "dk" ? `I sæson i ${label}` : `In season in ${label}`}
            </h1>
            <p className={styles.sub}>
              {locale === "dk" ? "Month hub til SEO + interlinking." : "SEO hub + interlinking."}
            </p>
          </div>

          <div className={styles.pager}>
            <Link className={styles.pillBtn} href={prevHref}>← {locale === "dk" ? "Forrige" : "Prev"}</Link>
            <Link className={styles.pillBtn} href={nextHref}>{locale === "dk" ? "Næste" : "Next"} →</Link>
          </div>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelTitle}>{mp?.title || (locale === "dk" ? "Overblik" : "Overview")}</div>
          <div className={styles.panelChips}>
            <Link className={styles.chip} href={`/${locale}/guides/safety-basics`}>{locale === "dk" ? "Sikkerhed" : "Safety"} →</Link>
            <Link className={styles.chip} href={`/${locale}/guides/lookalikes`}>{locale === "dk" ? "Forvekslinger" : "Look-alikes"} →</Link>
          </div>
        </div>

        <div className={styles.intro}>
          {mp?.intro ||
            (locale === "dk"
              ? "Tilføj intro i season_month_pages (det er din SEO-tekst)."
              : "Add intro in season_month_pages (this is your SEO text).")}
        </div>
      </section>

      <section className={styles.sectionHead}>
        <h2 className={styles.h2}>{locale === "dk" ? "Arter i sæson" : "Species in season"}</h2>
        <span className={styles.count}>{speciesCards.length}</span>
      </section>

      {speciesCards.length ? (
        <section className={styles.grid}>
          {speciesCards.map((s) => (
            <Link key={s.slug} href={`/${locale}/species/${s.slug}`} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardTitle}>{s.name}</div>
                <span className={styles.conf}>{s.conf}%</span>
              </div>
              <div className={styles.cardHint}>
                {locale === "dk" ? "Sæson match" : "Season match"}
              </div>
              <div className={styles.cardFoot}>
                <span className={styles.path}>/{locale}/species/{s.slug}</span>
                <span className={styles.chev} aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>
            {locale === "dk" ? "Ingen arter på denne måned endnu." : "No species for this month yet."}
          </div>
          <div className={styles.emptySub}>
            {locale === "dk" ? "Tilføj seasonality-rækker (country=DK, region='')." : "Add seasonality rows (country=DK, region='')."}
          </div>
        </div>
      )}
    </main>
  );
}