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
  return "DK";
}

function monthName(locale: Locale, m: number) {
  const dk = ["", "januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
  const en = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const arr = locale === "dk" ? dk : en;
  return arr[m] ?? String(m);
}

function monthSlug(m: number) {
  const slugs = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  return slugs[m] ?? String(m);
}

function currentMonthUTC() {
  return new Date().getUTCMonth() + 1;
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return { title: "Forago" };
  const locale = localeParam;

  return {
    title: locale === "dk" ? "Sæson nu — Forago" : "In season now — Forago",
    description:
      locale === "dk"
        ? "Se hvad der er i sæson lige nu (uden at udlevere spots)."
        : "See what’s in season right now (privacy-first).",
    alternates: { canonical: `/${locale}/season` },
  };
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

  const inSeason = (rows ?? []).filter((r) => {
    const a = r.month_from as number;
    const b = r.month_to as number;
    if (a <= b) return month >= a && month <= b;
    return month >= a || month <= b;
  });

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

  const trMap = new Map((tr ?? []).map((t) => [t.species_id as string, t]));
  const confMap = new Map(inSeason.map((s) => [s.species_id as string, (s.confidence as number) ?? 0]));

  const items = (species ?? [])
    .map((s) => {
      const t = trMap.get(s.id);
      return {
        id: s.id as string,
        slug: s.slug as string,
        group: (s.primary_group as string) || "plant",
        scientific: (s.scientific_name as string) || "",
        name: (t?.common_name as string) || s.slug,
        desc: (t?.short_description as string) || "",
        confidence: confMap.get(s.id) ?? 0,
      };
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const highSafety = items.filter((x) => (x.confidence ?? 0) >= 80).length;
  const monthHref = `/${locale}/season/${monthSlug(month)}`;

  return (
    <main className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroText}>
            <h1 className={styles.h1}>{locale === "dk" ? "I sæson nu" : "In season now"}</h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Sæsonbaseret overblik. Privatliv først — ingen spots."
                : "Season-first overview. Privacy-first — no spots."}
            </p>
          </div>

          <Link className={styles.monthChip} href={monthHref}>
            <span className={styles.monthChipKicker}>{locale === "dk" ? "Måned" : "Month"}</span>
            <span className={styles.monthChipVal}>{monthName(locale, month)}</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{locale === "dk" ? "I sæson" : "In season"}</div>
            <div className={styles.statValue}>{items.length}</div>
            <div className={styles.statHint}>{locale === "dk" ? "arter denne måned" : "species this month"}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>{locale === "dk" ? "Høj sikkerhed" : "High confidence"}</div>
            <div className={styles.statValue}>{highSafety}</div>
            <div className={styles.statHint}>{locale === "dk" ? "≥ 80% confidence" : "≥ 80% confidence"}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>{locale === "dk" ? "Princip" : "Principle"}</div>
            <div className={styles.statValueSm}>{locale === "dk" ? "Ingen spots" : "No spots"}</div>
            <div className={styles.statHint}>{locale === "dk" ? "privatliv først" : "privacy-first"}</div>
          </div>
        </div>
      </header>

      <section className={styles.sectionHead}>
        <h2 className={styles.h2}>{locale === "dk" ? "Arter i sæson" : "Species in season"}</h2>
        <div className={styles.sectionActions}>
          <Link className={styles.ghostBtn} href={monthHref}>
            {locale === "dk" ? "Se hele måneden" : "See full month"} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {items.length ? (
        <section className={styles.grid}>
          {items.map((s) => (
            <Link key={s.id} href={`/${locale}/species/${s.slug}`} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.titleBlock}>
                  <div className={styles.cardTitle}>{s.name}</div>
                  <div className={styles.cardMeta}>
                    {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
                    <span className={styles.dot}>•</span>
                    <span>{s.group}</span>
                  </div>
                </div>

                <span className={styles.confChip} aria-label={`confidence ${s.confidence}%`}>
                  {s.confidence}%
                </span>
              </div>

              <div className={styles.cardDesc}>
                {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
              </div>

              <div className={styles.cardFoot}>
                <span className={styles.pathPill}>/{locale}/species/{s.slug}</span>
                <span className={styles.chev} aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>
            {locale === "dk"
              ? "Ingen arter markeret i sæson for denne måned endnu."
              : "No species marked in season for this month yet."}
          </div>
          <div className={styles.emptySub}>
            {locale === "dk"
              ? "Tilføj rækker i seasonality (country=DK, region='')."
              : "Add rows in seasonality (country=DK, region='')."}
          </div>
        </div>
      )}
    </main>
  );
}