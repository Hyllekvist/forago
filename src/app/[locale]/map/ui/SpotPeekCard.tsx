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

function emojiForSpot(spot: Spot) {
  const slug = (spot.species_slug ?? "").toLowerCase();
  if (slug.includes("kantarel") || slug.includes("svamp")) return "🍄";
  if (slug.includes("ramsl")) return "🌿";
  if (slug.includes("hyld")) return "🌸";
  return "📍";
}

export function SpotPeekCard({ spot, mode, onClose, onLog, onLearn }: Props) {
  const tag = spot.species_slug ? `#${spot.species_slug}` : "Fund-spot";
  const title = spot.title ?? "Ukendt spot";

  return (
    <div className={styles.card} role="dialog" aria-label="Valgt spot">
      <div className={styles.topRow}>
        <div className={styles.modePill}>
          <span className={styles.modeDot} aria-hidden />
          {mode === "forage" ? "Forage" : "Daily"}
        </div>

        <button className={styles.close} onClick={onClose} aria-label="Luk">
          ✕
        </button>
      </div>

      <div className={styles.head}>
        <div className={styles.avatar} aria-hidden>
          {emojiForSpot(spot)}
        </div>

        <div className={styles.headText}>
          <div className={styles.kicker}>{tag}</div>
          <div className={styles.title}>{title}</div>
          <div className={styles.hint}>Tryk for at logge eller lære</div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} onClick={onLog}>
          <span className={styles.btnTitle}>Log fund</span>
          <span className={styles.btnSub}>+ foto • note • GPS</span>
        </button>

        <button className={styles.secondary} onClick={onLearn}>
          <span className={styles.btnTitle}>Lær mere</span>
          <span className={styles.btnSub}>Sank sikkert</span>
        </button>
      </div>
    </div>
  );
}