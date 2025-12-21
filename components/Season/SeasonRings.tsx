import styles from "./SeasonRings.module.css";

function Ring({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={styles.ring}>
      <div className={styles.circle} style={{ ["--pct" as any]: `${pct}%` }}>
        <div className={styles.value}>{value}</div>
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}

export function SeasonRings({
  today,
  thisWeek,
  safePicks,
}: {
  today: number;
  thisWeek: number;
  safePicks: number;
}) {
  return (
    <div className={styles.row}>
      <Ring label="Today" value={today} />
      <Ring label="This week" value={thisWeek} />
      <Ring label="Safe picks" value={safePicks} />
    </div>
  );
}
