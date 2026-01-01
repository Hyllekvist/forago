// src/app/[locale]/species/[slug]/loading.tsx
import styles from "./SpeciesPage.module.css";

export default function Loading() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {/* HERO placeholder (matcher FieldHero footprint visuelt) */}
        <section
          className={styles.skel}
          style={{
            height: "min(56svh, 520px)",
            borderRadius: 24,
          }}
          aria-label="Loading hero"
        />

        {/* SHEET */}
        <section className={styles.sheet} aria-label="Loading content">
          <header className={styles.header}>
            <div className={`${styles.skel} ${styles.skelTitle}`} />
            <div className={`${styles.skel} ${styles.skelSubline}`} />

            {/* chips */}
            <div className={styles.metaRow}>
              <div className={`${styles.skel} ${styles.skelChipSm}`} />
              <div className={`${styles.skel} ${styles.skelChip}`} />
              <div className={`${styles.skel} ${styles.skelChipSm}`} />
            </div>

            {/* KPI row placeholders */}
            <div className={styles.kpis}>
              <div className={styles.kpi} aria-hidden="true">
                <div className={`${styles.skel} ${styles.skelKpiLabel}`} />
                <div className={`${styles.skel} ${styles.skelKpiValue}`} />
              </div>

              <div className={styles.kpi} aria-hidden="true">
                <div className={`${styles.skel} ${styles.skelKpiLabel}`} />
                <div className={`${styles.skel} ${styles.skelKpiValue}`} />
              </div>
            </div>
          </header>

          <div className={styles.sections}>
            {/* Section 1 */}
            <section className={styles.section} aria-hidden="true">
              <div className={styles.skelSectionHead}>
                <div className={`${styles.skel} ${styles.skelH2}`} />
                <div className={`${styles.skel} ${styles.skelP}`} />
              </div>
              <div className={styles.skelBlock}>
                <div className={`${styles.skel} ${styles.skelP}`} />
                <div className={`${styles.skel} ${styles.skelP}`} style={{ width: "84%" }} />
                <div className={`${styles.skel} ${styles.skelP}`} style={{ width: "72%" }} />
              </div>
            </section>

            {/* Section 2 */}
            <section className={styles.section} aria-hidden="true">
              <div className={styles.skelSectionHead}>
                <div className={`${styles.skel} ${styles.skelH2}`} />
                <div className={`${styles.skel} ${styles.skelP}`} style={{ width: "70%" }} />
              </div>
              <div className={styles.skelBlock}>
                <div className={`${styles.skel} ${styles.skelP}`} />
                <div className={`${styles.skel} ${styles.skelP}`} style={{ width: "88%" }} />
              </div>
            </section>
          </div>

          <div className={styles.footerMeta}>
            <span className={`${styles.skel} ${styles.skelFooter}`} />
          </div>
        </section>
      </div>
    </main>
  );
}