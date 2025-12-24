"use client";

import Link from "next/link";
import styles from "./FeedPage.module.css";
import { Card } from "@/components/UI/Card";
import { CardLink } from "@/components/UI/CardLink";

type InSeasonItem = {
  slug: string;
  name: string;
  confidence: number;
  short?: string | null;
};

type RecentSpot = {
  id: string;
  title?: string | null;
  species_slug?: string | null;
  created_at?: string | null;
};

export default function FeedClient({
  locale,
  month,
  inSeason,
  recentSpots,
}: {
  locale: string;
  month: number;
  inSeason: InSeasonItem[];
  recentSpots: RecentSpot[];
}) {
  const t = (dk: string, en: string) => (locale === "dk" ? dk : en);

  const monthName = (() => {
    const dk = [
      "",
      "januar",
      "februar",
      "marts",
      "april",
      "maj",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "december",
    ];
    const en = [
      "",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return (locale === "dk" ? dk : en)[month] ?? String(month);
  })();

  return (
    <main className={styles.wrap}>
      {/* Hero */}
      <Card className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.h1}>{t("Feed", "Feed")}</h1>
            <p className={styles.sub}>
              {t(
                `I sæson lige nu · ${monthName}`,
                `In season right now · ${monthName}`
              )}
            </p>
          </div>

          <div className={styles.heroActions}>
            <Link className={styles.pill} href={`/${locale}/season`}>
              {t("Sæson", "Season")}
            </Link>
            <Link className={styles.pill} href={`/${locale}/map`}>
              {t("Kort", "Map")}
            </Link>
          </div>
        </div>
      </Card>

      {/* In-season now */}
      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.h2}>{t("I sæson nu", "In season now")}</h2>
          <Link className={styles.sectionLink} href={`/${locale}/season`}>
            {t("Se alle", "See all")}
          </Link>
        </div>

        {inSeason.length ? (
          <div className={styles.grid}>
            {inSeason.slice(0, 12).map((it) => (
              <CardLink
                key={it.slug}
                href={`/${locale}/species/${it.slug}`}
                className={styles.cardLink}
              >
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>{it.name}</div>
                  <div className={styles.badge}>
                    {t("Match", "Match")} · {it.confidence}%
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardText}>
                    {it.short ??
                      t(
                        "Åbn for identifikation, forvekslinger og sikkerhed.",
                        "Open for identification, look-alikes and safety."
                      )}
                  </p>
                </div>
              </CardLink>
            ))}
          </div>
        ) : (
          <Card className={styles.empty}>
            <p className={styles.muted}>
              {t(
                "Ingen sæsondata endnu for dette land. Udfyld seasonality-tabellen.",
                "No season data yet for this country. Fill the seasonality table."
              )}
            </p>
          </Card>
        )}
      </section>

      {/* New spots */}
      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.h2}>{t("Nye spots", "New spots")}</h2>
          <Link className={styles.sectionLink} href={`/${locale}/map`}>
            {t("Åbn kort", "Open map")}
          </Link>
        </div>

        {recentSpots.length ? (
          <div className={styles.list}>
            {recentSpots.slice(0, 10).map((s) => {
              const title =
                s.title ||
                (s.species_slug
                  ? t(`Spot: ${s.species_slug}`, `Spot: ${s.species_slug}`)
                  : t("Spot", "Spot"));

              const meta = s.species_slug
                ? t(`Art · ${s.species_slug}`, `Species · ${s.species_slug}`)
                : t("Ukendt art", "Unknown species");

              return (
                <CardLink
                  key={s.id}
                  href={`/${locale}/map?spot=${encodeURIComponent(s.id)}`}
                  className={styles.row}
                >
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{title}</div>
                    <div className={styles.rowMeta}>{meta}</div>
                  </div>
                  <div className={styles.rowChevron} aria-hidden>
                    →
                  </div>
                </CardLink>
              );
            })}
          </div>
        ) : (
          <Card className={styles.empty}>
            <p className={styles.muted}>
              {t("Ingen spots endnu.", "No spots yet.")}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}