"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TopNav.module.css";
import { ThemeToggle } from "@/components/UI/ThemeToggle";

export function TopNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href={`/${locale}`} aria-label="Forago home">
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.word}>Forago</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <Link
            className={`${styles.link} ${isActive(`/${locale}/guides`) ? styles.active : ""}`}
            href={`/${locale}/guides`}
          >
            Guides
          </Link>

          <Link
            className={`${styles.link} ${isActive(`/login`) ? styles.active : ""}`}
            href={`/login`}
          >
            Login
          </Link>

          <div className={styles.toggle}>
            <ThemeToggle />
          </div>
        </nav>
      </div>

      <div className={styles.hairline} />
    </header>
  );
}