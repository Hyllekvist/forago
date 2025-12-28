// src/app/[locale]/map/ui/MapTopbar.tsx
"use client";

import styles from "./MapTopbar.module.css";

type Props = {
  mode: "daily" | "forage";
  onToggleMode: () => void;
};

export function MapTopbar({ mode, onToggleMode }: Props) {
  const isForage = mode === "forage";

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.title}>
          {isForage ? "Sanketur i nærheden" : "Naturen omkring dig i dag"}
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