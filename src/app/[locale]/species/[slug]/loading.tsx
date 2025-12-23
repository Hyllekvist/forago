// src/app/[locale]/species/[slug]/loading.tsx
import styles from "./SpeciesPage.module.css";

export default function Loading() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.skelTitle} />
        <div className={styles.skelMeta} />
        <div className={styles.skelP} />
        <div className={styles.skelP} />
        <div className={styles.skelRow}>
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.skelH2} />
        <div className={styles.skelP} />
        <div className={styles.skelP} />
      </div>
    </main>
  );
}