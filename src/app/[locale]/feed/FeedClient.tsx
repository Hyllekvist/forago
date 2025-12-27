"use client";

import Link from "next/link";
import { useMemo } from "react";
import styles from "./FeedPage.module.css";
import { CardLink } from "@/components/UI/CardLink";
import { Card } from "@/components/UI/Card";
import type { FeedFind } from "./page";

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

function labelVisibility(locale: string, v?: string | null) {
  const dk = locale === "dk";
  if (v === "public_aggregate") return dk ? "Offentlig" : "Public";
  if (v === "friends") return dk ? "Venner" : "Friends";
  return dk ? "Privat" : "Private";
}

function computeTitle(locale: string, f: FeedFind) {
  if (f.scientific_name) return f.scientific_name;
  if (f.species_slug) return `#${f.species_slug}`;
  return locale === "dk" ? "Ukendt art" : "Unknown species";
}

function computeSub(locale: string, f: FeedFind) {
  const parts: string[] = [];
  if (f.primary_group) parts.push(f.primary_group);
  if (f.observed_at) parts.push(f.observed_at);
  return parts.length ? parts.join(" · ") : locale === "dk" ? "Fund" : "Find";
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

            const title = computeTitle(locale, f);
            const sub = computeSub(locale, f);
            const imgUrl = f.photo_url ? f.photo_url : null;

            // ✅ primary link: Find Detail
            const detailHref = `/${locale}/find/${encodeURIComponent(f.id)}`;

            // ✅ secondary: open map for this find
            const mapHref = `/${locale}/map?find=${encodeURIComponent(f.id)}`;

            return (
              <CardLink key={f.id} href={detailHref} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.metaRow}>
                    <span
                      className={`${styles.badge} ${
                        f.visibility === "public_aggregate"
                          ? styles.badgePublic
                          : styles.badgePrivate
                      }`}
                    >
                      {labelVisibility(locale, f.visibility)}
                    </span>

                    {isMine ? <span className={styles.mine}>{t("Dig", "You")}</span> : null}

                    <span className={styles.sep}>·</span>
                    <span className={styles.when}>{fmt(f.created_at)}</span>

                    <span className={styles.metaSpacer} />
                    <Link
                      className={styles.mapMini}
                      href={mapHref}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("Kort", "Map")}
                    </Link>
                  </div>

                  <h2 className={styles.h2}>{title}</h2>
                  <p className={styles.note}>{sub}</p>

                  {f.notes ? (
                    <p className={styles.note}>
                      <strong>{t("Note: ", "Note: ")}</strong>
                      {f.notes}
                    </p>
                  ) : null}
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