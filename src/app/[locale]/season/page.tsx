// src/app/[locale]/season/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./Season.module.css";
import { SeasonRadar } from "./_ui/SeasonRadar";
import { MonthStrip } from "./_ui/MonthStrip";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function countryForLocale(_locale: string) {
  return "DK"; // MVP
}

function monthName(locale: Locale, m: number) {
  const dk = ["", "januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
  const en = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  return (locale === "dk" ? dk : en)[m] ?? String(m);
}

function monthSlug(m: number) {
  const slugs = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  return slugs[m] ?? String(m);
}

function currentMonthUTC() {
  return new Date().getUTCMonth() + 1;
}

function inMonth(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  if (!isLocale(locale)) return { title: "Forago" };

  return {
    title: locale === "dk" ? "Sæson nu — Forago" : "In season now — Forago",
    description:
      locale === "dk"
        ? "Sæsonradar og artsoversigt — privatliv først (ingen spots)."
        : "Season radar and species overview — privacy-first (no spots).",
    alternates: { canonical: `/${locale}/season` },
  };
}

export default async function SeasonNowPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return notFound();
  const locale = params.locale;

  const month = currentMonthUTC();
  const country = countryForLocale(locale);
  const supabase = await supabaseServer();

  const { data: rows, error } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (error) throw error;

  const inSeasonRows = (rows ?? []).filter((r: any) =>
    inMonth(month, r.month_from as number, r.month_to as number)
  );

  const ids = inSeasonRows.map((r: any) => r.species_id as string);
  const highConfidence = inSeasonRows.filter((r: any) => ((r.confidence as number) ?? 0) >= 80).length;

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
      const season = inSeasonRows.find((x: any) => x.species_id === s.id);
      return {
        id: s.id as string,
        slug: s.slug as string,
        group: (s.primary_group as string) || "plant",
        scientific: (s.scientific_name as string) || "",
        name: (t?.common_name as string) || s.slug,
        desc: (t?.short_description as string) || "",
        confidence: ((season?.confidence as number) ?? 0) as number,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const title = locale === "dk" ? "I sæson nu" : "In season now";
  const subtitle =
    locale === "dk"
      ? "Sæsonbaseret overblik. Privatliv først — ingen spots."
      : "Season-based overview. Privacy-first — no spots.";

  const monthLabel = monthName(locale, month);
  const monthHref = `/${locale}/season/${monthSlug(month)}`;

  return (
    <main className={styles.page}>
      <SeasonRadar
        locale={locale}
        title={title}
        subtitle={subtitle}
        monthLabel={monthLabel}
        totalInSeason={items.length}
        highConfidence={highConfidence}
      />

      <MonthStrip locale={locale} activeMonth={month} />

      <section className={styles.cards} aria-label={locale === "dk" ? "Overblik" : "Overview"}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>{locale === "dk" ? "I sæson" : "In season"}</div>
          <div className={styles.big}>{items.length}</div>
          <div className={styles.small}>
            {locale === "dk" ? "arter denne måned" : "species this month"}
          </div>
          <div className={styles.linkRow}>
            <Link className={styles.pillLink} href={monthHref}>
              {locale === "dk" ? `Se ${monthLabel} →` : `View ${monthLabel} →`}
            </Link>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>{locale === "dk" ? "Høj sikkerhed" : "High confidence"}</div>
          <div className={styles.big}>{highConfidence}</div>
          <div className={styles.small}>
            {locale === "dk" ? "≥ 80% confidence" : "≥ 80% confidence"}
          </div>
          <div className={styles.linkRow}>
            <Link className={styles.pillLink} href={`/${locale}/guides/safety-basics`}>
              {locale === "dk" ? "Sikkerhed →" : "Safety →"}
            </Link>
            <Link className={styles.pillLink} href={`/${locale}/guides/lookalikes`}>
              {locale === "dk" ? "Forvekslinger →" : "Look-alikes →"}
            </Link>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>{locale === "dk" ? "Princip" : "Principle"}</div>
          <div className={styles.princip}>
            <div>
              <div className={styles.principStrong}>{locale === "dk" ? "Ingen spots" : "No spots"}</div>
              <div className={styles.small}>{locale === "dk" ? "privatliv først" : "privacy-first"}</div>
            </div>
            <span className={styles.badge} aria-hidden="true">★</span>
          </div>
        </div>
      </section>

      <div className={styles.speciesHeader}>
        <div>
          <h2 className={styles.h2}>{locale === "dk" ? "I sæson nu" : "In season now"}</h2>
          <p className={styles.h2sub}>
            {locale === "dk"
              ? "Sorteret efter confidence. Tryk for artsprofil."
              : "Sorted by confidence. Tap to open species profile."}
          </p>
        </div>
        <Link className={styles.pillLink} href={monthHref}>
          {locale === "dk" ? "Månedsside →" : "Month page →"}
        </Link>
      </div>

      {items.length ? (
        <section className={styles.list} aria-label={locale === "dk" ? "Arter" : "Species"}>
          {items.map((s) => (
            <Link key={s.id} href={`/${locale}/species/${s.slug}`} className={styles.item}>
              <span className={styles.badge}>{s.confidence}%</span>
              <div className={styles.name}>{s.name}</div>
              <div className={styles.meta}>
                {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
                <span className={styles.group}>{s.group}</span>
              </div>
              <div className={styles.desc}>
                {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          {locale === "dk"
            ? "Ingen arter markeret i sæson for denne måned endnu (tilføj seasonality)."
            : "No species marked in season for this month yet (add seasonality rows)."}
        </div>
      )}
    </main>
  );
}