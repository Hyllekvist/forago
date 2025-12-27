import Link from "next/link";
import Image from "next/image";
import styles from "./PublicHome.module.css";

const EXAMPLES = [
  { title: "Hvor finder man de bedste østers på Sjælland?", tag: "Mad & natur" },
  { title: "Hvilken varmepumpe giver bedst mening i et 70’er hus?", tag: "Bolig" },
  { title: "God børnevenlig strand nær Kalundborg?", tag: "Lokalt" },
  { title: "Bedste kaffebar til arbejde i København?", tag: "Byliv" },
];

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
            Svar fra mennesker – ikke støj.
          </p>

          <p className={styles.sub}>
            Stil et spørgsmål. Få svar fra folk, der faktisk ved noget — lokalt, praktisk og uden algoritme-rod.
          </p>

          <div className={styles.ctaRow}>
            <Link href="/ask" className={styles.primaryCta}>
              Stil dit spørgsmål
            </Link>

            <a href="#examples" className={styles.secondaryCta}>
              Se eksempler
            </a>

            <Link href="/login" className={styles.ghostCta}>
              Log ind
            </Link>
          </div>

          <div className={styles.proofRow} aria-label="Social proof">
            <div className={styles.proofPill}>⚡ Hurtige, konkrete svar</div>
            <div className={styles.proofPill}>📍 Lokal viden</div>
            <div className={styles.proofPill}>🧠 Praktisk erfaring</div>
          </div>
        </header>

        <aside className={styles.heroCard} aria-label="Preview">
          <div className={styles.cardTop}>
            <div className={styles.cardBadge}>Live eksempel</div>
            <div className={styles.cardTitle}>“Hvor kan man finde østers i Danmark?”</div>
            <div className={styles.cardMeta}>3 svar · 12 min · Sjælland</div>
          </div>

          <div className={styles.answer}>
            <div className={styles.answerHeader}>
              <span className={styles.avatar} aria-hidden="true" />
              <div>
                <div className={styles.answerName}>Maja</div>
                <div className={styles.answerSmall}>Har samlet i 8 år</div>
              </div>
            </div>
            <p className={styles.answerText}>
              Prøv Isefjorden ved lavvande — start ved de små vige, og tjek altid Fødevarestyrelsens råd før du spiser.
            </p>
          </div>

          <div className={styles.cardActions}>
            <Link href="/ask" className={styles.cardActionPrimary}>
              Spørg selv
            </Link>
            <Link href="/ask" className={styles.cardActionSecondary}>
              Se flere svar
            </Link>
          </div>
        </aside>
      </section>

      <section className={styles.section} aria-label="How it works">
        <div className={styles.sectionGrid}>
          <div className={styles.step}>
            <div className={styles.stepNo}>1</div>
            <div>
              <h2 className={styles.h2}>Stil et spørgsmål</h2>
              <p className={styles.p}>Hold det konkret. Jo mere praktisk, jo bedre svar.</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNo}>2</div>
            <div>
              <h2 className={styles.h2}>Få svar fra folk</h2>
              <p className={styles.p}>Erfaring og lokale tips slår generiske artikler.</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNo}>3</div>
            <div>
              <h2 className={styles.h2}>Gem og brug det</h2>
              <p className={styles.p}>Svar bliver til et bibliotek af løsninger — ikke en endeløs kommentartråd.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="examples" className={styles.section} aria-labelledby="examples-title">
        <div className={styles.sectionHead}>
          <h2 id="examples-title" className={styles.h2Large}>
            Eksempler på spørgsmål
          </h2>
          <p className={styles.p}>
            Klik og kom i gang. Det skal føles “åbent” — ikke som en tom app.
          </p>
        </div>

        <div className={styles.examplesGrid}>
          {EXAMPLES.map((x) => (
            <Link key={x.title} href="/ask" className={styles.exampleCard}>
              <div className={styles.exampleTag}>{x.tag}</div>
              <div className={styles.exampleTitle}>{x.title}</div>
              <div className={styles.exampleCta}>Stil lignende →</div>
            </Link>
          ))}
        </div>

        <div className={styles.bottomCta}>
          <Link href="/ask" className={styles.primaryCta}>
            Stil dit spørgsmål nu
          </Link>
          <Link href="/login" className={styles.secondaryCta}>
            Opret konto / Log ind
          </Link>
        </div>
      </section>
    </main>
  );
}
