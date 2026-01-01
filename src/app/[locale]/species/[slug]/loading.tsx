import FieldHero from "./FieldHero";
import styles from "./SpeciesPage.module.css";

export default function Loading() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {/* Hero skeleton (genbruger FieldHero layout) */}
        <div className={styles.heroSkelWrap}>
          <FieldHero imageUrl={null} alt="" />
          <div className={styles.heroSkelOverlay} aria-hidden="true" />
        </div>

        {/* Sheet skeleton */}
        <section className={styles.sheet}>
          <header className={styles.header}>
            <div className={`${styles.skel} ${styles.skelTitle}`} />
            <div className={`${styles.skel} ${styles.skelSubline}`} />

            <div className={styles.metaRow}>
              <div className={`${styles.skel} ${styles.skelChip}`} />
              <div className={`${styles.skel} ${styles.skelChip}`} />
              <div className={`${styles.skel} ${styles.skelChipSm}`} />
            </div>

            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <div className={`${styles.skel} ${styles.skelKpiLabel}`} />
                <div className={`${styles.skel} ${styles.skelKpiValue}`} />
              </div>
              <div className={styles.kpi}>
                <div className={`${styles.skel} ${styles.skelKpiLabel}`} />
                <div className={`${styles.skel} ${styles.skelKpiValue}`} />
              </div>
            </div>
          </header>

          <div className={styles.sections}>
            {[0, 1, 2].map((i) => (
              <section key={i} className={styles.section}>
                <div className={styles.skelSectionHead}>
                  <div className={`${styles.skel} ${styles.skelH2}`} />
                  <div className={`${styles.skel} ${styles.skelP}`} />
                </div>

                <div className={styles.skelBlock}>
                  <div className={`${styles.skel} ${styles.skelP}`} />
                  <div className={`${styles.skel} ${styles.skelP}`} style={{ width: "86%" }} />
                  <div className={`${styles.skel} ${styles.skelP}`} style={{ width: "72%" }} />
                </div>
              </section>
            ))}
          </div>

          <div className={styles.footerMeta}>
            <span className={`${styles.skel} ${styles.skelFooter}`} />
          </div>
        </section>
      </div>
    </main>
  );
}