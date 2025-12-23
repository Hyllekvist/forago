import Link from "next/link";
import styles from "./PublicHome.module.css";

export default function PublicHome() {
  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.brand}>
          <div className={styles.mark} aria-hidden />
          <div>
            <h1 className={styles.h1}>Forago</h1>
            <p className={styles.sub}>
              Find, understand, and use wild food — season-first, privacy-first.
            </p>
          </div>
        </div>

        <div className={styles.ctas}>
          <Link className={styles.primary} href="/dk">
            Enter Denmark
          </Link>
          <Link className={styles.secondary} href="/en">
            English
          </Link>
        </div>

        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>Season</h3>
            <p>What’s in season — and how to use it safely.</p>
          </div>
          <div className={styles.card}>
            <h3>Community</h3>
            <p>Ask, answer, and build collective knowledge.</p>
          </div>
          <div className={styles.card}>
            <h3>Privacy-first geo</h3>
            <p>Map finds without exposing nature or spots.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
