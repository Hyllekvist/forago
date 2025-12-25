"use client";

import styles from "./MapTopbar.module.css";

type Props = {
  mode: "daily" | "forage";
  onToggleMode: () => void;
};

export function MapTopbar({ mode, onToggleMode }: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.title}>Naturen omkring dig i dag</div>
        <div className={styles.sub}>Opdateret · Sæsonbaseret</div>
      </div>

      <button className={styles.modeBtn} onClick={onToggleMode}>
        <span className={styles.modeDot} data-mode={mode} />
        {mode === "daily" ? "Foraging mode" : "Daily mode"}
      </button>
    </div>
  );
}
