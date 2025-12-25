import Link from "next/link";
import Image from "next/image";
import styles from "./PublicHome.module.css";

export default function PublicHome() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="forago-title">
        <header className={styles.brand}>
          <div className={styles.brandTop}>
            <span className={styles.brandIconWrap} aria-hidden="true">
              <Image
                src="/forago-mushroom.svg"
                alt=""
                width={22}
                height={22}
                className={styles.brandIcon}
                priority
              />
            </span>

            <h1 id="forago-title" className={styles.h1}>
              Forago
            </h1>
          </div>

          <p className={styles.tagline}>
            <span aria-hidden="true">🍄</span>{" "}
            Wild food, made usable. <span className={styles.dot}>·</span>{" "}
            Season-first <span className={styles.dot}>·</span> Safety-first{" "}
            <span className={styles.dot}>·</span> Privacy-first
          </p>
        </header>

        <article className={styles.valueCard}>
          <h2 className={styles.h2}>Know what’s in season — and what’s dangerous.</h2>
          <p className={styles.lede}>
            Forago helps you identify, learn, and log wild finds with guide-quality
            safety checks and privacy-respecting maps.
          </p>
        </article>

        <div className={styles.ctas}>
          <Link className={styles.primary} href="/dk">
            Start i Danmark
          </Link>
          <Link className={styles.secondary} href="/en">
            Start in English
          </Link>
        </div>

        <nav className={styles.quickNav} aria-label="Quick links">
          <Link className={styles.pill} href="/dk/season">
            Sæson
          </Link>
          <Link className={styles.pill} href="/dk/guides">
            Guides
          </Link>
          <Link className={styles.pill} href="/dk/log">
            Log
          </Link>
          <Link className={styles.pill} href="/dk/map">
            Kort
          </Link>
        </nav>

        <section className={styles.grid} aria-label="Why Forago">
          <div className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.kicker}>SEASON</span>
              <span className={styles.metaRight}>What to look for now</span>
            </div>
            <h3 className={styles.cardTitle}>In season, not in hype</h3>
            <p className={styles.cardText}>
              Sæson-overblik først. Så du finder det der faktisk findes — og lader resten være.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.kicker}>SAFETY</span>
              <span className={styles.metaRight}>Look-alikes & checks</span>
            </div>
            <h3 className={styles.cardTitle}>Built for “don’t die”</h3>
            <p className={styles.cardText}>
              Forvekslinger er det farlige. Guides med klare kendetegn og no-BS advarsler.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.kicker}>PRIVACY</span>
              <span className={styles.metaRight}>Respect nature</span>
            </div>
            <h3 className={styles.cardTitle}>Maps without exposing spots</h3>
            <p className={styles.cardText}>
              Log dine fund uden at udlevere præcise hotspots. Natur først, altid.
            </p>
          </div>
        </section>

        <footer className={styles.foot}>
          <p className={styles.footNote}>
            Forago er lavet til sankere — ikke influencers.
          </p>
        </footer>
      </section>
    </main>
  );
}