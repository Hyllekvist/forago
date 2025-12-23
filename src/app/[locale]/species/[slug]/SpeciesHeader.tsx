import Link from "next/link";
import styles from "./SpeciesPage.module.css";
 
type Props = {
  locale: "dk" | "en";
  backHref: string;
  name: string;
  scientific?: string;
  group: string;
  shortDescription?: string;
  seasonText?: string | null;
  inSeasonNow: boolean;
  confidence?: number | null;
  monthLinks?: Array<{ href: string; label: string }>;
};

export function SpeciesHeader({
  locale,
  backHref,
  name,
  scientific,
  group,
  shortDescription,
  seasonText,
  inSeasonNow,
  confidence,
  monthLinks = [],
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.heroTop}>
        <Link className={styles.back} href={backHref}>
          ← {locale === "dk" ? "Arter" : "Species"}
        </Link>

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

      <h1 className={styles.h1}>{name}</h1>

      <div className={styles.meta}>
        {scientific ? <em>{scientific}</em> : null}
        {scientific ? <span className={styles.dot}>·</span> : null}
        <span className={styles.group}>{group}</span>
      </div>

      <p className={styles.sub}>
        {shortDescription ||
          (locale === "dk"
            ? "Tilføj short_description i DB for at gøre siden rankable."
            : "Add short_description in DB to make this page rankable.")}
      </p>

      <div className={styles.chips}>
        <span className={styles.chip}>
          {locale === "dk" ? "Sæson:" : "Season:"}{" "}
          {seasonText ? seasonText : locale === "dk" ? "ukendt" : "unknown"}
        </span>

        <Link className={styles.chipLink} href={`/${locale}/season`}>
          {locale === "dk" ? "Se sæson nu →" : "See season now →"}
        </Link>

        <Link className={styles.chipLink} href={`/${locale}/guides/safety-basics`}>
          {locale === "dk" ? "Sikkerhed →" : "Safety →"}
        </Link>

        <Link className={styles.chipLink} href={`/${locale}/guides/lookalikes`}>
          {locale === "dk" ? "Forvekslinger →" : "Look-alikes →"}
        </Link>
      </div>

      {monthLinks.length ? (
        <div className={styles.monthRow}>
          <span className={styles.monthLabel}>
            {locale === "dk" ? "I sæson i:" : "In season in:"}
          </span>
          <div className={styles.monthChips}>
            {monthLinks.map((m) => (
              <Link key={m.href} className={styles.monthChip} href={m.href}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}