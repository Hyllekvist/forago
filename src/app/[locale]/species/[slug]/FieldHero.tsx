"use client";

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
  return (
    <section className={styles.hero} aria-label={name}>
      {/* IMAGE */}
      <div className={styles.media}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority
            sizes="100vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.noImage}>
            {locale === "dk" ? "Intet billede endnu" : "No image yet"}
          </div>
        )}

        <div className={styles.vignette} aria-hidden />
        <div className={styles.grain} aria-hidden />
      </div>

      {/* OVERLAY TOP */}
      <div className={styles.overlayTop}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>{name}</h1>

          <div className={styles.subline}>
            {scientific ? <em>{scientific}</em> : null}
            {scientific ? <span className={styles.dot}>•</span> : null}
            <span>{group}</span>
          </div>
        </div>
      </div>

      {/* OVERLAY META */}
      <div className={styles.overlayBottom}>
        <div className={styles.metaRow}>
          {danger ? (
            <span className={`${styles.chip} ${styles.chipDanger}`}>
              ☠ {dangerLabel}
            </span>
          ) : (
            <span className={styles.chip}>
              {locale === "dk" ? "Ikke giftig" : "Not toxic"}
            </span>
          )}

          <span className={`${styles.chip} ${inSeasonNow ? styles.chipGood : ""}`}>
            {inSeasonNow
              ? locale === "dk"
                ? "I sæson"
                : "In season"
              : locale === "dk"
              ? "Ikke i sæson"
              : "Out of season"}
            {confidence !== null ? ` · ${Math.round(confidence)}%` : ""}
          </span>

          <span className={styles.chip}>
            {locale === "dk" ? "Sæson:" : "Season:"} {seasonText}
          </span>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              {locale === "dk" ? "Fund" : "Finds"}
            </span>
            <span className={styles.statValue}>{totalFinds}</span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statLabel}>30d</span>
            <span className={styles.statValue}>{finds30d}</span>
          </div>
        </div>
      </div>
    </section>
  );
}