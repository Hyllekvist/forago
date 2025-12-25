"use client"; 

import styles from "./MapSheet.module.css";
import type { Spot } from "../LeafletMap";

type Props = {
  mode: "daily" | "forage";
  expanded: boolean;
  onToggle: () => void;
  title: string;

  items: Spot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLog: (id: string) => void;
};

export function MapSheet({
  expanded,
  onToggle,
  title,
  items,
  selectedId,
  onSelect,
  onLog,
}: Props) {
  return (
    <div className={styles.sheet} data-expanded={expanded}>
      <button className={styles.grab} onClick={onToggle} aria-label="Toggle list">
        <span className={styles.handle} />
      </button>

      <div className={styles.header} onClick={onToggle} role="button">
        <div className={styles.hTitle}>{title}</div>
        <div className={styles.hHint}>{expanded ? "Skjul" : "Udforsk"}</div>
      </div>

      <div className={styles.body}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Ingen spots i view endnu</div>
            <div className={styles.emptySub}>Pan/zoom kortet – eller slå “Tæt på dig” til.</div>
          </div>
        ) : (
          <div className={styles.list}>
            {items.slice(0, 40).map((s) => {
              const active = s.id === selectedId;
              return (
                <div key={s.id} className={styles.row} data-active={active}>
                  <button className={styles.rowMain} onClick={() => onSelect(s.id)}>
                    <div className={styles.rowTitle}>{s.title ?? "Spot"}</div>
                    <div className={styles.rowMeta}>
                      {s.species_slug ? `#${s.species_slug}` : "—"}
                    </div>
                  </button>

                  <button className={styles.logBtn} onClick={() => onLog(s.id)}>
                    Log
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
