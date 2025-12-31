"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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

  const seasonChip = useMemo(() => {
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

  return (
    <>
      <header className={styles.hero}>
        <div className={`${styles.viewer} surface`}>
          {/* blurred plate */}
          <div className={styles.viewerPlate} aria-hidden="true">
            {imageUrl ? (
              <Image src={imageUrl} alt="" fill className={styles.viewerPlateImg} sizes="100vw" priority />
            ) : null}
          </div>

          {/* main image - contain, huge, tap to fullscreen */}
          <button
            type="button"
            className={`${styles.viewerTap} pressable`}
            onClick={() => imageUrl && setOpen(true)}
            aria-label={locale === "dk" ? "Åbn billede i fullscreen" : "Open image fullscreen"}
          >
            <div className={styles.viewerImgWrap}>
              {imageUrl ? (
                <Image src={imageUrl} alt={name} fill className={styles.viewerImg} sizes="100vw" priority />
              ) : (
                <div className={styles.noImg}>{locale === "dk" ? "Ingen billede endnu" : "No image yet"}</div>
              )}
            </div>

            <div className={styles.viewerHint}>
              <span className={styles.hintDot} aria-hidden="true" />
              <span className="meta">
                {locale === "dk" ? "Tryk for fullscreen (pinch-zoom)" : "Tap for fullscreen (pinch-zoom)"}
              </span>
            </div>
          </button>

          {/* overlays: minimal */}
          <div className={styles.viewerChips} aria-hidden="true">
            {danger ? (
              <span className={`${styles.chip} ${styles.chipDanger}`}>☠ {dangerLabel}</span>
            ) : (
              <span className={styles.chip}>{locale === "dk" ? "Sikkerhed ukendt" : "Safety unknown"}</span>
            )}
            <span className={`${styles.chip} ${inSeasonNow ? styles.chipGood : ""}`}>{seasonChip}</span>
            <span className={styles.chip}>{group}</span>
          </div>

          <div className={styles.viewerBar}>
            <div className={styles.barItem}>
              <div className="meta">{locale === "dk" ? "Sæson" : "Season"}</div>
              <div className={styles.barValue}>{seasonText}</div>
            </div>
            <div className={styles.barSep} />
            <div className={styles.barItem}>
              <div className="meta">{locale === "dk" ? "Fund" : "Finds"}</div>
              <div className={styles.barValue}>{totalFinds}</div>
            </div>
            <div className={styles.barSep} />
            <div className={styles.barItem}>
              <div className="meta">30d</div>
              <div className={styles.barValue}>{finds30d}</div>
            </div>
          </div>
        </div>

        <div className={styles.title}>
          <h1 className="h1">{name}</h1>
          <div className={styles.titleMeta}>
            {scientific ? <em className={styles.scientific}>{scientific}</em> : null}
            {scientific ? <span className={styles.dot}>·</span> : null}
            <span className="meta">{locale === "dk" ? "Feltprofil" : "Field profile"} · Forago</span>
          </div>
        </div>
      </header>

      {/* Fullscreen viewer: use <img> so iOS pinch feels natural */}
      {open && imageUrl ? (
        <div className={styles.fs} role="dialog" aria-modal="true">
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