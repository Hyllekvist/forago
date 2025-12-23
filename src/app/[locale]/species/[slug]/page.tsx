import { notFound } from "next/navigation";
import Script from "next/script";
import { supabaseServer } from "@/lib/supabase/server";

import styles from "./SpeciesPage.module.css";
import { SpeciesHeader } from "./SpeciesHeader";
import { StickySpeciesBar } from "./StickySpeciesBar";
import { RichText } from "./RichText";

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
  return new Date().getUTCMonth() + 1; // 1-12
}

function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

function seasonLabel(locale: Locale, from: number, to: number) {
  if (from === to) return monthName(locale, from);
  return `${monthName(locale, from)} – ${monthName(locale, to)}`;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) return { title: "Forago" };

  const supabase = supabaseServer();

  const { data: sp } = await supabase
    .from("species")
    .select("id, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!sp) return { title: "Forago" };

  const { data: tr } = await supabase
    .from("species_translations")
    .select("common_name, short_description")
    .eq("species_id", sp.id)
    .eq("locale", params.locale)
    .maybeSingle();

  const name = tr?.common_name || sp.slug;

  return {
    title: `${name} — Forago`,
    description:
      tr?.short_description ||
      (params.locale === "dk"
        ? `Lær at genkende og bruge ${name}.`
        : `Learn how to identify and use ${name}.`),
    alternates: { canonical: `/${params.locale}/species/${sp.slug}` },
  };
}

export default async function SpeciesPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) return notFound();
  const locale = params.locale;

  const supabase = supabaseServer();

  const { data: sp, error: spErr } = await supabase
    .from("species")
    .select("id, slug, scientific_name, primary_group, created_at")
    .eq("slug", params.slug)
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

  // Seasonality (country = locale, region = '')
  const { data: seas, error: seasErr } = await supabase
    .from("seasonality")
    .select("month_from, month_to, confidence")
    .eq("species_id", sp.id)
    .eq("country", locale)
    .eq("region", "")
    .maybeSingle();

  if (seasErr) throw seasErr;

  const from = (seas?.month_from as number | undefined) ?? undefined;
  const to = (seas?.month_to as number | undefined) ?? undefined;
  const confidence = (seas?.confidence as number | null | undefined) ?? null;

  const monthNow = currentMonthUTC();
  const inSeasonNow =
    typeof from === "number" && typeof to === "number"
      ? isInSeason(monthNow, from, to)
      : false;

  const seasonText =
    typeof from === "number" && typeof to === "number"
      ? seasonLabel(locale, from, to)
      : null;

  const monthLinks =
    typeof from === "number" && typeof to === "number"
      ? monthsBetween(from, to).map((m) => ({
          label: monthName(locale, m),
          href: `/${locale}/season/${MONTH_NUM_TO_SLUG[m]}`,
        }))
      : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    author: { "@type": "Organization", name: "Forago" },
    publisher: { "@type": "Organization", name: "Forago" },
    datePublished: sp.created_at,
    dateModified: tr?.updated_at || sp.created_at,
  };

  return (
    <main className={styles.wrap}>
      <Script id="species-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <StickySpeciesBar
        locale={locale}
        backHref={`/${locale}/species`}
        inSeasonNow={inSeasonNow}
        confidence={confidence}
        seasonText={seasonText}
      />

      <SpeciesHeader
        locale={locale}
        backHref={`/${locale}/species`}
        name={name}
        scientific={sp.scientific_name || ""}
        group={sp.primary_group || "plant"}
        shortDescription={tr?.short_description || ""}
        seasonText={seasonText}
        inSeasonNow={inSeasonNow}
        confidence={confidence}
        monthLinks={monthLinks}
      />

      <section className={styles.section}>
        <h2 className={styles.h2}>
          {locale === "dk" ? "Identifikation" : "Identification"}
        </h2>
        <div className={styles.card}>
          {tr?.identification ? (
            <RichText text={tr.identification} />
          ) : (
            <p className={styles.p}>
              {locale === "dk"
                ? "Tilføj identifikation i databasen."
                : "Add identification in database."}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>
          {locale === "dk" ? "Forvekslinger" : "Look-alikes"}
        </h2>
        <div className={styles.card}>
          {tr?.lookalikes ? (
            <RichText text={tr.lookalikes} />
          ) : (
            <p className={styles.p}>
              {locale === "dk" ? "Tilføj forvekslinger." : "Add look-alikes."}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>{locale === "dk" ? "Brug" : "Use"}</h2>
        <div className={styles.card}>
          {tr?.usage_notes ? (
            <RichText text={tr.usage_notes} />
          ) : (
            <p className={styles.p}>
              {locale === "dk" ? "Tilføj brug." : "Add usage."}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>
          {locale === "dk" ? "Sikkerhed" : "Safety"}
        </h2>
        <div className={styles.card}>
          {tr?.safety_notes ? (
            <RichText text={tr.safety_notes} variant="callout" />
          ) : (
            <p className={styles.p}>
              {locale === "dk"
                ? "Tilføj sikkerhedsnoter."
                : "Add safety notes."}
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