"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./FindPage.module.css";
import { Card } from "@/components/UI/Card";

type FindDetailPayload = {
  find: {
    id: string;
    user_id: string | null;
    species_id: string | null;
    observed_at: string | null;
    created_at: string | null;
    notes: string | null;
    photo_urls: string[] | null;
    country: string | null;
    spot_id: string | null;
    geo_cell: string | null;
    geo_precision_km: number | null;
    visibility: string | null;
  };
  species: {
    id: string;
    slug: string | null;
    primary_group: string | null;
    scientific_name: string | null;
  } | null;
  translation: {
    locale: string | null;
    common_name: string | null;
    short_description: string | null;
    identification: string | null;
    lookalikes: string | null;
    usage_notes: string | null;
    safety_notes: string | null;
    updated_at: string | null;
  } | null;
  cell: {
    country: string | null;
    geo_cell: string | null;
    precision_km: number | null;
    finds_count: number | null;
    updated_at: string | null;
  } | null;
  related: Array<{
    id: string;
    created_at: string | null;
    observed_at: string | null;
    species_id: string | null;
    notes: string | null;
    photo_url: string | null;
    visibility: string | null;
    user_id: string | null;
    country: string | null;
    spot_id: string | null;
    geo_cell: string | null;
    geo_precision_km: number | null;
  }>;
};

export type TopSpeciesRow = {
  species_id: string;
  slug: string | null;
  common_name: string | null;
  scientific_name: string | null;
  primary_group: string | null;
  c_total: number;
  c_last30: number;
  c_qtr: number;
};

export type SpotIntelligence = {
  country: string | null;
  spot_id: string | null;
  total: number;
  qtr: number;
  last30: number;
  first_seen: string | null;
  last_seen: string | null;
  last_observed_at: string | null;
  years_active: number;
  stable_over_years: boolean;
  year_counts: Array<{ year: number; count: number }>;
};

function t(locale: string, dk: string, en: string) {
  return locale === "dk" ? dk : en;
}

function fmtTS(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${d.getFullYear()} · ${hh}:${mm}`;
}

function fmtDate(date?: string | null) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
}

function visLabel(locale: string, v?: string | null) {
  if (v === "public_aggregate") return t(locale, "Offentlig", "Public");
  if (v === "friends") return t(locale, "Venner", "Friends");
  return t(locale, "Privat", "Private");
}

function cleanBullets(s?: string | null) {
  if (!s) return [];
  return s
    .split("\n")
    .map((x) => x.replace(/\r/g, "").trim())
    .filter(Boolean)
    .map((x) => x.replace(/^-+\s*/, ""));
}

type TabKey = "overview" | "identify" | "lookalikes" | "usage" | "safety";

function labelSpecies(locale: string, r: TopSpeciesRow) {
  const name = r.common_name || r.scientific_name || (r.slug ? `#${r.slug}` : null);
  return name ?? t(locale, "Ukendt art", "Unknown species");
}

function confidenceLabel(intel: SpotIntelligence | null, locale: string) {
  if (!intel) return { label: t(locale, "—", "—"), tone: "low" as const };

  const total = Number(intel.total ?? 0);
  const years = Number(intel.years_active ?? 0);

  if (years >= 3 && total >= 8) return { label: t(locale, "Høj", "High"), tone: "high" as const };
  if (years >= 2 && total >= 3) return { label: t(locale, "Medium", "Medium"), tone: "mid" as const };
  return { label: t(locale, "Lav", "Low"), tone: "low" as const };
}

