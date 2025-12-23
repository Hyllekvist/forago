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
  return new Date().getUTCMonth() + 1;
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
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.h2}>{title}</h2>
        <div className={styles.body}>{children}</div>
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
  const country = locale; // dk/en for now

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

  // Related species: other species also in season now
  let related: Array<{ slug: string; name: string; confidence: number }> = [];
  if (inSeasonNow) {
    const { data: relSeas } = await supabase
      .from("seasonality")
      .select("species_id, confidence, month_from, month_to")
      .eq("country", country)
      .eq("region", "");

    const relIds =
      (relSeas ?? [])
        .filter((r: any) => isInSeason(month, r.month_from as number, r.month_to as number))
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

  const shortMissing =
    !tr?.short_description &&
    (locale === "dk"
      ? "Tilføj short_description i species_translations for at gøre siden rankable."
      : "Add short_description in species_translations to make this page rankable.");

  return (
    <main className={styles.wrap}>
      <Script id="species-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

<header className={styles.header}>
  {/* Sticky top (mobile-first) */}
  <div className={styles.sticky}>
    <div className={styles.stickyRow}>
      <Link className={styles.back} href={`/${locale}/species`}>
        ← {locale === "dk" ? "Arter" : "Species"}
      </Link>

      <div className={styles.stickyTitleWrap}>
        <div className={styles.stickyTitle}>{name}</div>
        <div className={styles.stickyMeta}>
          {inSeasonNow
            ? locale === "dk"
              ? "I sæson nu"
              : "In season now"
            : locale === "dk"
            ? "Ikke i sæson"
            : "Not in season"}
          {conf !== null ? ` · ${conf}%` : ""}
        </div>
      </div>

      <Link className={styles.stickyIcon} href={`/${locale}/season`} aria-label="Season">
        ↗
      </Link>
    </div>

    <div className={styles.stickyChips}>
      <span className={styles.chip}>
        {locale === "dk" ? "Sæson:" : "Season:"}{" "}
        {seasonText ? seasonText : locale === "dk" ? "ukendt" : "unknown"}
      </span>

      <Link className={styles.chipLink} href={`/${locale}/guides/safety-basics`}>
        {locale === "dk" ? "Sikkerhed" : "Safety"}
      </Link>

      <Link className={styles.chipLink} href={`/${locale}/guides/lookalikes`}>
        {locale === "dk" ? "Forvekslinger" : "Look-alikes"}
      </Link>
    </div>
  </div>

  {/* Non-sticky hero (desktop / full) */}
  <div className={styles.hero}>
    <div className={styles.heroMain}>
      <h1 className={styles.h1}>{name}</h1>

      <div className={styles.meta}>
        {scientific ? <em>{scientific}</em> : null}
        {scientific ? <span className={styles.dot}>·</span> : null}
        <span className={styles.group}>{group}</span>
      </div>

      <p className={styles.sub}>
        {tr?.short_description
          ? tr.short_description
          : locale === "dk"
          ? "Tilføj short_description i species_translations for at gøre siden rankable."
          : "Add short_description in species_translations to make this page rankable."}
      </p>
    </div>

    <div className={styles.heroSide}>
      {inSeasonNow ? (
        <span className={`${styles.badge} ${styles.badgeSeason}`}>
          {locale === "dk" ? "I sæson nu" : "In season now"}
          {conf !== null ? ` · ${conf}%` : ""}
        </span>
      ) : (
        <span className={styles.badge}>
          {locale === "dk" ? "Ikke i sæson" : "Not in season"}
          {conf !== null ? ` · ${conf}%` : ""}
        </span>
      )}
    </div>
  </div>

  {/* Month chips (ikke sticky) */}
  {from && to ? (
    <div className={styles.monthRow}>
      <span className={styles.monthLabel}>
        {locale === "dk" ? "I sæson i:" : "In season in:"}
      </span>

      <div className={styles.monthChips}>
        {monthsBetween(from, to)
          .slice(0, 8)
          .map((m) => (
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
          <div className={styles.pre}>{tr.identification}</div>
        ) : (
          <p className={styles.p}>
            {locale === "dk"
              ? "Tilføj identification i species_translations (bullet-liste med kendetegn + habitat)."
              : "Add identification in species_translations (bullets: features + habitat)."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Forvekslinger" : "Look-alikes"}>
        {tr?.lookalikes ? (
          <div className={styles.pre}>{tr.lookalikes}</div>
        ) : (
          <p className={styles.p}>
            {locale === "dk"
              ? "Tilføj lookalikes (det er en af jeres største SEO-vindere)."
              : "Add look-alikes (one of your biggest SEO wins)."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Brug" : "Use"}>
        {tr?.usage_notes ? (
          <div className={styles.pre}>{tr.usage_notes}</div>
        ) : (
          <p className={styles.p}>
            {locale === "dk"
              ? "Tilføj usage_notes (3–5 konkrete anvendelser + tilberedning)."
              : "Add usage_notes (3–5 concrete uses + prep)."}
          </p>
        )}
      </Section>

      <Section title={locale === "dk" ? "Sikkerhed" : "Safety"}>
        {tr?.safety_notes ? (
          <div className={`${styles.pre} ${styles.safety}`}>{tr.safety_notes}</div>
        ) : (
          <p className={styles.p}>
            {locale === "dk"
              ? "Tilføj safety_notes. Vær tydelig: aldrig spise noget man ikke kan identificere 100%."
              : "Add safety_notes. Be explicit: never eat what you can’t ID with certainty."}
          </p>
        )}
      </Section>

      <section className={styles.section}>
        <div className={styles.card}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.h2}>
              {locale === "dk"
                ? "Relaterede arter (i sæson nu)"
                : "Related species (in season now)"}
            </h2>
          </div>

          {related.length ? (
            <div className={styles.relatedGrid}>
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${locale}/species/${r.slug}`}
                  className={styles.relatedCard}
                >
                  <div className={styles.relatedName}>{r.name}</div>
                  <div className={styles.relatedMeta}>
                    {locale === "dk" ? "Sæson match" : "Season match"} · {r.confidence}%
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.p}>
              {locale === "dk"
                ? "Ingen relaterede arter endnu."
                : "No related species yet."}
            </p>
          )}
        </div>
      </section>

      <p className={styles.updated}>
        {locale === "dk" ? "Sidst opdateret:" : "Last updated:"}{" "}
        {tr?.updated_at ? new Date(tr.updated_at).toISOString().slice(0, 10) : "—"}
      </p>
    </main>
  );
}