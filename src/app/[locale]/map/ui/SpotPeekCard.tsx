"use client";

import styles from "./SpotPeekCard.module.css";
import type { Spot } from "../LeafletMap";

type Props = {
  spot: Spot;
  mode: "daily" | "forage";
  onClose: () => void;
  onLog: () => void;
  onLearn: () => void;
};

function prettySpecies(slug?: string | null) {
  if (!slug) return null;
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function SpotPeekCard({ spot, mode, onClose, onLog, onLearn }: Props) {
  const species = prettySpecies(spot.species_slug);
  const title = spot.title ?? species ?? "Ukendt spot";

  return (
    <div className={styles.card} data-mode={mode} role="dialog" aria-label="Spot details">
      <div className={styles.glow} aria-hidden />

      <button className={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.badge}>
            {mode === "forage" ? "⚡ Peak i området" : "📍 Fund-spot"}
          </div>

          <div className={styles.title}>{title}</div>

          <div className={styles.meta}>
            {species ? <span className={styles.tag}>{species}</span> : <span className={styles.tag}>Spot</span>}
            <span className={styles.dot}>•</span>
            <span className={styles.muted}>Tryk for at logge eller lære</span>
          </div>
        </div>

        <div className={styles.heroRight} aria-hidden>
          <div className={styles.pulse} />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} onClick={onLog}>
          Log fund
        </button>
        <button className={styles.secondary} onClick={onLearn}>
          Lær mere
        </button>
      </div>
    </div>
  );
}