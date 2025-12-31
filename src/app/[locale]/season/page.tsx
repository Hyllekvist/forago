// src/app/[locale]/season/page.tsx
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
  // MVP: Danmark, men klar til udvidelse senere
  return "dk"; // ✅ matcher DB (lowercase)
}

const MONTHS: { num: number; slug: string; dk: string; en: string }[] = [
  { num: 1, slug: "january", dk: "januar", en: "january" },
  { num: 2, slug: "february", dk: "februar", en: "february" },
  { num: 3, slug: "march", dk: "marts", en: "march" },
  { num: 4, slug: "april", dk: "april", en: "april" },
  { num: 5, slug: "may", dk: "maj", en: "may" },
  { num: 6, slug: "june", dk: "juni", en: "june" },
  { num: 7, slug: "july", dk: "juli", en: "july" },
  { num: 8, slug: "august", dk: "august", en: "august" },
  { num: 9, slug: "september", dk: "september", en: "september" },
  { num: 10, slug: "october", dk: "oktober", en: "october" },
  { num: 11, slug: "november", dk: "november", en: "november" },
  { num: 12, slug: "december", dk: "december", en: "december" },
];

function monthLabel(locale: Locale, m: number) {
  const row = MONTHS.find((x) => x.num === m);
  if (!row) return String(m);
  return locale === "dk" ? row.dk : row.en;
}

function monthSlug(m: number) {
  return MONTHS.find((x) => x.num === m)?.slug ?? String(m);
}

function currentMonthCopenhagenApprox() {
  // Server-side: UTC month (god nok til MVP)
  return new Date().getUTCMonth() + 1;
}

function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to; // wrap-around
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return { title: "Forago" };

  const title = localeParam === "dk" ? "Sæson nu — Forago" : "In season now — Forago";
  const description =
    localeParam === "dk"
      ? "Se hvad der er i sæson lige nu (privacy-first — ingen spots)."
      : "See what’s in season right now (privacy-first — no spots).";

  return {
    title,
    description,
    alternates: { canonical: `/${localeParam}/season` },
  };
}

export default async function SeasonNowPage({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const month = currentMonthCopenhagenApprox();
  const country = countryForLocale(locale);
  const supabase = await supabaseServer();

  // Hent DK national seasonality (region = '')
  const { data: rows, error } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (error) throw error;

  const inSeasonRows = (rows ?? []).filter((r: any) => {
    const a = r.month_from as number;
    const b = r.month_to as number;
    return isInSeason(month, a, b);
  });

  const ids = inSeasonRows.map((r: any) => r.species_id as string);

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
  const confMap = new Map(
    (inSeasonRows ?? []).map((r: any) => [r.species_id as string, (r.confidence as number) ?? 0])
  );

  const items = (species ?? [])
    .map((s: any) => {
      const t = trMap.get(s.id as string);
      return {
        id: s.id as string,
        slug: s.slug as string,
        group: (s.primary_group as string) || "plant",
        scientific: (s.scientific_name as string) || "",
        name: (t?.common_name as string) || (s.slug as string),
        desc: (t?.short_description as string) || "",
        confidence: confMap.get(s.id as string) ?? 0,
      };
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const title = locale === "dk" ? "I sæson nu" : "In season now";
  const sub =
    locale === "dk"
      ? `Måned: ${monthLabel(locale, month)} · Privatliv først — ingen spots.`
      : `Month: ${monthLabel(locale, month)} · Privacy-first — no spots.`;

  const monthHref = `/${locale}/season/${monthSlug(month)}`;

  return (
    <main className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.h1}>{title}</h1>
            <p className={styles.sub}>{sub}</p>
          </div>

          <Link className={styles.primaryCta} href={monthHref}>
            {locale === "dk" ? "Se hele måneden" : "See full month"}
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className={styles.monthStrip} aria-label={locale === "dk" ? "Måneder" : "Months"}>
          {MONTHS.map((m) => {
            const href = `/${locale}/season/${m.slug}`;
            const active = m.num === month;
            return (
              <Link key={m.slug} href={href} className={`${styles.monthChip} ${active ? styles.monthChipActive : ""}`}>
                {locale === "dk" ? m.dk.slice(0, 3) : m.en.slice(0, 3)}
              </Link>
            );
          })}
        </div>
      </header>

      <section className={styles.grid} aria-label={locale === "dk" ? "Arter i sæson nu" : "Species in season now"}>
        {items.length ? (
          items.map((s) => (
            <Link key={s.id} href={`/${locale}/species/${s.slug}`} className={`${styles.card} hoverable pressable`}>
              <div className={styles.cardTop}>
                <div className={styles.cardTitle}>{s.name}</div>
                <span className={styles.confBadge}>{s.confidence}%</span>
              </div>

              <div className={styles.meta}>
                {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
                <span className={styles.dot} aria-hidden="true">
                  ·
                </span>
                <span className={styles.group}>{s.group}</span>
              </div>

              <div className={styles.desc}>
                {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
              </div>

              <div className={styles.cardFoot}>
                <span className={styles.pathPill}>/{locale}/species/{s.slug}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className={styles.empty}>
            {locale === "dk"
              ? "Ingen arter markeret i sæson for denne måned endnu (tilføj i seasonality)."
              : "No species marked in season for this month yet (add seasonality rows)."}
          </div>
        )}
      </section>
    </main>
  );
}