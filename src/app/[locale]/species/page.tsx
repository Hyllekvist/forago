import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
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

  // ✅ IMPORTANT: never call .in() with an empty array
  let translations:
    | Array<{
        species_id: string;
        locale: string;
        common_name: string | null;
        short_description: string | null;
      }>
    | null = null;

  if (ids.length > 0) {
    const { data: tr, error: trErr } = await supabase
      .from("species_translations")
      .select("species_id, locale, common_name, short_description")
      .eq("locale", locale)
      .in("species_id", ids);

    if (trErr) throw trErr;
    translations = tr ?? [];
  } else {
    translations = [];
  }

  const trMap = new Map(
    (translations ?? []).map((t) => [t.species_id as string, t])
  );

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
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.85 }}>{subtitle}</p>
      </header>

      <form
        action={`/${locale}/species`}
        method="get"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px auto",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder={
            locale === "dk"
              ? "Søg (ramsløg, kantarel…)"
              : "Search (ramsons, chanterelle…)"
          }
          style={{
            width: "100%",
            borderRadius: 14,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "inherit",
          }}
        />
        <select
          name="group"
          defaultValue={group}
          style={{
            borderRadius: 14,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "inherit",
          }}
        >
          <option value="">
            {locale === "dk" ? "Alle grupper" : "All groups"}
          </option>
          <option value="plant">{locale === "dk" ? "Planter" : "Plants"}</option>
          <option value="mushroom">
            {locale === "dk" ? "Svampe" : "Mushrooms"}
          </option>
          <option value="seaweed">
            {locale === "dk" ? "Tang" : "Seaweed"}
          </option>
          <option value="berry">{locale === "dk" ? "Bær" : "Berries"}</option>
        </select>
        <button
          type="submit"
          style={{
            borderRadius: 14,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.08)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          {locale === "dk" ? "Filtrér" : "Filter"}
        </button>
      </form>

      {safeSpecies.length === 0 ? (
        <p style={{ marginTop: 18, opacity: 0.8 }}>
          {locale === "dk"
            ? "Ingen arter endnu. Tilføj rækker i 'species' og 'species_translations'."
            : "No species yet. Add rows in 'species' and 'species_translations'."}
        </p>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((s) => (
            <Link
              key={s.id}
              href={`/${locale}/species/${s.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.name}</div>
              <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 8 }}>
                {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
                {" · "}
                <span>{s.group}</span>
              </div>
              <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.35 }}>
                {s.desc ||
                  (locale === "dk"
                    ? "Tilføj beskrivelse i DB."
                    : "Add description in DB.")}
              </div>
            </Link>
          ))}
        </section>
      )}

      {safeSpecies.length > 0 && items.length === 0 ? (
        <p style={{ marginTop: 18, opacity: 0.8 }}>
          {locale === "dk" ? "Ingen resultater." : "No results."}
        </p>
      ) : null}
    </main>
  );
}