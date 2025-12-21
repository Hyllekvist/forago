import styles from "./SpeciesCard.module.css";

export function SpeciesCard({
  title,
  season,
  safety,
}: {
  title: string;
  season: string;
  safety: string;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.title}>{title}</div>
        <div className={styles.season}>{season}</div>
      </div>
      <div className={styles.safety}>{safety}</div>
    </div>
  );
}
