"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./SpotPeekCard.module.css";
import type { Spot } from "../LeafletMap";

type Counts = { total: number; qtr: number };

type Props = {
  spot: Spot;
  mode: "daily" | "forage";
  userPos: { lat: number; lng: number } | null;

  // ✅ new (optional): hvis MapClient allerede har counts, brug dem
  counts?: Counts | null;

  onClose: () => void;
  onLog: () => void;
  onLearn: () => void;

  // optional fra MapClient
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
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      s2 *
      s2;
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

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function quarterStartISO(d = new Date()) {
  const q = Math.floor(d.getMonth() / 3); // 0..3
  const startMonth = q * 3; // 0,3,6,9
  const start = new Date(d.getFullYear(), startMonth, 1);
  return start.toISOString();
}

type SpotStatsApi = {
  spot_id: string;
  total_count: number;
  last_30d_count: number;
  last_14d_count: number;
};

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

  const freshness = useMemo(() => formatFreshness(spot.last_seen_at ?? null), [spot.last_seen_at]);

  const mapsHref = useMemo(() => {
    const q = encodeURIComponent(`${spot.lat},${spot.lng}`);
    if (isIOS()) return `http://maps.apple.com/?q=${q}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [spot.lat, spot.lng]);

  // ✅ fallback: hvis counts ikke kommer fra MapClient, hent stats her
  const [localCounts, setLocalCounts] = useState<Counts | null>(null);
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    if (counts) return; // MapClient styrer det
    let alive = true;
    setCountsLoading(true);
    setLocalCounts(null);

    // Vi bruger din eksisterende /api/spots/[id]/stats hvis du har den
    fetch(`/api/spots/${encodeURIComponent(spot.id)}/stats`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (!j?.ok || !j?.stats) return;

        const s = j.stats as SpotStatsApi;
        // "qtr" findes ikke i API'et – så vi bruger last_30d_count som “recent”
        setLocalCounts({ total: Number(s.total_count ?? 0), qtr: Number(s.last_30d_count ?? 0) });
      })
      .finally(() => {
        if (!alive) return;
        setCountsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [spot.id, counts]);

  const effectiveCounts = counts ?? localCounts;

const socialLine = countsLoading
  ? "Henter aktivitet…"
  : effectiveCounts
    ? `${effectiveCounts.total} community logs · ${effectiveCounts.qtr} denne sæson`
    : "Ingen community logs endnu";

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
              {mode === "forage" ? "Peak potential" : "I nærheden"}
            </span>
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

        <button
          className={styles.secondary}
          onClick={() => void onLog()}
          type="button"
          disabled={!!isLogging}
        >
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