import styles from "./Card.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <div className={`${styles.card}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}