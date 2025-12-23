import styles from "./SpeciesPage.module.css";

function splitLines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isBullet(line: string) {
  return line.startsWith("- ") || line.startsWith("• ");
}

export function RichText({
  text,
  variant = "normal",
}: {
  text: string;
  variant?: "normal" | "callout";
}) {
  const lines = splitLines(text);
  const hasBullets = lines.some(isBullet);

  if (!lines.length) return null;

  if (hasBullets) {
    const items = lines
      .filter(isBullet)
      .map((l) => l.replace(/^(-\s|•\s)/, "").trim())
      .filter(Boolean);

    return (
      <div className={variant === "callout" ? styles.callout : undefined}>
        <ul className={styles.ul}>
          {items.map((it, idx) => (
            <li key={idx} className={styles.li}>
              {it}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Fallback: paragraphs
  return (
    <div className={variant === "callout" ? styles.callout : undefined}>
      {lines.map((p, idx) => (
        <p key={idx} className={styles.paragraph}>
          {p}
        </p>
      ))}
    </div>
  );
}