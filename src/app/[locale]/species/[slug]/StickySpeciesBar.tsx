import Link from "next/link";
import styles from "./SpeciesPage.module.css";

type Props = {
  locale: "dk" | "en";
  backHref: string;
  inSeasonNow: boolean;
  confidence?: number | null;
  seasonText?: string | null;
};

export function StickySpeciesBar({
  locale,
  backHref,
  inSeasonNow,
  confidence,
  seasonText,
}: Props) {
  return (
    <div className={styles.sticky}>
      <div className={styles.stickyRow}>
        <Link className={styles.back} href={backHref}>
          ← {locale === "dk" ? "Arter" : "Species"}
        </Link>

        <span className={styles.stickySpacer} />

        <span className={`${styles.badge} ${inSeasonNow ? styles.badgeSeason : ""}`}>
          {inSeasonNow
            ? locale === "dk"
              ? "I sæson nu"
              : "In season now"
            : locale === "dk"
            ? "Ikke i sæson"
            : "Not in season"}
          {typeof confidence === "number" ? ` · ${confidence}%` : ""}
        </span>
      </div>

      <div className={styles.stickyChips}>
        <span className={styles.chip}>
          {locale === "dk" ? "Sæson:" : "Season:"}{" "}
          {seasonText ? seasonText : locale === "dk" ? "ukendt" : "unknown"}
        </span>

        <Link className={styles.chipLink} href={`/${locale}/season`}>
          {locale === "dk" ? "Sæson" : "Season"}
        </Link>

        <Link className={styles.chipLink} href={`/${locale}/guides/safety-basics`}>
          {locale === "dk" ? "Sikkerhed" : "Safety"}
        </Link>

        <Link className={styles.chipLink} href={`/${locale}/guides/lookalikes`}>
          {locale === "dk" ? "Forvekslinger" : "Look-alikes"}
        </Link>
      </div>
    </div>
  );
}