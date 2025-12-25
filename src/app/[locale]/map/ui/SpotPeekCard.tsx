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

export function SpotPeekCard({ spot, onClose, onLog, onLearn }: Props) {
  return (
    <div className={styles.card}>
      <button className={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className={styles.kicker}>
        {spot.species_slug ? `#${spot.species_slug}` : "Spot"}
      </div>
      <div className={styles.title}>{spot.title ?? "Ukendt spot"}</div>

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
