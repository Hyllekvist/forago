"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./FindPage.module.css";
import { Card } from "@/components/UI/Card";
import type { FindDetailPayload, TopSpeciesRow, SpotIntelligence } from "./page";

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
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const [y, m, d] = parts;
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

function confidenceLabel(si: SpotIntelligence | null) {
  if (!si) return { label: "—", level: "low" as const };

  const years = Number(si.years_active ?? 0);
  const total = Number(si.total ?? 0);

  if (years >= 3 && total >= 8) return { label: "Høj", level: "high" as const };
  if (years >= 2 && total >= 3) return { label: "Medium", level: "mid" as const };
  return { label: "Lav", level: "low" as const };
}

function stabilityText(locale: string, si: SpotIntelligence | null) {
  if (!si) return t(locale, "—", "—");
  const years = Number(si.years_active ?? 0);
  const stable = !!si.stable_over_years;

  if (years >= 3 && stable) return t(locale, "Ja (stabil over år)", "Yes (stable over years)");
  if (years >= 2) return t(locale, "Tegn på stabilitet", "Signs of stability");
  return t(locale, "For ny til at vurdere", "Too new to judge");
}

function seenBeforeText(locale: string, si: SpotIntelligence | null) {
  if (!si) return t(locale, "—", "—");
  const total = Number(si.total ?? 0);
  if (total >= 2) return t(locale, "Ja — set før", "Yes — seen before");
  if (total === 1) return t(locale, "Næsten nyt — 1 observation", "Mostly new — 1 observation");
  return t(locale, "Ingen data", "No data");
}

function lastObsText(locale: string, si: SpotIntelligence | null) {
  if (!si) return t(locale, "—", "—");
  // Prefer last_observed_at (date), fallback to last_seen (timestamp)
  if (si.last_observed_at) return fmtDate(si.last_observed_at);
  if (si.last_seen) return fmtTS(si.last_seen);
  return t(locale, "—", "—");
}

function yearBars(si: SpotIntelligence | null) {
  const rows = si?.year_counts ?? [];
  const cleaned = rows
    .map((r) => ({ year: Number(r.year), count: Number(r.count) }))
    .filter((x) => Number.isFinite(x.year) && Number.isFinite(x.count))
    .sort((a, b) => a.year - b.year)
    .slice(-6); // keep it tiny

  const max = Math.max(1, ...cleaned.map((x) => x.count));
  return cleaned.map((x) => ({
    ...x,
    pct: Math.round((x.count / max) * 100),
  }));
}

