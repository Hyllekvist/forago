"use client";

import Image from "next/image";
import styles from "./FieldHero.module.css";

type ChipTone = "neutral" | "good" | "warn" | "danger";

export type FieldChip = {
  label: string;
  tone?: ChipTone;
  icon?: React.ReactNode;
};

type Props = {
  title?: string;
  imageSrc: string;
  imageAlt: string;

  // overlay actions
  left?: React.ReactNode;   // back button etc.
  right?: React.ReactNode;  // season/save etc.

  // small chips on hero
  chips?: FieldChip[];

  // optional hint bottom
  hint?: string;

  // if your images are mostly studio/isolated: "contain" shows full specimen
  fit?: "contain" | "cover";
};

function toneClass(t?: ChipTone) {
  if (t === "good") return styles.chipGood;
  if (t === "warn") return styles.chipWarn;
  if (t === "danger") return styles.chipDanger;
  return styles.chipNeutral;
}

export default function FieldHero({
  title,
  imageSrc,
  imageAlt,
  left,
  right,
  chips = [],
  hint = "Tryk for fullscreen (pinch-zoom)",
  fit = "contain",
}: Props) {
  return (
    <section className={styles.hero} aria-label={title ? `Foto: ${title}` : "Foto"}>
      {/* image */}
      <div className={styles.media}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 1100px"
          className={`${styles.img} ${fit === "cover" ? styles.fitCover : styles.fitContain}`}
        />
        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
      </div>

      {/* overlay top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.left}>{left}</div>
          <div className={styles.right}>{right}</div>
        </div>
      </div>

      {/* chips */}
      {chips.length > 0 && (
        <div className={styles.chipsWrap}>
          <div className={styles.chips}>
            {chips.map((c, idx) => (
              <span key={idx} className={`${styles.chip} ${toneClass(c.tone)}`}>
                {c.icon ? <span className={styles.chipIcon}>{c.icon}</span> : null}
                <span className={styles.chipText}>{c.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* hint */}
      <div className={styles.hintWrap}>
        <div className={styles.hint}>
          <span className={styles.hintDot} aria-hidden="true" />
          <span className={styles.hintText}>{hint}</span>
        </div>
      </div>
    </section>
  );
}
