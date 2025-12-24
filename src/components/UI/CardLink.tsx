import Link from "next/link";
import clsx from "clsx";
import styles from "./CardLink.module.css";

export function CardLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={clsx(styles.card, className)}>
      {children}
    </Link>
  );
}