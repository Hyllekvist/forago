import styles from "./Map.module.css";
import { CellMap } from "@/components/Map/CellMap";

export default function Map() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>Map</h1>
      <p className={styles.sub}>
        Aggregated cells only. No pins. No routes. Protect nature + trust.
      </p>
      <CellMap />
    </div>
  );
}
