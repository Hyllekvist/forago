import Link from "next/link";
import styles from "./PublicHome.module.css";

export default function PublicHome() {
  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        {/* Brand row */}
        <div className={styles.brand}>
          <img
            src="/forago-mushroom.svg"
            alt=""
            className={styles.brandIcon}
            aria-hidden="true"
          />
          <div className={styles.brandText}>
            <h1 className={styles.h1}>Forago</h1>
            <p className={styles.sub}>
              Wild food, made usable. <span className={styles.subDim}>Season-first · Safety-first · Privacy-first</span>
            </p>
          </div>
        </div>

        {/* Big message */}
        <div className={styles.pitch}>
          <h2 className={styles.h2}>
            Know what’s in season — and what’s dangerous.
          </h2>
          <p className={styles.lead}>
            Forago helps you identify, learn, and log wild finds with guide-quality safety checks and
            privacy-respecting maps.
          </p>
        </div>

        {/* Primary actions */}
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/dk">
            Start i Danmark
          </Link>
          <Link className={styles.secondary} href="/en">
            Start in English
          </Link>
          <div className={styles.quickLinks}>
            <Link className={styles.pill} href="/dk/season">Sæson</Link>
            <Link className={styles.pill} href="/dk/guides">Guides</Link>
            <Link className={styles.pill} href="/dk/log">Log</Link>
            <Link className={styles.pill} href="/dk/map">Kort</Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.kicker}>Season</span>
              <span className={styles.mini}>What to look for now</span>
            </div>
            <h3 className={styles.cardH}>In season, not in hype</h3>
            <p className={styles.cardP}>
              Sæson-overblik først. Så du finder det der faktisk findes — og lader resten være.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.kicker}>Safety</span>
              <span className={styles.mini}>Look-alikes & checks</span>
            </div>
            <h3 className={styles.cardH}>Built for “don’t die”</h3>
            <p className={styles.cardP}>
              Guides med forvekslinger, tjeklister og klare “stop”-regler. Ikke fluffy blog-tekst.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.kicker}>Privacy</span>
              <span className={styles.mini}>Geo without damage</span>
            </div>
            <h3 className={styles.cardH}>Log finds without exposing nature</h3>
            <p className={styles.cardP}>
              Del viden uden at udstille spots. Privacy-first som default.
            </p>
          </div>
        </div>

        {/* Trust / bottom strip */}
        <div className={styles.footerStrip}>
          <div className={styles.stripItem}>
            <span className={styles.stripTitle}>Guides</span>
            <span className={styles.stripText}>Korte TL;DR + dybde, samme design som resten.</span>
          </div>
          <div className={styles.stripDivider} />
          <div className={styles.stripItem}>
            <span className={styles.stripTitle}>Log</span>
            <span className={styles.stripText}>Gem fund, foto og noter — også når du ikke kender arten.</span>
          </div>
        </div>
      </div>
    </main>
  );
}