function IntelCard({
  locale,
  spotIntel,
  spotIntelError,
  topSpecies,
  topSpeciesError,
}: {
  locale: string;
  spotIntel: SpotIntelligence | null;
  spotIntelError: string | null;
  topSpecies: TopSpeciesRow[];
  topSpeciesError: string | null;
}) {
  const conf = confidenceLabel(spotIntel);
  const bars = useMemo(() => yearBars(spotIntel), [spotIntel?.year_counts]);

  // If we have neither spot intel nor topSpecies, don’t show the card.
  const hasSomething =
    !!spotIntel ||
    (!!topSpecies && topSpecies.length > 0) ||
    !!spotIntelError ||
    !!topSpeciesError;

  if (!hasSomething) return null;

  return (
    <section className={styles.intelCard} aria-label="Forago Intelligence">
      <div className={styles.intelHead}>
        <div className={styles.intelTitleRow}>
          <div className={styles.intelTitle}>Forago Intelligence</div>
          <span className={styles.intelBadge} data-level={conf.level}>
            {t(locale, "Confidence:", "Confidence:")} <strong>{conf.label}</strong>
          </span>
        </div>

        <div className={styles.intelSub}>
          {t(
            locale,
            "Svar på de vigtigste spørgsmål — uden at gøre det kompliceret.",
            "Answers to the key questions — without making it complicated."
          )}
        </div>
      </div>

      {spotIntelError ? (
        <div className={styles.intelError}>
          {t(locale, "Fejl i intelligence:", "Intelligence error:")}{" "}
          <strong>{spotIntelError}</strong>
        </div>
      ) : spotIntel ? (
        <>
          <div className={styles.qaGrid}>
            <div className={styles.qaItem}>
              <div className={styles.qaQ}>{t(locale, "Har arten været her før?", "Has it been here before?")}</div>
              <div className={styles.qaA}>{seenBeforeText(locale, spotIntel)}</div>
            </div>

            <div className={styles.qaItem}>
              <div className={styles.qaQ}>{t(locale, "Hvornår var sidste observation?", "When was the last observation?")}</div>
              <div className={styles.qaA}>{lastObsText(locale, spotIntel)}</div>
            </div>

            <div className={styles.qaItem}>
              <div className={styles.qaQ}>{t(locale, "Er spot stabilt over år?", "Is this spot stable over years?")}</div>
              <div className={styles.qaA}>{stabilityText(locale, spotIntel)}</div>
            </div>
          </div>

          <div className={styles.intelStatsRow}>
            <div className={styles.statPill}>
              <span className={styles.statK}>{t(locale, "Total", "Total")}</span>
              <span className={styles.statV}>{spotIntel.total}</span>
            </div>
            <div className={styles.statPill}>
              <span className={styles.statK}>{t(locale, "30 dage", "30 days")}</span>
              <span className={styles.statV}>{spotIntel.last30}</span>
            </div>
            <div className={styles.statPill}>
              <span className={styles.statK}>{t(locale, "Kvartal", "Quarter")}</span>
              <span className={styles.statV}>{spotIntel.qtr}</span>
            </div>
            <div className={styles.statPill}>
              <span className={styles.statK}>{t(locale, "År aktive", "Years active")}</span>
              <span className={styles.statV}>{spotIntel.years_active}</span>
            </div>
          </div>

          {bars.length ? (
            <div className={styles.sparkWrap}>
              <div className={styles.sparkTitle}>{t(locale, "Stabilitet over år", "Stability over years")}</div>
              <div className={styles.spark}>
                {bars.map((b) => (
                  <div key={b.year} className={styles.sparkCol} title={`${b.year}: ${b.count}`}>
                    <div className={styles.sparkBar} style={{ height: `${Math.max(8, b.pct)}%` }} />
                    <div className={styles.sparkYear}>{String(b.year).slice(-2)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.intelEmpty}>
          {t(locale, "Ingen intelligence-data endnu.", "No intelligence data yet.")}
        </div>
      )}

      <div className={styles.intelDivider} />

      <div className={styles.topSpeciesHead}>
        <div className={styles.topSpeciesTitle}>{t(locale, "Top arter i området", "Top species in area")}</div>
        <div className={styles.topSpeciesHint}>{t(locale, "Social proof i dit område.", "Social proof in your area.")}</div>
      </div>

      {topSpeciesError ? (
        <div className={styles.intelError}>
          {t(locale, "Fejl i top arter:", "Top species error:")} <strong>{topSpeciesError}</strong>
        </div>
      ) : topSpecies.length ? (
        <div className={styles.topList}>
          {topSpecies.slice(0, 5).map((r) => (
            <div key={r.species_id} className={styles.topRow}>
              <div className={styles.topMain}>
                <div className={styles.topName}>{labelSpecies(locale, r)}</div>
                <div className={styles.topMeta}>
                  {(r.primary_group ?? "—")} · {t(locale, "30d", "30d")}: <strong>{r.c_last30}</strong>{" "}
                  <span className={styles.topSep}>·</span> {t(locale, "Q", "Q")}: <strong>{r.c_qtr}</strong>
                </div>
              </div>
              <div className={styles.topCount}>{r.c_total}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.intelEmpty}>{t(locale, "Ingen area-data endnu.", "No area data yet.")}</div>
      )}
    </section>
  );
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

  // correct deep-link types
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

  return (
    <div className={styles.wrap}>
      {/* Top row */}
      <div className={styles.topRow}>
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

          {/* ✅ MOBILE-FIRST: Intelligence card is here (visible on mobile) */}
          <IntelCard
            locale={locale}
            spotIntel={spotIntel}
            spotIntelError={spotIntelError}
            topSpecies={topSpecies}
            topSpeciesError={topSpeciesError}
          />

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
                <div className={styles.emptyTitle}>
                  {t(locale, "Ingen andre fund endnu", "No other finds yet")}
                </div>
                <div className={styles.emptyBody}>
                  {t(locale, "Det her område er stadig nyt i systemet.", "This area is still new in the system.")}
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* RIGHT (desktop only) */}
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

            {/* Desktop: show the same intelligence card in sidebar too */}
            <div className={styles.desktopIntelWrap}>
              <IntelCard
                locale={locale}
                spotIntel={spotIntel}
                spotIntelError={spotIntelError}
                topSpecies={topSpecies}
                topSpeciesError={topSpeciesError}
              />
            </div>

            <Link className={styles.primary} href={mapHref}>
              {t(locale, "Åbn område på kort", "Open area on map")} →
            </Link>

            <div className={styles.sideHint}>
              {t(
                locale,
                "Tip: Når vi får flere logs, bliver stabilitet og confidence automatisk mere præcis.",
                "Tip: As more logs come in, stability and confidence become more accurate."
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}