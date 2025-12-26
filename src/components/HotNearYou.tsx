"use client";

import styles from "./HotNearYou.module.css";

export type HotItem = {
  species_id: string;
  slug: string;
  primary_group: string;
  scientific_name: string | null;
  total: number;
  prev_total: number;
  delta: number;
  direction: "up" | "down" | "flat";
  last_observed_at: string | null;
};

export function HotNearYou({
  title = "Hot near you",
  subtitle,
  loading,
  items,
  onPick,
}: {
  title?: string;
  subtitle?: string;
  loading: boolean;
  items: HotItem[];
  onPick?: (slug: string) => void;
}) {
  return (
    <section className={styles.wrap} aria-label="Hot near you">
      <header className={styles.head}>
        <div>
          <div className={styles.title}>{title}</div>
          <div className={styles.sub}>
            {subtitle ?? "Top arter i nærheden, baseret på de seneste logs."}
          </div>
        </div>
        <div className={styles.badge}>{loading ? "…" : `${items.length}`}</div>
      </header>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.skel}>Henter…</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>Ingen offentlige logs i området endnu.</div>
        ) : (
          items.map((it) => (
            <button
              key={it.species_id}
              className={styles.item}
              onClick={() => onPick?.(it.slug)}
            >
              <div className={styles.left}>
                <div className={styles.slug}>{it.slug}</div>
                <div className={styles.meta}>
                  <span className={styles.group}>{it.primary_group}</span>
                  {it.scientific_name ? (
                    <span className={styles.sci}>{it.scientific_name}</span>
                  ) : null}
                </div>
              </div>

              <div className={styles.right}>
                <div className={styles.total}>{it.total}</div>
                <div className={styles.delta} data-dir={it.direction}>
                  {it.direction === "up" ? "↑" : it.direction === "down" ? "↓" : "→"}{" "}
                  {Math.abs(it.delta)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}