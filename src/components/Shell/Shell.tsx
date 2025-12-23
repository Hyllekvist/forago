import styles from "./Shell.module.css";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.fog} />
      <div className={styles.stack}>{children}</div>
    </div>
  );
}