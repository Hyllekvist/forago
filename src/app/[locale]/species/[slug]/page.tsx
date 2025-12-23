import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

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

function monthsBetween(from: number, to: number) {
  const out: number[] = [];
  if (from <= to) {
    for (let m = from; m <= to; m++) out.push(m);
  } else {
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

function currentMonthUTC() {
  const now = new Date();
  return now.getUTCMonth() + 1; // 1-12
}

function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to; // wrap-around
}

function seasonLabel(locale: Locale, from: number, to: number) {
  if (from === to) return monthName(locale, from);
  return `${monthName(locale, from)} – ${monthName(locale, to)}`;
}

function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 14,
        padding: 14,
        background: "rgba(255,255,255,0.03)",
        marginTop: 12,
      }}
    >
      <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>{title}</h2>
      <div style={{ opacity: 0.92, lineHeight: 1.55 }}>{children}</div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale: locParam, slug } = params;
  if (!isLocale(locParam)) return { title: "Forago" };

  const supabase = supabaseServer();
  const { data: sp } = await supabase
    .from("species")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!sp) return { title: "Forago" };

  const { data: tr } = await supabase
    .from("species_translations")
    .select("common_name, short_description")
    .eq("species_id", sp.id)
    .eq("locale", locParam)
    .maybeSingle();

  const name = tr?.common_name || slug;
  const title = `${name} — Forago`;
  const description =
    tr?.short_description ||
    (locParam === "dk"
      ? `Lær at genkende og bruge ${name}. Sæson, forvekslinger og sikkerhed.`
      : `Learn how to identify and use ${name}. Season, look-alikes and safety.`);

  return {
    title,
    description,
    alternates: { canonical: `/${locParam}/species/${slug}` },
  };
}

