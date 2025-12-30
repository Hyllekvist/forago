import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./Season.module.css";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function countryForLocale(_locale: string) {
  return "DK";
}

function monthName(locale: Locale, m: number) {
  const dk = [
    "",
    "januar",
    "februar",
    "marts",
    "april",
    "maj",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "december",
  ];
  const en = [
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
  ];
  return (locale === "dk" ? dk : en)[m] ?? String(m);
}

function monthSlug(m: number) {
  const slugs = [
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
  ];
  return slugs[m] ?? String(m);
}

function currentMonthUTC() {
  return new Date().getUTCMonth() + 1;
}

function inSeasonForMonth(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return { title: "Forago" };

  const title = localeParam === "dk" ? "Sæson nu — Forago" : "In season now — Forago";
  const description =
    localeParam === "dk"
      ? "Se hvad der er i sæson lige nu (uden at udlevere spots)."
      : "See what’s in season right now (privacy-first).";

  return { title, description, alternates: { canonical: `/${localeParam}/season` } };
}

export default async function SeasonNowPage({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const month = currentMonthUTC();
  const country = countryForLocale(locale);

  const supabase = await supabaseServer();

  const { data: rows, error } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (error) throw error;

  const all = rows ?? [];
  const inSeason = all.filter((r) =>
    inSeasonForMonth(month, r.month_from as number, r.month_to as number)
  );

  const ids = inSeason.map((r) => r.species_id as string);

  const { data: species } = ids.length
    ? await supabase.from("species").select("id, slug, primary_group, scientific_name").in("id", ids)
    : { data: [] as any[] };

  const { data: tr } = ids.length
    ? await supabase
        .from("species_translations")
        .select("species_id, common_name, short_description")
        .eq("locale", locale)
        .in("species_id", ids)
    : { data: [] as any[] };

  const trMap = new Map((tr ?? []).map((t: any) => [t.species_id as string, t]));

  const items = (species ?? [])
    .map((s: any) => {
      const t = trMap.get(s.id as string);
      const season = inSeason.find((x) => x.species_id === s.id);
      return {
        id: s.id as string,
        slug: s.slug as string,
        group: (s.primary_group as string) || "plant",
        scientific: (s.scientific_name as string) || "",
        name: (t?.common_name as string) || (s.slug as string),
        desc: (t?.short_description as string) || "",
        confidence: (season?.confidence as number) ?? 0,
      };
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const title = locale === "dk" ? "I sæson nu" : "In season now";
  const subtitle =
    locale === "dk"
      ? `Måned: ${monthName(locale, month)} · Privatliv først (ingen spots).`
      : `Month: ${monthName(locale, month)} · Privacy-first (no spots).`;

  const monthLink = `/${locale}/season/${monthSlug(month)}`;

  const count = items.length;
  const hi = items.filter((x) => (x.confidence ?? 0) >= 80).length;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.h1}>{title}</h1>
            <p className={styles.sub}>{subtitle}</p>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.monthPill} aria-label="Current month">
              <span className={styles.monthDot} aria-hidden="true" />
              <span className={styles.monthTxt}>{monthName(locale, month)}</span>
            </div>

            <Link className={styles.cta} href={monthLink}>
              {locale === "dk" ? "Se hele måneden" : "See full month"}
              <span className={styles.ctaArrow} aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statKicker}>{locale === "dk" ? "I sæson" : "In season"}</div>
            <div className={styles.statValue}>{count}</div>
            <div className={styles.statNote}>
              {locale === "dk" ? "arter denne måned" : "species this month"}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statKicker}>{locale === "dk" ? "Høj sikkerhed" : "High confidence"}</div>
            <div className={styles.statValue}>{hi}</div>
            <div className={styles.statNote}>
              {locale === "dk" ? "≥ 80% confidence" : "≥ 80% confidence"}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statKicker}>{locale === "dk" ? "Princip" : "Principle"}</div>
            <div className={styles.statValueSmall}>
              {locale === "dk" ? "Ingen spots" : "No spots"}
            </div>
            <div className={styles.statNote}>
              {locale === "dk" ? "privatliv først" : "privacy-first"}
            </div>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <section className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true">🌿</div>
          <div className={styles.emptyTitle}>
            {locale === "dk"
              ? "Ingen arter i sæson endnu"
              : "No species in season yet"}
          </div>
          <div className={styles.emptyText}>
            {locale === "dk"
              ? "Tilføj seasonality-rækker (DK national) for at få indhold her."
              : "Add seasonality rows (DK national) to populate this view."}
          </div>

          <Link className={styles.emptyCta} href={monthLink}>
            {locale === "dk" ? "Se månedssiden →" : "See month page →"}
          </Link>
        </section>
      ) : (
        <section className={styles.grid} aria-label={locale === "dk" ? "Arter i sæson" : "Species in season"}>
          {items.map((s) => (
            <Link key={s.id} href={`/${locale}/species/${s.slug}`} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.name}>{s.name}</div>
                <span
                  className={[
                    styles.conf,
                    s.confidence >= 80 ? styles.confHigh : s.confidence >= 50 ? styles.confMid : styles.confLow,
                  ].join(" ")}
                  title="Confidence"
                >
                  {s.confidence}%
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
      )}
    </main>
  );
}