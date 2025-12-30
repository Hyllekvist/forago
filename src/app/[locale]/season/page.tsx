import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./Season.module.css";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function countryForLocale(_locale: string) {
  return "DK";
}

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
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

function currentMonthCopenhagen() {
  const now = new Date();
  return now.getUTCMonth() + 1;
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return { title: "Forago" };

  const title = localeParam === "dk" ? "Sæson nu — Forago" : "Season now — Forago";
  const description =
    localeParam === "dk"
      ? "Sæsonbaseret overblik (privatliv først — ingen spots)."
      : "Season overview (privacy-first — no spots).";

  return {
    title,
    description,
    alternates: { canonical: `/${localeParam}/season` },
  };
}

export default async function SeasonNowPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return notFound();
  const locale = params.locale;

  const month = currentMonthCopenhagen();
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
    ? await supabase
        .from("species")
        .select("id, slug, primary_group, scientific_name")
        .in("id", ids)
    : { data: [] as any[] };

  const { data: tr } = ids.length
    ? await supabase
        .from("species_translations")
        .select("species_id, common_name, short_description")
        .eq("locale", locale)
        .in("species_id", ids)
    : { data: [] as any[] };

  const trMap = new Map((tr ?? []).map((t) => [t.species_id as string, t]));

  const items = (species ?? [])
    .map((s) => {
      const t = trMap.get(s.id);
      const season = inSeason.find((x) => x.species_id === s.id);
      return {
        id: s.id as string,
        slug: s.slug as string,
        group: (s.primary_group as string) || "plant",
        scientific: (s.scientific_name as string) || "",
        name: (t?.common_name as string) || s.slug,
        desc: (t?.short_description as string) || "",
        confidence: (season?.confidence as number) ?? 0,
      };
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const monthLink = `/${locale}/season/${monthSlug(month)}`;

  // “Season strength” (simple MVP score)
  const count = items.length;
  const high = items.filter((x) => x.confidence >= 80).length;
  const strength = Math.max(0, Math.min(99, Math.round(count * 8 + high * 12)));

  return (
    <main className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.kicker}>{locale === "dk" ? "SÆSON RADAR" : "SEASON RADAR"}</div>

        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.h1}>{locale === "dk" ? "I sæson nu" : "In season now"}</h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Sæsonbaseret overblik. Privatliv først — ingen spots."
                : "Season overview. Privacy-first — no spots."}
            </p>
          </div>

          <Link className={styles.starBtn} href={monthLink} aria-label="Month page">
            <span aria-hidden="true">★</span>
          </Link>
        </div>

        <section className={styles.grid}>
          <Link href={monthLink} className={styles.metricCard}>
            <div className={styles.metricLabel}>{locale === "dk" ? "MÅNED" : "MONTH"}</div>
            <div className={styles.metricValue}>{monthName(locale, month)}</div>
            <div className={styles.metricHint}>
              {locale === "dk" ? "Tryk for måneds-side →" : "Tap for month page →"}
            </div>
          </Link>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>{locale === "dk" ? "I SÆSON" : "IN SEASON"}</div>
            <div className={styles.metricValue}>{count}</div>
            <div className={styles.metricHint}>
              {locale === "dk" ? "arter lige nu" : "species right now"}
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>{locale === "dk" ? "HØJ SIKKERHED" : "HIGH CONF"}</div>
            <div className={styles.metricValue}>{high}</div>
            <div className={styles.metricHint}>≥ 80% confidence</div>
          </div>
        </section>

        <section className={styles.radarCard} aria-label="Season strength">
          <div className={styles.radarHead}>
            <div className={styles.radarTitle}>{locale === "dk" ? "Sæsonstyrke" : "Season strength"}</div>
            <div className={styles.radarMeta}>{locale === "dk" ? "volume + sikkerhed" : "volume + confidence"}</div>
          </div>

          <div className={styles.ringWrap}>
            <div className={styles.ring} style={{ ["--p" as any]: strength }} aria-hidden="true" />
            <div className={styles.ringCenter}>
              <div className={styles.ringNum}>{strength}</div>
              <div className={styles.ringSub}>{locale === "dk" ? "Nu" : "Now"}</div>
            </div>
          </div>

          <div className={styles.legend}>
            <span className={styles.dot} />
            <span>{locale === "dk" ? "Nu" : "Now"}</span>
            <span className={styles.sepDot} />
            <span>{locale === "dk" ? "Privatliv først" : "Privacy-first"}</span>
          </div>
        </section>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <div>
            <div className={styles.sectionKicker}>{locale === "dk" ? "NAVIGER" : "NAVIGATE"}</div>
            <h2 className={styles.h2}>{locale === "dk" ? "Sæson pr. måned" : "Season by month"}</h2>
          </div>
          <div className={styles.sectionHint}>
            {locale === "dk" ? "Tryk for måneds-side" : "Tap a month"}
          </div>
        </div>

        <div className={styles.monthRow} role="list">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
            const slug = monthSlug(m);
            const active = m === month;
            return (
              <Link
                key={slug}
                href={`/${locale}/season/${slug}`}
                className={`${styles.monthChip} ${active ? styles.monthChipActive : ""}`}
                role="listitem"
              >
                {locale === "dk" ? monthName(locale, m).slice(0, 3) : slug.slice(0, 3)}
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <div>
            <div className={styles.sectionKicker}>{locale === "dk" ? "I SÆSON" : "IN SEASON"}</div>
            <h2 className={styles.h2}>{locale === "dk" ? "Arter lige nu" : "Species right now"}</h2>
            <p className={styles.small}>
              {locale === "dk"
                ? "Sorteret efter confidence. Tryk for artsprofil."
                : "Sorted by confidence. Tap for species profile."}
            </p>
          </div>

          <Link className={styles.ghostBtn} href={monthLink}>
            {locale === "dk" ? "Månedsside →" : "Month page →"}
          </Link>
        </div>

        {items.length ? (
          <div className={styles.cards}>
            {items.map((s) => (
              <Link key={s.id} href={`/${locale}/species/${s.slug}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardTitle}>{s.name}</div>
                  <div className={styles.pill}>{s.confidence}%</div>
                </div>

                <div className={styles.meta}>
                  {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
                  <span className={styles.dotSep}>•</span>
                  <span className={styles.tag}>{s.group}</span>
                </div>

                <div className={styles.desc}>
                  {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
                </div>

                <div className={styles.cardArrow} aria-hidden="true">→</div>
              </Link>
            ))}
          </div>
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