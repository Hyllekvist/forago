// src/app/[locale]/map/ui/SpotPeekCard.tsx
"use client";

import styles from "./SpotPeekCard.module.css";
import type { Spot } from "../LeafletMap";

type Props = {
  spot: Spot;
  mode: "daily" | "forage";
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

// Dummy helpers (indtil vi har rigtig data)
function fakeDistanceKm() {
  // 0.3–2.9km
  const v = 0.3 + Math.random() * 2.6;
  return v < 1 ? `${Math.round(v * 1000)} m` : `${v.toFixed(1)} km`;
}

function fakeFreshness() {
  const labels = ["i dag", "i går", "for 2 dage siden", "for 1 uge siden"];
  return labels[Math.floor(Math.random() * labels.length)];
}

export function SpotPeekCard({ spot, mode, onClose, onLog, onLearn }: Props) {
  const emoji = emojiForSlug(spot.species_slug);
  const label =
    mode === "forage" ? "Muligt fund" : spot.species_slug ? "Spot" : "Lokation";

  const distance = fakeDistanceKm();
  const freshness = fakeFreshness();

  // Deep link (enkelt og stabilt)
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
            <span className={styles.dot} aria-hidden />
            <span className={styles.meta}>{distance}</span>
            <span className={styles.dot} aria-hidden />
            <span className={styles.meta}>{freshness}</span>
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