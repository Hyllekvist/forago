import Link from "next/link";
import styles from "./LocaleHome.module.css";

export default function LocaleHome({ params }: { params: { locale: string } }) {
  const l = params.locale;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.h1}>Forago</h1>
        <p className={styles.sub}>
          Season-first knowledge, privacy-first mapping, community with signal over hype.
        </p>
      </div>

      <div className={styles.grid}>
        <Link className={styles.card} href={`/${l}/season`}>
          <div className={styles.kicker}>Season</div>
          <div className={styles.title}>What’s in season</div>
          <div className={styles.desc}>Clean overview + safe ID pointers.</div>
        </Link>

        <Link className={styles.card} href={`/${l}/species`}>
          <div className={styles.kicker}>Species</div>
          <div className={styles.title}>Learn to identify</div>
          <div className={styles.desc}>Traits, look-alikes, and quality notes.</div>
        </Link>

        <Link className={styles.card} href={`/${l}/feed`}>
          <div className={styles.kicker}>Community</div>
          <div className={styles.title}>Ask & share</div>
          <div className={styles.desc}>Reddit-ish threads — moderated, factual.</div>
        </Link>

        <Link className={styles.card} href={`/${l}/map`}>
          <div className={styles.kicker}>Map</div>
          <div className={styles.title}>Privacy-first cells</div>
          <div className={styles.desc}>Aggregated finds, no precise spots.</div>
        </Link>
      </div>
    </div>
  );
}
