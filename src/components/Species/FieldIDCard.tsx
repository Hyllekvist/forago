import Link from "next/link";
import styles from "./FieldIDCard.module.css";

type Cue = {
  key: string;
  title: string;
  body: string;
  // matcher data-pin i SVG (fx "cap", "ridges", "stem")
  pin?: "cap" | "ridges" | "stem" | "habitat";
};

type Props = {
  locale: "dk" | "en";
  name: string;
  scientific?: string | null;

  inSeasonNow?: boolean;
  confidence?: number | null; // 0-100
  seasonLabel?: string | null; // "Sep – Dec"
  seasonHref?: string; // /dk/season eller /dk/season/september

  cues: Cue[];
  notes?: string;
};

function t(locale: Props["locale"], dk: string, en: string) {
  return locale === "dk" ? dk : en;
}

export function FieldIDCard({
  locale,
  name,
  scientific,
  inSeasonNow = false,
  confidence = null,
  seasonLabel = null,
  seasonHref,
  cues,
  notes,
}: Props) {
  const seasonText =
    confidence !== null
      ? `${t(locale, "I sæson nu", "In season now")} · ${confidence}%`
      : t(locale, "Sæson", "Season");

  return (
    <section className={styles.card} aria-labelledby="fieldid-title">
      <div className={styles.top}>
        <div className={styles.kicker}>
          {t(
            locale,
            "Hurtige cues + sæsonbar. Privatliv først — ingen spots.",
            "Fast cues + season bar. Privacy-first — no spots."
          )}
        </div>

        <div className={styles.headerRow}>
          <div className={styles.titleBlock}>
            <h2 id="fieldid-title" className={styles.h2}>
              {t(locale, "Identifikation i felten", "Field identification")}
            </h2>
            <div className={styles.nameRow}>
              <div className={styles.name}>{name}</div>
              {scientific ? <div className={styles.scientific}>{scientific}</div> : null}
            </div>
          </div>

          <div className={styles.actions}>
            <span
              className={`${styles.pill} ${inSeasonNow ? styles.pillGood : ""}`}
              aria-label={seasonText}
            >
              {seasonText}
            </span>

            {seasonHref ? (
              <Link className={styles.pillBtn} href={seasonHref}>
                {t(locale, "Sæson →", "Season →")}
              </Link>
            ) : null}
          </div>
        </div>

        {seasonLabel ? (
          <div className={styles.subRow}>
            <span className={styles.subLabel}>{t(locale, "Typisk:", "Typical:")}</span>
            <span className={styles.subValue}>{seasonLabel}</span>
          </div>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.visualWrap} aria-hidden="true">
          <div className={styles.visual}>
            <svg
              className={styles.svg}
              viewBox="0 0 720 420"
              role="img"
              aria-label="Illustration for felt-identifikation"
            >
              {/* bg */}
              <defs>
                <radialGradient id="g" cx="50%" cy="30%" r="80%">
                  <stop offset="0%" stopOpacity="0.10" />
                  <stop offset="100%" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="720" height="420" rx="24" className={styles.svgBg} />
              <rect x="0" y="0" width="720" height="420" rx="24" fill="url(#g)" />

              {/* ground */}
              <path
                d="M70 330 C 210 300, 510 300, 650 330"
                className={styles.strokeSoft}
                fill="none"
              />

              {/* mushroom silhouette (generic – fungerer for tragtkantarel-ish) */}
              {/* cap */}
              <path
                data-pin="cap"
                d="M170 210 C 250 150, 470 150, 550 210 C 520 230, 200 230, 170 210 Z"
                className={styles.fillMain}
              />
              <path
                d="M180 206 C 255 158, 465 158, 540 206"
                className={styles.strokeStrong}
                fill="none"
              />

              {/* stem / funnel */}
              <path
                data-pin="stem"
                d="M330 220 C 330 270, 300 310, 250 330
                   C 340 315, 380 315, 470 330
                   C 420 310, 390 270, 390 220 Z"
                className={styles.fillMain2}
              />
              <path
                d="M335 232 C 330 265, 315 285, 285 305"
                className={styles.strokeSoft}
                fill="none"
              />
              <path
                d="M385 232 C 390 265, 405 285, 435 305"
                className={styles.strokeSoft}
                fill="none"
              />

              {/* ridges */}
              <path
                data-pin="ridges"
                d="M350 240 C 345 275, 335 290, 315 305"
                className={styles.strokeStrong}
                fill="none"
              />
              <path
                d="M365 240 C 365 275, 365 292, 365 310"
                className={styles.strokeStrong}
                fill="none"
              />
              <path
                d="M370 240 C 375 275, 395 290, 415 305"
                className={styles.strokeStrong}
                fill="none"
              />

              {/* habitat hint */}
              <circle data-pin="habitat" cx="150" cy="315" r="8" className={styles.dot} />
              <circle cx="585" cy="315" r="8" className={styles.dot} />

              {/* pin glow (styres via CSS når du hover en cue) */}
              <circle cx="360" cy="205" r="26" className={styles.pinGlow} data-glow="cap" />
              <circle cx="360" cy="265" r="26" className={styles.pinGlow} data-glow="ridges" />
              <circle cx="320" cy="275" r="26" className={styles.pinGlow} data-glow="stem" />
              <circle cx="150" cy="315" r="26" className={styles.pinGlow} data-glow="habitat" />
            </svg>
          </div>
        </div>

        <div className={styles.cues}>
          <div className={styles.cuesHead}>
            <div className={styles.cuesTitle}>{t(locale, "Hurtigt blik", "Quick cues")}</div>
            <div className={styles.cuesSub}>
              {t(locale, "Brug 3–5 cues. Ikke ét.", "Use 3–5 cues. Not one.")}
            </div>
          </div>

          <ul className={styles.list}>
            {cues.slice(0, 6).map((c) => (
              <li key={c.key} className={styles.item} data-pin={c.pin || ""}>
                <div className={styles.itemTitle}>{c.title}</div>
                <div className={styles.itemBody}>{c.body}</div>
              </li>
            ))}
          </ul>

          {notes ? (
            <div className={styles.notes}>
              <div className={styles.notesTitle}>{t(locale, "Noter", "Notes")}</div>
              <div className={styles.notesBody}>{notes}</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
