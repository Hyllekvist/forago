import Link from "next/link";
import styles from "./LocaleHome.module.css";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

function t(locale: string, dk: string, en: string) {
  return locale === "dk" ? dk : en;
}

export default function LocaleHome({ params }: { params: { locale: string } }) {
  const locale = safeLocale(params?.locale);
  const l = locale;

  const nav = [
    { href: `/${l}/season`, label: t(l, "Sæson nu", "In season") },
    { href: `/${l}/guides`, label: t(l, "Guides", "Guides") },
    { href: `/${l}/log`, label: t(l, "Log", "Log") },
    { href: `/${l}/map`, label: t(l, "Kort", "Map") },
  ];

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.brandCard}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon} aria-hidden>
              🍄
            </div>
            <div className={styles.brandMeta}>
              <div className={styles.brandName}>Forago</div>
              <div className={styles.brandLine}>
                {t(
                  l,
                  "Wild food, gjort brugbart · Sæson først · Sikkerhed først · Privacy først",
                  "Wild food, made usable · Season-first · Safety-first · Privacy-first"
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroCard}>
          <h1 className={styles.h1}>
            {t(l, "Find det der er i sæson — og undgå det farlige.", "Know what’s in season — and what’s dangerous.")}
          </h1>

          <p className={styles.sub}>
            {t(
              l,
              "Forago hjælper dig med at identificere, lære og logge fund — med guide-kvalitet, no-BS advarsler og kort der respekterer naturen.",
              "Forago helps you identify, learn, and log wild finds — with guide-grade safety checks and maps that respect nature."
            )}
          </p>

          <div className={styles.ctaRow}>
            <Link className={styles.ctaPrimary} href={`/${l}/map`}>
              {t(l, "Åbn kortet", "Open the map")}
              <span className={styles.ctaArrow} aria-hidden>
                →
              </span>
            </Link>

            <Link className={styles.ctaSecondary} href={`/${l}/season`}>
              {t(l, "Se sæson nu", "See season now")}
            </Link>
          </div>

          <div className={styles.quickNav} role="navigation" aria-label="Quick links">
            {nav.map((x) => (
              <Link key={x.href} className={styles.pill} href={x.href}>
                {x.label}
              </Link>
            ))}
          </div>
        </div>

        {/* TRUST STRIP */}
        <div className={styles.trust}>
          <div className={styles.trustItem}>
            <div className={styles.trustK}>{t(l, "Signal", "Signal")}</div>
            <div className={styles.trustV}>{t(l, "Sæson > hype", "Season > hype")}</div>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustK}>{t(l, "Sikkerhed", "Safety")}</div>
            <div className={styles.trustV}>{t(l, "Forvekslinger + checks", "Look-alikes + checks")}</div>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustK}>{t(l, "Privacy", "Privacy")}</div>
            <div className={styles.trustV}>{t(l, "Aggregated cells", "Aggregated cells")}</div>
          </div>
        </div>
      </section>

      {/* VALUE GRID */}
      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.h2}>{t(l, "Det du får", "What you get")}</h2>
          <div className={styles.sectionHint}>
            {t(l, "Bygget til sankere — ikke influencers.", "Built for foragers — not influencers.")}
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardKicker}>{t(l, "SÆSON", "SEASON")}</div>
            <div className={styles.cardTitle}>{t(l, "In season, not in hype", "In season, not in hype")}</div>
            <div className={styles.cardDesc}>
              {t(
                l,
                "Sæson-overblik først. Så du leder efter det der faktisk findes — og dropper resten.",
                "Season overview first. So you look for what’s actually there — and skip the rest."
              )}
            </div>
            <Link className={styles.cardLink} href={`/${l}/season`}>
              {t(l, "Åbn sæson", "Open season")} →
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.cardKicker}>{t(l, "SAFETY", "SAFETY")}</div>
            <div className={styles.cardTitle}>{t(l, 'Built for "don’t die"', 'Built for "don’t die"')}</div>
            <div className={styles.cardDesc}>
              {t(
                l,
                "Forvekslinger er det farlige. Guides med klare kendetegn og no-BS advarsler.",
                "Look-alikes are the danger. Clear traits and no-BS warnings."
              )}
            </div>
            <Link className={styles.cardLink} href={`/${l}/guides`}>
              {t(l, "Se guides", "See guides")} →
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.cardKicker}>{t(l, "PRIVACY", "PRIVACY")}</div>
            <div className={styles.cardTitle}>{t(l, "Kort uden at udlevere hotspots", "Maps without exposing hotspots")}</div>
            <div className={styles.cardDesc}>
              {t(
                l,
                "Log fund uden at udlevere præcis lokation. Natur først, altid.",
                "Log finds without exposing precise spots. Nature first, always."
              )}
            </div>
            <Link className={styles.cardLink} href={`/${l}/map`}>
              {t(l, "Åbn kort", "Open map")} →
            </Link>
          </div>

          <div className={styles.card} data-accent="true">
            <div className={styles.cardKicker}>FORAGO INTELLIGENCE</div>
            <div className={styles.cardTitle}>
              {t(l, "Svar på det du faktisk vil vide", "Answers to what you actually care about")}
            </div>
            <div className={styles.cardDesc}>
              {t(
                l,
                "Har arten været her før? Hvornår var sidste observation? Er stedet stabilt over år?",
                "Has it been here before? When was it last seen? Is this spot stable over years?"
              )}
            </div>

            <div className={styles.qaList}>
              <div className={styles.qa}>
                <div className={styles.qaQ}>{t(l, "Har arten været her før?", "Has it been here before?")}</div>
                <div className={styles.qaA}>{t(l, "Ja/nej + kontekst", "Yes/no + context")}</div>
              </div>
              <div className={styles.qa}>
                <div className={styles.qaQ}>{t(l, "Hvornår var sidste observation?", "When was it last seen?")}</div>
                <div className={styles.qaA}>{t(l, "Dato + aktivitet", "Date + activity")}</div>
              </div>
              <div className={styles.qa}>
                <div className={styles.qaQ}>{t(l, "Er spot stabilt over år?", "Is it stable over years?")}</div>
                <div className={styles.qaA}>{t(l, "Stabil / ny / ustabil", "Stable / new / unstable")}</div>
              </div>
            </div>

            <div className={styles.cardNote}>
              {t(
                l,
                "Vises automatisk på fund-siden og kortet, baseret på aggregated data.",
                "Shown automatically on find pages and map, based on aggregated data."
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.h2}>{t(l, "Sådan bruger du det", "How it works")}</h2>
          <div className={styles.sectionHint}>{t(l, "3 trin. Ingen bullshit.", "3 steps. No bullshit.")}</div>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepTitle}>{t(l, "Tjek sæson", "Check season")}</div>
            <div className={styles.stepDesc}>
              {t(l, "Start med det der er realistisk lige nu.", "Start with what’s realistic right now.")}
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepTitle}>{t(l, "Verificér sikkert", "Verify safely")}</div>
            <div className={styles.stepDesc}>
              {t(l, "Kendetegn + forvekslinger før du spiser noget.", "Traits + look-alikes before you eat anything.")}
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepTitle}>{t(l, "Log uden at afsløre", "Log without exposing")}</div>
            <div className={styles.stepDesc}>
              {t(l, "Del signal — ikke præcise spots.", "Share signal — not precise hotspots.")}
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className={styles.ctaStrip}>
        <div className={styles.ctaStripInner}>
          <div className={styles.ctaStripLeft}>
            <div className={styles.ctaStripTitle}>{t(l, "Klar til at finde noget?", "Ready to find something?")}</div>
            <div className={styles.ctaStripSub}>
              {t(l, "Åbn kortet og se signalet i dit område.", "Open the map and see the signal near you.")}
            </div>
          </div>

          <div className={styles.ctaStripRight}>
            <Link className={styles.ctaPrimary} href={`/${l}/map`}>
              {t(l, "Åbn kort", "Open map")} →
            </Link>
            <Link className={styles.ctaSecondary} href={`/${l}/log`}>
              {t(l, "Log et fund", "Log a find")}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLine}>
          {t(
            l,
            "Forago er lavet til sankere — ikke influencers. Respekt naturen.",
            "Forago is for foragers — not influencers. Respect nature."
          )}
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className={styles.stickyCta} aria-hidden={false}>
        <Link className={styles.stickyBtn} href={`/${l}/map`}>
          {t(l, "Åbn kortet", "Open map")} →
        </Link>
      </div>
    </main>
  );
}