"use client";

import Link from "next/link";
import { useMemo } from "react";
import styles from "./FeedPage.module.css";
import { CardLink } from "@/components/UI/CardLink";
import { Card } from "@/components/UI/Card";

type FeedFind = {
  id: string;
  created_at?: string | null;
  observed_at?: string | null; // date as string
  species_id?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  visibility?: "private" | "friends" | "public_aggregate" | string | null;
  user_id?: string | null;
  spot_id?: string | null;
};

function fmt(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )} · ${hh}:${mm}`;
}

function isPublicAggregate(v?: string | null) {
  return v === "public_aggregate";
}

function labelVisibility(locale: string, v?: string | null) {
  const dk = locale === "dk";
  if (v === "public_aggregate") return dk ? "Offentlig" : "Public";
  if (v === "friends") return dk ? "Venner" : "Friends";
  return dk ? "Privat" : "Private";
}

export default function FeedClient({
  locale,
  month,
  finds,
  viewerUserId,
  errorMsg,
}: {
  locale: string;
  month: number;
  finds: FeedFind[];
  viewerUserId: string | null;
  errorMsg?: string | null;
}) {
  const t = (dk: string, en: string) => (locale === "dk" ? dk : en);

  const monthName = useMemo(() => {
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
  }, [locale, month]);

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

      {errorMsg ? (
        <Card className={styles.empty}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyTitle}>{t("Feed fejlede", "Feed failed")}</div>
          <div className={styles.emptyBody}>
            {t("DB sagde:", "DB said:")} <strong>{errorMsg}</strong>
          </div>
        </Card>
      ) : finds.length ? (
        <div className={styles.grid}>
          {finds.map((f) => {
            const isMine = viewerUserId && f.user_id === viewerUserId;

            // Title logic (you don't have species name yet)
            const title = f.species_id
              ? t("Fund registreret", "Find recorded")
              : t("Ukendt art", "Unknown species");

            // Photo: feed_finds returns first photo_urls element as photo_url
            const imgUrl = f.photo_url ? f.photo_url : null;

            // Link target: keep your current behavior (map with log param)
            // Better later: /[locale]/find/[id]
            const href = `/${locale}/map?find=${encodeURIComponent(f.id)}`;

            return (
              <CardLink key={f.id} href={href} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.metaRow}>
                    <span
                      className={`${styles.badge} ${
                        isPublicAggregate(f.visibility)
                          ? styles.badgePublic
                          : styles.badgePrivate
                      }`}
                    >
                      {labelVisibility(locale, f.visibility)}
                    </span>

                    {isMine ? <span className={styles.mine}>{t("Dig", "You")}</span> : null}

                    <span className={styles.sep}>·</span>
                    <span className={styles.when}>{fmt(f.created_at)}</span>
                  </div>

                  <h2 className={styles.h2}>{title}</h2>

                  {f.notes ? (
                    <p className={styles.note}>
                      <strong>{t("Note: ", "Note: ")}</strong>
                      {f.notes}
                    </p>
                  ) : (
                    <p className={styles.note}>
                      {t(
                        "Ingen note — du kan tilføje detaljer næste gang.",
                        "No note — add details next time."
                      )}
                    </p>
                  )}
                </div>

                <div className={styles.media}>
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.img} src={imgUrl} alt="" loading="lazy" />
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