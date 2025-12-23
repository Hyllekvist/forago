import styles from "./Card.module.css";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className ?? ""}`}>{children}</div>;
}
