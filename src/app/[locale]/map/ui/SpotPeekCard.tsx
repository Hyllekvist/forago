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

function titleCase(s: string) {
  return s
    .split(/[\s-_]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function emojiForSlug(slug?: string | null) {
  const s = (slug ?? "").toLowerCase();
  if (s.includes("kantarel") || s.includes("svamp") || s.includes("morel")) return "🍄";
  if (s.includes("ramsl") || s.includes("skovs") || s.includes("urt")) return "🌿";
  if (s.includes("bær") || s.includes("bromb") || s.includes("hindb")) return "🫐";
  if (s.includes("æble") || s.includes("pære")) return "🍏";
  return "🧭";
}

function vibeForMode(mode: Props["mode"]) {
  return mode === "forage"
    ? { label: "Foraging", hint: "Klar til at logge et fund?" }
    : { label: "Daily", hint: "Natur tæt på dig lige nu." };
}

export function SpotPeekCard({ spot, mode, onClose, onLog, onLearn }: Props) {
  const slug = spot.species_slug ?? "";
  const emoji = emojiForSlug(slug);
  const vibe = vibeForMode(mode);

  const title =
    (spot.title?.trim() && spot.title.trim()) ||
    (slug ? titleCase(slug) : "Ukendt fund");

  return (
    <div className={`${styles.card} hoverable`} role="region" aria-label="Spot">
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden />
            <span className={styles.badgeText}>{vibe.label}</span>
          </div>

          <div className={styles.titleRow}>
            <div className={styles.emoji} aria-hidden>
              {emoji}
            </div>
            <div className={styles.titleWrap}>
              <div className={styles.kicker}>
                {slug ? `#${slug}` : "Spot"}
              </div>
              <div className={styles.title}>{title}</div>
            </div>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaPill}>🔥 Muligt peak</span>
            <span className={styles.metaPill}>📍 Tæt på</span>
            <span className={styles.metaPill}>🕒 Bedst i dag</span>
          </div>

          <div className={styles.hint}>{vibe.hint}</div>
        </div>

        <button
          className={`${styles.close} pressable`}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className={styles.actions}>
        <button className={`${styles.primary} pressable`} onClick={onLog}>
          Log fund
          <span className={styles.primarySub}>+ foto • note • GPS</span>
        </button>

        <button className={`${styles.secondary} pressable`} onClick={onLearn}>
          Lær mere
          <span className={styles.secondarySub}>Sank sikkert</span>
        </button>
      </div>
    </div>
  );
}