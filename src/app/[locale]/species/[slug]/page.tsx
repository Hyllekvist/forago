// src/app/[locale]/species/[slug]/page.tsx
import { notFound } from "next/navigation";
import Script from "next/script";
import { supabaseServer } from "@/lib/supabase/server";
import FieldHero from "./FieldHero";
import styles from "./SpeciesPage.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function currentMonthLocal() {
  return new Date().getMonth() + 1;
}
function countryForLocale(_locale: string) {
  return "dk";
}
function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
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

function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

function fmtCompact(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("da-DK", { notation: "compact" }).format(n);
}

function pickCues(text: string | null | undefined, locale: Locale) {
  const fallback =
    locale === "dk"
      ? [
          "Start med helhedsformen: hat, stok og basis.",
          "Tjek undersiden: lameller/porelag + farve.",
          "Sammenlign altid med forvekslinger før du spiser noget.",
        ]
      : [
          "Start with the overall shape: cap, stem and base.",
          "Check the underside: gills/pores and color.",
          "Always compare with look-alikes before consuming anything.",
        ];

  const raw = (text ?? "").trim();
  if (!raw) return fallback;

  const parts = raw
    .replace(/\r/g, "")
    .split(/\n+|•|- /g)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) =>
      s.length > 140
        ? s
            .split(/\. +/g)
            .map((x) => x.trim())
            .filter(Boolean)
        : [s]
    )
    .filter((s) => s.length >= 12)
    .slice(0, 3);

  return parts.length ? parts : fallback;
}

type SpeciesRow = {
  id: string;
  slug: string;
  primary_group: string;
  scientific_name: string | null;
  created_at: string;
  image_path: string | null;
  image_updated_at: string | null;
  is_poisonous: boolean;
  danger_level: number;
};

