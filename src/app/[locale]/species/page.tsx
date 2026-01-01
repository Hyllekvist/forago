// src/app/[locale]/species/page.tsx
import Link from "next/link";
import Image from "next/image";
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

function countryForLocale(_locale: string) {
  return "dk";
}

function groupLabel(locale: Locale, g: string) {
  const v = (g || "").toLowerCase();
  if (locale === "dk") {
    if (v === "fungus") return "Svampe";
    if (v === "plant") return "Planter";
    if (v === "berry") return "Bær";
    if (v === "tree") return "Træer";
    return "Arter";
  }
  if (v === "fungus") return "Fungi";
  if (v === "plant") return "Plants";
  if (v === "berry") return "Berries";
  if (v === "tree") return "Trees";
  return "Species";
}

function fmtCompact(n: number, locale: Locale) {
  if (!Number.isFinite(n)) return "0";
  const l = locale === "dk" ? "da-DK" : "en-US";
  return new Intl.NumberFormat(l, { notation: "compact" }).format(n);
}

type SpeciesListRow = {
  id: string;
  slug: string;
  primary_group: string;
  image_path: string | null;
  image_updated_at: string | null;
  created_at: string;
  is_poisonous: boolean;
  danger_level: number;
};

type TrRow = {
  species_id: string;
  common_name: string | null;
  short_description: string | null;
};

