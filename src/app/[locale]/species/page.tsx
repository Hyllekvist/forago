// src/app/[locale]/species/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import styles from "./SpeciesIndex.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

// Locale = sprog. Country = geografi.
function countryForLocale(locale: Locale) {
  if (locale === "dk") return "DK";
  if (locale === "en") return "DK";
  return "DK";
}

function groupLabel(locale: Locale, g: string) {
  const key = (g || "").toLowerCase();
  if (locale === "dk") {
    if (key === "plant") return "Plante";
    if (key === "berry") return "Bær";
    if (key === "seaweed") return "Tang";
    if (key === "mushroom" || key === "fungus") return "Svamp";
    return g || "Art";
  }
  if (key === "plant") return "Plant";
  if (key === "berry") return "Berry";
  if (key === "seaweed") return "Seaweed";
  if (key === "mushroom") return "Mushroom";
  if (key === "fungus") return "Fungus";
  return g || "Species";
}

type RpcRow = {
  id: string;
  slug: string;
  primary_group: string | null;
  scientific_name: string | null;
  common_name: string | null;
  short_description: string | null;
  month_from: number | null;
  month_to: number | null;
  confidence: number | null;
  in_season_now: boolean | null;
};

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const loc = params.locale;
  const title = loc === "dk" ? "Arter — Forago" : "Species — Forago";
  const description =
    loc === "dk"
      ? "Find vilde råvarer: sæson, identifikation, forvekslinger og brug."
      : "Explore wild food species: season, identification, look-alikes and use.";

  return {
    title,
    description,
    alternates: { canonical: `/${loc}/species` },
  };
}

export default async function SpeciesIndexPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { group?: string; q?: string };
}) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const q = (searchParams?.q ?? "").trim();
  const group = (searchParams?.group ?? "").trim();

  // ✅ IMPORTANT: use read-only server client (no cookies().set)
  const supabase = supabaseServerReadOnly();
  const country = countryForLocale(locale);

  const { data, error } = await supabase.rpc("species_index", {
    p_locale: locale,
    p_country: country,
    p_q: q,
    p_group: group,
  });

  if (error) throw error;

  const rows = (data ?? []) as RpcRow[];

  const title = locale === "dk" ? "Arter" : "Species";
  const subtitle =
    locale === "dk"
      ? "Find artsprofiler med sæson, identifikation og forvekslinger."
      : "Find species pages with season, identification and look-alikes.";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
      </header>

      <form action={`/${locale}/species`} method="get" className={styles.filters}>
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
          <option value="fungus">{locale === "dk" ? "Svampe" : "Fungi"}</option>
          <option value="seaweed">{locale === "dk" ? "Tang" : "Seaweed"}</option>
          <option value="berry">{locale === "dk" ? "Bær" : "Berries"}</option>
        </select>

        <button className={styles.button} type="submit">
          {locale === "dk" ? "Filtrér" : "Filter"}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className={styles.sub}>
          {q || group
            ? locale === "dk"
              ? "Ingen resultater."
              : "No results."
            : locale === "dk"
            ? "Ingen arter endnu. Seed 'species' + 'species_translations' + 'seasonality'."
            : "No species yet. Seed 'species' + 'species_translations' + 'seasonality'."}
        </p>
      ) : (
        <section className={styles.grid}>
          {rows.map((r) => {
            const g = (r.primary_group ?? "plant").toLowerCase();
            const gText = groupLabel(locale, g);

            const inSeason = !!r.in_season_now;
            const conf = typeof r.confidence === "number" ? r.confidence : null;

            const name = r.common_name?.trim() || r.slug;
            const sci = r.scientific_name?.trim() || "";

            return (
              <Link key={r.id} href={`/${locale}/species/${r.slug}`} className={styles.card}>
                <span className={styles.badge}>
                  {gText}
                  {conf !== null ? ` · ${conf}%` : ""}
                </span>

                <span className={styles.badge} style={{ marginRight: 8 }}>
                  {inSeason ? (locale === "dk" ? "I sæson nu" : "In season now") : locale === "dk" ? "Ikke i sæson" : "Out of season"}
                </span>

                <div className={styles.name}>{name}</div>

                <div className={styles.meta}>{sci ? <em>{sci}</em> : <span>{r.slug}</span>}</div>

                <div className={styles.desc}>
                  {r.short_description?.trim() || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
                </div>

                <div className={styles.footer}>
                  <span className={styles.pill}>/{locale}/species/{r.slug}</span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
