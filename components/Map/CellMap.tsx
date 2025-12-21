import styles from "./CellMap.module.css";
import { CellLegend } from "./CellLegend";

const DEMO = [
  { id: "dk-2-10-20", count: 12 },
  { id: "dk-2-10-21", count: 6 },
  { id: "dk-2-11-20", count: 2 },
];

export function CellMap() {
  return (
    <div className={styles.wrap}>
      <CellLegend />
      <div className={styles.grid}>
        {DEMO.map((c) => (
          <div key={c.id} className={styles.cell} title={c.id}>
            <div className={styles.count}>{c.count}</div>
          </div>
        ))}
      </div>
      <p className={styles.note}>
        Demo view. Real implementation renders a coarse grid per region with aggregated counts.
      </p>
    </div>
  );
}
