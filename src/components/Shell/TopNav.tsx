"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TopNav.module.css";
import { ThemeToggle } from "@/components/UI/ThemeToggle";

export function TopNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href={`/${locale}`}>
          <span className={styles.mark} aria-hidden />
          <span className={styles.word}>Forago</span>
        </Link>

        <nav className={styles.nav} aria-label="Top navigation">
          <Link
            className={`${styles.link} ${isActive(`/${locale}/guides`) ? styles.linkActive : ""}`}
            href={`/${locale}/guides`}
          >
            Guides
          </Link>

          <Link className={styles.link} href={`/login`}>
            Login
          </Link>

          <div className={styles.toggleWrap}>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}