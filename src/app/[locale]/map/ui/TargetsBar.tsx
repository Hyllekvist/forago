"use client";

import Link from "next/link";
import styles from "./TargetsBar.module.css";

export type TargetKind = "peak" | "stable" | "easy";

export type TargetItem = {
  kind: TargetKind;
  species_slug: string;
  label: string;
  metric: string; // fx "24 fund (90d)"
  hint: string;   // fx "Peak i view"
  jumpSpotId: string; // spot vi flyver til ved klik
};

type Props = {
  locale: string;
  title: string;
  items: TargetItem[];
  onJumpSpot: (spotId: string) => void;
};

function kindBadge(kind: TargetKind) {
  if (kind === "peak") return { text: "PEAK", emoji: "🔥" };
  if (kind === "stable") return { text: "STABIL", emoji: "✅" };
  return { text: "NEM", emoji: "🎯" };
}

export function TargetsBar({ locale, title, items, onJumpSpot }: Props) {
  if (!items?.length) return null;

  return (
    <section className={styles.wrap} aria-label="Top targets in view">
      <div className={styles.head}>
        <div className={styles.title}>{title}</div>
        <div className={styles.sub}>Privacy-safe · uden præcise spots</div>
      </div>

      <div className={styles.grid}>
        {items.map((t) => {
          const k = kindBadge(t.kind);

          return (
            <div key={`${t.kind}-${t.species_slug}`} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.badge}>
                  <span aria-hidden="true">{k.emoji}</span> {k.text}
                </span>

                <button
                  type="button"
                  className={styles.jump}
                  onClick={() => onJumpSpot(t.jumpSpotId)}
                  title="Hop til spot"
                >
                  Hop →
                </button>
              </div>

              <div className={styles.name}>{t.label}</div>

              <div className={styles.meta}>
                <span className={styles.metric}>{t.metric}</span>
                <span className={styles.dot}>·</span>
                <span className={styles.hint}>{t.hint}</span>
              </div>

              <div className={styles.actions}>
                <Link
                  className={styles.link}
                  href={`/${locale}/species/${encodeURIComponent(t.species_slug)}`}
                >
                  Se kendetegn →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}