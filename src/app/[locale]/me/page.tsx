// src/app/[locale]/me/page.tsx
import styles from "./Me.module.css";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import LogoutButton from "@/components/Auth/LogoutButton";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

export default async function MePage({ params }: { params: { locale: string } }) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  // --- metrics (server-side) ---
  let myFindsCount = 0;

  if (user) {
    // Count my finds
    const { count, error } = await supabase
      .from("finds")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!error) myFindsCount = count ?? 0;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Me</h1>
        <p className={styles.sub}>Account + app preferences.</p>
      </header>

      <div className={styles.shell}>
        {!user ? (
          <section className={styles.heroCard}>
            <div className={styles.heroTop}>
              <div>
                <div className={styles.kicker}>
                  {locale === "dk" ? "Ikke logget ind" : "Not signed in"}
                </div>
                <div className={styles.email}>
                  {locale === "dk"
                    ? "Log ind for at gemme fund og bruge loggen"
                    : "Sign in to save finds and use the log"}
                </div>
              </div>

              <div className={styles.heroActions}>
                <Link className={styles.primaryBtn} href={`/${locale}/login?returnTo=/${locale}/me`}>
                  {locale === "dk" ? "Log ind" : "Sign in"}
                </Link>
              </div>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Privacy</div>
                <div className={styles.statValue}>{locale === "dk" ? "Skjul" : "Hide"}</div>
                <div className={styles.statHint}>
                  {locale === "dk" ? "Ingen præcise spots" : "No exact spots"}
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Sync</div>
                <div className={styles.statValue}>{locale === "dk" ? "Klar" : "Ready"}</div>
                <div className={styles.statHint}>
                  {locale === "dk" ? "På tværs af enheder" : "Across devices"}
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Guides</div>
                <div className={styles.statValue}>{locale === "dk" ? "In-app" : "In-app"}</div>
                <div className={styles.statHint}>
                  {locale === "dk" ? "Sikkerhed først" : "Safety first"}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className={styles.heroCard}>
              <div className={styles.heroTop}>
                <div className={styles.identity}>
                  <div className={styles.avatar} aria-hidden="true">
                    {user.email?.slice(0, 1)?.toUpperCase() ?? "U"}
                  </div>

                  <div className={styles.idText}>
                    <div className={styles.kicker}>
                      {locale === "dk" ? "Signed in as" : "Signed in as"}
                    </div>
                    <div className={styles.email}>{user.email}</div>
                    <div className={styles.badges}>
                      <span className={styles.badge}>
                        {locale === "dk" ? "Konto" : "Account"}
                      </span>
                      {user.email_confirmed_at ? (
                        <span className={styles.badgeOk}>
                          {locale === "dk" ? "Bekræftet" : "Verified"}
                        </span>
                      ) : (
                        <span className={styles.badgeWarn}>
                          {locale === "dk" ? "Ikke bekræftet" : "Unverified"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.heroActions}>
                  <Link className={styles.secondaryBtn} href={`/${locale}/settings`}>
                    Settings
                  </Link>
                  <Link className={styles.secondaryBtn} href={`/${locale}/ask`}>
                    Ask
                  </Link>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>
                    {locale === "dk" ? "Dine fund" : "Your finds"}
                  </div>
                  <div className={styles.statValue}>{myFindsCount}</div>
                  <div className={styles.statHint}>
                    {locale === "dk"
                      ? "Antal fund du har logget"
                      : "Total finds you’ve logged"}
                  </div>
                </div>

                <div className={styles.stat}>
                  <div className={styles.statLabel}>Streak</div>
                  <div className={styles.statValue}>—</div>
                  <div className={styles.statHint}>
                    {locale === "dk" ? "Daglige check-ins" : "Daily check-ins"}
                  </div>
                </div>

                <div className={styles.stat}>
                  <div className={styles.statLabel}>Privacy mode</div>
                  <div className={styles.statValue}>On</div>
                  <div className={styles.statHint}>
                    {locale === "dk" ? "Ingen præcise spots" : "No exact spots"}
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Preferences</div>
              </div>

              <div className={styles.rows}>
                <Link className={styles.row} href={`/${locale}/settings`}>
                  <div className={styles.rowLeft}>
                    <div className={styles.rowTitle}>Privacy</div>
                    <div className={styles.rowSub}>
                      {locale === "dk" ? "Hold naturen sikker" : "Keep nature safe"}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.pill}>On</span>
                    <span className={styles.chev}>→</span>
                  </div>
                </Link>

                <Link className={styles.row} href={`/${locale}/settings`}>
                  <div className={styles.rowLeft}>
                    <div className={styles.rowTitle}>
                      {locale === "dk" ? "Tema" : "Theme"}
                    </div>
                    <div className={styles.rowSub}>
                      {locale === "dk" ? "Styres i headeren" : "Controlled in header"}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.pill}>Auto</span>
                    <span className={styles.chev}>→</span>
                  </div>
                </Link>

                <Link className={styles.row} href={`/${locale}/settings`}>
                  <div className={styles.rowLeft}>
                    <div className={styles.rowTitle}>
                      {locale === "dk" ? "Sprog" : "Language"}
                    </div>
                    <div className={styles.rowSub}>
                      {locale === "dk" ? "Skifter via locale-routes" : "Via locale routes"}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.pill}>{locale.toUpperCase()}</span>
                    <span className={styles.chev}>→</span>
                  </div>
                </Link>
              </div>

              <div className={styles.danger}>
                <div>
                  <div className={styles.dangerTitle}>{locale === "dk" ? "Session" : "Session"}</div>
                  <div className={styles.dangerSub}>
                    {locale === "dk" ? "Log ud på denne enhed" : "Sign out on this device"}
                  </div>
                </div>
                <LogoutButton locale={locale} />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
