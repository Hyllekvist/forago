import Link from "next/link";
import styles from "./LocaleHome.module.css";

export default function LocaleHome({ params }: { params: { locale: string } }) {
  const l = params.locale;

  const t = (dk: string, en: string) => (l === "dk" ? dk : en);

  return (
    <div className={styles.wrap}>
      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} aria-hidden>
              🍄
            </div>
            <div className={styles.brandText}>
              <div className={styles.brandName}>Forago</div>
              <div className={styles.brandTag}>
                {t("Foraging — med signal over hype", "Foraging — signal over hype")}
              </div>
            </div>
          </div>

          <div className={styles.heroCTA}>
            <Link className={styles.primary} href={`/${l}/season`}>
              {t("Se hvad der er i sæson", "See what's in season")} →
            </Link>
            <Link className={styles.secondary} href={`/${l}/map`}>
              {t("Åbn kortet", "Open the map")}
            </Link>
          </div>
        </div>

        <h1 className={styles.h1}>
          {t(
            "Find bedre spots. Undgå fejl. Og se om arten har været der før.",
            "Find better spots. Avoid mistakes. And see if a species has been here before."
          )}
        </h1>

        <p className={styles.sub}>
          {t(
            "Season-first guides, privacy-first mapping og et community der belønner kvalitet — ikke støj.",
            "Season-first guides, privacy-first mapping, and a community that rewards quality — not noise."
          )}
        </p>

        {/* VALUE STRIP */}
        <div className={styles.valueStrip}>
          <div className={styles.valueChip}>
            <span className={styles.valueK}>{t("Spørgsmål:", "Question:")}</span>
            <span className={styles.valueV}>{t("Har arten været her før?", "Has it been here before?")}</span>
          </div>
          <div className={styles.valueChip}>
            <span className={styles.valueK}>{t("Svar:", "Answer:")}</span>
            <span className={styles.valueV}>{t("Sidste observation + stabilitet", "Last seen + stability")}</span>
          </div>
          <div className={styles.valueChip}>
            <span className={styles.valueK}>{t("Privat:", "Private:")}</span>
            <span className={styles.valueV}>{t("Aggregerede områder", "Aggregated areas")}</span>
          </div>
        </div>
      </header>

      {/* FEATURE CARDS */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t("Det kan du nu", "What you can do now")}</div>

        <div className={styles.grid}>
          <Link className={styles.card} href={`/${l}/season`}>
            <div className={styles.kicker}>{t("SÆSON", "SEASON")}</div>
            <div className={styles.title}>{t("Hvad er i sæson", "What's in season")}</div>
            <div className={styles.desc}>
              {t("Klar oversigt + sikre ID-pegepinde.", "Clean overview + safe ID pointers.")}
            </div>
            <div className={styles.cardFoot}>{t("Se sæson →", "View season →")}</div>
          </Link>

          <Link className={styles.card} href={`/${l}/map`}>
            <div className={styles.kicker}>{t("KORT", "MAP")}</div>
            <div className={styles.title}>{t("Privacy-first kort", "Privacy-first map")}</div>
            <div className={styles.desc}>
              {t("Se aktivitet i områder — uden at doxxe spots.", "See area activity — without doxxing spots.")}
            </div>
            <div className={styles.cardFoot}>{t("Åbn kort →", "Open map →")}</div>
          </Link>

          <Link className={styles.card} href={`/${l}/feed`}>
            <div className={styles.kicker}>{t("FEED", "FEED")}</div>
            <div className={styles.title}>{t("Community med kvalitet", "Community with quality")}</div>
            <div className={styles.desc}>
              {t("Fund + detaljer der faktisk hjælper: set før, last seen, stabilitet.", "Finds + details that help: seen before, last seen, stability.")}
            </div>
            <div className={styles.cardFoot}>{t("Gå til feed →", "Go to feed →")}</div>
          </Link>

          <Link className={styles.card} href={`/${l}/species`}>
            <div className={styles.kicker}>{t("ARTER", "SPECIES")}</div>
            <div className={styles.title}>{t("Lær at identificere", "Learn to identify")}</div>
            <div className={styles.desc}>
              {t("Kendetegn, forvekslinger, brug og sikkerhed.", "Traits, lookalikes, usage, and safety.")}
            </div>
            <div className={styles.cardFoot}>{t("Udforsk arter →", "Explore species →")}</div>
          </Link>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className={styles.bottom}>
        <div className={styles.bottomCard}>
          <div className={styles.bottomTitle}>
            {t("Start simpelt:", "Start simple:")}
          </div>
          <div className={styles.bottomBody}>
            {t(
              "Tjek sæsonen → åbn kortet → log et fund. Resten bygger vi ovenpå.",
              "Check season → open map → log a find. We build the rest on top."
            )}
          </div>

          <div className={styles.bottomActions}>
            <Link className={styles.primary} href={`/${l}/log`}>
              {t("Log et fund", "Log a find")} →
            </Link>
            <Link className={styles.ghost} href={`/${l}/feed`}>
              {t("Se feed", "View feed")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}