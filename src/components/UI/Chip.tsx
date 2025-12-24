import styles from "./Chip.module.css";

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={[styles.chip, className ?? ""].join(" ")}>{children}</span>;
}