import Link from "next/link";
import Image from "next/image";
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

function currentMonthLocal() {
  return new Date().getMonth() + 1;
}

function countryForLocale(_locale: string) {
  // DB bruger lowercase
  return "dk";
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

function fmtCompact(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("da-DK", { notation: "compact" }).format(n);
}

function groupLabel(locale: Locale, primaryGroup: string | null | undefined) {
  const g = String(primaryGroup ?? "").toLowerCase();
  if (locale === "dk") {
    if (g === "mushroom" || g === "fungus") return "Svamp";
    if (g === "berry") return "Bær";
    if (g === "plant") return "Plante";
    return "Art";
  }
  if (g === "mushroom" || g === "fungus") return "Mushroom";
  if (g === "berry") return "Berry";
  if (g === "plant") return "Plant";
  return "Species";
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
  const group = groupLabel(locale, species.primary_group);

  // seasonality
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
  const seasonText = from && to ? seasonLabel(locale, from, to) : null;

  // hero image url (cache-bust with updated_at)
  const imageUrl =
    species.image_path
      ? supabase.storage
          .from("species")
          .getPublicUrl(species.image_path).data.publicUrl +
        `?v=${encodeURIComponent(String(species.image_updated_at ?? species.created_at))}`
      : null;

  // intelligence
  let totalFinds = 0;
  let finds30d = 0;
  let hotspots: Array<{ area: string; finds: number }> = [];

  const [statsRes, hotRes] = await Promise.all([
    supabase.rpc("species_find_stats", { p_species_id: species.id, p_country: country }),
    supabase.rpc("species_hotspots", { p_species_id: species.id, p_country: country, p_limit: 5 }),
  ]);

  if (!statsRes.error && Array.isArray(statsRes.data) && statsRes.data[0]) {
    totalFinds = Number(statsRes.data[0].total_finds ?? 0);
    finds30d = Number(statsRes.data[0].finds_30d ?? 0);
  }

  if (!hotRes.error && Array.isArray(hotRes.data)) {
    hotspots = hotRes.data.map((r: any) => ({
      area: String(r.area ?? (locale === "dk" ? "Ukendt område" : "Unknown area")),
      finds: Number(r.finds ?? 0),
    }));
  }

  const danger =
    Boolean(species.is_poisonous) ||
    Boolean((t?.safety_notes ?? "").toLowerCase().includes("gift"));

  const dangerLabel =
    locale === "dk"
      ? (species.danger_level ?? 1) >= 2
        ? "MEGET GIFTIG"
        : "GIFTIG"
      : (species.danger_level ?? 1) >= 2
      ? "HIGHLY TOXIC"
      : "TOXIC";

  // Related species only when current species is in season (keeps list relevant)
  let related: Array<{ slug: string; name: string; confidence: number; imageUrl?: string | null }> = [];
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
      if (id === species.id) continue;
      uniq.set(id, Math.max(uniq.get(id) ?? 0, (r.confidence as number) ?? 0));
    }

    const ids = Array.from(uniq.keys());
    if (ids.length) {
      const { data: relSpecies } = await supabase
        .from("species")
        .select("id, slug, image_path, image_updated_at, created_at")
        .in("id", ids);

      const { data: relTr } = await supabase
        .from("species_translations")
        .select("species_id, common_name")
        .eq("locale", locale)
        .in("species_id", ids);

      const trMap = new Map((relTr ?? []).map((x: any) => [x.species_id as string, x.common_name as string]));
      const spMap = new Map((relSpecies ?? []).map((x: any) => [x.id as string, x]));

      related = ids
        .map((id) => {
          const s = spMap.get(id);
          const rimg =
            s?.image_path
              ? supabase.storage.from("species").getPublicUrl(s.image_path).data.publicUrl +
                `?v=${encodeURIComponent(String(s.image_updated_at ?? s.created_at))}`
              : null;

          return {
            slug: s?.slug || "",
            name: trMap.get(id) || s?.slug || "unknown",
            confidence: uniq.get(id) || 0,
            imageUrl: rimg,
          };
        })
        .filter((x) => x.slug)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 6);
    }
  }

  // schema.org
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

  const topHot = hotspots[0]?.area ?? "—";
  const topHotCount = hotspots[0]?.finds ?? 0;

  return (
    <main className={styles.wrap}>
      <Script id="species-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* Top bar */}
      <div className={styles.topbar}>
        <Link className={styles.back} href={`/${locale}/species`}>
          ← {locale === "dk" ? "Arter" : "Species"}
        </Link>

        <div className={styles.topbarRight}>
          <Link className={styles.topAction} href={`/${locale}/season`}>
            {locale === "dk" ? "Sæson" : "Season"}
          </Link>
          <Link className={styles.topAction} href={`/${locale}/log`}>
            {locale === "dk" ? "Gem" : "Save"}
          </Link>
        </div>
      </div>

      {/* HERO: image is center-stage (contain), chips float on top */}
      <header className={styles.hero}>
        <div className={styles.media}>
          <div className={styles.mediaBackdrop} aria-hidden="true" />

          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 900px"
              className={styles.mediaImg}
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          ) : (
            <div className={styles.mediaFallback} aria-hidden="true">
              <span>{locale === "dk" ? "Ingen billede endnu" : "No image yet"}</span>
            </div>
          )}

          {/* Floating chips */}
          {danger ? (
            <span className={styles.chipDanger} aria-label={dangerLabel}>
              ☠ {dangerLabel}
            </span>
          ) : null}

          <span className={`${styles.chipSeason} ${inSeasonNow ? styles.chipGood : styles.chipDim}`}>
            {inSeasonNow
              ? locale === "dk"
                ? "I sæson nu"
                : "In season now"
              : locale === "dk"
              ? "Ikke i sæson"
              : "Out of season"}
            {conf !== null ? ` · ${Math.round(conf)}%` : ""}
          </span>

          <span className={styles.chipGroup}>{group}</span>
        </div>

        <div className={styles.heroBody}>
          <h1 className={styles.h1}>{name}</h1>

          <div className={styles.metaRow}>
            {scientific ? <em className={styles.scientific}>{scientific}</em> : null}
            {scientific ? <span className={styles.dot}>·</span> : null}
            <span className={styles.seasonInline}>
              {locale === "dk" ? "Sæson:" : "Season:"}{" "}
              <strong>{seasonText ?? (locale === "dk" ? "ukendt" : "unknown")}</strong>
            </span>
          </div>

          <p className={styles.sub}>
            {t?.short_description ||
              (locale === "dk"
                ? "Tilføj short_description i species_translations."
                : "Add short_description in species_translations.")}
          </p>

          {/* Actions as navigation (not primary CTAs) */}
          <div className={styles.navTabs} role="tablist" aria-label="Sections">
            <a className={styles.tab} href="#identification">
              {locale === "dk" ? "Identifikation" : "Identification"}
            </a>
            <a className={`${styles.tab} ${danger ? styles.tabWarn : ""}`} href="#safety">
              {locale === "dk" ? "Sikkerhed" : "Safety"}
            </a>
            <a className={styles.tab} href="#lookalikes">
              {locale === "dk" ? "Forvekslinger" : "Look-alikes"}
            </a>
          </div>

          {/* Over-fold intelligence */}
          <div className={styles.facts}>
            <div className={styles.fact}>
              <div className={styles.factLabel}>{locale === "dk" ? "Fund" : "Finds"}</div>
              <div className={styles.factValue}>{fmtCompact(totalFinds)}</div>
              <div className={styles.factHint}>{locale === "dk" ? "Total (community)" : "Total (community)"}</div>
            </div>

            <div className={styles.fact}>
              <div className={styles.factLabel}>{locale === "dk" ? "Seneste 30 dage" : "Last 30 days"}</div>
              <div className={styles.factValue}>{fmtCompact(finds30d)}</div>
              <div className={styles.factHint}>{locale === "dk" ? "Momentum" : "Momentum"}</div>
            </div>

            <div className={styles.fact}>
              <div className={styles.factLabel}>{locale === "dk" ? "Hotspot" : "Hotspot"}</div>
              <div className={styles.factValue}>{topHot}</div>
              <div className={styles.factHint}>
                {topHotCount ? `${fmtCompact(topHotCount)} ${locale === "dk" ? "fund" : "finds"}` : (locale === "dk" ? "Ingen data" : "No data")}
              </div>
            </div>
          </div>

          {/* Month chips */}
          {from && to ? (
            <div className={styles.monthRow}>
              <div className={styles.monthLabel}>{locale === "dk" ? "I sæson i:" : "In season in:"}</div>
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
        </div>
      </header>

      {/* Hotspots list (privacy-first) */}
      <section className={styles.section} aria-label="Intelligence">
        <div className={styles.sectionTop}>
          <h2 className={styles.h2}>{locale === "dk" ? "Hvor findes den mest?" : "Where is it found most?"}</h2>
          <p className={styles.sectionSub}>
            {locale === "dk"
              ? "Aggregeret community-data. Ingen præcise spots."
              : "Aggregated community data. No precise spots."}
          </p>
        </div>

        <div className={styles.panel}>
          {hotspots.length ? (
            <ol className={styles.hotList}>
              {hotspots.slice(0, 5).map((h, idx) => (
                <li key={`${h.area}-${idx}`} className={styles.hotRow}>
                  <span className={styles.hotRank}>{idx + 1}</span>
                  <span className={styles.hotArea}>{h.area}</span>
                  <span className={styles.hotCount}>{fmtCompact(h.finds)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.muted}>{locale === "dk" ? "Ingen data endnu." : "No data yet."}</div>
          )}
        </div>
      </section>

      {/* Content sections (danger pushes Safety earlier visually) */}
      <section id="safety" className={styles.section}>
        <h2 className={styles.h2}>{locale === "dk" ? "Sikkerhed" : "Safety"}</h2>
        <div className={`${styles.card} ${styles.cardWarn}`}>
          {t?.safety_notes ? (
            <div className={styles.textBlock}>{t.safety_notes}</div>
          ) : (
            <p className={styles.muted}>
              {locale === "dk" ? "Tilføj safety_notes. Vær tydelig." : "Add safety_notes. Be explicit."}
            </p>
          )}
        </div>
      </section>

      <section id="identification" className={styles.section}>
        <h2 className={styles.h2}>{locale === "dk" ? "Identifikation" : "Identification"}</h2>
        <div className={styles.card}>
          {t?.identification ? (
            <div className={styles.textBlock}>{t.identification}</div>
          ) : (
            <p className={styles.muted}>
              {locale === "dk" ? "Tilføj identification i species_translations." : "Add identification in species_translations."}
            </p>
          )}
        </div>
      </section>

      <section id="lookalikes" className={styles.section}>
        <h2 className={styles.h2}>{locale === "dk" ? "Forvekslinger" : "Look-alikes"}</h2>
        <div className={`${styles.card} ${danger ? styles.cardWarn : ""}`}>
          {t?.lookalikes ? (
            <div className={styles.textBlock}>{t.lookalikes}</div>
          ) : (
            <p className={styles.muted}>
              {locale === "dk" ? "Tilføj lookalikes (SEO-guld)." : "Add look-alikes (SEO gold)."}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>{locale === "dk" ? "Brug" : "Use"}</h2>
        <div className={styles.card}>
          {t?.usage_notes ? (
            <div className={styles.textBlock}>{t.usage_notes}</div>
          ) : (
            <p className={styles.muted}>{locale === "dk" ? "Tilføj usage_notes." : "Add usage_notes."}</p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTopRow}>
          <h2 className={styles.h2}>
            {locale === "dk" ? "Relaterede (i sæson nu)" : "Related (in season now)"}
          </h2>
          <Link className={styles.more} href={`/${locale}/season`}>
            {locale === "dk" ? "Se sæson →" : "See season →"}
          </Link>
        </div>

        {related.length ? (
          <div className={styles.relatedGrid}>
            {related.map((r) => (
              <Link key={r.slug} className={styles.relatedCard} href={`/${locale}/species/${r.slug}`}>
                <div className={styles.relatedMedia}>
                  {r.imageUrl ? (
                    <Image src={r.imageUrl} alt={r.name} width={360} height={240} className={styles.relatedImg} />
                  ) : (
                    <div className={styles.relatedPh} aria-hidden="true" />
                  )}
                </div>
                <div className={styles.relatedBody}>
                  <div className={styles.relatedName}>{r.name}</div>
                  <div className={styles.relatedMeta}>
                    {locale === "dk" ? "Match" : "Match"} · {r.confidence}%
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>{locale === "dk" ? "Ingen relaterede endnu." : "No related yet."}</p>
        )}
      </section>

      <p className={styles.updated}>
        {locale === "dk" ? "Sidst opdateret:" : "Last updated:"}{" "}
        {t?.updated_at ? new Date(t.updated_at).toISOString().slice(0, 10) : "—"}
      </p>
    </main>
  );
}