export default async function SpeciesIndexPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { q?: string; group?: string };
}) {
  const locParam = params?.locale;
  if (!isLocale(locParam)) return notFound();
  const locale = locParam;

  const q = (searchParams?.q ?? "").trim();
  const group = (searchParams?.group ?? "").trim().toLowerCase();
  const country = countryForLocale(locale);

  const supabase = await supabaseServer();

  // Base species list
  let spQuery = supabase
    .from("species")
    .select("id, slug, primary_group, image_path, image_updated_at, created_at, is_poisonous, danger_level")
    .order("created_at", { ascending: false })
    .limit(120);

  if (group) spQuery = spQuery.eq("primary_group", group);

  const { data: spRows, error: spErr } = await spQuery;
  if (spErr) throw spErr;

  const rows = (spRows ?? []) as SpeciesListRow[];
  const ids = rows.map((r) => r.id);

  // Translations
  const { data: trRows, error: trErr } = await supabase
    .from("species_translations")
    .select("species_id, common_name, short_description")
    .eq("locale", locale)
    .in("species_id", ids);

  if (trErr) throw trErr;

  const trMap = new Map<string, TrRow>();
  for (const t of (trRows ?? []) as any[]) {
    trMap.set(String(t.species_id), {
      species_id: String(t.species_id),
      common_name: t.common_name ?? null,
      short_description: t.short_description ?? null,
    });
  }

  // Optional: stats RPC
  let statsMap = new Map<string, { total: number; d30: number }>();
  const statsRes = await supabase.rpc("species_find_stats_many", {
    p_species_ids: ids,
    p_country: country,
  });
  if (!statsRes.error && Array.isArray(statsRes.data)) {
    for (const r of statsRes.data as any[]) {
      const sid = String(r.species_id);
      statsMap.set(sid, {
        total: Number(r.total_finds ?? 0),
        d30: Number(r.finds_30d ?? 0),
      });
    }
  }

  // Filter
  const filtered = q
    ? rows.filter((r) => {
        const tr = trMap.get(r.id);
        const name = (tr?.common_name ?? r.slug).toLowerCase();
        const desc = (tr?.short_description ?? "").toLowerCase();
        const slug = (r.slug ?? "").toLowerCase();
        const qq = q.toLowerCase();
        return name.includes(qq) || desc.includes(qq) || slug.includes(qq);
      })
    : rows;

  // Grouping
  const groups = new Map<string, SpeciesListRow[]>();
  for (const r of filtered) {
    const k = (r.primary_group || "other").toLowerCase();
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const groupKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  function imgUrl(r: SpeciesListRow) {
    if (!r.image_path) return null;
    return (
      supabase.storage.from("species").getPublicUrl(r.image_path).data.publicUrl +
      `?v=${encodeURIComponent(String(r.image_updated_at ?? r.created_at))}`
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleBlock}>
            <h1 className={styles.h1}>{locale === "dk" ? "Arter" : "Species"}</h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Find arter, lær kendetegn, og se community-intelligence."
                : "Browse species, learn identification, and see community intelligence."}
            </p>
          </div>

          <Link className={styles.cta} href={`/${locale}/season`}>
            {locale === "dk" ? "Sæson" : "Season"}
          </Link>
        </div>

        <form className={styles.search} action="" method="get">
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            placeholder={locale === "dk" ? "Søg (fx rørhat, brændenælde…)" : "Search (e.g., chanterelle…)"}
            defaultValue={q}
            aria-label={locale === "dk" ? "Søg arter" : "Search species"}
          />

          <select
            className={styles.searchSelect}
            name="group"
            defaultValue={group}
            aria-label={locale === "dk" ? "Vælg gruppe" : "Choose group"}
          >
            <option value="">{locale === "dk" ? "Alle grupper" : "All groups"}</option>
            <option value="fungus">{locale === "dk" ? "Svampe" : "Fungi"}</option>
            <option value="plant">{locale === "dk" ? "Planter" : "Plants"}</option>
            <option value="berry">{locale === "dk" ? "Bær" : "Berries"}</option>
            <option value="tree">{locale === "dk" ? "Træer" : "Trees"}</option>
          </select>

          <button className={styles.searchBtn} type="submit">
            {locale === "dk" ? "Søg" : "Search"}
          </button>
        </form>

        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiK}>{locale === "dk" ? "Resultater" : "Results"}</div>
            <div className={styles.kpiV}>{fmtCompact(filtered.length, locale)}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiK}>{locale === "dk" ? "Grupper" : "Groups"}</div>
            <div className={styles.kpiV}>{fmtCompact(groupKeys.length, locale)}</div>
          </div>
        </div>
      </header>

      <section className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>{locale === "dk" ? "Ingen matches" : "No matches"}</div>
            <div className={styles.emptySub}>
              {locale === "dk" ? "Prøv en anden søgning eller fjern filter." : "Try another query or clear filters."}
            </div>
          </div>
        ) : (
          groupKeys.map((g) => {
            const items = groups.get(g) ?? [];
            return (
              <div key={g} className={styles.groupBlock}>
                <div className={styles.groupHead}>
                  <h2 className={styles.h2}>{groupLabel(locale, g)}</h2>
                  <div className={styles.groupCount}>{fmtCompact(items.length, locale)}</div>
                </div>

                <div className={styles.grid}>
                  {items.map((r) => {
                    const tr = trMap.get(r.id);
                    const name = tr?.common_name || r.slug;
                    const desc = tr?.short_description || "";
                    const img = imgUrl(r);

                    const danger = r.is_poisonous || (r.danger_level ?? 0) > 0;
                    const dangerLabel =
                      locale === "dk"
                        ? (r.danger_level ?? 0) >= 2
                          ? "MEGET GIFTIG"
                          : danger
                          ? "GIFTIG"
                          : null
                        : (r.danger_level ?? 0) >= 2
                        ? "HIGHLY TOXIC"
                        : danger
                        ? "TOXIC"
                        : null;

                    const stats = statsMap.get(r.id);
                    const total = stats ? stats.total : null;
                    const d30 = stats ? stats.d30 : null;

                    return (
                      <Link key={r.id} href={`/${locale}/species/${r.slug}`} className={styles.card}>
                        <div className={styles.media}>
                          {img ? (
                            <Image
                              src={img}
                              alt={name}
                              fill
                              sizes="(max-width: 900px) 92vw, (max-width: 1200px) 45vw, 30vw"
                              className={styles.img}
                            />
                          ) : (
                            <div className={styles.ph} aria-hidden="true" />
                          )}

                          <div className={styles.mediaShade} aria-hidden="true" />

                          <div className={styles.badges}>
                            {dangerLabel ? <span className={styles.badgeDanger}>☠ {dangerLabel}</span> : null}
                            <span className={styles.badge}>{g}</span>
                          </div>
                        </div>

                        <div className={styles.body}>
                          <div className={styles.name}>{name}</div>

                          <div className={styles.desc}>
                            {desc || (locale === "dk" ? "Tilføj short_description." : "Add short_description.")}
                          </div>

                          <div className={styles.statsRow}>
                            <div className={styles.statPill}>
                              <span className={styles.statK}>{locale === "dk" ? "Fund" : "Finds"}</span>
                              <span className={styles.statV}>{total === null ? "—" : fmtCompact(total, locale)}</span>
                            </div>
                            <div className={styles.statPill}>
                              <span className={styles.statK}>30d</span>
                              <span className={styles.statV}>{d30 === null ? "—" : fmtCompact(d30, locale)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerNote}>
          {locale === "dk"
            ? "Tip: Udfyld beskrivelser + forvekslinger pr. art — det er SEO-guld."
            : "Tip: Fill descriptions + look-alikes per species — SEO gold."}
        </div>
      </footer>
    </main>
  );
}