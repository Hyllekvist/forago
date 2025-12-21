import styles from "./Me.module.css";

export default function Me() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>Me</h1>
      <div className={styles.card}>
        <p className={styles.p}>Profile + your finds will live here.</p>
      </div>
    </div>
  );
}
