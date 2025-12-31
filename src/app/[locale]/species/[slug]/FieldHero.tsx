"use client";

import { useMemo, useState } from "react";
import styles from "./SpeciesPage.module.css";

export default function FieldHero(props: {
  locale: "dk" | "en";
  name: string;
  scientific: string;
  group: string;
  imageUrl: string | null;

  danger: boolean;
  dangerLabel: string;

  inSeasonNow: boolean;
  confidence: number | null;
  seasonText: string;

  totalFinds: string;
  finds30d: string;
}) {
  const {
    locale,
    name,
    scientific,
    group,
    imageUrl,
    danger,
    dangerLabel,
    inSeasonNow,
    confidence,
    seasonText,
    totalFinds,
    finds30d,
  } = props;

  const [open, setOpen] = useState(false);

  const seasonBadge = useMemo(() => {
    const base = inSeasonNow
      ? locale === "dk"
        ? "I sæson nu"
        : "In season now"
      : locale === "dk"
      ? "Ikke i sæson"
      : "Out of season";
    const conf = confidence !== null ? ` · ${Math.round(confidence)}%` : "";
    return base + conf;
  }, [inSeasonNow, confidence, locale]);

  const tapHint = locale === "dk" ? "Tryk for fullscreen (pinch-zoom)" : "Tap for fullscreen (pinch-zoom)";

  return (
    <>
      {/* Full-screen hero (clean image only) */}
      <header className={styles.heroFull} aria-label={locale === "dk" ? "Billede" : "Image"}>
        <button
          type="button"
          className={`${styles.heroMediaBtn} pressable`}
          onClick={() => imageUrl && setOpen(true)}
          aria-label={tapHint}
          disabled={!imageUrl}
        >
          {imageUrl ? (
            // use img here for fastest + predictable iOS pinch in fullscreen
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className={styles.heroImg} />
          ) : (
            <div className={styles.noImg}>{locale === "dk" ? "Ingen billede endnu" : "No image yet"}</div>
          )}

          <div className={styles.heroHint} aria-hidden="true">
            <span className={styles.hintDot} />
            <span className="meta">{tapHint}</span>
          </div>
        </button>
      </header>

      {/* Airbnb-ish info sheet (overlapping) */}
      <section className={`${styles.sheet} surface`} aria-label={locale === "dk" ? "Info" : "Info"}>
        <div className={styles.sheetTop}>
          <h1 className="h1">{name}</h1>

          <div className={styles.sheetMeta}>
            {scientific ? <em className={styles.scientific}>{scientific}</em> : null}
            {scientific ? <span className={styles.dot}>·</span> : null}
            <span className="meta">{locale === "dk" ? "Feltprofil" : "Field profile"} · Forago</span>
            <span className={styles.dot}>·</span>
            <span className="meta">{group}</span>
          </div>
        </div>

        <div className={styles.badgeRow} aria-label={locale === "dk" ? "Status" : "Status"}>
          {danger ? (
            <span className={`${styles.badge} ${styles.badgeDanger}`}>☠ {dangerLabel}</span>
          ) : (
            <span className={styles.badge}>{locale === "dk" ? "Sikkerhed ukendt" : "Safety unknown"}</span>
          )}

          <span className={`${styles.badge} ${inSeasonNow ? styles.badgeGood : ""}`}>{seasonBadge}</span>

          <span className={styles.badge}>
            {locale === "dk" ? "Sæson" : "Season"}: {seasonText}
          </span>
        </div>

        <div className={styles.kpis} aria-label={locale === "dk" ? "Statistik" : "Stats"}>
          <div className={styles.kpi}>
            <div className="meta">{locale === "dk" ? "Fund" : "Finds"}</div>
            <div className={styles.kpiV}>{totalFinds}</div>
          </div>
          <div className={styles.kpi}>
            <div className="meta">30d</div>
            <div className={styles.kpiV}>{finds30d}</div>
          </div>
        </div>
      </section>

      {/* Fullscreen */}
      {open && imageUrl ? (
        <div className={styles.fs} role="dialog" aria-modal="true" aria-label={locale === "dk" ? "Fullscreen billede" : "Fullscreen image"}>
          <button className={styles.fsClose} onClick={() => setOpen(false)} aria-label={locale === "dk" ? "Luk" : "Close"}>
            ✕
          </button>

          <div className={styles.fsScroll}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={name} className={styles.fsImg} />
          </div>

          <div className={styles.fsFooter}>
            <div className={styles.fsName}>{name}</div>
            {scientific ? <div className="meta">{scientific}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}