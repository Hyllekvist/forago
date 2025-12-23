import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

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
  return new Date().getUTCMonth() + 1; // 1..12
}

function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to; // wrap-around
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
  searchParams?: { group?: string; q?: string; season?: string; sort?: string };
}) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const q = (searchParams?.q ?? "").trim();
  const group = (searchParams?.group ?? "").trim();
  const seasonFilter = (searchParams?.season ?? "").trim(); // "now" | ""
  const sort = (searchParams?.sort ?? "").trim(); // "" (default) | "az"

  const supabase = supabaseServer();
  const month = currentMonthUTC();

  // 1) Species base
  const { data: species, error: spErr } = await supabase
    .from("species")
    .select("id, slug, primary_group, scientific_name")
    .order("slug", { ascending: true });

  if (spErr) throw spErr;

  const ids = (species ?? []).map((s) => s.id);
  if (!ids.length) {
    return (
      <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>{locale === "dk" ? "Arter" : "Species"}</h1>
        <p style={{ opacity: 0.8, marginTop: 10 }}>
          {locale === "dk" ? "Ingen arter endnu." : "No species yet."}
        </p>
      </main>
    );
  }

  // 2) Translations for locale
  const { data: translations, error: trErr } = await supabase
    .from("species_translations")
    .select("species_id, locale, common_name, short_description")
    .eq("locale", locale)
    .in("species_id", ids);

  if (trErr) throw trErr;

  const trMap = new Map(
    (translations ?? []).map((t) => [t.species_id as string, t])
  );

  // 3) Seasonality (national: region = '')
  const { data: seas, error: seasErr } = await supabase
    .from("seasonality")
    .select("species_id, country, region, month_from, month_to, confidence")
    .eq("country", locale)
    .eq("region", "")
    .in("species_id", ids);

  if (seasErr) throw seasErr;

  const seasMap = new Map<
    string,
    { from: number; to: number; confidence: number }
  >(
    (seas ?? []).map((r: any) => [
      r.species_id as string,
      {
        from: Number(r.month_from),
        to: Number(r.month_to),
        confidence: Number(r.confidence ?? 0),
      },
    ])
  );

  // Build items
  let items = (species ?? []).map((s) => {
    const t = trMap.get(s.id);
    const sea = seasMap.get(s.id);
    const from = sea?.from ?? null;
    const to = sea?.to ?? null;
    const confidence = sea?.confidence ?? 0;
    const inSeasonNow = from && to ? isInSeason(month, from, to) : false;

    const months =
      from && to ? monthsBetween(from, to).slice(0, 6) : ([] as number[]);

    return {
      id: s.id as string,
      slug: s.slug as string,
      group: (s.primary_group as string) || "plant",
      scientific: (s.scientific_name as string) || "",
      name: (t?.common_name as string) || (s.slug as string),
      desc: (t?.short_description as string) || "",
      seasonFrom: from,
      seasonTo: to,
      confidence,
      inSeasonNow,
      seasonText: from && to ? seasonLabel(locale, from, to) : null,
      monthLinks: months.map((m) => ({
        m,
        label: monthName(locale, m),
        href: `/${locale}/season/${MONTH_NUM_TO_SLUG[m]}`,
      })),
    };
  });

  // Filters
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

  if (seasonFilter === "now") {
    items = items.filter((x) => x.inSeasonNow);
  }

  // Sorting
  if (sort === "az") {
    items.sort((a, b) => a.name.localeCompare(b.name, locale));
  } else {
    // Default: in-season first, then confidence, then name
    items.sort((a, b) => {
      if (a.inSeasonNow !== b.inSeasonNow) return a.inSeasonNow ? -1 : 1;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.name.localeCompare(b.name, locale);
    });
  }

  const title = locale === "dk" ? "Arter" : "Species";
  const subtitle =
    locale === "dk"
      ? "Find artsprofiler med sæson, identifikation og forvekslinger."
      : "Species pages with season, identification and look-alikes.";

  const inSeasonCount = items.filter((x) => x.inSeasonNow).length;

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.85 }}>{subtitle}</p>

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href={`/${locale}/season`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
              opacity: 0.95,
            }}
          >
            {locale === "dk" ? "Se sæson nu →" : "See season now →"}
          </Link>

          <span
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(34,197,94,0.14)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
              opacity: 0.95,
            }}
          >
            {locale === "dk"
              ? `I sæson nu: ${inSeasonCount}`
              : `In season now: ${inSeasonCount}`}
          </span>
        </div>
      </header>

      {/* Filters */}
      <form
        action={`/${locale}/species`}
        method="get"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 160px auto",
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
          <option value="seaweed">{locale === "dk" ? "Tang" : "Seaweed"}</option>
          <option value="berry">{locale === "dk" ? "Bær" : "Berries"}</option>
        </select>

        <select
          name="season"
          defaultValue={seasonFilter}
          style={{
            borderRadius: 14,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "inherit",
          }}
        >
          <option value="">
            {locale === "dk" ? "Alle sæsoner" : "All seasons"}
          </option>
          <option value="now">
            {locale === "dk" ? "Kun i sæson nu" : "Only in season now"}
          </option>
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

        {/* keep sort in query? easiest: add small links */}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href={`/${locale}/species?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(group ? { group } : {}),
              ...(seasonFilter ? { season: seasonFilter } : {}),
            }).toString()}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.12)",
              background: sort === "az" ? "rgba(255,255,255,0.06)" : "rgba(34,197,94,0.14)",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 13,
            }}
          >
            {locale === "dk" ? "Relevans (sæson først)" : "Relevance (season first)"}
          </Link>

          <Link
            href={`/${locale}/species?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(group ? { group } : {}),
              ...(seasonFilter ? { season: seasonFilter } : {}),
              sort: "az",
            }).toString()}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.12)",
              background: sort === "az" ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 13,
            }}
          >
            {locale === "dk" ? "A–Å" : "A–Z"}
          </Link>
        </div>
      </form>

      {/* Grid */}
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
              background: s.inSeasonNow ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{s.name}</div>
              {s.inSeasonNow ? (
                <span
                  style={{
                    fontSize: 12,
                    borderRadius: 999,
                    padding: "4px 8px",
                    border: "1px solid rgba(34,197,94,0.35)",
                    background: "rgba(34,197,94,0.16)",
                    opacity: 0.95,
                    height: "fit-content",
                  }}
                >
                  {locale === "dk" ? "I sæson" : "In season"}
                </span>
              ) : null}
            </div>

            <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 8 }}>
              {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
              {" · "}
              <span>{s.group}</span>
            </div>

            <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.35 }}>
              {s.desc ||
                (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 12,
                  borderRadius: 999,
                  padding: "5px 9px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  opacity: 0.95,
                }}
              >
                {locale === "dk" ? "Sæson:" : "Season:"}{" "}
                {s.seasonText ? s.seasonText : locale === "dk" ? "ukendt" : "unknown"}
                {s.confidence ? ` · ${s.confidence}%` : ""}
              </span>

              {s.monthLinks.length ? (
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {locale === "dk" ? "I sæson i:" : "In:"}{" "}
                  {s.monthLinks.map((m, i) => (
                    <span key={m.href}>
                      <span style={{ opacity: 0.65 }}>{i ? ", " : ""}</span>
                      <span style={{ textDecoration: "underline" }}>{m.label}</span>
                    </span>
                  ))}
                </span>
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