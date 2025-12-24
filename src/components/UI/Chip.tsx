import styles from "./Chip.module.css";

type Tone = "default" | "good" | "warn";

export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={[styles.chip, styles[tone], className ?? ""].join(" ")}>
      {children}
    </span>
  );
}

export function ChipLink({
  href,
  children,
  active,
  className,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  // Bevidst ingen next/link her – brug hvor du vil (eller lav en Link-wrapper)
  return (
    <a
      href={href}
      className={[
        styles.chip,
        styles.link,
        active ? styles.active : "",
        "hoverable",
        "pressable",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </a>
  );
}