import styles from "./Me.module.css";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

export default async function MePage({ params }: { params: { locale: string } }) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{locale === "dk" ? "Me" : "Me"}</h1>
        <p className={styles.sub}>
          {locale === "dk" ? "Account + app preferences." : "Account + app preferences."}
        </p>
      </header>

      {!user ? (
        <section className={styles.card}>
          <div className={styles.cardTop}>
            <div>
              <div className={styles.kicker}>{locale === "dk" ? "Ikke logget ind" : "Not signed in"}</div>
              <div className={styles.title}>
                {locale === "dk" ? "Log ind for at gemme fund og bruge loggen" : "Sign in to save finds and use the log"}
              </div>
            </div>
            <Link className={styles.primaryBtn} href={`/${locale}/login?returnTo=/${locale}/me`}>
              {locale === "dk" ? "Log ind" : "Sign in"}
            </Link>
          </div>

          <div className={styles.grid2}>
            <div className={styles.miniCard}>
              <div className={styles.miniLabel}>{locale === "dk" ? "Privacy" : "Privacy"}</div>
              <div className={styles.miniValue}>{locale === "dk" ? "Skjul præcise spots" : "Hide exact spots"}</div>
            </div>
            <div className={styles.miniCard}>
              <div className={styles.miniLabel}>{locale === "dk" ? "Sync" : "Sync"}</div>
              <div className={styles.miniValue}>{locale === "dk" ? "På tværs af enheder" : "Across devices"}</div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.identity}>
                <div className={styles.avatar} aria-hidden="true">
                  {user.email?.slice(0, 1)?.toUpperCase() ?? "U"}
                </div>
                <div className={styles.identityText}>
                  <div className={styles.kicker}>{locale === "dk" ? "Signed in as" : "Signed in as"}</div>
                  <div className={styles.email}>{user.email}</div>
                  <div className={styles.meta}>
                    <span className={styles.badge}>{locale === "dk" ? "Konto" : "Account"}</span>
                    {user.email_confirmed_at ? (
                      <span className={styles.badgeOk}>{locale === "dk" ? "Bekræftet" : "Verified"}</span>
                    ) : (
                      <span className={styles.badgeWarn}>{locale === "dk" ? "Ikke bekræftet" : "Unverified"}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Link className={styles.secondaryBtn} href={`/${locale}/settings`}>
                  {locale === "dk" ? "Settings" : "Settings"}
                </Link>
                <Link className={styles.secondaryBtn} href={`/${locale}/ask`}>
                  {locale === "dk" ? "Ask" : "Ask"}
                </Link>
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>{locale === "dk" ? "Dine fund" : "Your finds"}</div>
                <div className={styles.statValue}>—</div>
                <div className={styles.statHint}>{locale === "dk" ? "Kommer når log er live" : "Shown when log is live"}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>{locale === "dk" ? "Streak" : "Streak"}</div>
                <div className={styles.statValue}>—</div>
                <div className={styles.statHint}>{locale === "dk" ? "Daglige check-ins" : "Daily check-ins"}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>{locale === "dk" ? "Privacy mode" : "Privacy mode"}</div>
                <div className={styles.statValue}>On</div>
                <div className={styles.statHint}>{locale === "dk" ? "Ingen præcise spots" : "No exact spots"}</div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>{locale === "dk" ? "Preferences" : "Preferences"}</div>

            <div className={styles.rows}>
              <Link className={styles.row} href={`/${locale}/settings`}>
                <div className={styles.rowLeft}>
                  <div className={styles.rowTitle}>{locale === "dk" ? "Privacy" : "Privacy"}</div>
                  <div className={styles.rowSub}>{locale === "dk" ? "Hold naturen sikker" : "Keep nature safe"}</div>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.pill}>On</span>
                  <span className={styles.chev}>→</span>
                </div>
              </Link>

              <Link className={styles.row} href={`/${locale}/settings`}>
                <div className={styles.rowLeft}>
                  <div className={styles.rowTitle}>{locale === "dk" ? "Tema" : "Theme"}</div>
                  <div className={styles.rowSub}>{locale === "dk" ? "Styres i headeren" : "Controlled in header"}</div>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.pill}>{locale === "dk" ? "Auto" : "Auto"}</span>
                  <span className={styles.chev}>→</span>
                </div>
              </Link>

              <Link className={styles.row} href={`/${locale}/settings`}>
                <div className={styles.rowLeft}>
                  <div className={styles.rowTitle}>{locale === "dk" ? "Sprog" : "Language"}</div>
                  <div className={styles.rowSub}>{locale === "dk" ? "Skifter via locale-routes" : "Via locale routes"}</div>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.pill}>{locale.toUpperCase()}</span>
                  <span className={styles.chev}>→</span>
                </div>
              </Link>
            </div>

            <div className={styles.divider} />

            <div className={styles.danger}>
              <div>
                <div className={styles.dangerTitle}>{locale === "dk" ? "Session" : "Session"}</div>
                <div className={styles.dangerSub}>{locale === "dk" ? "Log ud på denne enhed" : "Sign out on this device"}</div>
              </div>

              {/* Client-only logout */}
              {/* @ts-expect-error Server -> Client boundary */}
              <LogoutButton locale={locale} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}

// Server file kan importere client component sådan her:
import LogoutButton from "./LogoutButton";
