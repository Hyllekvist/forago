import styles from "./SpeciesPage.module.css";

export default function Loading() {
  return (
    <main className={styles.wrap}>
      <div className={styles.sticky}>
        <div className={styles.stickyTop}>
          <div className={styles.skelP} style={{ width: 140, height: 34 }} />
          <div className={styles.skelChip} style={{ width: 150, height: 34 }} />
        </div>

        <div className={styles.chips}>
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
        </div>
      </div>

      <header className={styles.hero}>
        <div className={styles.skelTitle} />
        <div className={styles.skelMeta} />
        <div className={styles.skelP} />
        <div className={styles.skelP} style={{ width: "92%" }} />

        <div className={styles.skelH2} />
        <div className={styles.skelRow}>
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.skelH2} />
        <div className={styles.card}>
          <div className={styles.skelP} />
          <div className={styles.skelP} style={{ width: "88%" }} />
          <div className={styles.skelP} style={{ width: "76%" }} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.skelH2} />
        <div className={styles.card}>
          <div className={styles.skelP} />
          <div className={styles.skelP} style={{ width: "84%" }} />
        </div>
      </section>
    </main>
  );
}