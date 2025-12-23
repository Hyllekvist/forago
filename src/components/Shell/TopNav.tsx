"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TopNav.module.css";
import { ThemeToggle } from "@/components/UI/ThemeToggle";

export function TopNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href={`/${locale}`}>
          <span className={styles.mark} aria-hidden />
          <span className={styles.word}>Forago</span>
        </Link>

        <div className={styles.right}>
          <Link className={styles.link} href={`/${locale}/guides`}>
            Guides
          </Link>
          <Link className={styles.link} href={`/login`}>
            Login
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className={styles.hairline} />
    </header>
  );
}
