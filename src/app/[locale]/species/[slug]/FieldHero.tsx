"use client";

import Image from "next/image";
import styles from "./FieldHero.module.css";

type Locale = "dk" | "en";

function t(locale: Locale, dk: string, en: string) {
  return locale === "dk" ? dk : en;
}

type Props = {
  locale: Locale;

  name: string;
  scientific: string;
  group: string; // e.g. "fungus"
  imageUrl: string | null;

  danger: boolean;
  dangerLabel: string;

  inSeasonNow: boolean;
  confidence: number | null;
  seasonText: string;

  totalFinds: string;
  finds30d: string;
};

function Chip({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "danger";
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? styles.chipGood
      : tone === "warn"
      ? styles.chipWarn
      : tone === "danger"
      ? styles.chipDanger
      : styles.chipNeutral;

  return (
    <span className={`${styles.chip} ${toneClass}`}>
      {icon ? <span className={styles.chipIcon}>{icon}</span> : null}
      <span className={styles.chipText}>{label}</span>
    </span>
  );
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
  const seasonChip = `${t(locale, "Sæson", "Season")}: ${seasonText}`;
  const seasonState = inSeasonNow
    ? t(locale, "I sæson", "In season")
    : t(locale, "Ikke i sæson", "Out of season");

  const confPct =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? Math.round(confidence * 100)
      : null;

  // FIX: din "8000%" bug kommer typisk af at confidence allerede er 0-100.
  // Her antager vi confidence er 0-1. Hvis din DB er 0-100, så skift til:
  // Math.round(confidence)
  const seasonStateLabel = confPct !== null ? `${seasonState} · ${confPct}%` : seasonState;

  return (
    <section className={styles.hero} aria-label={t(locale, "Foto", "Photo")}>
      <div className={styles.media}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1200px"
            className={styles.img}
          />
        ) : (
          <div className={styles.noImage}>
            <div className={styles.noImageInner}>
              <div className={styles.noImageTitle}>{name}</div>
              <div className={styles.noImageMeta}>{scientific}</div>
            </div>
          </div>
        )}

        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        {/* badges/chips – låses til top-left så de IKKE “flyver” midt i billedet */}
        <div className={styles.chipsDock} aria-label={t(locale, "Status", "Status")}>
          <div className={styles.chips}>
            {danger ? <Chip label={dangerLabel} tone="danger" icon={<span aria-hidden>☠️</span>} /> : null}
            <Chip label={seasonStateLabel} tone={inSeasonNow ? "good" : "warn"} />
            <Chip label={seasonChip} tone="neutral" />
          </div>
        </div>

        {/* hint */}
        <div className={styles.hintWrap}>
          <div className={styles.hint}>
            <span className={styles.hintDot} aria-hidden="true" />
            <span className={styles.hintText}>
              {t(locale, "Tryk for fullscreen (pinch-zoom)", "Tap for fullscreen (pinch-zoom)")}
            </span>
          </div>
        </div>

        {/* bottom sheet overlay – trukket OP over billedet */}
        <div className={styles.sheet} role="group" aria-label={t(locale, "Overblik", "Overview")}>
          <div className={styles.sheetInner}>
            <div className={styles.head}>
              <h1 className={styles.h1}>{name}</h1>
              <div className={styles.metaRow}>
                {scientific ? <span className={styles.metaEm}>{scientific}</span> : null}
                {scientific ? <span className={styles.metaDot}>•</span> : null}
                <span className={styles.meta}>{group}</span>
              </div>
              <div className={styles.meta2}>{seasonChip}</div>
            </div>

            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>{t(locale, "Fund", "Finds")}</div>
                <div className={styles.kpiValue}>{totalFinds}</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>30d</div>
                <div className={styles.kpiValue}>{finds30d}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}