function qas(intel: SpotIntelligence | null, locale: string) {
  if (!intel) {
    return [
      { q: t(locale, "Har arten været her før?", "Has it been here before?"), a: t(locale, "—", "—") },
      { q: t(locale, "Hvornår var sidste observation?", "When was the last observation?"), a: t(locale, "—", "—") },
      { q: t(locale, "Er dette spot stabilt over år?", "Is this spot stable over years?"), a: t(locale, "—", "—") },
    ];
  }

  const total = Number(intel.total ?? 0);
  const years = Number(intel.years_active ?? 0);
  const lastObs = intel.last_observed_at ? fmtDate(intel.last_observed_at) : fmtTS(intel.last_seen);

  const beenHere =
    total >= 2
      ? t(locale, "Ja — set før", "Yes — seen before")
      : t(locale, "Næsten nyt — 1 observation", "Mostly new — 1 observation");

  let stable = t(locale, "For ny til at vurdere", "Too new to tell");
  if (years >= 3 && intel.stable_over_years) stable = t(locale, "Ja — stabil over år", "Yes — stable over years");
  else if (years >= 2) stable = t(locale, "Tegn på stabilitet", "Signs of stability");

  return [
    { q: t(locale, "Har arten været her før?", "Has it been here before?"), a: beenHere },
    { q: t(locale, "Hvornår var sidste observation?", "When was the last observation?"), a: lastObs || t(locale, "—", "—") },
    { q: t(locale, "Er dette spot stabilt over år?", "Is this spot stable over years?"), a: stable },
  ];
}

function normalizeYearCounts(intel: SpotIntelligence | null) {
  const rows = intel?.year_counts ?? [];
  const max = Math.max(1, ...rows.map((r) => Number(r.count ?? 0)));
  return { rows, max };
}

