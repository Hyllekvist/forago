import clsx from "clsx";
import styles from "./Card.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <div className={clsx(styles.card, className)}>
      {children}
    </div>
  );
}