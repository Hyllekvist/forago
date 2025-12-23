import styles from "./SafetyCallout.module.css";

export function SafetyCallout({
  level,
  title,
  body,
}: {
  level: "good" | "warn" | "bad";
  title: string;
  body: string;
}) {
  const cls =
    level === "good" ? styles.good : level === "bad" ? styles.bad : styles.warn;

  return (
    <div className={`${styles.box} ${cls}`}>
      <div className={styles.title}>{title}</div>
      <div className={styles.body}>{body}</div>
    </div>
  );
}
