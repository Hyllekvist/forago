import styles from "./SeasonGrid.module.css";

const ITEMS = [
  { name: "Ramsløg", note: "Leaves + smell; watch look-alikes." },
  { name: "Brændenælde", note: "Young shoots for soup/tea." },
  { name: "Hyldeblomst", note: "Season soon; plan syrups." },
  { name: "Kantarel", note: "Later in summer; learn habitat now." },
];

export function SeasonGrid() {
  return (
    <div className={styles.grid}>
      {ITEMS.map((x) => (
        <div key={x.name} className={styles.card}>
          <div className={styles.name}>{x.name}</div>
          <div className={styles.note}>{x.note}</div>
        </div>
      ))}
    </div>
  );
}
