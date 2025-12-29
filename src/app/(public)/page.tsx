import Link from "next/link";
import Image from "next/image";
import styles from "./PublicHome.module.css";

const HIGHLIGHTS = [
  {
    title: "Live spots — ikke guides",
    body: "Se aktive spots på kortet baseret på rigtige fund. Ikke gamle blogposts.",
    icon: "🗺️",
  },
  {
    title: "Sanke-mode",
    body: "Fokus på det, der kan findes omkring dig nu. Nærhed + aktivitet = signal.",
    icon: "🍄",
  },
  {
    title: "Stabilitet & freshness",
    body: "Vi viser om et spot er stabilt, tilbagevendende eller sporadisk — så du ikke spilder tid.",
    icon: "📈",
  },
];

const FLOWS = [
  { no: "1", title: "Åbn kortet", body: "Se hotspots i view med det samme." },
  { no: "2", title: "Vælg et spot", body: "Preview: afstand, senest set, aktivitet." },
  { no: "3", title: "Log dit fund", body: "Ét klik. Du gør signalet stærkere for alle." },
];

// “Eksempler” som føles som use-cases (ikke tom app)
const USE_CASES = [
  { title: "Hvad er værd at gå efter i dag?", tag: "Daily mode", href: "/dk/map" },
  { title: "Find sikre spots tæt på mig (2 km)", tag: "Sanke-mode", href: "/dk/map?mode=forage" },
  { title: "Se hvilke spots der er mest aktive lige nu", tag: "Aktivitet", href: "/dk/map" },
  { title: "Åbn et spot og se historik + seneste fund", tag: "Spot side", href: "/dk/map" },
];

export default function PublicHome() {
  return (
    <main className={styles.page}>
      {/* HERO */}
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

          <p className={styles.tagline}>Find naturens signaler. Før alle andre.</p>

          <p className={styles.sub}>
            Et live-kort over spots, aktivitet og sæson — baseret på rigtige fund fra mennesker.
            Daily mode for overblik. Sanke-mode når du vil ud og finde noget nu.
          </p>

          <div className={styles.ctaRow}>
            <Link href="/dk/map" className={styles.primaryCta}>
              Åbn kortet
            </Link>

            <Link href="/login" className={styles.secondaryCta}>
              Opret konto / Log ind
            </Link>

            <a href="#how" className={styles.ghostCta}>
              Se hvordan det virker
            </a>
          </div>

          <div className={styles.proofRow} aria-label="What you get">
            <div className={styles.proofPill}>📍 Spots med signal</div>
            <div className={styles.proofPill}>🧭 Tæt på dig</div>
            <div className={styles.proofPill}>⚡ Log på 5 sek</div>
          </div>
        </header>

        {/* Preview card / product teaser */}
        <aside className={styles.heroCard} aria-label="Preview">
          <div className={styles.cardTop}>
            <div className={styles.cardBadge}>Live preview</div>
            <div className={styles.cardTitle}>“Spot #kantarel — 0.8 km”</div>
            <div className={styles.cardMeta}>Senest set: i går · 12 fund · 4 sidste 30d</div>
          </div>

          <div className={styles.answer}>
            <div className={styles.answerHeader}>
              <span className={styles.avatar} aria-hidden="true" />
              <div>
                <div className={styles.answerName}>Stabilitet: Tilbagevendende</div>
                <div className={styles.answerSmall}>Signal fra flere fund over tid</div>
              </div>
            </div>

            <p className={styles.answerText}>
              Åbn spot → se top arter, historik og log dit fund. Sanke-mode filtrerer automatisk
              til relevante spots i nærheden.
            </p>
          </div>

          <div className={styles.cardActions}>
            <Link href="/dk/map" className={styles.cardActionPrimary}>
              Udforsk kortet
            </Link>
            <Link href="/dk/map?mode=forage" className={styles.cardActionSecondary}>
              Prøv Sanke-mode
            </Link>
          </div>
        </aside>
      </section>

      {/* FEATURES */}
      <section className={styles.section} aria-label="Why Forago">
        <div className={styles.sectionHead}>
          <h2 className={styles.h2Large}>Hvorfor Forago virker</h2>
          <p className={styles.p}>
            Du får et signal, ikke støj: nærhed, aktivitet og seneste fund – samlet på ét kort.
          </p>
        </div>

        <div className={styles.examplesGrid}>
          {HIGHLIGHTS.map((x) => (
            <div key={x.title} className={styles.exampleCard} role="article">
              <div className={styles.exampleTag}>{x.icon}</div>
              <div className={styles.exampleTitle}>{x.title}</div>
              <div className={styles.p}>{x.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className={styles.section} aria-label="How it works">
        <div className={styles.sectionGrid}>
          {FLOWS.map((s) => (
            <div key={s.no} className={styles.step}>
              <div className={styles.stepNo}>{s.no}</div>
              <div>
                <h2 className={styles.h2}>{s.title}</h2>
                <p className={styles.p}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className={styles.section} aria-label="Use cases">
        <div className={styles.sectionHead}>
          <h2 className={styles.h2Large}>Det her kan du gøre med det samme</h2>
          <p className={styles.p}>
            Ingen onboarding-helvede. Åbn kortet og begynd at browse spots.
          </p>
        </div>

        <div className={styles.examplesGrid}>
          {USE_CASES.map((x) => (
            <Link key={x.title} href={x.href} className={styles.exampleCard}>
              <div className={styles.exampleTag}>{x.tag}</div>
              <div className={styles.exampleTitle}>{x.title}</div>
              <div className={styles.exampleCta}>Åbn →</div>
            </Link>
          ))}
        </div>

        <div className={styles.bottomCta}>
          <Link href="/dk/map" className={styles.primaryCta}>
            Åbn kortet nu
          </Link>
          <Link href="/login" className={styles.secondaryCta}>
            Opret konto / Log ind
          </Link>
        </div>
      </section>
    </main>
  );
}