export default async function SpeciesPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale: locParam, slug } = params;
  if (!isLocale(locParam)) return notFound();
  const locale = locParam;

  const supabase = supabaseServer();
  const month = currentMonthUTC();

  // Note: we reuse locale as "country" for now ('dk'/'en').
  const country = locale;

  const { data: sp, error: spErr } = await supabase
    .from("species")
    .select("id, slug, primary_group, scientific_name, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (spErr) throw spErr;
  if (!sp) return notFound();

  const { data: tr, error: trErr } = await supabase
    .from("species_translations")
    .select(
      "common_name, short_description, identification, lookalikes, usage_notes, safety_notes, updated_at"
    )
    .eq("species_id", sp.id)
    .eq("locale", locale)
    .maybeSingle();

  if (trErr) throw trErr;

  const name = tr?.common_name || sp.slug;
  const scientific = sp.scientific_name || "";
  const group = sp.primary_group || "plant";

  // Seasonality (national: region = '')
  const { data: seasonRow, error: seasErr } = await supabase
    .from("seasonality")
    .select("month_from, month_to, confidence, notes")
    .eq("species_id", sp.id)
    .eq("country", country)
    .eq("region", "")
    .maybeSingle();

  if (seasErr) throw seasErr;

  const from = (seasonRow?.month_from as number | undefined) ?? undefined;
  const to = (seasonRow?.month_to as number | undefined) ?? undefined;
  const conf = (seasonRow?.confidence as number | undefined) ?? null;

  const inSeasonNow = from && to ? isInSeason(month, from, to) : false;
  const seasonText = from && to ? seasonLabel(locale, from, to) : null;

  // Related species: other species that are also in season now (same country/region)
  let related: Array<{ slug: string; name: string; confidence: number }> = [];
  if (inSeasonNow) {
    const { data: relSeas } = await supabase
      .from("seasonality")
      .select("species_id, confidence, month_from, month_to")
      .eq("country", country)
      .eq("region", "");

    const relIds =
      (relSeas ?? [])
        .filter((r: any) => {
          const a = r.month_from as number;
          const b = r.month_to as number;
          return isInSeason(month, a, b);
        })
        .map((r: any) => ({
          species_id: r.species_id as string,
          confidence: (r.confidence as number) ?? 0,
        })) ?? [];

    const uniq = new Map<string, number>();
    for (const r of relIds) {
      if (r.species_id === sp.id) continue;
      uniq.set(r.species_id, Math.max(uniq.get(r.species_id) ?? 0, r.confidence));
    }

    const ids = Array.from(uniq.keys());
    if (ids.length) {
      const { data: relSpecies } = await supabase
        .from("species")
        .select("id, slug")
        .in("id", ids);

      const { data: relTr } = await supabase
        .from("species_translations")
        .select("species_id, common_name")
        .eq("locale", locale)
        .in("species_id", ids);

      const trMap = new Map(
        (relTr ?? []).map((t: any) => [t.species_id as string, t.common_name as string])
      );
      const slugMap = new Map(
        (relSpecies ?? []).map((s: any) => [s.id as string, s.slug as string])
      );

      related = ids
        .map((id) => ({
          slug: slugMap.get(id) || "",
          name: trMap.get(id) || slugMap.get(id) || "unknown",
          confidence: uniq.get(id) || 0,
        }))
        .filter((x) => x.slug)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 6);
    }
  }

  const base = siteUrl();
  const canonical = `${base}/${locale}/species/${sp.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: `${name} — Forago`,
        inLanguage: locale,
      },
      {
        "@type": "Article",
        headline: name,
        about: scientific ? [{ "@type": "Thing", name: scientific }] : undefined,
        author: { "@type": "Organization", name: "Forago" },
        publisher: { "@type": "Organization", name: "Forago" },
        mainEntityOfPage: canonical,
        datePublished: sp.created_at,
        dateModified: tr?.updated_at || sp.created_at,
      },
    ],
  };

  return (
    <main style={{ padding: 16, maxWidth: 920, margin: "0 auto" }}>
      <Script id="species-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <header style={{ marginBottom: 10 }}>
        <p style={{ margin: 0 }}>
          <Link href={`/${locale}/species`} style={{ textDecoration: "none" }}>
            ← {locale === "dk" ? "Arter" : "Species"}
          </Link>
        </p>

        <h1 style={{ margin: "10px 0 6px" }}>{name}</h1>

        <div style={{ opacity: 0.78, fontSize: 14, lineHeight: 1.35 }}>
          {scientific ? <em>{scientific}</em> : null}
          {scientific ? " · " : null}
          <span>{group}</span>
        </div>

        {tr?.short_description ? (
          <p style={{ margin: "10px 0 0", opacity: 0.9, lineHeight: 1.55 }}>
            {tr.short_description}
          </p>
        ) : (
          <p style={{ margin: "10px 0 0", opacity: 0.75 }}>
            {locale === "dk"
              ? "Tilføj short_description i species_translations for at gøre siden rankable."
              : "Add short_description in species_translations to make this page rankable."}
          </p>
        )}

        {/* Season chips */}
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
              opacity: 0.95,
            }}
          >
            {locale === "dk" ? "Sæson:" : "Season:"}{" "}
            {seasonText ? seasonText : locale === "dk" ? "ukendt" : "unknown"}
          </span>

          <span
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: inSeasonNow ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
              opacity: 0.95,
            }}
          >
            {inSeasonNow
              ? locale === "dk"
                ? "I sæson nu"
                : "In season now"
              : locale === "dk"
              ? "Ikke i sæson nu"
              : "Not in season now"}
            {conf !== null ? ` · ${conf}%` : ""}
          </span>

          <Link
            href={`/${locale}/season`}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
              textDecoration: "none",
              color: "inherit",
              opacity: 0.95,
            }}
          >
            {locale === "dk" ? "Se sæson nu →" : "See season now →"}
          </Link>

          <Link
            href={`/${locale}/guides/safety-basics`}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
              textDecoration: "none",
              color: "inherit",
              opacity: 0.95,
            }}
          >
            {locale === "dk" ? "Sikkerhed →" : "Safety →"}
          </Link>

          <Link
            href={`/${locale}/guides/lookalikes`}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              padding: "8px 10px",
              fontSize: 13,
              textDecoration: "none",
              color: "inherit",
              opacity: 0.95,
            }}
          >
            {locale === "dk" ? "Forvekslinger →" : "Look-alikes →"}
          </Link>
        </div>

        {/* NEW: Month links ("I sæson i:") */}
        {from && to ? (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ opacity: 0.78, fontSize: 13 }}>
              {locale === "dk" ? "I sæson i:" : "In season in:"}
            </span>

            {monthsBetween(from, to)
              .slice(0, 8)
              .map((m) => (
                <Link
                  key={m}
                  href={`/${locale}/season/${MONTH_NUM_TO_SLUG[m]}`}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 13,
                    textDecoration: "none",
                    color: "inherit",
                    opacity: 0.95,
                  }}
                >
                  {monthName(locale, m)}
                </Link>
              ))}
          </div>
        ) : null}
      </header>

      <Section title={locale === "dk" ? "Identifikation" : "Identification"}>
        {tr?.identification ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{tr.identification}</div>
        ) : (
          <p style={{ margin: 0, opacity: 0.75 }}>
            {locale === "dk"
              ? "Tilføj identification i species_translations (bullet-liste med kendetegn + habitat)."
              : "Add identification in species_translations (bullets: features + habitat)."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Forvekslinger" : "Look-alikes"}>
        {tr?.lookalikes ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{tr.lookalikes}</div>
        ) : (
          <p style={{ margin: 0, opacity: 0.75 }}>
            {locale === "dk"
              ? "Tilføj lookalikes (det er en af jeres største SEO-vindere)."
              : "Add look-alikes (one of your biggest SEO wins)."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Brug" : "Use"}>
        {tr?.usage_notes ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{tr.usage_notes}</div>
        ) : (
          <p style={{ margin: 0, opacity: 0.75 }}>
            {locale === "dk"
              ? "Tilføj usage_notes (3–5 konkrete anvendelser + tilberedning)."
              : "Add usage_notes (3–5 concrete uses + prep)."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Sikkerhed" : "Safety"}>
        {tr?.safety_notes ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{tr.safety_notes}</div>
        ) : (
          <p style={{ margin: 0, opacity: 0.75 }}>
            {locale === "dk"
              ? "Tilføj safety_notes. Vær tydelig: aldrig spise noget man ikke kan identificere 100%."
              : "Add safety_notes. Be explicit: never eat what you can’t ID with certainty."}
          </p>
        )}
      </Section>

      {/* Related */}
      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>
          {locale === "dk" ? "Relaterede arter (i sæson nu)" : "Related species (in season now)"}
        </h2>

        {related.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/${locale}/species/${r.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14,
                  padding: 12,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{r.name}</div>
                <div style={{ opacity: 0.78, fontSize: 13 }}>
                  {locale === "dk" ? "Sæson match" : "Season match"} · {r.confidence}%
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, opacity: 0.75 }}>
            {locale === "dk"
              ? "Ingen relaterede arter endnu (tilføj flere seasonality-rækker for denne måned)."
              : "No related species yet (add more seasonality rows for this month)."}
          </p>
        )}
      </section>

      <p style={{ marginTop: 18, opacity: 0.7, fontSize: 13 }}>
        {locale === "dk" ? "Sidst opdateret:" : "Last updated:"}{" "}
        {tr?.updated_at ? new Date(tr.updated_at).toISOString().slice(0, 10) : "—"}
      </p>
    </main>
  );
}