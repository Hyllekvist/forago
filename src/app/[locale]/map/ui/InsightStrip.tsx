"use client";

import styles from "./InsightStrip.module.css";

export type InsightKey = "season_now" | "peak" | "nearby";

type Insights = Record<
  InsightKey,
  { label: string; value: number; hint: string }
>;

type Props = {
  mode: "daily" | "forage";
  active: InsightKey | null;
  insights: Insights;
  onPick: (k: InsightKey) => void;
};

export function InsightStrip({ active, insights, onPick }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.scroller}>
        <button
          className={styles.card}
          data-active={active === "season_now"}
          onClick={() => onPick("season_now")}
        >
          <div className={styles.kicker}>🍄 {insights.season_now.label}</div>
          <div className={styles.value}>
            {insights.season_now.value} <span className={styles.muted}>{insights.season_now.hint}</span>
          </div>
        </button>

        <button
          className={styles.card}
          data-active={active === "peak"}
          onClick={() => onPick("peak")}
        >
          <div className={styles.kicker}>🌱 {insights.peak.label}</div>
          <div className={styles.value}>
            {insights.peak.value} <span className={styles.muted}>{insights.peak.hint}</span>
          </div>
        </button>

        <button
          className={styles.card}
          data-active={active === "nearby"}
          onClick={() => onPick("nearby")}
        >
          <div className={styles.kicker}>🧭 {insights.nearby.label}</div>
          <div className={styles.value}>
            {insights.nearby.value} <span className={styles.muted}>{insights.nearby.hint}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
