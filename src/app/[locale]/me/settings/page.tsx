import Link from "next/link";
import styles from "./Settings.module.css";

export const dynamic = "force-dynamic";

export default function SettingsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "dk";

  return (
    <main className={styles.wrap}>
      <header className={styles.top}>
        <Link className={styles.back} href={`/${locale}/me`}>← Me</Link>
        <h1 className={styles.h1}>Settings</h1>
        <p className={styles.sub}>App choices. No dark patterns.</p>
      </header>

      <section className={styles.card}>
        <div className={styles.item}>
          <div>
            <div className={styles.t}>Privacy</div>
            <div className={styles.d}>No exact spots. Keep nature safe.</div>
          </div>
          <span className={styles.badge}>On</span>
        </div>

        <div className={styles.sep} />

        <div className={styles.item}>
          <div>
            <div className={styles.t}>Theme</div>
            <div className={styles.d}>Styres af toggle i headeren.</div>
          </div>
          <span className={styles.badge}>OK</span>
        </div>

        <div className={styles.sep} />

        <div className={styles.item}>
          <div>
            <div className={styles.t}>Language</div>
            <div className={styles.d}>Skifter via locale-routes.</div>
          </div>
          <span className={styles.badge}>{locale.toUpperCase()}</span>
        </div>
      </section>
    </main>
  );
}