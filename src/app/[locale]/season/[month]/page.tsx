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

const MONTH_NUM_TO_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(MONTH_SLUG_TO_NUM).map(([slug, n]) => [n, slug])
) as any;

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

function countryForLocale(_locale: string) {
  return "DK";
}

function inMonth(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to; // wrap-around
}

function monthLabel(locale: Locale, monthNum: number) {
  const slug = MONTH_NUM_TO_SLUG[monthNum] ?? String(monthNum);
  return locale === "dk" ? MONTH_NUM_TO_DK[monthNum] : slug;
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

  const fallbackTitle =
    params.locale === "dk"
      ? `Sæson i ${MONTH_NUM_TO_DK[monthNum]} — Forago`
      : `Season in ${params.month} — Forago`;

  const title = mp?.title || fallbackTitle;

  const description =
    mp?.seo_description ||
    (params.locale === "dk"
      ? `Se hvad der typisk er i sæson i ${MONTH_NUM_TO_DK[monthNum]} (privatliv først).`
      : `See what's typically in season in ${params.month} (privacy-first).`);

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
  const country = countryForLocale(locale);

  // Month page intro (SEO text)
  const { data: mp, error: mpErr } = await supabase
    .from("season_month_pages")
    .select("title, intro")
    .eq("locale", locale)
    .eq("month", monthNum)
    .maybeSingle();

  if (mpErr) throw mpErr;

  // ✅ BUGFIX: country må ikke være locale — det skal være "DK"
  const { data: seas, error: seasErr } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (seasErr) throw seasErr;

  const matches =
    (seas ?? [])
      .filter((r: any) => inMonth(monthNum, r.month_from as number, r.month_to as number))
      .map((r: any) => ({ id: r.species_id as string, conf: (r.confidence as number) ?? 0 })) ?? [];

  const uniqueIds = Array.from(new Set(matches.map((x) => x.id)));

  type Card = {
    slug: string;
    name: string;
    conf: number;
  };

  let speciesCards: Card[] = [];

  if (uniqueIds.length) {
    const { data: spRows, error: spErr } = await supabase
      .from("species")
      .select("id, slug, primary_group, scientific_name")
      .in("id", uniqueIds);

    if (spErr) throw spErr;

    const { data: trRows, error: trErr } = await supabase
      .from("species_translations")
      .select("species_id, common_name, short_description")
      .eq("locale", locale)
      .in("species_id", uniqueIds);

    if (trErr) throw trErr;

    const slugMap = new Map((spRows ?? []).map((s: any) => [s.id as string, s]));
    const trMap = new Map((trRows ?? []).map((t: any) => [t.species_id as string, t]));
    const confMap = new Map(matches.map((x) => [x.id, x.conf]));

    speciesCards = uniqueIds
      .map((id) => {
        const s = slugMap.get(id);
        if (!s?.slug) return null;

        const t = trMap.get(id);
        return {
          slug: s.slug as string,
          name: (t?.common_name as string) || (s.slug as string),
          conf: confMap.get(id) || 0,
          // extra (til UI)
          group: (s.primary_group as string) || "plant",
          scientific: (s.scientific_name as string) || "",
          desc: (t?.short_description as string) || "",
        };
      })
      .filter(Boolean) as any;

    speciesCards.sort((a: any, b: any) => (b.conf ?? 0) - (a.conf ?? 0));
  }

  const label = monthLabel(locale, monthNum);

  // Month switcher
  const monthItems = Array.from({ length: 12 }).map((_, i) => {
    const n = i + 1;
    const slug = MONTH_NUM_TO_SLUG[n];
    return {
      n,
      slug,
      label: locale === "dk" ? MONTH_NUM_TO_DK[n].slice(0, 3) : slug.slice(0, 3),
      href: `/${locale}/season/${slug}`,
      active: n === monthNum,
    };
  });

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.breadcrumb}>
          <Link className={styles.back} href={`/${locale}/season`}>
            ← {locale === "dk" ? "Sæson" : "Season"}
          </Link>
        </div>

        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.h1}>
              {locale === "dk" ? `I sæson i ${label}` : `In season in ${label}`}
            </h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Typiske arter for måneden. Privatliv først — ingen spots."
                : "Typical species for the month. Privacy-first — no spots."}
            </p>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.countPill}>
              <span className={styles.countDot} aria-hidden="true" />
              <span className={styles.countTxt}>
                {speciesCards.length} {locale === "dk" ? "arter" : "species"}
              </span>
            </div>
          </div>
        </div>

        <nav className={styles.monthStrip} aria-label={locale === "dk" ? "Vælg måned" : "Pick month"}>
          {monthItems.map((m) => (
            <Link
              key={m.slug}
              href={m.href}
              className={[styles.monthChip, m.active ? styles.monthChipActive : ""].join(" ")}
              aria-current={m.active ? "page" : undefined}
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className={styles.overview}>
        <div className={styles.overviewTop}>
          <h2 className={styles.h2}>{locale === "dk" ? "Overblik" : "Overview"}</h2>

          <div className={styles.linkRow}>
            <Link className={styles.pillLink} href={`/${locale}/guides/safety-basics`}>
              {locale === "dk" ? "Sikkerhed →" : "Safety →"}
            </Link>
            <Link className={styles.pillLink} href={`/${locale}/guides/lookalikes`}>
              {locale === "dk" ? "Forvekslinger →" : "Look-alikes →"}
            </Link>
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
        <p className={styles.sectionSub}>
          {locale === "dk"
            ? "Sorterede efter confidence (højeste først)."
            : "Sorted by confidence (highest first)."}
        </p>
      </section>

      {speciesCards.length ? (
        <section className={styles.grid} aria-label={locale === "dk" ? "Arter" : "Species"}>
          {speciesCards.map((s: any) => (
            <Link key={s.slug} href={`/${locale}/species/${s.slug}`} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.name}>{s.name}</div>
                <span
                  className={[
                    styles.conf,
                    s.conf >= 80 ? styles.confHigh : s.conf >= 50 ? styles.confMid : styles.confLow,
                  ].join(" ")}
                >
                  {s.conf}%
                </span>
              </div>

              <div className={styles.meta}>
                {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
                <span className={styles.dot} aria-hidden="true">·</span>
                <span className={styles.group}>{s.group}</span>
              </div>

              <div className={styles.desc}>
                {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
              </div>

              <div className={styles.cardFoot}>
                <span className={styles.pill}>/{locale}/species/{s.slug}</span>
                <span className={styles.open} aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true">🗓️</div>
          <div className={styles.emptyTitle}>
            {locale === "dk"
              ? "Ingen arter er knyttet til denne måned endnu"
              : "No species linked to this month yet"}
          </div>
          <div className={styles.emptyText}>
            {locale === "dk"
              ? "Tilføj seasonality-rækker for DK national (region='') for at få indhold her."
              : "Add seasonality rows for DK national (region='') to populate this page."}
          </div>
          <Link className={styles.emptyCta} href={`/${locale}/season`}>
            {locale === "dk" ? "Tilbage til sæson nu →" : "Back to season now →"}
          </Link>
        </section>
      )}
    </main>
  );
}