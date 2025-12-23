import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./SpeciesIndex.module.css";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

const MONTH_NUM_TO_SLUG: Record<number, string> = {
  1: "january",
  2: "february",
  3: "march",
  4: "april",
  5: "may",
  6: "june",
  7: "july",
  8: "august",
  9: "september",
  10: "october",
  11: "november",
  12: "december",
};

function currentMonthUTC() {
  return new Date().getUTCMonth() + 1;
}

function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

function monthsBetween(from: number, to: number) {
  const out: number[] = [];
  if (from <= to) for (let m = from; m <= to; m++) out.push(m);
  else {
    for (let m = from; m <= 12; m++) out.push(m);
    for (let m = 1; m <= to; m++) out.push(m);
  }
  return out;
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

function seasonLabel(locale: Locale, from: number, to: number) {
  if (from === to) return monthName(locale, from);
  return `${monthName(locale, from)} – ${monthName(locale, to)}`;
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const title = locale === "dk" ? "Arter — Forago" : "Species — Forago";
  const description =
    locale === "dk"
      ? "Find vilde råvarer: sæson, identifikation, forvekslinger og brug."
      : "Explore wild food species: season, identification, look-alikes and use.";

  return {
    title,
    description,
    alternates: { canonical: `/${locale}/species` },
  };
}

export default async function SpeciesIndexPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { group?: string; q?: string; season?: string; sort?: string };
}) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const q = (searchParams?.q ?? "").trim();
  const group = (searchParams?.group ?? "").trim();
  const seasonFilter = (searchParams?.season ?? "").trim(); // "now" | ""
  const sort = (searchParams?.sort ?? "").trim(); // "" | "az"

  const supabase = supabaseServer();
  const month = currentMonthUTC();

  const { data: species, error: spErr } = await supabase
    .from("species")
    .select("id, slug, primary_group, scientific_name")
    .order("slug", { ascending: true });

  if (spErr) throw spErr;

  const ids = (species ?? []).map((s) => s.id);
  if (!ids.length) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.h1}>{locale === "dk" ? "Arter" : "Species"}</h1>
          <p className={styles.sub}>
            {locale === "dk" ? "Ingen arter endnu." : "No species yet."}
          </p>
        </header>
      </main>
    );
  }

  const { data: translations, error: trErr } = await supabase
    .from("species_translations")
    .select("species_id, locale, common_name, short_description")
    .eq("locale", locale)
    .in("species_id", ids);

  if (trErr) throw trErr;

  const trMap = new Map((translations ?? []).map((t) => [t.species_id as string, t]));

  const { data: seas, error: seasErr } = await supabase
    .from("seasonality")
    .select("species_id, country, region, month_from, month_to, confidence")
    .eq("country", locale)
    .eq("region", "")
    .in("species_id", ids);

  if (seasErr) throw seasErr;

  const seasMap = new Map<string, { from: number; to: number; confidence: number }>(
    (seas ?? []).map((r: any) => [
      r.species_id as string,
      { from: Number(r.month_from), to: Number(r.month_to), confidence: Number(r.confidence ?? 0) },
    ])
  );

  let items = (species ?? []).map((s) => {
    const t = trMap.get(s.id);
    const sea = seasMap.get(s.id);

    const from = sea?.from ?? null;
    const to = sea?.to ?? null;
    const confidence = sea?.confidence ?? 0;

    const inSeasonNow = from && to ? isInSeason(month, from, to) : false;

    const months = from && to ? monthsBetween(from, to) : [];
    const monthLinks = months.slice(0, 6).map((m) => ({
      m,
      label: monthName(locale, m),
      href: `/${locale}/season/${MONTH_NUM_TO_SLUG[m]}`,
    }));

    return {
      id: s.id as string,
      slug: s.slug as string,
      group: (s.primary_group as string) || "plant",
      scientific: (s.scientific_name as string) || "",
      name: (t?.common_name as string) || (s.slug as string),
      desc: (t?.short_description as string) || "",
      seasonText: from && to ? seasonLabel(locale, from, to) : null,
      confidence,
      inSeasonNow,
      monthLinks,
    };
  });

  if (group) items = items.filter((x) => x.group === group);

  if (q) {
    const qq = q.toLowerCase();
    items = items.filter(
      (x) =>
        x.name.toLowerCase().includes(qq) ||
        x.slug.toLowerCase().includes(qq) ||
        x.scientific.toLowerCase().includes(qq)
    );
  }

  if (seasonFilter === "now") items = items.filter((x) => x.inSeasonNow);

  if (sort === "az") {
    items.sort((a, b) => a.name.localeCompare(b.name, locale));
  } else {
    items.sort((a, b) => {
      if (a.inSeasonNow !== b.inSeasonNow) return a.inSeasonNow ? -1 : 1;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.name.localeCompare(b.name, locale);
    });
  }

  const inSeasonCount = items.filter((x) => x.inSeasonNow).length;

  const title = locale === "dk" ? "Arter" : "Species";
  const subtitle =
    locale === "dk"
      ? "Find artsprofiler med sæson, identifikation og forvekslinger."
      : "Species pages with season, identification and look-alikes.";

  const baseParams = (extra?: Record<string, string>) =>
    new URLSearchParams({
      ...(q ? { q } : {}),
      ...(group ? { group } : {}),
      ...(seasonFilter ? { season: seasonFilter } : {}),
      ...(extra ?? {}),
    }).toString();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>

        <div className={styles.chips}>
          <Link className={styles.chip} href={`/${locale}/season`}>
            {locale === "dk" ? "Se sæson nu →" : "See season now →"}
          </Link>
          <span className={`${styles.chip} ${styles.chipSuccess}`}>
            {locale === "dk" ? `I sæson nu: ${inSeasonCount}` : `In season now: ${inSeasonCount}`}
          </span>
        </div>
      </header>

      <form className={styles.filters} action={`/${locale}/species`} method="get">
        <input
          className={styles.input}
          name="q"
          defaultValue={q}
          placeholder={locale === "dk" ? "Søg (ramsløg, kantarel…)" : "Search (ramsons, chanterelle…)"}
        />

        <select className={styles.select} name="group" defaultValue={group}>
          <option value="">{locale === "dk" ? "Alle grupper" : "All groups"}</option>
          <option value="plant">{locale === "dk" ? "Planter" : "Plants"}</option>
          <option value="mushroom">{locale === "dk" ? "Svampe" : "Mushrooms"}</option>
          <option value="seaweed">{locale === "dk" ? "Tang" : "Seaweed"}</option>
          <option value="berry">{locale === "dk" ? "Bær" : "Berries"}</option>
        </select>

        <select className={styles.select} name="season" defaultValue={seasonFilter}>
          <option value="">{locale === "dk" ? "Alle sæsoner" : "All seasons"}</option>
          <option value="now">{locale === "dk" ? "Kun i sæson nu" : "Only in season now"}</option>
        </select>

        <button className={styles.button} type="submit">
          {locale === "dk" ? "Filtrér" : "Filter"}
        </button>

        <div className={styles.sortRow}>
          <Link
            className={styles.chip}
            href={`/${locale}/species?${baseParams()}`}
            aria-current={sort !== "az" ? "page" : undefined}
          >
            {locale === "dk" ? "Relevans (sæson først)" : "Relevance (season first)"}
          </Link>
          <Link
            className={styles.chip}
            href={`/${locale}/species?${baseParams({ sort: "az" })}`}
            aria-current={sort === "az" ? "page" : undefined}
          >
            {locale === "dk" ? "A–Å" : "A–Z"}
          </Link>
        </div>
      </form>

      <section className={styles.grid}>
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/species/${s.slug}`}
            className={`${styles.card} ${s.inSeasonNow ? styles.cardSeason : ""}`}
          >
            <div className={styles.cardTop}>
              <div>
                <div className={styles.name}>{s.name}</div>
                <div className={styles.meta}>
                  {s.scientific ? <em>{s.scientific}</em> : s.slug}
                  {" · "}
                  {s.group}
                </div>
              </div>

              {s.inSeasonNow ? (
                <span className={`${styles.badge} ${styles.badgeSeason}`}>
                  {locale === "dk" ? "I sæson" : "In season"}
                </span>
              ) : null}
            </div>

            <div className={styles.desc}>
              {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
            </div>

            <div className={styles.footer}>
              <span className={styles.pill}>
                {locale === "dk" ? "Sæson:" : "Season:"}{" "}
                {s.seasonText ? s.seasonText : locale === "dk" ? "ukendt" : "unknown"}
                {s.confidence ? ` · ${s.confidence}%` : ""}
              </span>

              {s.monthLinks.length ? (
                <div className={styles.months}>
                  {locale === "dk" ? "I sæson i:" : "In:"}{" "}
                  {s.monthLinks.map((m, i) => (
                    <span key={m.href}>
                      {i ? ", " : ""}
                      <Link className={styles.monthLink} href={m.href} onClick={(e) => e.stopPropagation()}>
                        {m.label}
                      </Link>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </section>

      {items.length === 0 ? (
        <p style={{ marginTop: 18, opacity: 0.8 }}>
          {locale === "dk" ? "Ingen resultater." : "No results."}
        </p>
      ) : null}
    </main>
  );
}