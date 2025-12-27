"use client";

import Link from "next/link";
import styles from "./FindPage.module.css";
import type { FindDetail } from "./page";
import { Card } from "@/components/UI/Card";

function t(locale: string, dk: string, en: string) {
  return locale === "dk" ? dk : en;
}

function fmtTS(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${d.getFullYear()} · ${hh}:${mm}`;
}

function fmtDate(date?: string | null) {
  if (!date) return "";
  // date comes as YYYY-MM-DD
  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
}

function visLabel(locale: string, v?: string | null) {
  if (v === "public_aggregate") return t(locale, "Offentlig", "Public");
  if (v === "friends") return t(locale, "Venner", "Friends");
  return t(locale, "Privat", "Private");
}

export default function FindClient({
  locale,
  data,
  errorMsg,
}: {
  locale: string;
  data: FindDetail | null;
  errorMsg: string | null;
}) {
  if (!data) {
    return (
      <div className={styles.wrap}>
        <Card className={styles.errorCard}>
          <div className={styles.errorTitle}>{t(locale, "Kunne ikke finde fundet", "Find not found")}</div>
          <div className={styles.errorBody}>
            {t(locale, "Fejl:", "Error:")} <strong>{errorMsg ?? "Unknown"}</strong>
          </div>
          <Link className={styles.back} href={`/${locale}/feed`}>
            {t(locale, "Tilbage til feed", "Back to feed")} →
          </Link>
        </Card>
      </div>
    );
  }

  const { find, species, viewerUserId } = data;
  const isMine = viewerUserId && find.user_id === viewerUserId;

  const title =
    species?.scientific_name ||
    (species?.slug ? `#${species.slug}` : t(locale, "Ukendt art", "Unknown species"));

  const group = species?.primary_group ?? null;

  const photos = (find.photo_urls ?? []).filter(Boolean);
  const hero = photos[0] ?? null;

  const mapHref = `/${locale}/map?find=${encodeURIComponent(find.id)}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <Link className={styles.backTop} href={`/${locale}/feed`}>
          ← {t(locale, "Feed", "Feed")}
        </Link>

        <div className={styles.actions}>
          <Link className={styles.actionBtn} href={mapHref}>
            {t(locale, "Åbn på kort", "Open on map")}
          </Link>

          <button
            className={styles.actionBtn}
            type="button"
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard?.writeText(url);
            }}
          >
            {t(locale, "Kopiér link", "Copy link")}
          </button>
        </div>
      </div>

      <div className={styles.shell}>
        {/* LEFT: content */}
        <section className={styles.left}>
          <header className={styles.header}>
            <div className={styles.badges}>
              <span className={styles.badge}>{visLabel(locale, find.visibility)}</span>
              {isMine ? <span className={styles.badgeMine}>{t(locale, "Dit fund", "Yours")}</span> : null}
              {group ? <span className={styles.badgeSoft}>{group}</span> : null}
            </div>

            <h1 className={styles.h1}>{title}</h1>

            <div className={styles.meta}>
              {find.observed_at ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaK}>{t(locale, "Observeret", "Observed")}</span>
                  <span className={styles.metaV}>{fmtDate(find.observed_at)}</span>
                </div>
              ) : null}

              {find.created_at ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaK}>{t(locale, "Logget", "Logged")}</span>
                  <span className={styles.metaV}>{fmtTS(find.created_at)}</span>
                </div>
              ) : null}

              {find.geo_precision_km ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaK}>{t(locale, "Præcision", "Precision")}</span>
                  <span className={styles.metaV}>{find.geo_precision_km} km</span>
                </div>
              ) : null}
            </div>
          </header>

          <div className={styles.hero}>
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.heroImg} src={hero} alt="" />
            ) : (
              <div className={styles.heroEmpty}>
                <div className={styles.heroIcon}>📷</div>
                <div className={styles.heroText}>{t(locale, "Ingen foto", "No photo")}</div>
              </div>
            )}

            {photos.length > 1 ? (
              <div className={styles.thumbRow}>
                {photos.slice(0, 6).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} className={styles.thumb} src={p} alt="" />
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.cardGrid}>
            <div className={styles.infoCard}>
              <div className={styles.cardTitle}>{t(locale, "Note", "Notes")}</div>
              <div className={styles.cardBody}>
                {find.notes ? find.notes : t(locale, "Ingen note endnu.", "No notes yet.")}
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardTitle}>{t(locale, "Sted", "Location")}</div>
              <div className={styles.cardBody}>
                <div className={styles.kv}>
                  <span className={styles.k}>{t(locale, "Land", "Country")}</span>
                  <span className={styles.v}>{find.country ?? "—"}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.k}>{t(locale, "Spot", "Spot")}</span>
                  <span className={styles.v}>{find.spot_id ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: sticky map/action panel */}
        <aside className={styles.right}>
          <div className={styles.sticky}>
            <div className={styles.sideTitle}>{t(locale, "Handlinger", "Actions")}</div>

            <Link className={styles.primary} href={mapHref}>
              {t(locale, "Se fund på kort", "View on map")} →
            </Link>

            <div className={styles.sideMeta}>
              <div className={styles.sideRow}>
                <span className={styles.sideK}>{t(locale, "Visibility", "Visibility")}</span>
                <span className={styles.sideV}>{visLabel(locale, find.visibility)}</span>
              </div>
              <div className={styles.sideRow}>
                <span className={styles.sideK}>{t(locale, "Find ID", "Find ID")}</span>
                <span className={styles.sideV}>{find.id.slice(0, 8)}…</span>
              </div>
            </div>

            <div className={styles.sideHint}>
              {t(
                locale,
                "Næste: vi kobler spot_id op på spots-tabellen og viser kortpreview + nærliggende fund.",
                "Next: we connect spot_id to spots and show a real map preview + nearby finds."
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}