type TrRow = {
  common_name: string | null;
  short_description: string | null;
  identification: string | null;
  lookalikes: string | null;
  usage_notes: string | null;
  safety_notes: string | null;
  updated_at: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale: locParam, slug } = params;
  if (!isLocale(locParam)) return { title: "Forago" };

  const supabase = await supabaseServer();
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

  const supabase = await supabaseServer();
  const month = currentMonthLocal();
  const country = countryForLocale(locale);

  const { data: sp, error: spErr } = await supabase
    .from("species")
    .select(
      "id, slug, primary_group, scientific_name, created_at, image_path, image_updated_at, is_poisonous, danger_level"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (spErr) throw spErr;
  if (!sp) return notFound();
  const species = sp as SpeciesRow;

  const { data: tr, error: trErr } = await supabase
    .from("species_translations")
    .select(
      "common_name, short_description, identification, lookalikes, usage_notes, safety_notes, updated_at"
    )
    .eq("species_id", species.id)
    .eq("locale", locale)
    .maybeSingle();

  if (trErr) throw trErr;
  const t = (tr ?? null) as TrRow | null;

  const name = t?.common_name || species.slug;
  const scientific = species.scientific_name || "";
  const group = species.primary_group || "plant";

  const { data: seasonRow, error: seasErr } = await supabase
    .from("seasonality")
    .select("month_from, month_to, confidence, notes")
    .eq("species_id", species.id)
    .eq("country", country)
    .eq("region", "")
    .maybeSingle();

  if (seasErr) throw seasErr;

  const from = (seasonRow?.month_from as number | undefined) ?? undefined;
  const to = (seasonRow?.month_to as number | undefined) ?? undefined;
  const conf = (seasonRow?.confidence as number | undefined) ?? null;

  const inSeasonNow = from && to ? isInSeason(month, from, to) : false;
  const seasonText =
    from && to ? seasonLabel(locale, from, to) : locale === "dk" ? "ukendt" : "unknown";

  const imageUrl = species.image_path
    ? supabase.storage.from("species").getPublicUrl(species.image_path).data.publicUrl +
      `?v=${encodeURIComponent(String(species.image_updated_at ?? species.created_at))}`
    : null;

  let totalFinds = 0;
  let finds30d = 0;
  const statsRes = await supabase.rpc("species_find_stats", { p_species_id: species.id });
  if (!statsRes.error && Array.isArray(statsRes.data) && statsRes.data[0]) {
    totalFinds = Number(statsRes.data[0].total_finds ?? 0);
    finds30d = Number(statsRes.data[0].finds_30d ?? 0);
  }

  const danger = species.is_poisonous || (t?.safety_notes?.toLowerCase().includes("gift") ?? false);
  const dangerLabel =
    locale === "dk"
      ? species.danger_level >= 2
        ? "MEGET GIFTIG"
        : "GIFTIG"
      : species.danger_level >= 2
      ? "HIGHLY TOXIC"
      : "TOXIC";

  const base = siteUrl();
  const canonical = `${base}/${locale}/species/${species.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": canonical, url: canonical, name: `${name} — Forago`, inLanguage: locale },
      {
        "@type": "Article",
        headline: name,
        about: scientific ? [{ "@type": "Thing", name: scientific }] : undefined,
        author: { "@type": "Organization", name: "Forago" },
        publisher: { "@type": "Organization", name: "Forago" },
        mainEntityOfPage: canonical,
        datePublished: species.created_at,
        dateModified: t?.updated_at || species.created_at,
      },
    ],
  };

  const cues = pickCues(t?.identification, locale);

  const sections = danger
    ? (["safety", "lookalikes", "identification", "use"] as const)
    : (["identification", "lookalikes", "use", "safety"] as const);

  return (
    <main className={styles.page}>
      <Script id="species-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <div className={styles.shell}>
        {/* Full hero (fills screen) */}
        <FieldHero
          locale={locale}
          name={name}
          scientific={scientific}
          group={group}
          imageUrl={imageUrl}
          danger={danger}
          dangerLabel={dangerLabel}
          inSeasonNow={inSeasonNow}
          confidence={conf}
          seasonText={seasonText}
          totalFinds={fmtCompact(totalFinds)}
          finds30d={fmtCompact(finds30d)}
        />

        {/* Sheet/content under hero */}
        <section className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>{name}</h1>

            <p className={styles.subline}>
              {scientific ? <span className={styles.latin}>{scientific}</span> : null}
              {scientific ? <span className={styles.dot}>•</span> : null}
              <span>{group}</span>
              <span className={styles.dot}>•</span>
              <span>
                {locale === "dk" ? "Sæson:" : "Season:"} {seasonText}
              </span>
            </p>

            <div className={styles.metaRow}>
              {danger ? (
                <span className={`${styles.metaChip} ${styles.metaChipStrong}`}>
                  ☠️ {dangerLabel}
                </span>
              ) : (
                <span className={styles.metaChip}>
                  {locale === "dk" ? "Ikke giftig" : "Not toxic"}
                </span>
              )}

              <span className={styles.metaChip}>
                {inSeasonNow ? (locale === "dk" ? "I sæson" : "In season") : locale === "dk" ? "Ikke i sæson" : "Out of season"}
                {typeof conf === "number" ? ` · ${Math.round(conf * 100)}%` : ""}
              </span>

              <span className={styles.metaChip}>
                {locale === "dk" ? "Land:" : "Country:"} {country.toUpperCase()}
              </span>
            </div>

            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>{locale === "dk" ? "Fund" : "Finds"}</div>
                <div className={styles.kpiValue}>{fmtCompact(totalFinds)}</div>
              </div>

              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>{locale === "dk" ? "30d" : "30d"}</div>
                <div className={styles.kpiValue}>{fmtCompact(finds30d)}</div>
              </div>
            </div>
          </header>

          <div className={styles.sections}>
            {/* Quick field checklist */}
            <section className={styles.section} aria-label={locale === "dk" ? "Hurtig identifikation" : "Quick identification"}>
              <h2 className={styles.sectionTitle}>{locale === "dk" ? "Hurtig identifikation" : "Quick identification"}</h2>
              <p className={styles.sectionSub}>{locale === "dk" ? "Brug dette som tjekliste i marken." : "Use this as a field checklist."}</p>

              <div className={styles.checklist}>
                {cues.map((c, i) => (
                  <div key={i} className={styles.check}>
                    <span className={styles.bullet} aria-hidden="true" />
                    <p className={styles.checkText}>{c}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Main sections */}
            {sections.map((key) => {
              if (key === "identification") {
                return (
                  <section key={key} id="identification" className={styles.section}>
                    <h2 className={styles.sectionTitle}>{locale === "dk" ? "Identifikation" : "Identification"}</h2>
                    {t?.identification ? (
                      <div className={styles.paragraph}>
                        <p>{t.identification}</p>
                      </div>
                    ) : (
                      <p className={styles.sectionSub}>
                        {locale === "dk" ? "Tilføj identification i species_translations." : "Add identification in species_translations."}
                      </p>
                    )}
                  </section>
                );
              }

              if (key === "lookalikes") {
                return (
                  <section key={key} id="lookalikes" className={styles.section}>
                    <h2 className={styles.sectionTitle}>{locale === "dk" ? "Forvekslinger" : "Look-alikes"}</h2>
                    {t?.lookalikes ? (
                      <div className={styles.callout}>
                        <p className={styles.calloutText}>{t.lookalikes}</p>
                      </div>
                    ) : (
                      <p className={styles.sectionSub}>
                        {locale === "dk" ? "Tilføj lookalikes (SEO-guld)." : "Add look-alikes (SEO gold)."}
                      </p>
                    )}
                  </section>
                );
              }

              if (key === "use") {
                return (
                  <section key={key} id="use" className={styles.section}>
                    <h2 className={styles.sectionTitle}>{locale === "dk" ? "Brug" : "Use"}</h2>
                    {t?.usage_notes ? (
                      <div className={styles.paragraph}>
                        <p>{t.usage_notes}</p>
                      </div>
                    ) : (
                      <p className={styles.sectionSub}>{locale === "dk" ? "Tilføj usage_notes." : "Add usage_notes."}</p>
                    )}
                  </section>
                );
              }

              // safety
              return (
                <section key={key} id="safety" className={styles.section}>
                  <h2 className={styles.sectionTitle}>{locale === "dk" ? "Sikkerhed" : "Safety"}</h2>
                  {t?.safety_notes ? (
                    <div className={styles.callout}>
                      <p className={styles.calloutText}>{t.safety_notes}</p>
                    </div>
                  ) : (
                    <p className={styles.sectionSub}>
                      {locale === "dk" ? "Tilføj safety_notes. Vær tydelig." : "Add safety_notes. Be explicit."}
                    </p>
                  )}
                </section>
              );
            })}
          </div>

          <div className={styles.footerMeta}>
            {locale === "dk" ? "Sidst opdateret:" : "Last updated:"}{" "}
            {t?.updated_at ? new Date(t.updated_at).toISOString().slice(0, 10) : "—"}
          </div>
        </section>
      </div>
    </main>
  );
}
