import Link from "next/link";
import styles from "./CardLink.module.css";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function CardLink({ href, children, className }: Props) {
  return (
    <Link
      href={href}
      className={`${styles.card}${className ? ` ${className}` : ""}`}
    >
      {children}
    </Link>
  );
}