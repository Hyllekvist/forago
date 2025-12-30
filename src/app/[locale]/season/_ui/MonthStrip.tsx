// src/app/[locale]/season/_ui/MonthStrip.tsx
import Link from "next/link";
import styles from "./MonthStrip.module.css";

type Locale = "dk" | "en";

const MONTHS: { slug: string; dk: string; en: string; n: number }[] = [
  { slug: "january", dk: "Jan", en: "Jan", n: 1 },
  { slug: "february", dk: "Feb", en: "Feb", n: 2 },
  { slug: "march", dk: "Mar", en: "Mar", n: 3 },
  { slug: "april", dk: "Apr", en: "Apr", n: 4 },
  { slug: "may", dk: "Maj", en: "May", n: 5 },
  { slug: "june", dk: "Jun", en: "Jun", n: 6 },
  { slug: "july", dk: "Jul", en: "Jul", n: 7 },
  { slug: "august", dk: "Aug", en: "Aug", n: 8 },
  { slug: "september", dk: "Sep", en: "Sep", n: 9 },
  { slug: "october", dk: "Okt", en: "Oct", n: 10 },
  { slug: "november", dk: "Nov", en: "Nov", n: 11 },
  { slug: "december", dk: "Dec", en: "Dec", n: 12 },
];

function label(locale: Locale, m: (typeof MONTHS)[number]) {
  return locale === "dk" ? m.dk : m.en;
}

export function MonthStrip({
  locale,
  activeMonth,
  counts,
}: {
  locale: Locale;
  activeMonth: number; // 1-12
  counts?: Record<number, number>; // month -> count in season (optional)
}) {
  return (
    <section className={styles.wrap} aria-label={locale === "dk" ? "Måneder" : "Months"}>
      <div className={styles.titleRow}>
        <div>
          <div className={styles.kicker}>{locale === "dk" ? "NAVIGER" : "BROWSE"}</div>
          <div className={styles.h2}>{locale === "dk" ? "Sæson pr. måned" : "Season by month"}</div>
        </div>
        <div className={styles.hint}>{locale === "dk" ? "Tryk for månedsside" : "Tap a month"}</div>
      </div>

      <div className={styles.strip}>
        {MONTHS.map((m) => {
          const isActive = m.n === activeMonth;
          const c = counts?.[m.n] ?? null;

          return (
            <Link
              key={m.slug}
              href={`/${locale}/season/${m.slug}`}
              className={`${styles.item} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.m}>{label(locale, m)}</span>
              {c !== null ? <span className={styles.c}>{c}</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}