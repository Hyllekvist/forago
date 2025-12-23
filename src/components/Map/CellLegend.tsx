import styles from "./CellLegend.module.css";

export function CellLegend() {
  return (
    <div className={styles.row}>
      <div className={styles.item}><span className={styles.dot} /> Low</div>
      <div className={styles.item}><span className={styles.dot2} /> Medium</div>
      <div className={styles.item}><span className={styles.dot3} /> High</div>
    </div>
  );
}
