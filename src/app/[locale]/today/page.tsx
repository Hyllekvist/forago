// src/app/[locale]/today/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./Today.module.css";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

function monthLocal() {
  return new Date().getMonth() + 1; // 1-12 (lokal tid)
}

function inSeasonForMonth(a: number, b: number, m: number) {
  if (a <= b) return m >= a && m <= b;
  return m >= a || m <= b; // wrap-around (fx nov->feb)
}

type SeasonalityRow = {
  species_id: string;
  month_from: number;
  month_to: number;
  confidence: number | null;
};

type SpeciesRow = {
  id: string;
  slug: string;
  primary_group: string | null;
  scientific_name: string | null;
};

type SpeciesTrRow = {
  species_id: string;
  common_name: string | null;
  short_description: string | null;
};

type SeasonCard = {
  slug: string;
  common_name: string;
  scientific_name: string;
  primary_group: string;
  confidence: number;
  short_description: string;
};

export default async function TodayPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = safeLocale(params?.locale);

  // ✅ Locale ≠ country. Today er nationalt (privacy-first) → hardcode DK for nu.
  // Senere kan I gøre det dynamisk via user settings/geo.
  const country = "DK";
  const region = ""; // jeres schema bruger tom string som "ingen region"

  const supabase = await supabaseServer();

  const [{ data: auth }, feedRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("feed_top_species", {
      p_country: country,
      p_locale: locale,
      p_days: 14,
      p_limit: 6,
    }),
  ]);

  const topSpecies = (feedRes.data ?? []) as any[];
  const uid = auth?.user?.id ?? null;

  // -------- In season now (privacy-first, national) --------
  const month = monthLocal();

  const { data: seasonRowsRaw } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", region);

  const seasonRows = (seasonRowsRaw ?? []) as SeasonalityRow[];

  const inSeason = seasonRows.filter((r) =>
    inSeasonForMonth(Number(r.month_from), Number(r.month_to), month)
  );

  const seasonIds = inSeason.map((r) => String(r.species_id));

  const [{ data: speciesRaw }, { data: trRaw }] = await Promise.all([
    seasonIds.length
      ? supabase
          .from("species")
          .select("id, slug, primary_group, scientific_name")
          .in("id", seasonIds)
      : Promise.resolve({ data: [] as any[] }),
    seasonIds.length
      ? supabase
          .from("species_translations")
          .select("species_id, common_name, short_description")
          .eq("locale", locale)
          .in("species_id", seasonIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const species = (speciesRaw ?? []) as SpeciesRow[];
  const tr = (trRaw ?? []) as SpeciesTrRow[];

  // O(1) lookups
  const seasonMap = new Map<string, SeasonalityRow>();
  for (const r of inSeason) seasonMap.set(String(r.species_id), r);

  const trMap = new Map<string, SpeciesTrRow>();
  for (const t of tr) trMap.set(String(t.species_id), t);

  const seasonCards: SeasonCard[] = species
    .map((s) => {
      const t = trMap.get(String(s.id));
      const season = seasonMap.get(String(s.id));

      return {
        slug: String(s.slug ?? ""),
        primary_group: String(s.primary_group ?? "plant"),
        scientific_name: String(s.scientific_name ?? ""),
        common_name: String(t?.common_name ?? s.slug ?? ""),
        short_description: String(t?.short_description ?? ""),
        confidence: Number(season?.confidence ?? 0),
      };
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, 4);

  // -------- My activity (optional) --------
  let myTotal = 0;
  let myLast30d = 0;

  if (uid) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: total }, { count: last30 }] = await Promise.all([
      supabase
        .from("finds")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid),
      supabase
        .from("finds")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .gte("created_at", since),
    ]);

    myTotal = total ?? 0;
    myLast30d = last30 ?? 0;
  }

  const title =
    locale === "dk" ? "Naturen omkring dig i dag" : "Nature around you today";
  const sub =
    locale === "dk" ? "Opdateret · Sæsonbaseret" : "Updated · Season-based";

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.h1}>{title}</h1>
            <p className={styles.sub}>{sub}</p>
          </div>

          <div className={styles.heroActions}>
            <span className={styles.pill} aria-label="Mode">
              Foraging mode
            </span>
          </div>
        </div>

        <div className={styles.chips}>
          <div className={styles.chip}>
            <div className={styles.chipTop}>
              🍄 {locale === "dk" ? "I sæson nu" : "In season"}
            </div>
            <div className={styles.chipValue}>
              {inSeason.length} {locale === "dk" ? "arter" : "species"}
            </div>
          </div>

          <Link
            href={`/${locale}/map`}
            className={`${styles.chip} ${styles.chipLink} hoverable pressable`}
          >
            <div className={styles.chipTop}>
              🗺️ {locale === "dk" ? "Kort" : "Map"}
            </div>
            <div className={styles.chipValue}>
              {locale === "dk" ? "Udforsk" : "Explore"} →
            </div>
          </Link>

          <Link
            href={`/${locale}/ask`}
            className={`${styles.chip} ${styles.chipLink} hoverable pressable`}
          >
            <div className={styles.chipTop}>
              ❓ {locale === "dk" ? "Spørg" : "Ask"}
            </div>
            <div className={styles.chipValue}>
              {locale === "dk" ? "Få svar" : "Get answers"} →
            </div>
          </Link>

          <Link
            href={`/${locale}/log`}
            className={`${styles.chip} ${styles.chipLink} hoverable pressable`}
          >
            <div className={styles.chipTop}>
              📓 {locale === "dk" ? "Mine fund" : "My finds"}
            </div>
            <div className={styles.chipValue}>
              {uid ? `${myTotal}` : locale === "dk" ? "Log ind" : "Sign in"} →
            </div>
          </Link>
        </div>
      </header>

      <section className={styles.section} aria-label="In season now">
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>
            {locale === "dk" ? "I sæson nu" : "In season now"}
          </h2>
          <Link
            className={`${styles.more} hoverable pressable`}
            href={`/${locale}/season`}
          >
            {locale === "dk" ? "Se mere →" : "See more →"}
          </Link>
        </div>

        <div className={styles.grid}>
          {seasonCards.map((s) => (
            <Link
              key={s.slug}
              href={`/${locale}/species/${s.slug}`}
              className={`${styles.card} hoverable pressable`}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardTitle}>{s.common_name}</div>
                <span className={styles.badge}>{Math.round(s.confidence)}%</span>
              </div>

              <div className={styles.cardMeta}>
                <em>{s.scientific_name}</em>
                <span className={styles.dot}>·</span>
                <span>{s.primary_group}</span>
              </div>

              <div className={styles.cardBody}>
                {s.short_description ||
                  (locale === "dk"
                    ? "Tilføj en kort beskrivelse i databasen."
                    : "Add a short description in the database.")}
              </div>
            </Link>
          ))}

          {seasonCards.length === 0 ? (
            <div className={styles.empty}>
              {locale === "dk"
                ? "Ingen arter i sæson endnu (tilføj seasonality)."
                : "No in-season species yet (add seasonality)."}
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.section} aria-label="What’s hot">
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>
            {locale === "dk" ? "Hvad sker der" : "What’s happening"}
          </h2>
          <Link
            className={`${styles.more} hoverable pressable`}
            href={`/${locale}/feed`}
          >
            {locale === "dk" ? "Åbn feed →" : "Open feed →"}
          </Link>
        </div>

        <div className={styles.list}>
          {(topSpecies ?? []).slice(0, 4).map((t: any) => (
            <Link
              key={`${t.spot_id}-${t.species_slug}`}
              href={
                t.species_slug
                  ? `/${locale}/species/${t.species_slug}`
                  : `/${locale}/feed`
              }
              className={`${styles.row} hoverable pressable`}
            >
              <div className={styles.rowLeft}>
                <div className={styles.rowKicker}>
                  {t.spot_id
                    ? `Spot ${t.spot_id}`
                    : locale === "dk"
                    ? "Spot"
                    : "Spot"}
                  <span className={styles.dot}>·</span>
                  <span>
                    {t.finds_count ?? 0} {locale === "dk" ? "fund" : "finds"}
                  </span>
                </div>
                <div className={styles.rowTitle}>
                  {t.common_name ?? t.species_slug ?? ""}
                </div>
                <div className={styles.rowMeta}>
                  <span>{t.primary_group ?? ""}</span>
                  {t.scientific_name ? (
                    <>
                      <span className={styles.dot}>·</span>
                      <em>{t.scientific_name}</em>
                    </>
                  ) : null}
                </div>
              </div>

              <div className={styles.rowRight} aria-hidden="true">
                →
              </div>
            </Link>
          ))}

          {(topSpecies ?? []).length === 0 ? (
            <div className={styles.empty}>
              {locale === "dk" ? "Ingen feed-data endnu." : "No feed data yet."}
            </div>
          ) : null}
        </div>
      </section>

      {uid ? (
        <section className={styles.section} aria-label="My activity">
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>
              {locale === "dk" ? "Din aktivitet" : "Your activity"}
            </h2>
            <Link
              className={`${styles.more} hoverable pressable`}
              href={`/${locale}/log`}
            >
              {locale === "dk" ? "Se log →" : "See log →"}
            </Link>
          </div>

          <div className={styles.activity}>
            <div className={styles.activityCard}>
              <div className={styles.activityLabel}>
                {locale === "dk" ? "Seneste 30 dage" : "Last 30 days"}
              </div>
              <div className={styles.activityValue}>{myLast30d}</div>
            </div>
            <div className={styles.activityCard}>
              <div className={styles.activityLabel}>Total</div>
              <div className={styles.activityValue}>{myTotal}</div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
