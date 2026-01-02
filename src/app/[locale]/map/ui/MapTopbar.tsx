"use client";

import styles from "./MapTopbar.module.css";

type Props = {
  mode: "daily" | "forage";
  onToggleMode: () => void;
  onBack?: () => void;
};

export function MapTopbar({ mode, onToggleMode, onBack }: Props) {
  const isForage = mode === "forage";

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.row}>
          {onBack ? (
            <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Tilbage">
              ←
            </button>
          ) : null}

          <div className={styles.title}>
            {isForage ? "Sanketur i nærheden" : "Naturen omkring dig i dag"}
          </div>
        </div>

        <div className={styles.sub}>
          {isForage ? "Opdateret · Fokus på fund" : "Opdateret · Sæsonbaseret"}
        </div>
      </div>

      <button className={styles.modeBtn} onClick={onToggleMode} type="button">
        <span className={styles.modeDot} data-mode={mode} />
        {isForage ? "I dag" : "Sankemode"}
      </button>
    </div>
  );
}