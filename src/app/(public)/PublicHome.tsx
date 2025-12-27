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

          {/* 👇 DETTE ER KERNEN */}
          <p className={styles.tagline}>
            Få svar fra rigtige mennesker – lokalt, hurtigt og uden bullshit.
          </p>

          <p className={styles.sub}>
            Stil dit spørgsmål og få svar fra folk, der faktisk ved noget.
            Ikke algoritmer. Ikke støj.
          </p>

          <div className={styles.ctaWrap}>
            <Link href="/ask" className={styles.primaryCta}>
              Stil dit spørgsmål
            </Link>
          </div>
        </header>
      </section>
    </main>
  );
}
