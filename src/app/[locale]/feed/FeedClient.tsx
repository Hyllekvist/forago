"use client";

import Link from "next/link";
import styles from "./FeedPage.module.css";

type LogItem = {
  id: string;
  created_at: string;
  user_id: string;
  visibility: "public" | "private";
  species_query: string | null;
  note: string | null;
  photo_url: string | null; // server prepared
  is_mine?: boolean;        // server prepared
};

type Props = {
  locale: "dk" | "en" | "se" | "de";
  items: LogItem[];
  userId?: string | null;
};

function t(locale: Props["locale"], dk: string, en: string) {
  return locale === "dk" ? dk : en;
}

function formatWhen(iso: string, locale: Props["locale"]) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.abs(now.getTime() - d.getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 2) return t(locale, "Lige nu", "Just now");
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;

  return d.toLocaleDateString(locale === "dk" ? "da-DK" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FeedClient({ locale, items }: Props) {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.h1}>{t(locale, "Feed", "Feed")}</h1>
          <p className={styles.sub}>
            {t(
              locale,
              "De seneste fund fra fællesskabet — og dine egne.",
              "Latest finds from the community — and yours."
            )}
          </p>
        </div>

        <Link className={styles.cta} href={`/${locale}/log`}>
          <span className={styles.ctaDot} aria-hidden="true" />
          {t(locale, "Log fund", "Log find")}
        </Link>
      </header>

      {items.length === 0 ? (
        <section className={styles.empty}>
          <div className={styles.emptyIcon}>🪴</div>
          <div className={styles.emptyTitle}>
            {t(locale, "Ingen fund endnu", "No finds yet")}
          </div>
          <div className={styles.emptyBody}>
            {t(locale, "Vær den første til at logge et fund.", "Be the first to log a find.")}
          </div>

          <Link className={styles.emptyCta} href={`/${locale}/log`}>
            {t(locale, "Log fund", "Log find")}
          </Link>
        </section>
      ) : (
        <section className={styles.grid} aria-label="Feed items">
          {items.map((r) => {
            const title = r.species_query?.trim() || t(locale, "Ukendt art", "Unknown species");
            const when = formatWhen(r.created_at, locale);

            return (
              <article key={r.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.metaRow}>
                    <span className={styles.when}>{when}</span>
                    <span className={styles.sep}>·</span>

                    <span
                      className={`${styles.badge} ${
                        r.visibility === "private" ? styles.badgePrivate : styles.badgePublic
                      }`}
                    >
                      {r.visibility === "private"
                        ? t(locale, "Privat", "Private")
                        : t(locale, "Offentlig", "Public")}
                    </span>

                    {r.is_mine ? (
                      <>
                        <span className={styles.sep}>·</span>
                        <span className={styles.mine}>{t(locale, "Mit", "Mine")}</span>
                      </>
                    ) : null}
                  </div>

                  <h2 className={styles.h2}>{title}</h2>
                  {r.note ? <p className={styles.note}>{r.note}</p> : null}
                </div>

                <div className={styles.media}>
                  {r.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.img} src={r.photo_url} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.mediaEmpty}>
                      <div className={styles.mediaIcon}>📷</div>
                      <div className={styles.mediaText}>
                        {t(locale, "Intet foto", "No photo")}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <Link className={styles.open} href={`/${locale}/log/${r.id}`}>
                    {t(locale, "Åbn", "Open")}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}