export default function FindClient({
  locale,
  payload,
  errorMsg,
  topSpecies,
  topSpeciesError,
  spotIntel,
  spotIntelError,
}: {
  locale: string;
  payload: FindDetailPayload | null;
  errorMsg: string | null;
  topSpecies: TopSpeciesRow[];
  topSpeciesError: string | null;
  spotIntel: SpotIntelligence | null;
  spotIntelError: string | null;
}) {
  if (!payload) {
    return (
      <div className={styles.wrap}>
        <Card className={styles.errorCard}>
          <div className={styles.errorTitle}>
            {t(locale, "Kunne ikke åbne fundet", "Could not open find")}
          </div>
          <div className={styles.errorBody}>
            {t(locale, "Fejl:", "Error:")} <strong>{errorMsg ?? "Unknown"}</strong>
          </div>
          <Link className={styles.back} href={`/${locale}/feed`}>
            {t(locale, "Tilbage til feed", "Back to feed")} →
          </Link>
        </Card>
      </div>
    );
  }

  const f = payload.find;
  const sp = payload.species;
  const tr = payload.translation;
  const cell = payload.cell;
  const related = payload.related ?? [];

  const title =
    tr?.common_name ||
    sp?.scientific_name ||
    (sp?.slug ? `#${sp.slug}` : t(locale, "Ukendt art", "Unknown species"));

  const subtitle =
    tr?.common_name && sp?.scientific_name
      ? sp.scientific_name
      : tr?.short_description
        ? tr.short_description
        : "";

  const hero = (f?.photo_urls?.[0] as string | null) ?? null;

  const areaKey = (cell?.geo_cell as string | null) ?? (f?.spot_id as string | null);
  const areaCount = cell?.finds_count ?? null;
  const areaPrecision = cell?.precision_km ?? f?.geo_precision_km ?? null;

  // map deep-link: cell -> ?cell=, spot -> ?spot=, fallback find -> ?find=
  const mapHref = cell?.geo_cell
    ? `/${locale}/map?cell=${encodeURIComponent(cell.geo_cell)}`
    : f?.spot_id
      ? `/${locale}/map?spot=${encodeURIComponent(f.spot_id)}`
      : `/${locale}/map?find=${encodeURIComponent(f.id)}`;

  const [tab, setTab] = useState<TabKey>("overview");

  const identify = useMemo(() => cleanBullets(tr?.identification), [tr?.identification]);
  const lookalikes = useMemo(() => cleanBullets(tr?.lookalikes), [tr?.lookalikes]);
  const usage = useMemo(() => cleanBullets(tr?.usage_notes), [tr?.usage_notes]);
  const safety = useMemo(() => cleanBullets(tr?.safety_notes), [tr?.safety_notes]);

  const overviewText = tr?.short_description ?? f?.notes ?? null;

  const conf = useMemo(() => confidenceLabel(spotIntel, locale), [spotIntel, locale]);
  const qa = useMemo(() => qas(spotIntel, locale), [spotIntel, locale]);
  const yc = useMemo(() => normalizeYearCounts(spotIntel), [spotIntel]);

  const intelSummary = spotIntel
    ? t(locale, "Aktivitet", "Activity") +
      `: ${spotIntel.total} · ` +
      t(locale, "30d", "30d") +
      `: ${spotIntel.last30} · ` +
      t(locale, "Q", "Q") +
      `: ${spotIntel.qtr}`
    : t(locale, "Ingen data endnu.", "No data yet.");

  const IntelligenceCard = (
    <div className={styles.intelCard}>
      <div className={styles.intelHead}>
        <div className={styles.intelHeadLeft}>
          <div className={styles.intelKicker}>{t(locale, "Forago Intelligence", "Forago Intelligence")}</div>
          <div className={styles.intelSub}>{intelSummary}</div>
        </div>

        <div className={styles.confBadge} data-tone={conf.tone}>
          <span className={styles.confK}>{t(locale, "Confidence", "Confidence")}</span>
          <span className={styles.confV}>{conf.label}</span>
        </div>
      </div>

      {spotIntelError ? (
        <div className={styles.intelError}>
          {t(locale, "Fejl:", "Error:")} <strong>{spotIntelError}</strong>
        </div>
      ) : null}

      <div className={styles.qaGrid}>
        {qa.map((x, i) => (
          <div key={i} className={styles.qaItem}>
            <div className={styles.qaQ}>{x.q}</div>
            <div className={styles.qaA}>{x.a}</div>
          </div>
        ))}
      </div>

      <div className={styles.stability}>
        <div className={styles.stabilityTop}>
          <div className={styles.stabilityTitle}>{t(locale, "Stabilitet over år", "Stability over years")}</div>
          <div className={styles.stabilityMeta}>
            {spotIntel?.first_seen ? (
              <>
                {t(locale, "Først set", "First seen")}: <strong>{fmtTS(spotIntel.first_seen)}</strong>
                <span className={styles.dot} aria-hidden />
              </>
            ) : null}
            {spotIntel?.last_seen ? (
              <>
                {t(locale, "Sidst set", "Last seen")}: <strong>{fmtTS(spotIntel.last_seen)}</strong>
              </>
            ) : null}
          </div>
        </div>

        {yc.rows.length ? (
          <div className={styles.bars}>
            {yc.rows.map((r) => {
              const h = Math.max(0.12, Number(r.count ?? 0) / yc.max); // min-height følelse
              return (
                <div key={r.year} className={styles.barItem} title={`${r.year}: ${r.count}`}>
                  <div className={styles.bar} style={{ height: `${Math.round(h * 100)}%` }} />
                  <div className={styles.barLabel}>{String(r.year).slice(2)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.stabilityEmpty}>
            {t(locale, "For få data til stability-visning endnu.", "Not enough data for stability yet.")}
          </div>
        )}
      </div>

      {/* Fold Top species ind i samme card */}
      <div className={styles.topSpecies}>
        <div className={styles.topSpeciesTitle}>{t(locale, "Top arter i området", "Top species in area")}</div>

        {topSpeciesError ? (
          <div className={styles.topSpeciesEmpty}>
            {t(locale, "Fejl:", "Error:")} <strong>{topSpeciesError}</strong>
          </div>
        ) : topSpecies.length ? (
          <div className={styles.topSpeciesList}>
            {topSpecies.slice(0, 5).map((r) => (
              <div key={r.species_id} className={styles.topRow}>
                <div className={styles.topMain}>
                  <div className={styles.topName}>{labelSpecies(locale, r)}</div>
                  <div className={styles.topMeta}>
                    {(r.primary_group ?? "—")} · {t(locale, "30d", "30d")}: <strong>{r.c_last30}</strong>{" "}
                    <span className={styles.sep}>·</span> {t(locale, "Q", "Q")}: <strong>{r.c_qtr}</strong>
                  </div>
                </div>
                <div className={styles.topCount}>{r.c_total}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.topSpeciesEmpty}>{t(locale, "Ingen area-data endnu.", "No area data yet.")}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      {/* Top row */}
      <div className={styles.topRowNav}>
        <Link className={styles.backTop} href={`/${locale}/feed`}>
          ← {t(locale, "Feed", "Feed")}
        </Link>

        <div className={styles.actions}>
          <Link className={styles.actionBtn} href={mapHref}>
            {t(locale, "Åbn område på kort", "Open area on map")}
          </Link>

          <button
            className={styles.actionBtn}
            type="button"
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard?.writeText(url);
            }}
          >
            {t(locale, "Kopiér link", "Copy link")}
          </button>
        </div>
      </div>

      <div className={styles.shell}>
        {/* LEFT */}
        <section className={styles.left}>
          <header className={styles.header}>
            <div className={styles.badges}>
              <span className={styles.badge}>{visLabel(locale, f?.visibility)}</span>
              {sp?.primary_group ? <span className={styles.badgeSoft}>{sp.primary_group}</span> : null}
              {areaKey ? (
                <span className={styles.badgeSoft}>
                  {t(locale, "Område", "Area")}: {areaKey}
                </span>
              ) : null}
            </div>

            <h1 className={styles.h1}>{title}</h1>
            {subtitle ? <p className={styles.sub}>{subtitle}</p> : null}

            <div className={styles.meta}>
              {f?.observed_at ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaK}>{t(locale, "Observeret", "Observed")}</span>
                  <span className={styles.metaV}>{fmtDate(f.observed_at)}</span>
                </div>
              ) : null}

              {f?.created_at ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaK}>{t(locale, "Logget", "Logged")}</span>
                  <span className={styles.metaV}>{fmtTS(f.created_at)}</span>
                </div>
              ) : null}

              {areaCount != null ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaK}>{t(locale, "Fund i området", "Finds in area")}</span>
                  <span className={styles.metaV}>{areaCount}</span>
                </div>
              ) : null}

              {areaPrecision != null ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaK}>{t(locale, "Præcision", "Precision")}</span>
                  <span className={styles.metaV}>{areaPrecision} km</span>
                </div>
              ) : null}
            </div>
          </header>

          <div className={styles.hero}>
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.heroImg} src={hero} alt="" />
            ) : (
              <div className={styles.heroEmpty}>
                <div className={styles.heroIcon}>📷</div>
                <div className={styles.heroText}>{t(locale, "Ingen foto", "No photo")}</div>
              </div>
            )}
          </div>

          {/* ✅ Mobile-first: intelligence card IN FLOW */}
          <div className={styles.mobileIntel}>{IntelligenceCard}</div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={styles.tab} data-active={tab === "overview"} onClick={() => setTab("overview")}>
              {t(locale, "Overblik", "Overview")}
            </button>
            <button className={styles.tab} data-active={tab === "identify"} onClick={() => setTab("identify")}>
              {t(locale, "Kendetegn", "Identification")}
            </button>
            <button className={styles.tab} data-active={tab === "lookalikes"} onClick={() => setTab("lookalikes")}>
              {t(locale, "Forvekslinger", "Lookalikes")}
            </button>
            <button className={styles.tab} data-active={tab === "usage"} onClick={() => setTab("usage")}>
              {t(locale, "Brug", "Usage")}
            </button>
            <button className={styles.tab} data-active={tab === "safety"} onClick={() => setTab("safety")}>
              {t(locale, "Sikkerhed", "Safety")}
            </button>
          </div>

          <div className={styles.tabPanel}>
            {tab === "overview" ? (
              <div className={styles.panelCard}>
                <div className={styles.panelTitle}>{t(locale, "Kort beskrivelse", "Short description")}</div>
                <div className={styles.panelBody}>
                  {overviewText ? overviewText : t(locale, "Ingen tekst endnu.", "No text yet.")}
                </div>
              </div>
            ) : null}

            {tab === "identify" ? (
              <div className={styles.panelCard}>
                <div className={styles.panelTitle}>{t(locale, "Sådan genkender du den", "How to identify")}</div>
                {identify.length ? (
                  <ul className={styles.bullets}>{identify.map((x, i) => <li key={i}>{x}</li>)}</ul>
                ) : (
                  <div className={styles.panelBody}>{t(locale, "Ingen data endnu.", "No data yet.")}</div>
                )}
              </div>
            ) : null}

            {tab === "lookalikes" ? (
              <div className={styles.panelCard}>
                <div className={styles.panelTitle}>{t(locale, "Vigtige forvekslinger", "Important lookalikes")}</div>
                {lookalikes.length ? (
                  <ul className={styles.bullets}>{lookalikes.map((x, i) => <li key={i}>{x}</li>)}</ul>
                ) : (
                  <div className={styles.panelBody}>{t(locale, "Ingen data endnu.", "No data yet.")}</div>
                )}
              </div>
            ) : null}

            {tab === "usage" ? (
              <div className={styles.panelCard}>
                <div className={styles.panelTitle}>{t(locale, "Brug i køkkenet", "How to use")}</div>
                {usage.length ? (
                  <ul className={styles.bullets}>{usage.map((x, i) => <li key={i}>{x}</li>)}</ul>
                ) : (
                  <div className={styles.panelBody}>{t(locale, "Ingen data endnu.", "No data yet.")}</div>
                )}
              </div>
            ) : null}

            {tab === "safety" ? (
              <div className={styles.panelCard} data-danger="true">
                <div className={styles.panelTitle}>{t(locale, "Sikkerhed", "Safety")}</div>
                {safety.length ? (
                  <ul className={styles.bullets}>{safety.map((x, i) => <li key={i}>{x}</li>)}</ul>
                ) : (
                  <div className={styles.panelBody}>{t(locale, "Ingen data endnu.", "No data yet.")}</div>
                )}
              </div>
            ) : null}
          </div>

          {/* Related */}
          <div className={styles.section}>
            <div className={styles.sectionTop}>
              <div className={styles.sectionTitle}>
                {t(locale, "Andre fund i samme område", "Other finds in the same area")}
              </div>
              <Link className={styles.sectionLink} href={mapHref}>
                {t(locale, "Se på kort", "View on map")} →
              </Link>
            </div>

            {related.length ? (
              <div className={styles.relatedGrid}>
                {related.slice(0, 12).map((r) => {
                  const img = r.photo_url as string | null;
                  const href = `/${locale}/find/${encodeURIComponent(r.id)}`;
                  return (
                    <Link key={r.id} className={styles.relatedCard} href={href}>
                      <div className={styles.relatedMedia}>
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className={styles.relatedImg} src={img} alt="" />
                        ) : (
                          <div className={styles.relatedEmpty}>📷</div>
                        )}
                      </div>

                      <div className={styles.relatedMeta}>
                        <div className={styles.relatedWhen}>{fmtTS(r.created_at)}</div>
                        <div className={styles.relatedBadge}>{visLabel(locale, r.visibility)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className={styles.emptyRelated}>
                <div className={styles.emptyTitle}>{t(locale, "Ingen andre fund endnu", "No other finds yet")}</div>
                <div className={styles.emptyBody}>
                  {t(locale, "Det her område er stadig nyt i systemet.", "This area is still new in the system.")}
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* RIGHT (desktop sticky) */}
        <aside className={styles.right}>
          <div className={styles.sticky}>
            <div className={styles.sideTitle}>{t(locale, "Område", "Area")}</div>

            <div className={styles.sideBox}>
              <div className={styles.sideRow}>
                <span className={styles.sideK}>{t(locale, "Cell/Spot", "Cell/Spot")}</span>
                <span className={styles.sideV}>{areaKey ?? "—"}</span>
              </div>
              <div className={styles.sideRow}>
                <span className={styles.sideK}>{t(locale, "Fund", "Finds")}</span>
                <span className={styles.sideV}>{areaCount ?? "—"}</span>
              </div>
              <div className={styles.sideRow}>
                <span className={styles.sideK}>{t(locale, "Præcision", "Precision")}</span>
                <span className={styles.sideV}>{areaPrecision != null ? `${areaPrecision} km` : "—"}</span>
              </div>
              <div className={styles.sideRow}>
                <span className={styles.sideK}>{t(locale, "Opdateret", "Updated")}</span>
                <span className={styles.sideV}>{cell?.updated_at ? fmtTS(cell.updated_at) : "—"}</span>
              </div>
            </div>

            {/* ✅ Desktop: samme intelligence card */}
            <div className={styles.desktopIntel}>{IntelligenceCard}</div>

            <Link className={styles.primary} href={mapHref}>
              {t(locale, "Åbn område på kort", "Open area on map")} →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}