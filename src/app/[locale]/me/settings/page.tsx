import styles from "./Settings.module.css";

export default function Settings() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>Settings</h1>
      <div className={styles.card}>
        <p className={styles.p}>Theme toggle, privacy defaults, notifications, etc.</p>
      </div>
    </div>
  );
}
