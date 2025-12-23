import styles from "./Lookalikes.module.css";

export function Lookalikes({
  items,
}: {
  items: { name: string; risk: "good" | "warn" | "bad"; note: string }[];
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Look-alikes</h2>
      <div className={styles.grid}>
        {items.map((x) => (
          <div key={x.name} className={`${styles.card} ${styles[x.risk]}`}>
            <div className={styles.name}>{x.name}</div>
            <div className={styles.note}>{x.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
