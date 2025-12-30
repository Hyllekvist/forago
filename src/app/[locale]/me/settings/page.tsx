import Link from "next/link";
import styles from "./Settings.module.css";

export const dynamic = "force-dynamic";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: string | undefined): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

export default function SettingsPage({ params }: { params: { locale: string } }) {
  const locale = safeLocale(params?.locale);

  const t = {
    title: locale === "dk" ? "Settings" : "Settings",
    sub: locale === "dk" ? "App choices. No dark patterns." : "App choices. No dark patterns.",
    back: locale === "dk" ? "← Me" : "← Me",
    privacy: locale === "dk" ? "Privacy" : "Privacy",
    privacyDesc: locale === "dk" ? "Ingen præcise spots. Hold naturen sikker." : "No exact spots. Keep nature safe.",
    theme: locale === "dk" ? "Tema" : "Theme",
    themeDesc: locale === "dk" ? "Styres af toggle i headeren." : "Controlled by the header toggle.",
    language: locale === "dk" ? "Sprog" : "Language",
    languageDesc: locale === "dk" ? "Skifter via locale-routes." : "Switches via locale routes.",
    account: locale === "dk" ? "Account" : "Account",
    accountDesc: locale === "dk" ? "Session og sikkerhed." : "Session and security.",
    manageAccount: locale === "dk" ? "Åbn Me" : "Open Me",
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} href={`/${locale}/me`}>
          {t.back}
        </Link>

        <div className={styles.head}>
          <h1 className={styles.h1}>{t.title}</h1>
          <p className={styles.sub}>{t.sub}</p>
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>{t.privacy}</div>
            <span className={styles.pill}>On</span>
          </div>

          <button className={styles.row} type="button" aria-disabled="true">
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.privacy}</div>
              <div className={styles.rowSub}>{t.privacyDesc}</div>
            </div>
            <div className={styles.rowRight}>
              <span className={styles.toggle} aria-hidden="true">
                <span className={styles.toggleKnob} />
              </span>
            </div>
          </button>

          <div className={styles.hint}>
            {locale === "dk"
              ? "Coming soon: vælg om præcise spots kan vises for dig selv."
              : "Coming soon: choose if exact spots can be shown for you only."}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>{t.theme}</div>
            <span className={styles.pill}>{locale === "dk" ? "Auto" : "Auto"}</span>
          </div>

          <div className={styles.rowStatic}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.theme}</div>
              <div className={styles.rowSub}>{t.themeDesc}</div>
            </div>
            <div className={styles.rowRight}>
              <span className={styles.chev}>↗</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>{t.language}</div>
            <span className={styles.pill}>{locale.toUpperCase()}</span>
          </div>

          <div className={styles.rowStatic}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.language}</div>
              <div className={styles.rowSub}>{t.languageDesc}</div>
            </div>
            <div className={styles.rowRight}>
              <span className={styles.chev}>→</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>{t.account}</div>
            <Link className={styles.pillLink} href={`/${locale}/me`}>
              {t.manageAccount}
            </Link>
          </div>

          <div className={styles.rowStatic}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.account}</div>
              <div className={styles.rowSub}>{t.accountDesc}</div>
            </div>
            <div className={styles.rowRight}>
              <span className={styles.chev}>→</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
