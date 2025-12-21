import styles from "./Log.module.css";
import { FindComposer } from "@/components/Finds/FindComposer";

export default function Log() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>Log a find</h1>
      <p className={styles.sub}>
        We store only a coarse cell id (privacy-first). Never reveal exact spots.
      </p>
      <FindComposer />
    </div>
  );
}
