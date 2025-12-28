"use client";

import styles from "./InsightStrip.module.css";

export type InsightKey = "season_now" | "peak" | "nearby";

type InsightItem = { label: string; value: number; hint: string };
type Insights = Partial<Record<InsightKey, InsightItem>>;

type Props = {
  mode: "daily" | "forage";
  active: InsightKey | null;
  insights: Insights; // 👈 må gerne være partial i runtime
  onPick: (k: InsightKey) => void;
};

const FALLBACK: Record<InsightKey, InsightItem> = {
  season_now: { label: "I sæson nu", value: 0, hint: "Arter" },
  peak: { label: "Peak", value: 0, hint: "I området" },
  nearby: { label: "Tæt på dig", value: 0, hint: "< 2 km" },
};

function safeItem(insights: Insights | null | undefined, k: InsightKey): InsightItem {
  const v = insights?.[k];
  if (!v || typeof v.label !== "string") return FALLBACK[k];
  return {
    label: v.label,
    value: Number.isFinite(v.value as any) ? Number(v.value) : 0,
    hint: typeof v.hint === "string" ? v.hint : FALLBACK[k].hint,
  };
}

export function InsightStrip({ active, insights, onPick }: Props) {
  const season = safeItem(insights, "season_now");
  const peak = safeItem(insights, "peak");
  const nearby = safeItem(insights, "nearby");

  return (
    <div className={styles.wrap}>
      <div className={styles.scroller}>
        <button
          className={styles.card}
          data-active={active === "season_now" ? "1" : "0"}
          onClick={() => onPick("season_now")}
          type="button"
        >
          <div className={styles.kicker}>🍄 {season.label}</div>
          <div className={styles.value}>
            {season.value} <span className={styles.muted}>{season.hint}</span>
          </div>
        </button>

        <button
          className={styles.card}
          data-active={active === "peak" ? "1" : "0"}
          onClick={() => onPick("peak")}
          type="button"
        >
          <div className={styles.kicker}>🌱 {peak.label}</div>
          <div className={styles.value}>
            {peak.value} <span className={styles.muted}>{peak.hint}</span>
          </div>
        </button>

        <button
          className={styles.card}
          data-active={active === "nearby" ? "1" : "0"}
          onClick={() => onPick("nearby")}
          type="button"
        >
          <div className={styles.kicker}>🧭 {nearby.label}</div>
          <div className={styles.value}>
            {nearby.value} <span className={styles.muted}>{nearby.hint}</span>
          </div>
        </button>
      </div>
    </div>
  );
}