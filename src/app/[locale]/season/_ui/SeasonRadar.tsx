// src/app/[locale]/season/_ui/SeasonRadar.tsx
import styles from "./SeasonRadar.module.css";

type Locale = "dk" | "en";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function SeasonRadar({
  locale,
  title,
  subtitle,
  monthLabel,
  totalInSeason,
  highConfidence,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  monthLabel: string;
  totalInSeason: number;
  highConfidence: number;
}) {
  const total = Math.max(0, totalInSeason);
  const high = clamp(Math.max(0, highConfidence), 0, total || 1);

  // “Signal” score: mix af volume og safety (MVP)
  // volumeScore: 0..100 hvor 16 arter ~ “fuld”
  const volumeScore = clamp(Math.round((total / 16) * 100), 0, 100);
  const safetyScore = clamp(Math.round((high / Math.max(1, total)) * 100), 0, 100);
  const score = Math.round(volumeScore * 0.55 + safetyScore * 0.45);

  // Ring
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;

  return (
    <section className={styles.wrap} aria-label={locale === "dk" ? "Sæson radar" : "Season radar"}>
      <div className={styles.left}>
        <div className={styles.kicker}>{locale === "dk" ? "SÆSON RADAR" : "SEASON RADAR"}</div>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>

        <div className={styles.metaRow}>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>{locale === "dk" ? "Måned" : "Month"}</span>
            <span className={styles.pillValue}>{monthLabel}</span>
          </div>

          <div className={styles.pill}>
            <span className={styles.pillLabel}>{locale === "dk" ? "I sæson" : "In season"}</span>
            <span className={styles.pillValue}>{total}</span>
          </div>

          <div className={styles.pill}>
            <span className={styles.pillLabel}>{locale === "dk" ? "Høj sikkerhed" : "High confidence"}</span>
            <span className={styles.pillValue}>{high}</span>
          </div>
        </div>
      </div>

      <div className={styles.right} aria-hidden="true">
        <div className={styles.ringCard}>
          <svg className={styles.svg} viewBox="0 0 120 120">
            <circle className={styles.track} cx="60" cy="60" r={r} />
            <circle
              className={styles.progress}
              cx="60"
              cy="60"
              r={r}
              strokeDasharray={`${dash} ${c - dash}`}
            />
          </svg>

          <div className={styles.center}>
            <div className={styles.score}>{score}</div>
            <div className={styles.scoreLabel}>{locale === "dk" ? "Sæsonstyrke" : "Season strength"}</div>
            <div className={styles.scoreHint}>
              {locale === "dk" ? "volume + sikkerhed" : "volume + confidence"}
            </div>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.dot} />
              <span>{locale === "dk" ? "Nu" : "Now"}</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotSoft}`} />
              <span>{locale === "dk" ? "Privatliv først" : "Privacy-first"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}