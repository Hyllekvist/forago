"use client";

import Link from "next/link";
import { useMemo } from "react";
import styles from "./FeedPage.module.css";
import { CardLink } from "@/components/UI/CardLink";
import { Card } from "@/components/UI/Card";

type LogItem = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  species_query?: string | null;
  photo_path?: string | null;
  visibility?: "public" | "private" | null;
  user_id?: string | null;
};

export default function FeedClient({
  locale,
  month,
  logs,
  viewerUserId,
}: {
  locale: string;
  month: number;
  logs: LogItem[];
  viewerUserId: string | null;
}) {
  const t = (dk: string, en: string) => (locale === "dk" ? dk : en);

  const monthName = useMemo(() => {
    const dk = ["", "januar","februar","marts","april","maj","juni","juli","august","september","oktober","november","december"];
    const en = ["", "January","February","March","April","May","June","July","August","September","October","November","December"];
    return (locale === "dk" ? dk : en)[month] ?? String(month);
  }, [locale, month]);

  function fmt(ts?: string | null) {
    if (!ts) return "";
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} · ${hh}:${mm}`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.h1}>{t("Feed", "Feed")}</h1>
          <p className={styles.sub}>
            {t(`Nye fund · ${monthName}`, `New finds · ${monthName}`)}
          </p>
        </div>

        <Link className={styles.cta} href={`/${locale}/log`}>
          <span className={styles.ctaDot} aria-hidden />
          {t("Log fund", "Log find")}
        </Link>
      </div>

      {logs.length ? (
        <div className={styles.grid}>
          {logs.map((l) => {
            const isMine = viewerUserId && l.user_id === viewerUserId;
            const title =
              l.title ||
              l.species_query ||
              (locale === "dk" ? "Nyt fund" : "New find");

            const imgUrl = l.photo_path
              ? `/api/logs/photo?path=${encodeURIComponent(l.photo_path)}`
              : null;

            return (
              <CardLink
                key={l.id}
                href={`/${locale}/map?log=${encodeURIComponent(l.id)}`}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <div className={styles.metaRow}>
                    <span className={`${styles.badge} ${l.visibility === "public" ? styles.badgePublic : styles.badgePrivate}`}>
                      {l.visibility === "public" ? t("Offentlig", "Public") : t("Privat", "Private")}
                    </span>
                    {isMine ? <span className={styles.mine}>{t("Dig", "You")}</span> : null}
                    <span className={styles.sep}>·</span>
                    <span className={styles.when}>{fmt(l.created_at)}</span>
                  </div>

                  <h2 className={styles.h2}>{title}</h2>
                  {l.species_query ? (
                    <p className={styles.note}>
                      {t("Art (valgfrit): ", "Species (optional): ")}
                      <strong>{l.species_query}</strong>
                    </p>
                  ) : (
                    <p className={styles.note}>
                      {t("Ukendt art — fællesskabet kan hjælpe.", "Unknown species — community can help.")}
                    </p>
                  )}
                </div>

                <div className={styles.media}>
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.img} src={imgUrl} alt="" />
                  ) : (
                    <div className={styles.mediaEmpty}>
                      <div className={styles.mediaIcon}>📷</div>
                      <div className={styles.mediaText}>{t("Ingen foto", "No photo")}</div>
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <span className={styles.open}>{t("Åbn", "Open")} →</span>
                </div>
              </CardLink>
            );
          })}
        </div>
      ) : (
        <Card className={styles.empty}>
          <div className={styles.emptyIcon}>🍄</div>
          <div className={styles.emptyTitle}>{t("Ingen fund endnu", "No finds yet")}</div>
          <div className={styles.emptyBody}>
            {t("Vær den første til at logge et fund.", "Be the first to log a find.")}
          </div>
          <Link className={styles.emptyCta} href={`/${locale}/log`}>
            {t("Log fund", "Log find")}
          </Link>
        </Card>
      )}
    </div>
  );
}