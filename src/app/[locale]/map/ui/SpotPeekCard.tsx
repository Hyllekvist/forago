// src/app/[locale]/map/ui/SpotPeekCard.tsx
"use client";

import { useMemo } from "react";
import styles from "./SpotPeekCard.module.css";
import type { Spot } from "../LeafletMap";

type LatLng = { lat: number; lng: number };

type Props = {
  spot: Spot;
  mode: "daily" | "forage";
  userPos?: LatLng | null;          // ✅ NEW
  lastSeenAt?: string | null;       // ✅ optional (ISO string) - hvis I har det
  onClose: () => void;
  onLog: () => void;
  onLearn: () => void;
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

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      s2 *
      s2;
  return 2 * R * Math.asin(Math.sqrt(q));
}

function formatDistance(userPos: LatLng | null | undefined, spot: Spot) {
  if (!userPos) return null;
  const km = haversineKm(userPos, { lat: spot.lat, lng: spot.lng });
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatRelativeDa(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (!Number.isFinite(diffMs)) return null;

  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return mins <= 1 ? "lige nu" : `${mins} min siden`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? "1 time siden" : `${hours} timer siden`;

  const days = Math.round(hours / 24);
  if (days === 1) return "i går";
  if (days < 7) return `${days} dage siden`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return w === 1 ? "1 uge siden" : `${w} uger siden`;
  }
  return d.toLocaleDateString("da-DK");
}

export function SpotPeekCard({
  spot,
  mode,
  userPos = null,
  lastSeenAt = null,
  onClose,
  onLog,
  onLearn,
}: Props) {
  const emoji = emojiForSlug(spot.species_slug);
  const label = mode === "forage" ? "Muligt fund" : spot.species_slug ? "Spot" : "Lokation";

  const distance = useMemo(() => formatDistance(userPos, spot), [userPos, spot.lat, spot.lng]);
  const freshness = useMemo(() => formatRelativeDa(lastSeenAt), [lastSeenAt]);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${spot.lat},${spot.lng}`
  )}`;

  return (
    <section className={styles.card} role="dialog" aria-label="Selected spot">
      <div className={styles.bg} aria-hidden />

      <button className={styles.close} onClick={onClose} aria-label="Close">
        <span aria-hidden>✕</span>
      </button>

      <header className={styles.head}>
        <div className={styles.badge} aria-hidden>
          <span className={styles.badgeEmoji}>{emoji}</span>
        </div>

        <div className={styles.headMain}>
          <div className={styles.kickerRow}>
            <span className={styles.kicker}>{label}</span>

            {distance ? (
              <>
                <span className={styles.dot} aria-hidden />
                <span className={styles.meta}>{distance}</span>
              </>
            ) : null}

            {freshness ? (
              <>
                <span className={styles.dot} aria-hidden />
                <span className={styles.meta}>{freshness}</span>
              </>
            ) : null}
          </div>

          <h3 className={styles.title}>{spot.title ?? "Ukendt spot"}</h3>

          <div className={styles.pills}>
            <span className={styles.pill}>
              {spot.species_slug ? `#${spot.species_slug}` : "#unclassified"}
            </span>
            <span className={styles.pillAccent}>
              {mode === "forage" ? "Peak potential" : distance && distance.includes("m") ? "Meget tæt på" : "I nærheden"}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.actions}>
        <a className={styles.primary} href={mapsHref} target="_blank" rel="noreferrer">
          <span className={styles.primaryIcon} aria-hidden>
            ➜
          </span>
          Navigér
        </a>

        <button className={styles.secondary} onClick={onLog} type="button">
          Log fund
        </button>

        <button className={styles.ghost} onClick={onLearn} type="button">
          Lær mere
        </button>
      </div>

      <div className={styles.hint}>
        Tip: Tryk på flere pins for at browse. Zoom ind for flere detaljer.
      </div>
    </section>
  );
}