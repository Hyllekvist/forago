// src/app/[locale]/species/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./SpeciesIndex.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
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
  searchParams?: { group?: string; q?: string };
}) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const q = (searchParams?.q ?? "").trim();
  const group = (searchParams?.group ?? "").trim();

  const supabase = await supabaseServer();

  const { data: species, error: spErr } = await supabase
    .from("species")
    .select("id, slug, primary_group, scientific_name")
    .order("slug", { ascending: true });

  if (spErr) throw spErr;

  const safeSpecies = species ?? [];
  const ids = safeSpecies.map((s) => s.id as string);

  // never .in([]) – good
  const { data: tr } =
    ids.length > 0
      ? await supabase
          .from("species_translations")
          .select("species_id, locale, common_name, short_description")
          .eq("locale", locale)
          .in("species_id", ids)
      : { data: [] as any[] };

  const trMap = new Map((tr ?? []).map((t: any) => [t.species_id as string, t]));

  let items = safeSpecies.map((s) => {
    const t = trMap.get(s.id as string);
    return {
      id: s.id as string,
      slug: s.slug as string,
      group: (s.primary_group as string) || "plant",
      scientific: (s.scientific_name as string) || "",
      name: (t?.common_name as string) || (s.slug as string),
      desc: (t?.short_description as string) || "",
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
          placeholder={
            locale === "dk"
              ? "Søg (ramsløg, kantarel…)"
              : "Search (ramsons, chanterelle…)"
          }
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

      {safeSpecies.length === 0 ? (
        <p className={styles.sub}>
          {locale === "dk"
            ? "Ingen arter endnu. Tilføj rækker i 'species' og 'species_translations'."
            : "No species yet. Add rows in 'species' and 'species_translations'."}
        </p>
      ) : (
        <section className={styles.grid}>
          {items.map((s) => (
            <Link key={s.id} href={`/${locale}/species/${s.slug}`} className={styles.card}>
              {/* placeholder badge – gør den dynamisk senere via seasonality */}
              <span className={styles.badge}>{s.group}</span>

              <div className={styles.name}>{s.name}</div>

              <div className={styles.meta}>
                {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
              </div>

              <div className={styles.desc}>
                {s.desc ||
                  (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
              </div>

              <div className={styles.footer}>
                <span className={styles.pill}>/{locale}/species/{s.slug}</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {safeSpecies.length > 0 && items.length === 0 ? (
        <p className={styles.sub}>{locale === "dk" ? "Ingen resultater." : "No results."}</p>
      ) : null}
    </main>
  );
}
