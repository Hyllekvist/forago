// src/app/[locale]/map/ui/TargetsBar.tsx
import Link from "next/link";
import styles from "./TargetsBar.module.css";

export type TargetItem = {
  kind: "stable" | "easy" | "mystery";
  label: string;
  species_slug: string;
  jumpSpotId: string;
  metric: string;
  hint: string;
};

function kindBadge(kind: TargetItem["kind"]) {
  if (kind === "stable") return { emoji: "✅", text: "STABIL" };
  if (kind === "easy") return { emoji: "🎯", text: "NEM" };
  return { emoji: "❓", text: "MYSTERY" };
}

type Props = {
  locale: string;
  title: string;
  items: TargetItem[];
  onJumpSpot: (spotId: string) => void;
  variant?: "grid" | "rail";
};

export function TargetsBar({
  locale,
  title,
  items,
  onJumpSpot,
  variant = "grid",
}: Props) {
  if (!items?.length) return null;

  return (
    <section
      className={styles.wrap}
      data-variant={variant}
      aria-label="Top targets in view"
    >
      <div className={styles.head}>
        <div className={styles.title}>{title}</div>
        <div className={styles.sub}>Sæson + aktivitet</div>
      </div>

      <div className={styles.grid}>
        {items.map((t) => {
          const k = kindBadge(t.kind);

          return (
            <div key={`${t.kind}-${t.species_slug}-${t.jumpSpotId}`} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.badge}>
                  <span aria-hidden="true">{k.emoji}</span> {k.text}
                </span>

                <button
                  type="button"
                  className={styles.jump}
                  onClick={() => onJumpSpot(t.jumpSpotId)}
                  title="Hop til spot"
                >
                  Hop →
                </button>
              </div>

              <div className={styles.name}>{t.label}</div>

              <div className={styles.meta}>
                <span className={styles.metric}>{t.metric}</span>
                <span className={styles.dot}>·</span>
                <span className={styles.hint}>{t.hint}</span>
              </div>

              <Link
                className={styles.link}
                href={`/${locale}/species/${encodeURIComponent(t.species_slug)}`}
              >
                Se kendetegn →
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}