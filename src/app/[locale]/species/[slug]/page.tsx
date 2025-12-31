import Link from "next/link";
import Script from "next/script"; 
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./SpeciesPage.module.css";
import FieldHero from "./FieldHero";

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
  const dk = ["", "januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
  const en = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
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

/** Try to extract 3-6 “field cues” from identification text without AI */
function cuesFromText(locale: Locale, txt?: string | null) {
  const fallback =
    locale === "dk"
      ? ["Se på hat/kant", "Tjek lameller/porer", "Tjek stok og ring", "Lugt (hvis relevant)", "Habitat: skov/eng/kant"]
      : ["Check cap/edge", "Check gills/pores", "Check stem and ring", "Smell (if relevant)", "Habitat: forest/meadow/edge"];

  const s = (txt ?? "").trim();
  if (!s) return fallback;

  const lines = s
    .split(/\r?\n+/)
    .map((x) => x.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => l.length >= 8 && l.length <= 110).slice(0, 6);
  return bullets.length ? bullets : fallback;
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

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }) {
  const { locale: locParam, slug } = params;
  if (!isLocale(locParam)) return { title: "Forago" };

  const supabase = await supabaseServer();
  const { data: sp } = await supabase.from("species").select("id, slug").eq("slug", slug).maybeSingle();
  if (!sp) return { title: "Forago" };

  const { data: tr } = await supabase
    .from("species_translations")
    .select("common_name, short_description")
    .eq("species_id", sp.id)
    .eq("locale", locParam)
    .maybeSingle();

  const name = tr?.common_name || slug;
  return {
    title: `${name} — Forago`,
    description:
      tr?.short_description ||
      (locParam === "dk"
        ? `Lær at identificere ${name} i marken. Sæson, forvekslinger og sikkerhed.`
        : `Identify ${name} in the field. Season, look-alikes and safety.`),
    alternates: { canonical: `/${locParam}/species/${slug}` },
  };
}

export default async function SpeciesPage({ params }: { params: { locale: string; slug: string } }) {
  const { locale: locParam, slug } = params;
  if (!isLocale(locParam)) return notFound();
  const locale = locParam;

  const supabase = await supabaseServer();
  const month = currentMonthLocal();
  const country = countryForLocale(locale);

  const { data: sp, error: spErr } = await supabase
    .from("species")
    .select("id, slug, primary_group, scientific_name, created_at, image_path, image_updated_at, is_poisonous, danger_level")
    .eq("slug", slug)
    .maybeSingle();

  if (spErr) throw spErr;
  if (!sp) return notFound();
  const species = sp as SpeciesRow;

  const { data: tr, error: trErr } = await supabase
    .from("species_translations")
    .select("common_name, short_description, identification, lookalikes, usage_notes, safety_notes, updated_at")
    .eq("species_id", species.id)
    .eq("locale", locale)
    .maybeSingle();

  if (trErr) throw trErr;
  const t = (tr ?? null) as TrRow | null;

  const name = t?.common_name || species.slug;
  const scientific = species.scientific_name || "";
  const group = species.primary_group || "unknown";

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
  const seasonText = from && to ? seasonLabel(locale, from, to) : (locale === "dk" ? "ukendt" : "unknown");

  const imageUrl =
    species.image_path
      ? supabase.storage.from("species").getPublicUrl(species.image_path).data.publicUrl +
        `?v=${encodeURIComponent(String(species.image_updated_at ?? species.created_at))}`
      : null;

  const danger =
    species.is_poisonous || (t?.safety_notes?.toLowerCase().includes("gift") ?? false);

  const dangerLabel =
    locale === "dk"
      ? species.danger_level >= 2
        ? "MEGET GIFTIG"
        : "GIFTIG"
      : species.danger_level >= 2
      ? "HIGHLY TOXIC"
      : "TOXIC";

  let totalFinds = 0;
  let finds30d = 0;

  const statsRes = await supabase.rpc("species_find_stats", { p_species_id: species.id });
  if (!statsRes.error && Array.isArray(statsRes.data) && statsRes.data[0]) {
    totalFinds = Number(statsRes.data[0].total_finds ?? 0);
    finds30d = Number(statsRes.data[0].finds_30d ?? 0);
  }

  const cues = cuesFromText(locale, t?.identification);

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

  return (
    <main className={styles.page}>
      <Script id="species-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* sticky field chrome */}
      <div className={`${styles.chrome} surfaceGlass`}>
        <Link className={`${styles.back} pressable`} href={`/${locale}/species`}>
          <span aria-hidden="true">←</span>
          <span>{locale === "dk" ? "Arter" : "Species"}</span>
        </Link>

        <div className={styles.chromeRight}>
          <Link className={`${styles.chromeBtn} hoverable`} href={`/${locale}/season`}>
            {locale === "dk" ? "Sæson" : "Season"}
          </Link>
          <Link className={`${styles.chromeBtn} ${styles.chromeBtnPrimary} hoverable`} href={`/${locale}/log`}>
            {locale === "dk" ? "Gem" : "Save"}
          </Link>
        </div>
      </div>

      {/* FIELD VIEWER HERO (image-first) */}
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

      {/* Field cues: scannable */}
      <section className={styles.cues}>
        <div className={styles.cuesHead}>
          <h2 className="h3">{locale === "dk" ? "Hurtig identifikation" : "Quick identification"}</h2>
          <p className="meta">{locale === "dk" ? "Fokus på detaljer du kan tjekke på stedet." : "Field-check details you can verify on site."}</p>
        </div>

        <div className={`${styles.cuesCard} surface`}>
          <ol className={styles.cueList}>
            {cues.map((c, i) => (
              <li key={`${i}-${c}`} className={styles.cueItem}>
                <span className={styles.cueDot} aria-hidden="true" />
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Main sections - tighter, more “field manual” */}
      <section className={styles.sections}>
        <div className={styles.block}>
          <h2 className="h3">{locale === "dk" ? "Identifikation" : "Identification"}</h2>
          <div className="surface">
            <div className={styles.textBlock}>
              {t?.identification || (locale === "dk" ? "Tilføj identification i species_translations." : "Add identification in species_translations.")}
            </div>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.block}>
            <h2 className="h3">{locale === "dk" ? "Forvekslinger" : "Look-alikes"}</h2>
            <div className={`surface ${danger ? styles.warnSurface : ""}`}>
              <div className={styles.textBlock}>
                {t?.lookalikes || (locale === "dk" ? "Tilføj lookalikes." : "Add look-alikes.")}
              </div>
            </div>
          </div>

          <div className={styles.block}>
            <h2 className="h3">{locale === "dk" ? "Sikkerhed" : "Safety"}</h2>
            <div className={`surface ${styles.warnSurface}`}>
              <div className={styles.textBlock}>
                {t?.safety_notes || (locale === "dk" ? "Tilføj safety_notes. Vær tydelig." : "Add safety_notes. Be explicit.")}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.block}>
          <h2 className="h3">{locale === "dk" ? "Brug" : "Use"}</h2>
          <div className="surface">
            <div className={styles.textBlock}>
              {t?.usage_notes || (locale === "dk" ? "Tilføj usage_notes." : "Add usage_notes.")}
            </div>
          </div>
        </div>
      </section>

      <p className={styles.updated}>
        {locale === "dk" ? "Sidst opdateret:" : "Last updated:"}{" "}
        {t?.updated_at ? new Date(t.updated_at).toISOString().slice(0, 10) : "—"}
      </p>
    </main>
  );
}