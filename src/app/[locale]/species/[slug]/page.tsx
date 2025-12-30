import Link from "next/link"; 
import { notFound } from "next/navigation";
import Script from "next/script";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./SpeciesPage.module.css";

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

function currentMonthUTC() {
  return new Date().getUTCMonth() + 1;
}

function countryForLocale(locale: string) {
  // MVP: Danmark, men klar til udvidelse senere
  return "DK";
}

function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
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
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "warn";
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>{title}</h2>
      <div className={`${styles.card} ${tone === "warn" ? styles.cardWarn : ""}`}>
        {children}
      </div>
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
  const month = currentMonthUTC();

  // midlertidigt: land = locale
const country = countryForLocale(locale);

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

  // Related species (samme land/region, i sæson nu)
  let related: Array<{ slug: string; name: string; confidence: number }> = [];
  if (inSeasonNow) {
    const { data: relSeas } = await supabase
      .from("seasonality")
      .select("species_id, confidence, month_from, month_to")
      .eq("country", country)
      .eq("region", "");

    const uniq = new Map<string, number>();
    for (const r of relSeas ?? []) {
      const a = r.month_from as number;
      const b = r.month_to as number;
      if (!isInSeason(month, a, b)) continue;
      const id = r.species_id as string;
      if (id === sp.id) continue;
      uniq.set(id, Math.max(uniq.get(id) ?? 0, (r.confidence as number) ?? 0));
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
    <main className={styles.wrap}>
      <Script id="species-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* Sticky quick bar */}
      <div className={styles.sticky}>
        <div className={styles.stickyTop}>
          <Link className={styles.back} href={`/${locale}/species`}>
            ← {locale === "dk" ? "Arter" : "Species"}
          </Link>

          <span className={`${styles.badge} ${inSeasonNow ? styles.badgeGood : ""}`}>
            {inSeasonNow
              ? locale === "dk"
                ? "I sæson nu"
                : "In season now"
              : locale === "dk"
              ? "Ikke i sæson"
              : "Out of season"}
            {conf !== null ? ` · ${conf}%` : ""}
          </span>
        </div>

        <div className={styles.chips}>
          <span className={styles.chip}>
            {locale === "dk" ? "Sæson:" : "Season:"}{" "}
            {seasonText ? seasonText : locale === "dk" ? "ukendt" : "unknown"}
          </span>

          <Link className={styles.chipLink} href={`/${locale}/season`}>
            {locale === "dk" ? "Sæson" : "Season"}
          </Link>

          <Link className={styles.chipLink} href={`/${locale}/guides/safety-basics`}>
            {locale === "dk" ? "Sikkerhed" : "Safety"}
          </Link>

          <Link className={styles.chipLink} href={`/${locale}/guides/lookalikes`}>
            {locale === "dk" ? "Forvekslinger" : "Look-alikes"}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <header className={styles.hero}>
        <h1 className={styles.h1}>{name}</h1>
        <div className={styles.meta}>
          {scientific ? <em>{scientific}</em> : null}
          {scientific ? <span className={styles.dot}>·</span> : null}
          <span>{group}</span>
        </div>

        {tr?.short_description ? (
          <p className={styles.sub}>{tr.short_description}</p>
        ) : (
          <p className={styles.sub}>
            {locale === "dk"
              ? "Tilføj short_description i species_translations."
              : "Add short_description in species_translations."}
          </p>
        )}

        {from && to ? (
          <div className={styles.monthRow}>
            <div className={styles.monthLabel}>
              {locale === "dk" ? "I sæson i:" : "In season in:"}
            </div>
            <div className={styles.monthChips}>
              {monthsBetween(from, to).map((m) => (
                <Link
                  key={m}
                  className={styles.monthChip}
                  href={`/${locale}/season/${MONTH_NUM_TO_SLUG[m]}`}
                >
                  {monthName(locale, m)}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <Section title={locale === "dk" ? "Identifikation" : "Identification"}>
        {tr?.identification ? (
          <div className={styles.textBlock}>{tr.identification}</div>
        ) : (
          <p className={styles.pMuted}>
            {locale === "dk"
              ? "Tilføj identification i species_translations."
              : "Add identification in species_translations."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Forvekslinger" : "Look-alikes"}>
        {tr?.lookalikes ? (
          <div className={styles.textBlock}>{tr.lookalikes}</div>
        ) : (
          <p className={styles.pMuted}>
            {locale === "dk"
              ? "Tilføj lookalikes (SEO-guld)."
              : "Add look-alikes (SEO gold)."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Brug" : "Use"}>
        {tr?.usage_notes ? (
          <div className={styles.textBlock}>{tr.usage_notes}</div>
        ) : (
          <p className={styles.pMuted}>
            {locale === "dk"
              ? "Tilføj usage_notes."
              : "Add usage_notes."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Sikkerhed" : "Safety"} tone="warn">
        {tr?.safety_notes ? (
          <div className={styles.textBlock}>{tr.safety_notes}</div>
        ) : (
          <p className={styles.pMuted}>
            {locale === "dk"
              ? "Tilføj safety_notes. Vær tydelig."
              : "Add safety_notes. Be explicit."}
          </p>
        )}
      </Section>

      <section className={styles.section}>
        <h2 className={styles.h2}>
          {locale === "dk" ? "Relaterede (i sæson nu)" : "Related (in season now)"}
        </h2>

        {related.length ? (
          <div className={styles.relatedGrid}>
            {related.map((r) => (
              <Link key={r.slug} className={styles.relatedCard} href={`/${locale}/species/${r.slug}`}>
                <div className={styles.relatedName}>{r.name}</div>
                <div className={styles.relatedMeta}>
                  {locale === "dk" ? "Match" : "Match"} · {r.confidence}%
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.pMuted}>
            {locale === "dk"
              ? "Ingen relaterede endnu."
              : "No related yet."}
          </p>
        )}
      </section>

      <p className={styles.updated}>
        {locale === "dk" ? "Sidst opdateret:" : "Last updated:"}{" "}
        {tr?.updated_at ? new Date(tr.updated_at).toISOString().slice(0, 10) : "—"}
      </p>
    </main>
  );
}
