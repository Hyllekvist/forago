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

function countryForLocale(locale: Locale) {
  // MVP: Danmark (DB bruger country="DK")
  return "DK";
}

const MONTHS = [
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
] as const;

function currentMonthCopenhagen() {
  // Server: UTC month (ok til MVP)
  return new Date().getUTCMonth() + 1;
}

function inMonth(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to; // wrap-around
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
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

  const monthNum = currentMonthCopenhagen();
  const month = MONTHS.find((m) => m.num === monthNum)!;
  const country = countryForLocale(locale);

  const supabase = await supabaseServer();

  // Seasonality rows for DK national (region='')
  const { data: rows, error } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (error) throw error;

  const inSeason = (rows ?? []).filter((r) =>
    inMonth(monthNum, r.month_from as number, r.month_to as number)
  );

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
  const confMap = new Map(inSeason.map((x) => [x.species_id as string, (x.confidence as number) ?? 0]));

  const items = (species ?? [])
    .map((s) => {
      const t = trMap.get(s.id);
      const confidence = confMap.get(s.id as string) ?? 0;
      return {
        id: s.id as string,
        slug: s.slug as string,
        group: (s.primary_group as string) || "plant",
        scientific: (s.scientific_name as string) || "",
        name: (t?.common_name as string) || (s.slug as string),
        desc: (t?.short_description as string) || "",
        confidence,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  // KPI
  const total = items.length;
  const highSafety = items.filter((x) => x.confidence >= 80).length;

  // Season strength score (simpel MVP): volume + safety
  // volume: 0..60 (30 arter ~ max), safety: 0..40 (andel >=80)
  const volumeScore = clamp(Math.round((total / 30) * 60), 0, 60);
  const safetyScore = total === 0 ? 0 : clamp(Math.round((highSafety / total) * 40), 0, 40);
  const seasonScore = clamp(volumeScore + safetyScore, 0, 100);

  const monthLabel = locale === "dk" ? month.dk : month.en;

  return (
    <main className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.kicker}>{locale === "dk" ? "SÆSON RADAR" : "SEASON RADAR"}</div>

        <div className={styles.heroRow}>
          <div className={styles.heroLeft}>
            <h1 className={styles.h1}>{locale === "dk" ? "I sæson nu" : "In season now"}</h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Sæsonbaseret overblik. Privatliv først — ingen spots."
                : "Season-based overview. Privacy first — no spots."}
            </p>

            <div className={styles.kpiRow}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>{locale === "dk" ? "Måned" : "Month"}</div>
                <div className={styles.kpiValue}>{monthLabel}</div>
              </div>

              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>{locale === "dk" ? "I sæson" : "In season"}</div>
                <div className={styles.kpiValue}>{total}</div>
              </div>

              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>{locale === "dk" ? "Høj sikkerhed" : "High safety"}</div>
                <div className={styles.kpiValue}>{highSafety}</div>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.gaugeCard} aria-label="Season strength">
              <div className={styles.gaugeTop}>
                <div className={styles.gaugeTitle}>{locale === "dk" ? "Sæsonstyrke" : "Season strength"}</div>
                <div className={styles.gaugeMeta}>{locale === "dk" ? "volume + sikkerhed" : "volume + safety"}</div>
              </div>

              <div className={styles.gauge}>
                {/* Ring-gauge (SVG) */}
                {(() => {
                  const r = 46;
                  const c = 2 * Math.PI * r;
                  const pct = clamp(seasonScore, 0, 100) / 100;
                  const dash = c * pct;
                  const gap = c - dash;

                  return (
                    <svg className={styles.gaugeSvg} viewBox="0 0 120 120" role="img" aria-label={`Score ${seasonScore}`}>
                      <circle className={styles.gaugeTrack} cx="60" cy="60" r={r} />
                      <circle
                        className={styles.gaugeProg}
                        cx="60"
                        cy="60"
                        r={r}
                        strokeDasharray={`${dash} ${gap}`}
                      />
                      <text x="60" y="58" textAnchor="middle" className={styles.gaugeNum}>
                        {seasonScore}
                      </text>
                      <text x="60" y="78" textAnchor="middle" className={styles.gaugeTxt}>
                        {locale === "dk" ? "Nu" : "Now"}
                      </text>
                    </svg>
                  );
                })()}
              </div>

              <div className={styles.gaugeLegend}>
                <span className={styles.dot} aria-hidden="true" />
                <span>{locale === "dk" ? "Nu" : "Now"}</span>
                <span className={styles.sep} aria-hidden="true" />
                <span className={styles.muted}>{locale === "dk" ? "Privatliv først" : "Privacy first"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.monthNav}>
        <div className={styles.monthNavHead}>
          <div>
            <div className={styles.sectionKicker}>{locale === "dk" ? "NAVIGER" : "NAVIGATE"}</div>
            <h2 className={styles.h2}>{locale === "dk" ? "Sæson pr. måned" : "Season by month"}</h2>
          </div>
          <div className={styles.monthHint}>{locale === "dk" ? "Tryk for månedsside" : "Tap for month page"}</div>
        </div>

        <div className={styles.monthRow} role="list">
          {MONTHS.map((m) => {
            const active = m.num === monthNum;
            return (
              <Link
                key={m.slug}
                href={`/${locale}/season/${m.slug}`}
                className={[styles.monthChip, active ? styles.monthChipActive : ""].join(" ")}
                role="listitem"
              >
                {locale === "dk" ? m.dk.slice(0, 3) : m.en.slice(0, 3)}
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionKicker}>{locale === "dk" ? "I SÆSON" : "IN SEASON"}</div>
            <h2 className={styles.h2}>{locale === "dk" ? "Arter lige nu" : "Species right now"}</h2>
            <p className={styles.sectionSub}>
              {locale === "dk"
                ? "Sorteret efter confidence. Tryk for artsprofil."
                : "Sorted by confidence. Tap for species profile."}
            </p>
          </div>

          <Link className={styles.monthCta} href={`/${locale}/season/${month.slug}`}>
            {locale === "dk" ? `Månedsside` : `Month page`} <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className={styles.grid}>
          {items.map((s) => (
            <Link key={s.id} href={`/${locale}/species/${s.slug}`} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardTitle}>{s.name}</div>
                <div className={styles.pill}>{s.confidence}%</div>
              </div>

              <div className={styles.meta}>
                {s.scientific ? <em>{s.scientific}</em> : s.slug}
                <span className={styles.dotSep} aria-hidden="true" />
                <span className={styles.tag}>{s.group}</span>
              </div>

              <div className={styles.desc}>
                {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
              </div>

              <div className={styles.cardArrow} aria-hidden="true">
                →
              </div>
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            {locale === "dk"
              ? "Ingen arter markeret i sæson for denne måned endnu (tilføj i seasonality)."
              : "No species marked in season for this month yet (add seasonality rows)."}
          </div>
        ) : null}
      </section>
    </main>
  );
}