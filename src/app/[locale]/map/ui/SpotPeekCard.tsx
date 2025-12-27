"use client";

import { useMemo } from "react";
import styles from "./SpotPeekCard.module.css";
import type { Spot } from "../LeafletMap";

type Counts = {
  total: number;
  qtr: number;
  last30?: number;
  first_seen?: string | null;
  last_seen?: string | null;
};

type Props = {
  spot: Spot;
  mode: "daily" | "forage";
  userPos: { lat: number; lng: number } | null;

  counts?: Counts | null;

  onClose: () => void;
  onLog: () => void;
  onLearn: () => void;

  isLogging?: boolean;
  logOk?: boolean;
};

function emojiForSlug(slug?: string | null) {
  const s = (slug ?? "").toLowerCase();
  if (!s) return "📍";
  if (s.includes("svamp") || s.includes("mush") || s.includes("chanter") || s.includes("kantarel"))
    return "🍄";
  if (s.includes("bær") || s.includes("berry") || s.includes("blåb") || s.includes("hindb"))
    return "🫐";
  if (s.includes("urt") || s.includes("herb")) return "🌿";
  if (s.includes("nød") || s.includes("nut")) return "🌰";
  return "📍";
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(q));
}

function formatDistance(userPos: { lat: number; lng: number } | null, spot: Spot) {
  if (!userPos) return "—";
  const km = haversineKm(userPos, { lat: spot.lat, lng: spot.lng });
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function formatFreshness(iso?: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;

  const now = Date.now();
  const diffMs = Math.max(0, now - t);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return "i dag";
  if (days === 1) return "i går";
  if (days < 7) return `for ${days} dage siden`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "for 1 uge siden";
  if (weeks < 5) return `for ${weeks} uger siden`;
  const months = Math.floor(days / 30);
  if (months === 1) return "for 1 måned siden";
  return `for ${months} måneder siden`;
}

function computeStability(counts?: Counts | null) {
  if (!counts) return { key: "loading" as const, label: "Henter…", hint: "" };

  const total = counts.total ?? 0;
  const last30 = counts.last30 ?? 0;
  const qtr = counts.qtr ?? 0;

  // Logik (skarp og enkel):
  // Stabil: mange og nylige
  if (total >= 10 && last30 >= 3) return { key: "stable" as const, label: "Stabil", hint: "aktiv spot" };

  // Tilbagevendende: noget traction
  if (total >= 3 || qtr >= 2 || last30 >= 2)
    return { key: "returning" as const, label: "Tilbagevendende", hint: "finder dukker op" };

  // Ellers: sporadisk
  return { key: "sporadic" as const, label: "Sporadisk", hint: "få fund" };
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function SpotPeekCard({
  spot,
  mode,
  userPos,
  counts,
  onClose,
  onLog,
  onLearn,
  isLogging,
  logOk,
}: Props) {
  const emoji = emojiForSlug(spot.species_slug);
  const label = mode === "forage" ? "Muligt fund" : spot.species_slug ? "Spot" : "Lokation";

  const distance = useMemo(() => formatDistance(userPos, spot), [userPos, spot.lat, spot.lng]);

  const lastSeenIso = counts?.last_seen ?? null;
  const freshness = useMemo(() => formatFreshness(lastSeenIso), [lastSeenIso]);

  const mapsHref = useMemo(() => {
    const q = encodeURIComponent(`${spot.lat},${spot.lng}`);
    if (isIOS()) return `http://maps.apple.com/?q=${q}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [spot.lat, spot.lng]);

  const stability = useMemo(() => computeStability(counts), [counts]);

  const socialLine = useMemo(() => {
    if (!counts) return "Henter aktivitet…";
    const last30 = counts.last30 ?? 0;
    return `${counts.total} fund · ${counts.qtr} i kvartalet · ${last30} sidste 30d`;
  }, [counts]);

  return (
    <section className={styles.card} role="dialog" aria-label="Selected spot">
      <div className={styles.bg} aria-hidden />

      <button className={styles.close} onClick={onClose} aria-label="Close" type="button">
        <span aria-hidden>✕</span>
      </button>

      <header className={styles.head}>
        <div className={styles.badge} aria-hidden>
          <span className={styles.badgeEmoji}>{emoji}</span>
        </div>

        <div className={styles.headMain}>
          <div className={styles.kickerRow}>
            <span className={styles.kicker}>{label}</span>

            <span className={styles.dot} aria-hidden />
            <span className={styles.meta}>{distance}</span>

            {freshness ? (
              <>
                <span className={styles.dot} aria-hidden />
                <span className={styles.meta}>senest {freshness}</span>
              </>
            ) : null}
          </div>

          <h3 className={styles.title}>{spot.title ?? "Ukendt spot"}</h3>

          <div className={styles.pills}>
            <span className={styles.pill}>{spot.species_slug ? `#${spot.species_slug}` : "#unclassified"}</span>

            <span
              className={`${styles.pillStatus} ${
                stability.key === "stable"
                  ? styles.pillStable
                  : stability.key === "returning"
                    ? styles.pillReturning
                    : stability.key === "sporadic"
                      ? styles.pillSporadic
                      : styles.pillLoading
              }`}
              title={stability.hint}
            >
              {stability.label}
            </span>

            <span className={styles.pillAccent}>{mode === "forage" ? "Peak potential" : "I nærheden"}</span>
          </div>

          <div className={styles.social}>{socialLine}</div>
        </div>
      </header>

      <div className={styles.actions}>
        <a className={styles.primary} href={mapsHref} target="_blank" rel="noreferrer">
          <span className={styles.primaryIcon} aria-hidden>
            ➜
          </span>
          Navigér
        </a>

        <button className={styles.secondary} onClick={onLog} type="button" disabled={!!isLogging}>
          {logOk ? "✅ Logget" : isLogging ? "Logger…" : "Log fund"}
        </button>

        <button className={styles.ghost} onClick={onLearn} type="button">
          Lær mere
        </button>
      </div>

      <div className={styles.hint}>Tip: Tryk på flere pins for at browse. Zoom ind for flere detaljer.</div>
    </section>
  );
}