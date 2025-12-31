"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./FieldHero.module.css";

type Props = {
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
};

function fmtPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return null;
  const v = Math.round(n * 100);
  return `${v}%`;
}

export default function FieldHero({
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
}: Props) {
  const t = {
    back: locale === "dk" ? "Arter" : "Species",
    season: locale === "dk" ? "Sæson" : "Season",
    save: locale === "dk" ? "Gem" : "Save",
    hint: locale === "dk" ? "Tryk for fullscreen (pinch-zoom)" : "Tap for fullscreen (pinch-zoom)",
    inSeason: locale === "dk" ? "I sæson" : "In season",
    notInSeason: locale === "dk" ? "Ikke i sæson" : "Out of season",
    found: locale === "dk" ? "Fund" : "Finds",
    last30d: locale === "dk" ? "30d" : "30d",
  };

  const confText = fmtPct(confidence);
  const seasonState = inSeasonNow ? t.inSeason : t.notInSeason;

  return (
    <section className={styles.hero} aria-label={name ? `Foto: ${name}` : "Foto"}>
      {/* Media */}
      <div className={styles.media}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority
            sizes="100vw"
            className={styles.img}
          />
        ) : (
          <div className={styles.noImage}>
            <span className={styles.noImageText}>
              {locale === "dk" ? "Intet billede endnu" : "No image yet"}
            </span>
          </div>
        )}

        {/* Subtle overlays */}
        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        {/* Topbar overlay */}
        <div className={styles.topbar}>
          <div className={styles.topbarInner}>
            <Link href={`/${locale}/species`} className={styles.back}>
              <span className={styles.backArrow} aria-hidden="true">←</span>
              <span className={styles.backText}>{t.back}</span>
            </Link>

            <div className={styles.actions}>
              <button type="button" className={styles.actionBtn}>
                {t.season}
              </button>
              <button type="button" className={styles.actionBtnPrimary}>
                {t.save}
              </button>
            </div>
          </div>
        </div>

        {/* Chips (top-left, under topbar) */}
        <div className={styles.chips}>
          {danger ? (
            <span className={`${styles.chip} ${styles.chipDanger}`}>
              <span className={styles.chipIcon} aria-hidden="true">☠︎</span>
              <span className={styles.chipText}>{dangerLabel}</span>
            </span>
          ) : null}

          <span className={`${styles.chip} ${inSeasonNow ? styles.chipGood : styles.chipNeutral}`}>
            <span className={styles.chipText}>
              {seasonState}{confText ? ` · ${confText}` : ""}
            </span>
          </span>

          <span className={`${styles.chip} ${styles.chipNeutral}`}>
            <span className={styles.chipText}>{group}</span>
          </span>
        </div>

        {/* Hint bottom-left */}
        <div className={styles.hint}>
          <span className={styles.hintDot} aria-hidden="true" />
          <span className={styles.hintText}>{t.hint}</span>
        </div>

        {/* Bottom sheet (overlaps hero, Airbnb-ish) */}
        <div className={styles.sheet}>
          <div className={styles.sheetInner}>
            <div className={styles.sheetHead}>
              <h1 className={styles.title}>{name}</h1>
              <p className={styles.metaLine}>
                <span className={styles.scientific}>{scientific || ""}</span>
                <span className={styles.dot} aria-hidden="true">•</span>
                <span className={styles.metaMuted}>{group}</span>
                <span className={styles.dot} aria-hidden="true">•</span>
                <span className={styles.metaMuted}>{t.season}: {seasonText}</span>
              </p>
            </div>

            <div className={styles.stats}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t.found}</div>
                <div className={styles.statValue}>{totalFinds}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t.last30d}</div>
                <div className={styles.statValue}>{finds30d}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer so sheet overlap doesn’t hide the image under it */}
        <div className={styles.sheetSpacer} aria-hidden="true" />
      </div>
    </section>
  );
}